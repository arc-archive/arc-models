/* eslint-disable no-continue */
/* eslint-disable no-plusplus */

/** @typedef {import('./RequestTypes').ARCSavedRequest} ARCSavedRequest */
/** @typedef {import('./RequestTypes').ARCHistoryRequest} ARCHistoryRequest */
/** @typedef {import('./types').Entity} Entity */
/** @typedef {import('./types').DeletedEntity} DeletedEntity */
/** @typedef {import('./types').ARCEntityChangeRecord} ARCEntityChangeRecord */

/**
 * Computes past mindnight for given timestamp.
 *
 * @param {number} time Timestamp
 * @return {number} Time reduced to midnight.
 */
export function computeMidnight(time) {
  let typed = Number(time);
  if (!time || Number.isNaN(typed)) {
    typed = Date.now();
  }
  const day = new Date(typed);
  day.setHours(0, 0, 0, 0);
  return day.getTime();
}

/**
 * Computes time for timestamp's day, month and year and time set to 0.
 * @param {object} item Database entry item.
 * @return {object} The same database item with `_time` property.
 */
export function computeTime(item) {
  const copy = { ...item };
  copy._time = computeMidnight(copy.time);
  return copy;
}

/**
 * Helper method to cancel the event and stop it's propagation.
 * @param {Event|CustomEvent} e Event to cancel
 */
export function cancelEvent(e) {
  e.preventDefault();
  e.stopPropagation();
}

/**
 * Normalizes various historical labels for the request to a curently used values.
 *
 * @param {string} type `saved-requests`, `saved`, `history-requests`, `history`, `legacy-projects`, or `projects`
 * @return {string} `saved`, `history`, or `projects`
 */
export function normalizeRequestType(type) {
  switch (type) {
    case 'saved-requests':
      return 'saved';
    case 'history-requests':
      return 'history';
    case 'legacy-projects':
      return 'projects';
    default:
      return type;
  }
}

/**
 * Normalizes request object to whatever the app is currently using.
 *
 * @param {ARCHistoryRequest|ARCSavedRequest} request
 * @return {ARCHistoryRequest|ARCSavedRequest}
 */
export function normalizeRequest(request) {
  if (!request) {
    return request;
  }
  // @ts-ignore
  if (request.legacyProject) {
    const saved = /** @type ARCSavedRequest */ (request);
    if (!saved.projects) {
      saved.projects = [];
    }
    // @ts-ignore
    saved.projects[saved.projects.length] = saved.legacyProject;
    // @ts-ignore
    delete request.legacyProject;
  }
  const skipKeys = ['_id', '_rev', '_deleted'];
  Object.keys(request).forEach((key) => {
    if (key[0] === '_' && skipKeys.indexOf(key) === -1) {
      delete request[key];
    }
  });
  if (!request.updated) {
    request.updated = Date.now();
  }
  if (!request.created) {
    request.created = Date.now();
  }
  return request;
}

/**
 * Generates an ID for a request history object
 *
 * @param {ARCHistoryRequest} request The request object
 * @return {string} Generated history ID.
 */
export function generateHistoryId(request) {
  const { method, url } = request;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const time = d.getTime();
  const encUrl = encodeURIComponent(url);
  return `${time}/${encUrl}/${method}`;
}

/**
 * Finds a next revision after the `deletedRevision` in the revisions history
 * which is the one that reverts any changes made after it.
 *
 * @param {object} revs PouchDB revision history object
 * @param {string} deletedRevision Revision of deleted object (after delete).
 * @return {string|null} Revision ID of the object before a change registered in
 * `deletedRevision`
 */
export function findUndeletedRevision(revs, deletedRevision) {
  // find a revision matching deleted item's updated rev
  let index = revs.start;
  const { ids } = revs;
  let found = false;
  for (let i = 0, len = ids.length; i < len; i++) {
    const revision = `${index}-${ids[i]}`;
    if (found) {
      return revision;
    }
    if (revision === deletedRevision) {
      // next revision is the one we are looking for.
      found = true;
    }
    index--;
  }
  return null;
}

/**
 * Finds last not deleted revision of a document.
 *
 * @template T
 * @param {PouchDB.Database} db PouchDB instance
 * @param {DeletedEntity[]} items List of documents to process
 * @return {Promise<T[]>} Last not deleted version of each document.
 */
export async function findNotDeleted(db, items) {
  const list = Array.from(items)
  const options = {
    docs: list,
    revs: true,
  };
  const result = await db.bulkGet(options);
  const { results } = result;
  const data = [];
  for (let i = 0, len = results.length; i < len; i++) {
    const item = results[i];
    // @ts-ignore
    const doc = /** @type PouchDB.Core.GetMeta */ (item.docs[0].ok);
    if (!doc) {
      data[data.length] = Promise.resolve({ ok: false });
      continue;
    }
    const revs = doc._revisions;
    const undeletedRevision = findUndeletedRevision(revs, list[i].rev);
    if (!undeletedRevision) {
      data[data.length] = Promise.resolve({ ok: false });
    } else {
      // @ts-ignore
      data[data.length] = db.get(doc._id, { rev: undeletedRevision });
    }
  }
  return Promise.all(data);
}

/**
 * Reverts deleted items.
 *
 * @param {PouchDB.Database} db The database handler to perform the operation on.
 * @param {DeletedEntity[]} items List of objects to restore.
 * @return {Promise<ARCEntityChangeRecord[]>} Resolved promise with restored objects. Objects have updated `_rev` property.
 */
export async function revertDelete(db, items) {
  if (!db) {
    throw new Error('The "db" argument is missing');
  }
  if (!items) {
    throw new Error('The "items" argument is missing');
  }
  // first get information about previous revision (before delete)
  const restored = await findNotDeleted(db, items);
  for (let i = restored.length - 1; i >= 0; i--) {
    const item = restored[i];
    // @ts-ignore
    if (item.ok === false) {
      items.splice(i, 1);
      restored.splice(i, 1);
    } else {
      item._rev = items[i].rev;
    }
  }
  const updated = await db.bulkDocs(restored);
  const query = {
    keys: updated.map((item) => item.id),
    include_docs: true,
  };
  const result = await db.allDocs(query);
  const records = [];
  result.rows.forEach((request, i) => {
    const record = {
      id: request.id,
      rev: request.value.rev,
      item: request.doc,
      oldRev: items[i].rev,
    }
    records.push(record);
  });
  return records;
}
