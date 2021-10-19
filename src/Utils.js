/* eslint-disable no-continue */
/* eslint-disable no-plusplus */

/** @typedef {import('@advanced-rest-client/events').ArcRequest.ARCSavedRequest} ARCSavedRequest */
/** @typedef {import('@advanced-rest-client/events').ArcRequest.ARCHistoryRequest} ARCHistoryRequest */
/** @typedef {import('@advanced-rest-client/events').Project.ARCProject} ARCProject */
/** @typedef {import('@advanced-rest-client/events').Model.DeletedEntity} DeletedEntity */
/** @typedef {import('@advanced-rest-client/events').Model.ARCEntityChangeRecord} ARCEntityChangeRecord */
/** @typedef {import('@advanced-rest-client/events').ArcRequest.RequestAuthorization} RequestAuthorization */
/** @typedef {import('@advanced-rest-client/events').ArcResponse.TransformedPayload} TransformedPayload */
/** @typedef {import('@advanced-rest-client/events').ArcResponse.Response} Response */

/**
 * Computes past midnight for given timestamp.
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
 * Normalizes various historical labels for the request to a currently used values.
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
 * Normalizes authorization object to a current one.
 *
 * @param {ARCHistoryRequest} request Request to process
 * @return {ARCHistoryRequest} Copy of the request
 */
export function normalizeAuthorization(request) {
  // @ts-ignore
  const { auth={}, authType } = request;
  if (!authType) {
    return request;
  }
  const requestAuth = /** @type RequestAuthorization */({
    config: auth,
    enabled: true,
    type: authType,
  });
  const copy = { ...request };
  copy.authorization = [requestAuth];
  delete copy.auth;
  // @ts-ignore
  delete copy.authType;
  return copy;
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
  if (!request.midnight) {
    const day = new Date(request.updated);
    day.setHours(0, 0, 0, 0);
    request.midnight = day.getTime();
  }
  if (!request.type) {
    // @ts-ignore
    if (request.name) {
      request.type = 'saved';
    } else {
      request.type = 'history';
    }
  } else if (request.type === 'drive' || request.type === 'google-drive') {
    request.type = 'saved';
  }
  if (request.type === 'history' && !request._id) {
    request._id = generateHistoryId(request);
  }
  return normalizeAuthorization(request);
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
      item: normalizeRequest(request.doc),
      oldRev: items[i].rev,
    }
    records.push(record);
  });
  return records;
}

/**
 * Transforms the `TransformedPayload` object to its original data type.
 * @param {TransformedPayload} body
 * @returns {Buffer|ArrayBuffer|undefined}
 */
export function restoreTransformedPayload(body) {
  if (body.type === 'ArrayBuffer') {
    const { buffer } = new Uint16Array(body.data);
    return buffer;
  }
  if (body.type === 'Buffer') {
    return Buffer.from(body.data);
  }
  return undefined;
}

/**
 * Normalizes projects list to common model.
 * It updates `updated` property to current time.
 * If an item is not an object then it is removed.
 *
 * @param {ARCProject[]} projects List of projects.
 * @return {ARCProject[]}
 */
export function normalizeProjects(projects) {
  const items = [...projects];
  for (let i = items.length - 1; i >= 0; i--) {
    let item = items[i];
    if (!item || typeof item !== 'object') {
      items.splice(i, 1);
      continue;
    }
    item = {
      order: 0,
      requests: [],
      ...item,
    };
    item.updated = Date.now();
    if (!item.created) {
      item.created = item.updated;
    }
    items[i] = item;
  }
  return items;
}

/**
 * Generates default export name value.
 * @return {string}
 */
export function generateFileName() {
  const date = new Date();
  const day = date.getDate();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return `arc-data-export-${day}-${month}-${year}.json`;
}
