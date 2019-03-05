/**
Copyright 2016 The Advanced REST client authors <arc@mulesoft.com>
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
*/
import {RequestBaseModel} from './request-base-model.js';
import {PayloadProcessor} from '@advanced-rest-client/arc-electron-payload-processor/payload-processor.mjs';
/**
 * Event based access to saved and history request datastore.
 *
 * This model creates and updates updates request objects and updates
 * URL index associated with the request.
 * It also supports querying for request data, deleting request data and
 * undeleting it.
 *
 * ## Required dependency
 *
 * Because `pouchdb.quick-search` plugin and PouchDB in general is not ES6 ready
 * the plugin has to be included as a regular script and then added as a Plugin to
 * PouchDB global instance. This component has `pouchdb.quick-search` as a
 * dependency.
 *
 * ```html
 * <script src="node_modules/pouchdb-quick-search/dist/pouchdb.quick-search.js"></script>
 * <script type="module">
 * import 'node_modules/pouchdb/dist/pouchdb.js';
 * PouchDB.plugin(PouchQuickSearch);
 * <script>
 * ```
 *
 * ## Events API
 *
 * All events must be marked as cancelable or will be ignore by the model.
 * In ARC ecosystem models dispatch the same event after the object is updated
 * (deleted, created, updated) but the event is not cancelable.
 * Components should only react on non cancelable model events as it means
 * that the change has been commited to the datastore.
 *
 * Each handled event is canceled so it's safe to put more than one model in
 * the DOM. Event's detail object will get `result` property with the promise
 * resolved when operation commits.
 *
 * **save-request**
 * This event should be used when dealing with unprocessed request data.
 * Request object may contain Blob or FormData as a payload which would be lost
 * if trying to store it in the data store. This flow handles payload
 * transformation.
 *
 * Detail's parameteres:
 * - request - Required, ArcRequest object
 * - projects - Optional, Array of strings, List of project names to create
 * with this request and associate with the request object.
 * - options - Optional, map of additional options. Currently only `isDrive` is
 * supported. When set `export-google-drive` is dispatched. If the event is not
 * handled by the application the save flow fails.
 *
 * ```javascript
 * const e = new CustomEvent('save-request', {
 *  bubbles: true,
 *  composed: true,
 *  cancelable: true,
 *  detail: {
 *    request: {...}
 *    projects: ['Test project'],
 *    options: {
 *      isDrive: true
 *    }
 *  }
 * };
 * this.dispatchEvent(e);
 * ```
 *
 * **request-object-read**
 *
 * Reads the request from the data store.
 *
 * Detail's parameteres:
 *
 * - `id` - Required, String. Request ID
 * - `type` - Required, String. Either `history` or `saved`
 * - `rev` - Optional, String. Specific revision to read
 *
 * **request-object-changed**
 *
 * Should be only used if the payload is not `Blob` or `FormData` and
 * all request properties are set. By default `save-request` event should be
 * used.
 *
 * Detail's parameteres: ArcRequest object.
 * https://github.com/advanced-rest-client/api-components-api/blob/master/docs/
 * arc-models.md#arcrequest
 *
 * **request-object-deleted**
 *
 * Deletes the object from the data store.
 *
 * Detail's parameteres:
 *
 * - `id` - Required, String. Request ID
 * - `type` - Required, String. Either `history` or `saved`
 *
 * **request-objects-deleted**
 *
 * Deletes number of requests in bulk.
 *
 * Detail's parameteres:
 *
 * - `type` - Required, String. Either `history` or `saved`
 * - `items` - Required, Array<String>. List of request IDs to delete.
 *
 * **request-objects-undeleted**
 *
 * Used to restore deleted request data.
 *
 * Detail's parameteres:
 *
 * - `type` - Required, String. Either `history` or `saved`
 * - `items` - Required, Array<Object>. List of requests to restore.
 * Each object must contain `_rev` and `_id`.
 *
 * The `result` property contains result of calling `revertRemove()` function.
 *
 * **request-query**
 *
 * Queries for request data. This flow searches for URL data in a separate index
 * and then performs full text search on the request data store.
 *
 * Detail's parameteres:
 *
 * - `q` - Required, String. User query.
 * - `type` - Optional, String. Either `history` or `saved`. By default it
 * searches in both data stores.
 * - `detailed` - Optional, Boolean. If set it uses slower algorithm but performs full
 * search on the index. When false it only uses filer like query + '*'.
 *
 * @polymer
 * @customElement
 * @memberof LogicElements
 * @extends RequestBaseModel
 */
