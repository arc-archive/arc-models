import '../../pouchdb/dist/pouchdb.js';
import '../../chance/dist/chance.min.js';
/* global Chance, PouchDB */
const chance = new Chance();
export const DatabaseHelper = {};
let LAST_TIME = Date.now();
DatabaseHelper.payloadMethods = ['POST', 'PUT', 'DELETE', 'OPTIONS'];
DatabaseHelper.nonPayloadMethods = ['GET', 'HEAD'];
DatabaseHelper.contentTypes = [
  'application/x-www-form-urlencoded',
  'application/json',
  'application/xml',
  'text/plain'
];

// Sets a midnight on the timestamp
DatabaseHelper.setMidninght = function(time) {
  const now = new Date(time);
  now.setMilliseconds(0);
  now.setSeconds(0);
  now.setMinutes(0);
  now.setHours(0);
  return now.getTime();
};
/**
 * Generates HTTP headers string.
 *
 * @param {?String} contentType
 * @param {Object} opts Configuration options:
 * - `noHeaders` (Boolean) will not generate headers string
 * (will set empty string)
 * @return {String} Valid HTTP headers string.
 */
DatabaseHelper.generateHeaders = function(contentType, opts) {
  opts = opts || {};
  let headers = '';
  if (!opts.noHeaders) {
    const headersSize = chance.integer({
      min: 0,
      max: 10
    });
    for (let i = 0; i < headersSize; i++) {
      headers += 'X-' + chance.word() + ': ' + chance.word() + '\n';
    }
  }
  if (contentType) {
    headers += 'content-type: ' + contentType;
  }
  return headers;
};
/**
 * Generates a HTTP method name for the request.
 *
 * @param {Boolean} isPayload If true it will use `opts.methodsPools` or
 * `DataGenerator.payloadMethods` to pick a method
 * from. Otherwise it will use
 * `DataGenerator.nonPayloadMethods` to pick a method from.
 * @param {Object} opts Configuration options:
 * -   `methodsPools` (Array<String>) List of methods to randomly pick from.
 *      It only relevant for a requests that can carry a payload.
 * @return {String} Randomly picked HTTP method name.
 */
DatabaseHelper.generateMethod = function(isPayload, opts) {
  opts = opts || {};
  if (isPayload) {
    return chance.pick(opts.methodsPools || DatabaseHelper.payloadMethods);
  }
  return chance.pick(DatabaseHelper.nonPayloadMethods);
};
/**
 * Randomly generates a boolean flag describing if the request can
 * carry a payload.
 * @param {Object} opts Configuration options:
 * -   `noPayload` (Boolean) If set the request will not have payload
 * -   `forcePayload` (Boolean) The request will always have a payload.
 *      THe `noPayload` property takes precedence over this setting.
 * @return {Boolean} `true` if the request can carry a payload and
 * `false` otherwise.
 */
DatabaseHelper.generateIsPayload = function(opts) {
  opts = opts || {};
  let isPayload = false;
  if (!opts.noPayload) {
    if (opts.forcePayload || chance.bool()) {
      isPayload = true;
    }
  }
  return isPayload;
};
/**
 * Generates a `content-type` header value.
 * @return {String} Value of the `content-type` header
 */
DatabaseHelper.generateContentType = function() {
  return chance.pick(DatabaseHelper.contentTypes);
};
/**
 * Generates random payload data for given `contentType`.
 * The `contentType` must be one of the `DataGenerator.contentTypes`.
 * @return {String} Payload message.
 */
DatabaseHelper.generatePayload = function() {
  return chance.paragraph();
};
/**
 * Generates a request timestamp that is withing this month.
 * @return {Number} The timestamp
 */
DatabaseHelper.generateRequestTime = function() {
  const d = new Date();
  let year = d.getFullYear();
  let month = d.getMonth();
  month--;
  if (month === -1) {
    month = 11;
    year--;
  }
  const randomDay = chance.date({year: year, month: month});
  return randomDay.getTime();
};
/**
 * Generates a description for a request.
 *
 * @param {Object} opts Configuration options:
 * -   `noDescription` (Boolean) if set then it will never generate a desc.
 * @return {String|undefined} Items description.
 */
DatabaseHelper.generateDescription = function(opts) {
  if (opts && opts.noDescription) {
    return;
  }
  return chance.bool({likelihood: 70}) ? chance.paragraph() : undefined;
};
/**
 * Generates a random ARC legacy project object.
 *
 * @return {Object} ARC's object.
 */
