/** @typedef {import('./RequestTypes').ARCSavedRequest} ARCSavedRequest */
/** @typedef {import('./RequestTypes').ARCHistoryRequest} ARCHistoryRequest */

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