class RequestModel extends RequestBaseModel {
  /**
   * @constructor
   */
  constructor() {
    super();
    this._handleRead = this._handleRead.bind(this);
    this._handleObjectSave = this._handleObjectSave.bind(this);
    this._handleObjectsSave = this._handleObjectsSave.bind(this);
    this._handleObjectDelete = this._handleObjectDelete.bind(this);
    this._handleObjectsDelete = this._handleObjectsDelete.bind(this);
    this._handleUndelete = this._handleUndelete.bind(this);
    this._saveRequestHandler = this._saveRequestHandler.bind(this);
    this._saveHistoryHandler = this._saveHistoryHandler.bind(this);
    this._handleQuery = this._handleQuery.bind(this);
    this._handleList = this._handleList.bind(this);
    this._listProjectRequestsHandler = this._listProjectRequestsHandler.bind(this);
  }
  /**
   * Adds event listeners.
   * @param {HTMLElement} node
   */
  _attachListeners(node) {
    node.addEventListener('save-request', this._saveRequestHandler);
    node.addEventListener('save-history', this._saveHistoryHandler);
    node.addEventListener('request-object-read', this._handleRead);
    node.addEventListener('request-object-changed', this._handleObjectSave);
    node.addEventListener('request-objects-changed', this._handleObjectsSave);
    node.addEventListener('request-object-deleted', this._handleObjectDelete);
    node.addEventListener('request-objects-deleted', this._handleObjectsDelete);
    node.addEventListener('request-objects-undeleted', this._handleUndelete);
    node.addEventListener('request-query', this._handleQuery);
    node.addEventListener('request-list', this._handleList);
    node.addEventListener('request-project-list', this._listProjectRequestsHandler);
    node.addEventListener('destroy-model', this._deleteModelHandler);
  }
  /**
   * Removes event listeners.
   * @param {HTMLElement} node
   */
  _detachListeners(node) {
    node.removeEventListener('save-request', this._saveRequestHandler);
    node.removeEventListener('save-history', this._saveHistoryHandler);
    node.removeEventListener('request-object-read', this._handleRead);
    node.removeEventListener('request-object-changed', this._handleObjectSave);
    node.removeEventListener('request-objects-changed', this._handleObjectsSave);
    node.removeEventListener('request-object-deleted',
      this._handleObjectDelete);
    node.removeEventListener('request-objects-deleted',
      this._handleObjectsDelete);
    node.removeEventListener('request-objects-undeleted', this._handleUndelete);
    node.removeEventListener('request-query', this._handleQuery);
    node.removeEventListener('request-list', this._handleList);
    node.removeEventListener('request-project-list', this._listProjectRequestsHandler);
    node.removeEventListener('destroy-model', this._deleteModelHandler);
  }
  /**
   * A handler for `save-request-data` custom event. It's special event to
   * save / update request data dispatched by the request editor.
   *
   * @param {CustomEvent} e
   */
  _saveRequestHandler(e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const request = e.detail.request;
    const projects = e.detail.projects;
    const options = e.detail.options;
    if (!request._id) {
      request._id = this.uuid.generate();
    }
    let p;
    if (projects && projects.length) {
      p = this._createProjects(projects, request._id);
    } else {
      p = Promise.resolve();
    }
    e.detail.result = p
    .then((projectIds) => {
      if (!request.projects) {
        request.projects = [];
      }
      if (request.legacyProject) {
        if (request.projects.indexOf(request.legacyProject) === -1) {
          request.projects.push(request.legacyProject);
        }
        delete request.legacyProject;
      }
      if (projectIds) {
        request.projects = request.projects.concat(projectIds);
      }
      request.type = 'saved';
      return this.saveRequest(request, options);
    });
  }
  /**
   * Create projects from project names.
   * It is used when creating a request with a new project.
   *
   * @param {Array<String>} names Names of projects
   * @param {?String} requestId Request ID to add to the projects.
   * @return {Promise<Array<String>>} Promise resolved to list of project IDs
   */
  _createProjects(names, requestId) {
    const requests = [];
    if (requestId) {
      requests.push(requestId);
    }
    const projects = names.map((name) => {
      return {
        updated: Date.now(),
        order: 0,
        requests,
        name
      };
    });
    return this.projectDb.bulkDocs(projects)
    .then((response) => {
      const result = [];
      for (let i = 0, len = response.length; i < len; i++) {
        const r = response[i];
        if (r.error) {
          this._handleException(r, true);
          continue;
        }
        const project = projects[i];
        project._rev = r.rev;
        project._id = r.id;
        this._fireUpdated('project-object-changed', {
          project: project
        });
        result[result.length] = r.id;
      }
      return result;
    });
  }
  /**
   * Handler for `save-history` object. It computes payload to savable state
   * and saves history object.
   * Note, the ID is is a combination of today's midningt timestamp, url and
   * method. If such ID already exists the object is updated.
   *
   * @param {CustomEvent} e
   */
  _saveHistoryHandler(e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const request = e.detail.request;
    if (!request._id) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      let id = d.getTime();
      id += '/' + encodeURIComponent(request.url);
      id += '/' + request.method;
      request._id = id;
    }
    request.type = 'history';
    const db = this.getDatabase(request.type);
    e.detail.result = db.get(request._id)
    .catch((e) => {
      if (e.status === 404) {
        return;
      }
      this._handleException(e);
    })
    .then((dbRequest) => {
      if (dbRequest) {
        request._rev = dbRequest._rev;
      }
      return this.saveRequest(request);
    });
  }
  /**
   * Saves a request into a data store.
   * It handles payload to string conversion, handles types, and syncs request
   * with projects. Use `update()` method only if you are storing already
   * prepared request object to the store.
   *
   * @param {Object} request ArcRequest object
   * @param {Object} opts Save request object. Currently only `isDrive`
   * is supported
   * @return {Promise} A promise resilved to updated request object.
   */
  saveRequest(request, opts) {
    opts = opts || {};
    if (!request.type) {
      if (request.name) {
        request.type = 'saved';
      } else {
        request.type = 'history';
      }
    } else if (request.type === 'drive' || request.type === 'google-drive') {
      request.type = 'saved';
    }
    if (!request._id) {
      request._id = this.uuid.generate();
    }
    return PayloadProcessor.payloadToString(request)
    .then((result) => {
      request = result;
      return this._saveGoogleDrive(request, opts);
    })
    .then((request) => this.update(request.type, request))
    .then((request) => {
      return this._syncProjects(request._id, request.projects)
      .then(() => request);
    })
    .catch((cause) => this._handleException(cause));
  }
  /**
   * Sunchronizes project requests to ensure each project contains this
   * `requestId` on their list of requests.
   *
   * @param {String} requestId Request ID
   * @param {?Array<String>} projects List of request projects.
   * @return {Promise}
   */
  _syncProjects(requestId, projects) {
    if (!projects || !projects.length) {
      return Promise.resolve();
    }
    const db = this.projectDb;
    const update = [];
    return db.allDocs({
      // jscs:disable
      include_docs: true
      // jscs:enable
    })
    .then((response) => {
      const rows = response.rows;
      for (let i = 0, len = rows.length; i < len; i++) {
        const project = rows[i];
        const doc = project.doc;
        if (projects.indexOf(project.id) === -1) {
          const index = doc.requests ? doc.requests.indexOf(requestId) : -1;
          if (index !== -1) {
            doc.requests.splice(index, 1);
            update.push(doc);
          }
          continue;
        }
        if (!doc.requests) {
          doc.requests = [requestId];
          update.push(doc);
        } else if (doc.requests.indexOf(requestId) === -1) {
          doc.requests.push(requestId);
          update.push(doc);
        }
      }
      if (update.length) {
        return db.bulkDocs(update);
      }
    })
    .then((response) => {
      if (!response) {
        return;
      }
      for (let i = 0, len = response.length; i < len; i++) {
        const r = response[i];
        if (r.error) {
          this._handleException(r, true);
          continue;
        }
        const project = update[i];
        project._rev = r.rev;
        this._fireUpdated('project-object-changed', {
          project: project
        });
      }
    });
  }
  /**
   * Normalizes request object to whatever the app is currently using.
   * @param {Object} request
   * @return {Object}
   */
  normalizeRequest(request) {
    if (!request) {
      return;
    }
    if (request.legacyProject) {
      if (!request.projects) {
        request.projects = [];
      }
      request.projects[request.projects.length] = request.legacyProject;
      delete request.legacyProject;
    }
    const skipKeys = ['_id', '_rev'];
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
   * Reads an entry from the datastore.
   *
   * @param {String} type Request type: `saved-requests` or `history-requests`
   * @param {String} id The ID of the datastore entry.
   * @param {?String} rev Specific revision to read. Defaults to
   * latest revision.
   * @param {?Object} opts Additional options. Currently only `restorePayload`
   * is supported
   * @return {Promise} Promise resolved to a project object.
   */
  read(type, id, rev, opts) {
    const conf = {};
    if (rev) {
      conf.rev = rev;
    }
    const db = this.getDatabase(type);
    return db.get(id, conf)
    .then((request) => {
      if (opts && opts.restorePayload) {
        request = PayloadProcessor.restorePayload(request);
      }
      return this.normalizeRequest(request);
    });
  }
  /**
   * The same as `read()` but for a list of requests.
   * @param {String} type Requests type to restore.
   * @param {Array<String>} keys Request ids
   * @param {?Object} opts Additional options. Currently only `restorePayload`
   * is supported
   * @return {Promise}
   */
  readBulk(type, keys, opts) {
    const db = this.getDatabase(type);
    return db.allDocs({
      include_docs: true,
      keys
    })
    .then((response) => {
      const requests = [];
      response.rows.forEach((item) => {
        const request = item.doc;
        if (!request) {
          return;
        }
        if (opts && opts.restorePayload) {
          PayloadProcessor.restorePayload(request);
        }
        requests[requests.length] = request;
      });
      return requests;
    });
  }
  /**
   * Updates / saves the request object in the datastore.
   * This function fires `request-object-changed` event.
   *
   * If any of `name`, `method`, `url` or `legacyProject` properties change
   * then the old object is deleted and new is created with new ID.
   *
   * @param {String} type Request type: `saved-requests` or `history-requests`
   * @param {Object} request An object to save / update
   * @return {Promise} Resolved promise to request object with updated `_rev`
   */
  update(type, request) {
    const db = this.getDatabase(type);
    let oldRev = request._rev;
    if (!request._id) {
      request._id = this.uuid.generate();
    }
    request.updated = Date.now();
    let copy = Object.assign({}, request);
    copy = this.normalizeRequest(copy);
    return db.put(copy)
    .then((result) => {
      request._rev = result.rev;
      const detail = {
        request: request,
        oldRev: oldRev,
        // oldId will be removed
        oldId: request._id,
        type: type
      };
      this._fireUpdated('request-object-changed', detail);
      return request;
    });
  }
  /**
   * Updates more than one request in a bulk.
   * @param {String} type Request type: `saved-requests` or `history-requests`
   * @param {Array<Object>} requests List of requests to update.
   * @return {Array} List of PouchDB responses to each insert
   */
  updateBulk(type, requests) {
    const db = this.getDatabase(type);
    for (let i = 0; i < requests.length; i++) {
      requests[i] = this.normalizeRequest(requests[i]);
    }
    return db.bulkDocs(requests)
    .then((response) => {
      for (let i = 0, len = response.length; i < len; i++) {
        const r = response[i];
        if (r.error) {
          this._handleException(r, true);
          continue;
        }
        const request = requests[i];
        const oldRev = request._rev;
        request._rev = r.rev;
        if (!request._id) {
          request._id = r.id;
        }
        const detail = {
          request,
          oldRev: oldRev,
          oldId: request._id,
          type: type
        };
        this._fireUpdated('request-object-changed', detail);
      }
      return response;
    })
    .catch((cause) => {
      console.warn('[request-model] ' + cause.message);
      throw cause;
    });
  }
  /**
   * Removed an object from the datastore.
   * This function fires `request-object-deleted` event.
   *
   * @param {String} type Request type: `saved-requests` or `history-requests`
   * @param {String} id The ID of the datastore entry.
   * @param {?String} rev Specific revision to read. Defaults to
   * latest revision.
   * @return {Promise} Promise resolved to a new `_rev` property of deleted
   * object.
   */
  remove(type, id, rev) {
    let promise;
    if (!rev) {
      promise = this.read(type, id)
      .then((obj) => rev = obj._rev);
    } else {
      promise = Promise.resolve();
    }
    return promise.then(() => {
      const db = this.getDatabase(type);
      return db.remove(id, rev);
    })
    .then((response) => {
      const detail = {
        id: id,
        rev: response.rev,
        oldRev: rev,
        type: type
      };
      this._fireUpdated('request-object-deleted', detail);
      return response.rev;
    });
  }
  /**
   * Reverts deleted items.
   * This function fires `request-object-changed` event for each restored
   * request.
   *
   * @param {String} type Request type: `saved-requests` or `history-requests`
   * @param {Array} items List of request objects. Required properties are
   * `_id` and `_rev`.
   * @return {Promise} Resolved promise with restored objects. Objects have
   * updated `_rev` property.
   */
  revertRemove(type, items) {
    const db = this.getDatabase(type);
    // first get information about previous revision (before delete)
    return this._findNotDeleted(db, items)
    .then((restored) => {
      restored = restored.map((doc, i) => {
        doc._rev = items[i]._rev;
        return doc;
      });
      return db.bulkDocs(restored);
    })
    .then((result) => {
      return db.allDocs({
        keys: result.map((item) => item.id),
        // jscs:disable
        include_docs: true
        // jscs:enable
      });
    })
    .then((result) => {
      result.rows.forEach((request, i) => {
        const detail = {
          request: request.doc,
          oldRev: items[i]._rev,
          oldId: request.id,
          type: type
        };
        this._fireUpdated('request-object-changed', detail);
      });
      return result.rows;
    });
  }
  /**
   * Finds last not deleted revision of a document.
   * @param {Object} db PouchDB instance
   * @param {Array} items List of documents to process
   * @return {Promise<Array>} Last not deleted version of each document.
   */
  _findNotDeleted(db, items) {
    const list = items.map((item) => {
      return {
        id: item._id,
        rev: item._rev
      };
    });
    const options = {
      docs: list,
      revs: true
    };
    return db.bulkGet(options)
    .then((result) => {
      return result.results.map((item, i) => {
        const doc = item.docs[0].ok;
        const revs = doc._revisions;
        const undeletedRevision =
          this._findUndeletedRevision(revs, items[i]._rev);
        if (!undeletedRevision) {
          throw new Error('Previous version of the object not found');
        }
        return db.get(doc._id, {rev: undeletedRevision});
      });
    })
    .then((promises) => Promise.all(promises));
  }
  /**
   * Finds a next revision after the `deletedRevision` in the revisions history
   * which is the one that reverts any changes made after it.
   *
   * @param {Object} revs PouchDB revision history object
   * @param {Object} deletedRevision Revision of deleted object (after delete).
   * @return {String} Revision ID of the object before a change registered in
   * `deletedRevision`
   */
  _findUndeletedRevision(revs, deletedRevision) {
    // find a revision matching deleted item's updated rev
    let index = revs.start;
    const ids = revs.ids;
    let found = false;
    for (let i = 0, len = ids.length; i < len; i++) {
      const revision = index + '-' + ids[i];
      if (found) {
        return revision;
      }
      if (revision === deletedRevision) {
        // next revision is the one we are looking for.
        found = true;
      }
      index--;
    }
  }
  /**
   * Handler for request read event request.
   * @param {CustomEvent} e
   */
  _handleRead(e) {
    if (!e.cancelable || e.composedPath()[0] === this) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const {type, id, opts} = e.detail;
    if (!id) {
      e.detail.result = Promise.reject(
        new Error('Request "id" property is missing.'));
      return;
    }
    if (!type) {
      e.detail.result = Promise.reject(
        new Error('Request "type" property is missing.'));
      return;
    }
    let p;
    if (id instanceof Array) {
      p = this.readBulk(type, id, opts);
    } else {
      p = this.read(type, id, e.detail.rev, opts);
    }
    e.detail.result = p
    .catch((e) => this._handleException(e));
  }
  /**
   * Handles onject save / update
   *
   * @param {CustomEvent} e
   */
  _handleObjectSave(e) {
    if (e.composedPath()[0] === this || !e.cancelable) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const request = e.detail.request;
    if (!request) {
      e.detail.result = Promise.reject(
        new Error('The "request" property is missing.'));
      return;
    }
    if (!e.detail.type) {
      e.detail.result = Promise.reject(
        new Error('The "type" property is missing.'));
      return;
    }
    const db = this.getDatabase(e.detail.type);
    let p;
    if (request._id && !request._rev) {
      p = db.get(request._id)
      .catch((e) => {
        if (e.status === 404) {
          // create new
          return {};
        }
        this._handleException(e);
      });
    } else {
      p = Promise.resolve({});
    }
    e.detail.result = p
    .then((result) => {
      result = Object.assign({}, result, request);
      return this.update(e.detail.type, result);
    })
    .catch((e) => this._handleException(e));
  }
  /**
   * Handler for `request-objects-changed` event. Updates requests in bulk operation.
   * @param {CustomEvent} e
   */
  _handleObjectsSave(e) {
    if (e.composedPath()[0] === this || !e.cancelable) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const {requests, type} = e.detail;
    if (!requests) {
      e.detail.result = Promise.reject(
        new Error('The "requests" property is missing.'));
      return;
    }
    if (!type) {
      e.detail.result = Promise.reject(
        new Error('The "type" property is missing.'));
      return;
    }
    e.detail.result = this.updateBulk(type, requests);
  }
  /**
   * Deletes the object from the datastore.
   *
   * @param {CustomEvent} e
   */
  _handleObjectDelete(e) {
    if (e.composedPath()[0] === this) {
      return;
    }
    if (!e.cancelable) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    if (!e.detail.type) {
      e.detail.result = Promise.reject(
        new Error('Request "type" property is missing.'));
      return;
    }

    if (!e.detail.id) {
      e.detail.result = Promise.reject(new Error('Missing "id" property.'));
      return;
    }

    e.detail.result = this.remove(e.detail.type, e.detail.id, e.detail.rev)
    .catch((e) => this._handleException(e));
  }
  /**
   * Queries for a list of projects.
   * @param {CustomEvent} e
   */
  _handleObjectsDelete(e) {
    if (!e.cancelable || e.composedPath()[0] === this) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    if (!e.detail.type) {
      e.detail.result = Promise.reject(
        new Error('Request "type" property is missing.'));
      return;
    }

    if (!e.detail.items) {
      e.detail.result = Promise.reject(
        new Error('The "items" property is missing.'));
      return;
    }
    const db = this.getDatabase(e.detail.type);
    let removed = [];
    e.detail.result = db.allDocs({
      keys: e.detail.items
    })
    .then((res) => this._filterExistingItems(res))
    .then((res) => {
      removed = res;
      return Promise.all(res.map((i) => db.remove(i.id, i.value.rev)));
    })
    .then((result) => {
      const data = {};
      result.forEach((item) => {
        if (item.ok) {
          const detail = {
            id: item.id,
            rev: item.rev,
            oldRev: this._findOldRef(removed, item.id)
          };
          data[item.id] = item.rev;
          this._fireUpdated('request-object-deleted', detail);
        }
      });
      return data;
    });
  }
  /**
   * handlers `request-objects-undeleted` event to restore deleted items
   * @param {CustomEvent} e
   */
  _handleUndelete(e) {
    if (!e.cancelable || e.composedPath()[0] === this) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    if (!e.detail.type) {
      e.detail.result = Promise.reject(
        new Error('Request "type" property is missing.'));
      return;
    }

    if (!e.detail.items) {
      e.detail.result = Promise.reject(
        new Error('The "items" property is missing.'));
      return;
    }
    e.detail.result = this.revertRemove(e.detail.type, e.detail.items)
    .catch((e) => this._handleException(e));
  }
  /**
   * Filters query results to return only successfuly read data.
   * @param {Object} result PouchDB query result
   * @return {Array} List of request that has been read.
   */
  _filterExistingItems(result) {
    result = result.rows.filter((item) => {
      if (item.error) {
        console.warn(item);
        return false;
      }
      return true;
    });
    return result;
  }
  /**
   * Finds a `_rev` for a doc.
   * @param {Array} docs List of PouchDB documents to search for `_rev`
   * @param {String} id Document ID
   * @return {String} Associated `_rev`
   */
  _findOldRef(docs, id) {
    const result = docs.find((item) => item._id === id);
    return result ? result._rev : undefined;
  }
  /**
   * Saves the request on Google Drive.
   * It sends `drive-request-save` event to call a component responsible
   * for saving the request.
   *
   * This do nothing if `opts.drive is not set.`
   *
   * @param {Object} data Data to save
   * @param {Object} opts Save request options. See `saveRequest` for more info.
   * @return {Promise} Resolved promise to updated object.
   */
  _saveGoogleDrive(data, opts) {
    if (!opts.isDrive) {
      return Promise.resolve(data);
    }
    const copy = Object.assign({}, data);
    const e = new CustomEvent('export-google-drive', {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail: {
        content: copy,
        contentType: 'application/json',
        file: copy.name + '.arc'
      }
    });
    this.dispatchEvent(e);
    if (!e.defaultPrevented) {
      console.warn('Unable to export request to Google Drive.');
      console.warn('The drive-request-save was not handled.');
      return Promise.reject(new Error('Drive export module not found'));
    }
    return e.detail.result
    .then((insertResult) => {
      const driveId = insertResult.id;
      if (driveId) {
        data.driveId = driveId;
      }
      return data;
    });
  }
  /**
   * Handler for `request-list` custom event.
   * The `result` property will contain a result of calling `list()` function.
   *
   * The event has to be cancelable and not already cancelled in order to handle
   * it.
   *
   * Required properties on `detail` object:
   * - `type` {String} Datastore type
   * - `queryOptions` {Object} PouchDB query options.
   *
   * @param {CustomEvent} e
   */
  _handleList(e) {
    if (!e.cancelable || e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const {type, queryOptions} = e.detail;
    if (!type) {
      e.detail.result = Promise.reject(new Error(
        'The "type" parameter is required.'
      ));
      return;
    }
    if (!queryOptions) {
      e.detail.result = Promise.reject(new Error(
        'The "queryOptions" parameter is required.'
      ));
      return;
    }
    e.detail.result = this.list(type, queryOptions)
    .catch((e) => this._handleException(e));
  }
  /**
   * Performs a query for the request data.
   *
   * This is not the same as searching for a request. This only lists
   * data from the datastore for given query options.
   *
   * @param {String} type Datastore type
   * @param {Object} queryOptions PouchDB query options.
   * @return {Promise} List of PouchDB documents for the query.
   */
  list(type, queryOptions) {
    const db = this.getDatabase(type);
    return db.allDocs(queryOptions)
    .then((response) => {
      if (response.rows) {
        for (let i = 0, len = response.rows.length; i < len; i++) {
          if (response.rows[i] && response.rows[i].doc) {
            response.rows[i].doc = this.normalizeRequest(response.rows[i].doc);
          }
        }
      }
      return response;
    });
  }
  /**
   * A handler for the `request-query` custom event. Queries the datastore for
   * request data.
   * The event must have `q` property set on the detail object.
   *
   * @param {CustomEvent} e
   */
  _handleQuery(e) {
    if (!e.cancelable) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    if (!e.detail.q) {
      e.detail.result = Promise.reject(
        new Error('The "q" property is missing.'));
      return;
    }
    e.detail.result = this.query(e.detail.q, e.detail.type, e.detail.detailed);
  }
  /**
   * Queries both URL and PouchDb data.
   *
   * It calls, in order, `queryUrlData()` and `queryPouchDb()` functions.
   *
   * @param {String} q User query
   * @param {?String} type Optional, type of the requests to search for.
   * By default it returns all data.
   * @param {?Boolean} detailed If set it uses slower algorithm but performs full
   * search on the index. When false it only uses filer like query + '*'.
   * @return {Promise<Array<Object>>} Promise resolved to the list of requests.
   */
  query(q, type, detailed) {
    return this.queryUrlData(q, type, detailed)
    .then((urlSearechResults) => {
      const ignore = urlSearechResults.map((item) => item._id);
      return this.queryPouchDb(q, type, ignore)
      .then((result) => urlSearechResults.concat(result));
    });
  }

  /**
   * Performs a query on the URL index data.
   *
   * @param {String} q User query
   * @param {?String} type Optional, type of the requests to search for.
   * By default it returns all data.
   * @param {?Boolean} detailed If set it uses slower algorithm but performs full
   * search on the index. When false it only uses filer like query + '*'.
   * @return {Promise<Array<Object>>} Promise resolved to the list of requests.
   */
  queryUrlData(q, type, detailed) {
    const e = new CustomEvent('url-index-query', {
      composed: true,
      cancelable: true,
      bubbles: true,
      detail: {
        q,
        type,
        detailed
      }
    });
    this.dispatchEvent(e);
    if (!e.defaultPrevented) {
      console.warn('URL index model not found.');
      return Promise.resolve([]);
    }
    return e.detail.result
    .then((results) => {
      const keys = Object.keys(results);
      if (!keys.length) {
        return keys;
      }
      const savedKeys = [];
      const historyKeys = [];
      for (let i = 0, len = keys.length; i < len; i++) {
        if (results[keys[i]] === 'history' || results[keys[i]] === 'history-requests') {
          historyKeys[historyKeys.length] = keys[i];
        } else if (results[keys[i]] === 'saved' || results[keys[i]] === 'saved-requests') {
          savedKeys[savedKeys.length] = keys[i];
        }
      }
      const p = [];
      if (savedKeys.length) {
        p[p.length] = this.savedDb.allDocs({
          keys: savedKeys,
          // jscs:disable
          include_docs: true
          // jscs:enable
        });
      }
      if (historyKeys.length) {
        p[p.length] = this.historyDb.allDocs({
          keys: historyKeys,
          // jscs:disable
          include_docs: true
          // jscs:enable
        });
      }
      return Promise.all(p);
    })
    .then((results) => {
      const data = [];
      for (let i = 0, iLen = results.length; i < iLen; i++) {
        const response = results[i];
        for (let j = 0, jLen = response.rows.length; j < jLen; j++) {
          if (response.rows[j].error) {
            continue;
          }
          data[data.length] = response.rows[j].doc;
        }
      }
      return data;
    });
  }
  /**
   * Performs a query on the request and/or history data store.
   * It uses PouchDB `query` function on built indexes.
   * Note, it does not query for URL data.
   *
   * @param {String} q User query
   * @param {?String} type Optional, type of the requests to search for.
   * By default it returns all data for both history and saved.
   * @param {?Array<String>} ignore List of IDs to ignore.
   * @return {Promise<Array<Object>>} Promise resolved to the list of requests.
   */
  queryPouchDb(q, type, ignore) {
    if (!q) {
      return Promise.reject(new Error('The "q" parameter is required.'));
    }
    if (type === 'history') {
      return this.queryHistory(q, ignore);
    }
    if (type === 'saved') {
      return this.querySaved(q, ignore);
    }
    return Promise.all([this.queryHistory(q, ignore), this.querySaved(q, ignore)])
    .then((results) => results[0].concat(results[1]));
  }
  /**
   * List of fields to index in the history store.
   * @return {Array<String>}
   */
  get historyIndexes() {
    return ['headers', 'payload', 'method'];
  }
  /**
   * List of fields to index in the saved store.
   * @return {Array<String>}
   */
  get savedIndexes() {
    return ['headers', 'payload', 'method', 'description', 'name'];
  }
  /**
   * Queries history store using PouchDB quick search plugin (full text search).
   *
   * @param {String} q User query
   * @param {?Array<String>} ignore List of IDs to ignore.
   * @return {Promise<Array<Object>>} Promise resolved to the list of requests.
   */
  queryHistory(q, ignore) {
    return this._queryStore(q, ignore, this.historyDb, this.historyIndexes);
  }
  /**
   * Queries Saved store using PouchDB quick search plugin (full text search).
   *
   * @param {String} q User query
   * @param {?Array<String>} ignore List of IDs to ignore.
   * @return {Promise<Array<Object>>} Promise resolved to the list of requests.
   */
  querySaved(q, ignore) {
    return this._queryStore(q, ignore, this.savedDb, this.savedIndexes);
  }
  /**
   * See `query()` function for description.
   * @param {String} q User query
   * @param {?Array<String>} ignore List of IDs to ignore.
   * @param {Object} db A handler to the data store.
   * @param {Array<String>} indexes List of fields to query
   * @return {Promise<Array<Object>>} A promise resolved to list of PouchDB docs.
   */
  _queryStore(q, ignore, db, indexes) {
    if (!q) {
      return Promise.reject(new Error('The "q" argument is required.'));
    }
    if (ignore !== undefined && !(ignore instanceof Array)) {
      return Promise.reject(new TypeError('The "ignore" argument is not an array.'));
    }
    q = String(q).toLowerCase();
    return db.search({
      query: q,
      fields: indexes,
      // jscs:disable
      include_docs: true,
      // jscs:enable
      mm: (100 / q.split(' ').length)
    })
    .then((data) => {
      const rows = data.rows || [];
      const result = [];
      for (let i = rows.length - 1; i >= 0; i--) {
        if (!(ignore && ignore.indexOf(rows[i].id) !== -1)) {
          result[result.length] = rows[i].doc;
        }
      }
      return result;
    });
  }
  /**
   * Performs data inding using PouchDB api.
   * This is not the same as URL indexing using `url-indexer`.
   *
   * @param {String} type Data type - saved or history.
   * @return {Promise}
   */
  indexData(type) {
    const db = type === 'history' ? this.historyDb : this.savedDb;
    const fields = type === 'history' ? this.historyIndexes : this.savedIndexes;
    return db.search({
      fields,
      build: true
    });
  }
  /**
   * Handler for `request-project-list` event to query for list of requests in
   * a project.
   * @param {CustomEvent} e
   */
  _listProjectRequestsHandler(e) {
    if (!e.cancelable) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    if (!e.detail.id) {
      e.detail.result = Promise.reject(new Error('Project id is not set.'));
      return;
    }
    e.detail.result = this.readProjectRequests(e.detail.id, e.detail.opts);
  }
  /**
   * Reads list of requests associated with a project
   * @param {String} id Project id
   * @param {Object} opts Additional options. Currently only `restorePayload`
   * is supported
   * @return {Promise}
   */
  readProjectRequests(id, opts) {
    return this.readProject(id)
    .then((project) => {
      if (project.requests) {
        return this.readBulk('saved', project.requests, opts);
      }
      return this.readProjectRequestsLegacy(id, opts);
    });
  }
  /**
   * Reads requests data related to the project from a legacy system.
   * @param {String} id Project id
   * @return {Promise}
   */
  readProjectRequestsLegacy(id) {
    const db = this.getDatabase('saved');
    return db.allDocs()
    .then((response) => {
      return response.rows.filter((item) => item.id.indexOf(id) !== -1);
    })
    .then((response) => Promise.all(response.map((item) => db.get(item.id))))
    .then((requests) => {
      requests.sort(this.sortRequestProjectOrder);
      return requests;
    });
  }
  /**
   * Sorts requests list by `projectOrder` property
   *
   * @param {Object} a
   * @param {Object} b
   * @return {Number}
   */
  sortRequestProjectOrder(a, b) {
    if (a.projectOrder > b.projectOrder) {
      return 1;
    }
    if (a.projectOrder < b.projectOrder) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }
    if (a.name < b.name) {
      return -1;
    }
    return 0;
  }
  /**
   * Handler for `destroy-model` custom event.
   * Deletes saved or history data when scheduled for deletion.
   * @param {CustomEvent} e
   */
  _deleteModelHandler(e) {
    const models = e.detail.models;
    if (!models || !models.length) {
      return;
    }
    const promises = this.deleteDataModel(models);
    if (promises.length) {
      if (!e.detail.result) {
        e.detail.result = [];
      }
      e.detail.result = e.detail.result.concat(promises);
    }
  }
  /**
   * Deletes all data of selected type.
   * @param {Array<String>|String} models Database type or list of types.
   * @return {Array<Promise>} List of promises. Might be empty array.
   */
  deleteDataModel(models) {
    if (!(models instanceof Array)) {
      models = [models];
    }
    const p = [];
    if (models.indexOf('saved-requests') !== -1 || models.indexOf('saved') !== -1 || models.indexOf('all') !== -1) {
      p[p.length] = this.deleteModel('saved');
    }
    if (models.indexOf('history-requests') !== -1 || models.indexOf('history') !== -1 || models.indexOf('all') !== -1) {
      p[p.length] = this.deleteModel('history');
    }
    return p;
  }
  /**
   * Fired when the request should be expored to Google Drive.
   * This element doesn't support this operation but this way it queries for
   * an element that can export data to Google Drive.
   *
   * @event drive-request-save
   * @param {Object} request Request data to export
   * @param {String} fileName Google Drive file name.
   */

  /**
   * Fired when the project entity has been saved / updated in the datastore.
   *
   * @event request-object-changed
   * @param {Object} request Request object with new `_rev`.
   * @param {String} oldRev Entity old `_rev` property. May be `undefined` when
   * creating new entity.
   * @param {String} oldId Entity old `_id` property. May be `undefined` when
   * creating new entity.
   * @param {String} type Request object type. Can be either `saved-requests` or
   * `history-requests`
   */

  /**
   * @event request-object-deleted
   * @param {String} id Removed request ID
   * @param {String} rev Updated `_rev` property of the object.
   * @param {String} oldRev Entity old `_rev` property (before delete).
   * @param {String} type Request object type. Can be either `saved-requests` or
   * `history-requests`
   */

  /**
   * Dispatched when request object indexing finishes.
   * This event does not bubbles.
   *
   * @event request-indexing-finished
   */
  /**
   * Dispatched when request object indexing finishes with error.
   * This event does not bubbles.
   *
   * @event request-indexing-error
   * @param {String} message Error message
   */

  /**
   * Dispatched when saving request object to the data store and configuration
   * option says to save request to Google Drive.
   * This component does not handles the logic responsible for Drive integration.
   *
   * Note, The request save flow fails when this event is not handled.
   *
   * @event export-google-drive
   * @param {Object} content Data to store in the Drive
   * @param {String} contentType Always 'application/json'
   * @param {String} file Drive file name
   */
}
window.customElements.define('request-model', RequestModel);