DatabaseHelper.createProjectObject = function() {
  const project = {
    _id: chance.guid({
      version: 5
    }),
    name: chance.sentence({words: 2}),
    order: 0,
    description: chance.paragraph()
  };
  return project;
};
/**
 * Generates random saved request item.
 *
 * @param {Object} opts Options to generate the request:
 * -   `noPayload` (Boolean) If set the request will not have payload
 * -   `forcePayload` (Boolean) The request will always have a payload.
 *      The `noPayload` property takes precedence over this setting.
 * -   `methodsPools` (Array<String>) List of methods to randomly pick one of
 * -   `noHeaders` (Boolean) will not generate headers string (will set empty
 *      string). If payload is generated then it will always contain a
 *      `content-type` header.
 * -   `noGoogleDrive` (Boolean) if set then it will never generate Drive ID.
 * -   `noDescription` (Boolean) if set then it will never generate a desc.
 * -   `project` (String) A project ID to add. It also add other project related
 *      properties.
 * @return {Object} A request object
 */
DatabaseHelper.generateSavedItem = function(opts) {
  opts = opts || {};
  const isPayload = DatabaseHelper.generateIsPayload(opts);
  const method = DatabaseHelper.generateMethod(isPayload, opts);
  const contentType = isPayload ? DatabaseHelper.generateContentType() :
    undefined;
  const headers = DatabaseHelper.generateHeaders(contentType, opts);
  const payload = DatabaseHelper.generatePayload();
  const time = DatabaseHelper.generateRequestTime();
  const requestName = chance.sentence({words: 2});
  const description = DatabaseHelper.generateDescription(opts);

  const item = {
    url: chance.url(),
    method: method,
    headers: headers,
    created: time,
    updated: time,
    type: 'saved',
    name: requestName
  };
  if (description) {
    item.description = description;
  }
  if (payload) {
    item.payload = payload;
  }
  if (opts.project) {
    item.projects = [opts.project];
    item.projectOrder = chance.integer({min: 0, max: 10});
  }
  return item;
};
/**
 * Generates a history object.
 *
 * @param {Object} opts Options to generate the request:
 * -   `noPayload` (Boolean) If set the request will not have payload
 * -   `forcePayload` (Boolean) The request will always have a payload.
 *      The `noPayload` property takes precedence over this setting.
 * -   `methodsPools` (Array<String>) List of methods to randomly pick one of
 * -   `noHeaders` (Boolean) will not generate headers string (will set empty
 *      string). If payload is generated then it will always contain a
 *      `content-type` header.
 * @return {Object} A request object
 */
DatabaseHelper.generateHistoryObject = function(opts) {
  opts = opts || {};
  LAST_TIME -= chance.integer({min: 1.8e+6, max: 8.64e+7});
  const isPayload = DatabaseHelper.generateIsPayload(opts);
  const method = DatabaseHelper.generateMethod(isPayload, opts);
  const contentType = isPayload ? DatabaseHelper.generateContentType() :
    undefined;
  const headers = DatabaseHelper.generateHeaders(contentType, opts);
  const payload = DatabaseHelper.generatePayload(contentType);
  const url = chance.url();
  const item = {
    url: url,
    method: method,
    headers: headers,
    created: LAST_TIME,
    updated: LAST_TIME
  };
  if (payload) {
    item.payload = payload;
  }
  return item;
};
/**
 * Picks a random project ID from the list of passed in `opts` map projects.
 *
 * @param {Object} opts Configuration options:
 * -   `projects` (Array<Object>) List of generated projects
 * @return {String|undefined} Project id or undefined.
 */
DatabaseHelper.pickProjectId = function(opts) {
  opts = opts || {};
  if (!opts.projects) {
    return;
  }
  const projectsIndex = chance.integer({min: 0, max: opts.projects.length - 1});
  return chance.bool() ? opts.projects[projectsIndex]._id : undefined;
};
/**
 * Generates a list of saved requests.
 *
 * @param {Object} opts Configuration options:
 * -   `projects` (Array<Object>) List of generated projects
 * -   `requestsSize` (Number) Number of request to generate. Default to 25.
 * Rest of configuration options are defined in
 * `DatabaseHelper.generateSavedItem`
 * @return {Array<Object>} List of requests.
 */
DatabaseHelper.generateRequests = function(opts) {
  opts = opts || {};
  const list = [];
  const size = opts.requestsSize || 25;
  for (let i = 0; i < size; i++) {
    const project = DatabaseHelper.pickProjectId(opts);
    const _opts = Object.assign({}, opts);
    _opts.project = project;
    list.push(DatabaseHelper.generateSavedItem(_opts));
  }
  return list;
};
/**
 * Generates a list of project objects.
 *
 * @param {Object} opts Configuration options:
 * -   `projectsSize` (Number) A number of projects to generate.
 * @return {Array<Object>} List of generated project objects.
 */
DatabaseHelper.generateProjects = function(opts) {
  opts = opts || {};
  const size = opts.projectsSize || 5;
  const result = [];
  for (let i = 0; i < size; i++) {
    result.push(DatabaseHelper.createProjectObject());
  }
  return result;
};
/**
 * Generates requests data. That includes projects and requests.
 *
 * @param {Object} opts Configuration options:
 * -   `projectsSize` (Number) A number of projects to generate.
 * -   `requestsSize` (Number) Number of request to generate. Default to 25.
 * Rest of configuration options are defined in
 * `DatabaseHelper.generateSavedItem`
 * @return {Object} A map with `projects` and `requests` arrays.
 */
DatabaseHelper.generateSavedRequestData = function(opts) {
  opts = opts || {};
  const projects = DatabaseHelper.generateProjects(opts);
  opts.projects = projects;
  const requests = DatabaseHelper.generateRequests(opts);
  return {
    requests: requests,
    projects: projects
  };
};
/**
 * Generates history requests list
 *
 * @param {Object} opts Configuration options:
 * -   `requestsSize` (Number) Number of request to generate. Default to 25.
 * Rest of configuration options are defined in
 * `DatabaseHelper.generateHistoryObject`
 * @return {Array} List of history requests objects
 */
DatabaseHelper.generateHistoryRequestsData = function(opts) {
  opts = opts || {};
  const size = opts.requestsSize || 25;
  const result = [];
  for (let i = 0; i < size; i++) {
    result.push(DatabaseHelper.generateHistoryObject(opts));
  }
  return result;
};
/**
 * Generates saved requests data and inserts them into the data store if they
 * are missing.
 *
 * @param {Object} opts See `DatabaseHelper.generateSavedRequestData`
 * for description.
 * @return {Promise} Resolved promise when data are inserted into the datastore.
 * Promise resolves to generated data object
 */
DatabaseHelper.insertSavedRequestData = function(opts) {
  opts = opts || {};
  const data = DatabaseHelper.generateSavedRequestData(opts);
  const savedDb = new PouchDB('saved-requests');
  const projectsDb = new PouchDB('legacy-projects');
  return projectsDb.bulkDocs(data.projects)
  .then(function() {
    return savedDb.bulkDocs(data.requests);
  })
  .then(function() {
    return data;
  });
};
/**
 * @return {Promise} Promise resolved to all documents in the projects store.
 */
DatabaseHelper.allProjects = function() {
  const projectsDb = new PouchDB('legacy-projects');
  return projectsDb.allDocs({
    include_docs: true
  })
  .then((response) => response.rows.map((item) => item.doc));
};
/**
 * Generates and saves cookies data to the data store.
 *
 * @param {Object} opts See `DatabaseHelper.generateHistoryRequestsData`
 * for description.
 * @return {Promise} Resolved promise when data are inserted into the datastore.
 * Promise resolves to generated data object
 */
DatabaseHelper.insertHistoryRequestData = function(opts) {
  opts = opts || {};
  const data = DatabaseHelper.generateHistoryRequestsData(opts);
  const db = new PouchDB('history-requests');
  return db.bulkDocs(data)
  .then(function() {
    return data;
  });
};
DatabaseHelper.clearDatabases = function(...names) {
  const promises = names.map((name) => new PouchDB(name).destroy());
  return Promise.all(promises);
};
DatabaseHelper.clearProjects = function() {
  return DatabaseHelper.clearDatabases('legacy-projects');
};
DatabaseHelper.clearRequests = function() {
  return DatabaseHelper.clearDatabases('saved-requests'); // 'history-requests'
};
DatabaseHelper.clearHistory = function() {
  return DatabaseHelper.clearDatabases('history-requests');
};
DatabaseHelper.clearWebsocketUrlHostory = function() {
  return DatabaseHelper.clearDatabases('websocket-url-history');
};
DatabaseHelper.clearRestAPi = function() {
  return DatabaseHelper.clearDatabases('api-index', 'api-data');
};
DatabaseHelper.clearHostRules = function() {
  return DatabaseHelper.clearDatabases('host-rules');
};
DatabaseHelper.clearAuthData = function() {
  return DatabaseHelper.clearDatabases('auth-data');
};
