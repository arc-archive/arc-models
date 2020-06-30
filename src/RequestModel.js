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
import { PayloadProcessor } from '@advanced-rest-client/arc-electron-payload-processor/payload-processor-esm.js';
import { v4 } from '@advanced-rest-client/uuid-generator';
import { RequestBaseModel } from './RequestBaseModel.js';

/* eslint-disable require-atomic-updates */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-continue */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */

/** @typedef {import('./RequestTypes').ARCSavedRequest} ARCSavedRequest */
/** @typedef {import('./RequestTypes').ARCHistoryRequest} ARCHistoryRequest */
/** @typedef {import('./RequestTypes').SaveARCRequestOptions} SaveARCRequestOptions */
/** @typedef {import('./RequestTypes').ARCProject} ARCProject */
/** @typedef {import('./RequestTypes').ARCRequestRestoreOptions} ARCRequestRestoreOptions */
/** @typedef {import('./types').Entity} Entity */

/**
 * Event based access to saved and history request datastore.
 *
 * This model creates and updates updates request objects and updates
 * URL index associated with the request.
 * It also supports querying for request data, deleting request data and
 * undeleting it.
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
 * supported. When set `google-drive-data-save` is dispatched. If the event is not
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
 */
export class RequestModel extends RequestBaseModel {
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
    this._listProjectRequestsHandler = this._listProjectRequestsHandler.bind(
      this
    );
  }

  /**
   * Adds event listeners.
   * @param {EventTarget} node
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
    node.addEventListener(
      'request-project-list',
      this._listProjectRequestsHandler
    );
    node.addEventListener('destroy-model', this._deleteModelHandler);
  }

  /**
   * Removes event listeners.
   * @param {EventTarget} node
   */
  _detachListeners(node) {
    node.removeEventListener('save-request', this._saveRequestHandler);
    node.removeEventListener('save-history', this._saveHistoryHandler);
    node.removeEventListener('request-object-read', this._handleRead);
    node.removeEventListener('request-object-changed', this._handleObjectSave);
    node.removeEventListener(
      'request-objects-changed',
      this._handleObjectsSave
    );
    node.removeEventListener(
      'request-object-deleted',
      this._handleObjectDelete
    );
    node.removeEventListener(
      'request-objects-deleted',
      this._handleObjectsDelete
    );
    node.removeEventListener('request-objects-undeleted', this._handleUndelete);
    node.removeEventListener('request-query', this._handleQuery);
    node.removeEventListener('request-list', this._handleList);
    node.removeEventListener(
      'request-project-list',
      this._listProjectRequestsHandler
    );
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
    const { request, projects, options } = e.detail;
    e.detail.result = this.saveRequestProject(request, projects, options);
  }

  /**
   * Saves requests with project data.
   * This is actual implementation of `save-request` events.
   *
   * @param {ARCSavedRequest|ARCHistoryRequest} request Request object to store.
   * @param {string[]=} projects List of project names to create with this request
   * and attach it to the request object.
   * @param {SaveARCRequestOptions=} options Save request options. Currently only `isDrive`
   * is supported
   * @return {Promise<ARCSavedRequest>} A promise resolved to updated request object
   */
  async saveRequestProject(request, projects, options) {
    const typed = /** @type ARCSavedRequest */ ({ ...request });
    if (!typed._id) {
      typed._id = v4();
    }
    let projectIds;
    if (projects && projects.length) {
      projectIds = await this.createRequestProjects(projects, typed._id);
    }
    if (!typed.projects) {
      typed.projects = [];
    }
    // @ts-ignore
    if (typed.legacyProject) {
      // @ts-ignore
      if (typed.projects.indexOf(typed.legacyProject) === -1) {
        // @ts-ignore
        typed.projects.push(typed.legacyProject);
      }
      // @ts-ignore
      delete typed.legacyProject;
    }
    if (projectIds) {
      typed.projects = typed.projects.concat(projectIds);
    }
    typed.type = 'saved';
    return this.saveRequest(typed, options);
  }

  /**
   * Create projects from project names.
   * It is used when creating a request with a new project.
   *
   * @param {string[]} names Names of projects
   * @param {string=} requestId Request ID to add to the projects.
   * @return {Promise<string[]>} Promise resolved to list of project IDs
   */
  async createRequestProjects(names, requestId) {
    const requests = [];
    if (requestId) {
      requests.push(requestId);
    }
    const projects = names.map((name) => {
      return {
        updated: Date.now(),
        order: 0,
        requests,
        name,
      };
    });
    const response = await this.projectDb.bulkDocs(projects);
    const result = [];
    for (let i = 0, len = response.length; i < len; i++) {
      const r = response[i];
      const typedError = /** @type PouchDB.Core.Error */ (r);
      if (typedError.error) {
        this._handleException(typedError, true);
        continue;
      }
      const project = /** @type ARCProject */ (projects[i]);
      project._rev = r.rev;
      project._id = r.id;
      this._fireUpdated('project-object-changed', {
        project,
      });
      result[result.length] = r.id;
    }
    return result;
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
    const { request } = e.detail;
    e.detail.result = this.saveHistory(request);
  }

  /**
   * Stores a history obvject in the data store, taking care of `_rev`
   * property read.
   * @param {ARCHistoryRequest} request The request object to store
   * @return {Promise<ARCHistoryRequest>} A promise resolved to the updated request object.
   */
  async saveHistory(request) {
    if (!request._id) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      const time = d.getTime();
      const encUrl = encodeURIComponent(request.url);
      request._id = `${time}/${encUrl}/${request.method}`;
    }
    request.type = 'history';
    const db = this.getDatabase(request.type);
    let doc;
    try {
      doc = await db.get(request._id);
    } catch (e) {
      if (e.status !== 404) {
        this._handleException(e);
        return undefined;
      }
    }
    if (doc) {
      request._rev = doc._rev;
    }
    return this.saveRequest(request);
  }

  /**
   * Saves a request into a data store.
   * It handles payload to string conversion, handles types, and syncs request
   * with projects. Use `update()` method only if you are storing already
   * prepared request object to the store.
   *
   * @param {ARCHistoryRequest|ARCSavedRequest} request ArcRequest object
   * @param {SaveARCRequestOptions=} opts Save request object. Currently only `isDrive`
   * is supported
   * @return {Promise} A promise resilved to updated request object.
   */
  async saveRequest(request, opts = {}) {
    let typed = /** @type ARCSavedRequest */ (request);
    if (!typed.type) {
      if (typed.name) {
        typed.type = 'saved';
      } else {
        typed.type = 'history';
      }
    } else if (typed.type === 'drive' || typed.type === 'google-drive') {
      typed.type = 'saved';
    }
    if (!typed._id) {
      typed._id = v4();
    }
    try {
      typed = await PayloadProcessor.payloadToString(typed);
      typed = /** @type ARCSavedRequest */ (await this._saveGoogleDrive(typed, opts));
      typed = await this.update(typed.type, typed);
      if (typed.type === 'saved') {
        await this._syncProjects(typed._id, typed.projects);
      }
      return typed;
    } catch (e) {
      this._handleException(e);
      return undefined;
    }
  }

  /**
   * Synchronizes project requests to ensure each project contains this
   * `requestId` on its list of requests.
   *
   * @param {string} requestId Request ID
   * @param {string[]} projects List of request projects.
   * @return {Promise<void>}
   */
  async _syncProjects(requestId, projects) {
    if (!projects || !projects.length) {
      return;
    }
    const db = this.projectDb;
    const update = [];
    const queryResponse = await db.allDocs({
      include_docs: true,
    });

    const { rows } = queryResponse;
    for (let i = 0, len = rows.length; i < len; i++) {
      const project = rows[i];
      const { doc } = project;
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
    if (!update.length) {
      return;
    }
    const response = await db.bulkDocs(update);
    for (let i = 0, len = response.length; i < len; i++) {
      const r = response[i];
      const typedError = /** @type PouchDB.Core.Error */ (r);
      if (typedError.error) {
        this._handleException(r, true);
        continue;
      }
      const project = update[i];
      project._rev = r.rev;
      this._fireUpdated('project-object-changed', {
        project,
      });
    }
  }

  /**
   * Normalizes request object to whatever the app is currently using.
   *
   * @param {ARCHistoryRequest|ARCSavedRequest} request
   * @return {ARCHistoryRequest|ARCSavedRequest}
   */
  normalizeRequest(request) {
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
   * @param {string} type Request type: `saved-requests` or `history-requests`
   * @param {string} id The ID of the datastore entry.
   * @param {string=} rev Specific revision to read. Defaults to
   * latest revision.
   * @param {ARCRequestRestoreOptions=} opts Restoration options.
   * @return {Promise<ARCHistoryRequest|ARCSavedRequest>} Promise resolved to a request object.
   */
  async read(type, id, rev, opts = {}) {
    const conf = {};
    if (rev) {
      conf.rev = rev;
    }
    const db = this.getDatabase(type);
    let request = await db.get(id, conf);
    if (opts.restorePayload) {
      request = PayloadProcessor.restorePayload(request);
    }
    return this.normalizeRequest(request);
  }

  /**
   * The same as `read()` but for a list of requests.
   * @param {String} type Requests type to restore.
   * @param {string[]=} keys Request ids
   * @param {ARCRequestRestoreOptions=} opts Restoration options.
   * @return {Promise<ARCHistoryRequest[]|ARCSavedRequest[]>}
   */
  async readBulk(type, keys, opts) {
    const db = this.getDatabase(type);
    const response = await db.allDocs({
      include_docs: true,
      keys,
    });
    const requests = [];
    response.rows.forEach((item) => {
      let request = item.doc;
      if (!request) {
        return;
      }
      if (opts && opts.restorePayload) {
        request = PayloadProcessor.restorePayload(request);
      }
      requests[requests.length] = request;
    });
    return requests;
  }

  /**
   * Updates / saves the request object in the datastore.
   * This function dispatches `request-object-changed` event.
   *
   * If any of `name`, `method`, `url` or `legacyProject` properties change
   * then the old object is deleted and new is created with new ID.
   *
   * @param {string} type Request type: `saved-requests` or `history-requests`
   * @param {ARCHistoryRequest|ARCSavedRequest} request An object to save / update
   * @return {Promise} Resolved promise to request object with updated `_rev`
   */
  async update(type, request) {
    const db = this.getDatabase(type);
    const oldRev = request._rev;
    if (!request._id) {
      request._id = v4();
    }
    request.updated = Date.now();
    let copy = { ...request };
    copy = this.normalizeRequest(copy);
    const result = await db.put(copy);
    /* eslint-disable-next-line require-atomic-updates */
    request._rev = result.rev;
    const detail = {
      request,
      oldRev,
      // oldId will be removed
      oldId: request._id,
      type,
    };
    this._fireUpdated('request-object-changed', detail);
    return request;
  }

  /**
   * Updates more than one request in a bulk.
   * @param {string} type Request type: `saved-requests` or `history-requests`
   * @param {(ARCHistoryRequest|ARCSavedRequest)[]} requests List of requests to update.
   * @return {Promise<(PouchDB.Core.Response|PouchDB.Core.Error)[]>} List of PouchDB responses to each insert
   */
  async updateBulk(type, requests) {
    const items = [...requests];
    const db = this.getDatabase(type);
    for (let i = 0; i < items.length; i++) {
      items[i] = this.normalizeRequest(items[i]);
    }
    const response = await db.bulkDocs(items);
    for (let i = 0, len = response.length; i < len; i++) {
      const r = response[i];
      const typedError = /** @type PouchDB.Core.Error */ (r);
      if (typedError.error) {
        this._handleException(typedError, true);
        continue;
      }
      const request = items[i];
      const oldRev = request._rev;
      request._rev = r.rev;
      if (!request._id) {
        request._id = r.id;
      }
      const detail = {
        request,
        oldRev,
        oldId: request._id,
        type,
      };
      this._fireUpdated('request-object-changed', detail);
    }
    return response;
  }

  /**
   * Removed an object from the datastore.
   * This function fires `request-object-deleted` event.
   *
   * @param {string} type Request type: `saved-requests` or `history-requests`
   * @param {string} id The ID of the datastore entry.
   * @param {string=} rev Specific revision to read. Defaults to
   * latest revision.
   * @return {Promise<string>} Promise resolved to a new `_rev` property of deleted
   * object.
   */
  async delete(type, id, rev) {
    let winningRev = rev;
    if (!winningRev) {
      const obj = await this.read(type, id);
      winningRev = obj._rev;
    }
    const db = this.getDatabase(type);
    const response = await db.remove(id, winningRev);
    const detail = {
      id,
      rev: response.rev,
      oldRev: winningRev,
      type,
    };
    this._fireUpdated('request-object-deleted', detail);
    return response.rev;
  }

  /**
   * Reverts deleted items.
   * This function fires `request-object-changed` event for each restored
   * request.
   *
   * @param {string} type Request type: `saved-requests` or `history-requests`
   * @param {Entity[]} items List of request objects. Required properties are
   * `_id` and `_rev`.
   * @return {Promise<(ARCHistoryRequest|ARCSavedRequest)[]>} Resolved promise with restored objects. Objects have
   * updated `_rev` property.
   */
  async revertRemove(type, items) {
    if (!type) {
      throw new Error('The "type" argument is missing');
    }
    if (!items) {
      throw new Error('The "items" argument is missing');
    }
    const db = this.getDatabase(type);
    // first get information about previous revision (before delete)
    const restored = await this._findNotDeleted(db, items);
    for (let i = restored.length - 1; i >= 0; i--) {
      const item = restored[i];
      // @ts-ignore
      if (item.ok === false) {
        items.splice(i, 1);
        restored.splice(i, 1);
      } else {
        item._rev = items[i]._rev;
      }
    }
    const updated = await db.bulkDocs(restored);
    const query = {
      keys: updated.map((item) => item.id),
      include_docs: true,
    };
    const result = await db.allDocs(query);
    result.rows.forEach((request, i) => {
      const detail = {
        request: request.doc,
        oldRev: items[i]._rev,
        oldId: request.id,
        type,
      };
      this._fireUpdated('request-object-changed', detail);
    });
    return result.rows.map((item) => item.doc);
  }

  /**
   * Finds last not deleted revision of a document.
   * @param {PouchDB.Database} db PouchDB instance
   * @param {Entity[]} items List of documents to process
   * @return {Promise<(ARCHistoryRequest|ARCSavedRequest)[]>} Last not deleted version of each document.
   */
  async _findNotDeleted(db, items) {
    const list = items.map((item) => {
      return {
        id: item._id,
        rev: item._rev,
      };
    });
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
        data[data.length] = { ok: false };
        continue;
      }
      const revs = doc._revisions;
      const undeletedRevision = this._findUndeletedRevision(revs, list[i].rev);
      if (!undeletedRevision) {
        data[data.length] = { ok: false };
      } else {
        // @ts-ignore
        data[data.length] = await db.get(doc._id, { rev: undeletedRevision });
      }
    }
    return data;
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
  _findUndeletedRevision(revs, deletedRevision) {
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
   * Handler for request read event request.
   * @param {CustomEvent} e
   */
  _handleRead(e) {
    if (!e.cancelable || e.composedPath()[0] === this) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const { type, id, opts } = e.detail;
    if (!id) {
      e.detail.result = Promise.reject(
        new Error('Request "id" property is missing.')
      );
      return;
    }
    if (!type) {
      e.detail.result = Promise.reject(
        new Error('Request "type" property is missing.')
      );
      return;
    }
    let p;
    if (id instanceof Array) {
      p = this.readBulk(type, id, opts);
    } else {
      p = this.read(type, id, e.detail.rev, opts);
    }
    e.detail.result = p.catch((ex) => this._handleException(ex));
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
    const { type, request } = e.detail;
    e.detail.result = this._saveObjectHanlder(type, request);
  }

  async _saveObjectHanlder(type, request) {
    if (!type) {
      throw new Error('The "type" property is missing.');
    }
    if (!request) {
      throw new Error('The "request" property is missing.');
    }
    const db = this.getDatabase(type);
    let item = { ...request };
    if (item._id && !item._rev) {
      try {
        const dbRequest = await db.get(item._id);
        item = { ...dbRequest, ...item };
      } catch (e) {
        if (e.status !== 404) {
          this._handleException(e);
        }
      }
    }
    try {
      return this.update(type, item);
    } catch (e) {
      this._handleException(e);
      return undefined;
    }
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

    const { requests, type } = e.detail;
    if (!requests) {
      e.detail.result = Promise.reject(
        new Error('The "requests" property is missing.')
      );
      return;
    }
    if (!type) {
      e.detail.result = Promise.reject(
        new Error('The "type" property is missing.')
      );
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
        new Error('Request "type" property is missing.')
      );
      return;
    }

    if (!e.detail.id) {
      e.detail.result = Promise.reject(new Error('Missing "id" property.'));
      return;
    }

    e.detail.result = this.delete(
      e.detail.type,
      e.detail.id,
      e.detail.rev
    ).catch((ex) => this._handleException(ex));
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
    const { type, items } = e.detail;
    e.detail.result = this.bulkDelete(type, items);
  }

  /**
   * Removes documents in a bulk operation.
   *
   * @param {string} type Database type
   * @param {string[]} items List of keys to remove
   * @return {Promise}
   */
  async bulkDelete(type, items) {
    if (!type) {
      throw new Error('Request "type" property is missing.');
    }
    if (!items) {
      throw new Error('The "items" property is missing.');
    }
    const db = this.getDatabase(type);
    const response = await db.allDocs({
      keys: items,
    });
    const removed = this._filterExistingItems(response);
    const data = {};
    for (const item of removed) {
      try {
        const result = await db.remove(item.id, item.value.rev);
        if (!result.ok) {
          continue;
        }
        const detail = {
          id: result.id,
          rev: result.rev,
          oldRev: this._findOldRef(removed, result.id),
        };
        data[result.id] = result.rev;
        this._fireUpdated('request-object-deleted', detail);
      } catch (e) {
        continue;
      }
    }
    return data;
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

    const { type, items } = e.detail;
    e.detail.result = this.revertRemove(type, items).catch((ex) =>
      this._handleException(ex)
    );
  }

  /**
   * Filters query results to return only successfuly read data.
   * @param {PouchDB.Core.AllDocsResponse} result PouchDB query result
   * @return {object[]} List of request that has been read.
   */
  _filterExistingItems(result) {
    return result.rows.filter((item) => {
      // @ts-ignore
      if (item.error) {
        return false;
      }
      return true;
    });
  }

  /**
   * Finds a `_rev` for a doc.
   * @param {object[]} docs List of PouchDB documents to search for `_rev`
   * @param {string} id Document ID
   * @return {string} Associated `_rev`
   */
  _findOldRef(docs, id) {
    const result = docs.find((item) => item._id === id);
    return result ? result._rev : undefined;
  }

  /**
   * Saves the request on Google Drive.
   * It dispatches `google-drive-data-save` event to call a component responsible
   * for saving the request on Google Drive.
   *
   * This do nothing if `opts.drive is not set.`
   *
   * @param {ARCHistoryRequest|ARCSavedRequest} data Data to save
   * @param {SaveARCRequestOptions} opts Save request options.
   * @return {Promise<ARCHistoryRequest|ARCSavedRequest>} Resolved promise to updated object.
   */
  async _saveGoogleDrive(data, opts) {
    if (!opts.isDrive) {
      return data;
    }
    const copy = { ...data };
    const e = new CustomEvent('google-drive-data-save', {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail: {
        result: undefined,
        content: copy,
        // @ts-ignore
        file: `${copy.name || 'arc-request'}.arc`,
        options: {
          contentType: 'application/restclient+data',
        },
      },
    });
    this.dispatchEvent(e);
    if (!e.defaultPrevented) {
      throw new Error('Drive export module not found');
    }
    const insertResult = await e.detail.result;
    const driveId = insertResult.id;
    if (driveId) {
      copy.driveId = driveId;
    }
    return copy;
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
    const { type, queryOptions } = e.detail;
    e.detail.result = this.list(type, queryOptions).catch((ex) =>
      this._handleException(ex)
    );
  }

  /**
   * Performs a query for the request data.
   *
   * This is not the same as searching for a request. This only lists
   * data from the datastore for given query options.
   *
   * @param {String} type Datastore type
   * @param {PouchDB.Core.AllDocsOptions} queryOptions PouchDB query options.
   * @return {Promise} List of PouchDB documents for the query.
   */
  async list(type, queryOptions) {
    if (!type) {
      throw new Error('The "type" parameter is required.');
    }
    if (!queryOptions) {
      throw new Error('The "queryOptions" parameter is required.');
    }
    const db = this.getDatabase(type);
    const response = await db.allDocs(queryOptions);
    if (response.rows) {
      for (let i = 0, len = response.rows.length; i < len; i++) {
        if (response.rows[i] && response.rows[i].doc) {
          response.rows[i].doc = this.normalizeRequest(response.rows[i].doc);
        }
      }
    }
    return response;
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
    e.detail.result = this.query(e.detail.q, e.detail.type, e.detail.detailed);
  }

  /**
   * Queries both URL and PouchDb data.
   *
   * It calls, in order, `queryUrlData()` and `queryPouchDb()` functions.
   *
   * @param {string} q User query
   * @param {string=} type Optional, type of the requests to search for.
   * By default it returns all data.
   * @param {boolean=} detailed If set it uses slower algorithm but performs full
   * search on the index. When false it only uses filer like query + '*'.
   * @return {Promise<Array<Object>>} Promise resolved to the list of requests.
   */
  async query(q, type, detailed) {
    if (!q) {
      throw new Error('The "q" property is missing.');
    }
    const urlSearechResults = await this.queryUrlData(q, type, detailed);
    const ignore = urlSearechResults.map((item) => item._id);
    const result = await this.queryPouchDb(q, type, ignore);
    return urlSearechResults.concat(result);
  }

  /**
   * Performs a query on the URL index data.
   *
   * @param {String} q User query
   * @param {string=} type Optional, type of the requests to search for.
   * By default it returns all data.
   * @param {boolean=} detailed If set it uses slower algorithm but performs full
   * search on the index. When false it only uses filer like query + '*'.
   * @return {Promise<(ARCHistoryRequest|ARCSavedRequest)[]>} Promise resolved to the list of requests.
   */
  async queryUrlData(q, type, detailed) {
    const e = new CustomEvent('url-index-query', {
      composed: true,
      cancelable: true,
      bubbles: true,
      detail: {
        q,
        type,
        detailed,
        result: undefined,
      },
    });
    this.dispatchEvent(e);
    if (!e.defaultPrevented) {
      return [];
    }
    const data = await e.detail.result;
    const keys = Object.keys(data);
    if (!keys.length) {
      return [];
    }
    const savedKeys = [];
    const historyKeys = [];
    for (let i = 0, len = keys.length; i < len; i++) {
      if (data[keys[i]] === 'history' || data[keys[i]] === 'history-requests') {
        historyKeys[historyKeys.length] = keys[i];
      } else if (
        data[keys[i]] === 'saved' ||
        data[keys[i]] === 'saved-requests'
      ) {
        savedKeys[savedKeys.length] = keys[i];
      }
    }

    const responses = [];
    if (savedKeys.length) {
      responses[responses.length] = await this.savedDb.allDocs({
        keys: savedKeys,
        include_docs: true,
      });
    }

    if (historyKeys.length) {
      responses[responses.length] = await this.historyDb.allDocs({
        keys: historyKeys,
        include_docs: true,
      });
    }

    const result = [];
    for (let i = 0, iLen = responses.length; i < iLen; i++) {
      const response = responses[i];
      for (let j = 0, jLen = response.rows.length; j < jLen; j++) {
        // @ts-ignore
        if (response.rows[j].error) {
          continue;
        }
        result[result.length] = response.rows[j].doc;
      }
    }
    return result;
  }

  /**
   * Performs a query on the request and/or history data store.
   * It uses PouchDB `query` function on built indexes.
   * Note, it does not query for URL data.
   *
   * @param {string} q User query
   * @param {string=} type Type of the requests to search for.
   * By default it returns all data for both history and saved.
   * @param {string[]=} ignore List of IDs to ignore.
   * @return {Promise<(ARCHistoryRequest|ARCSavedRequest)[]>} Promise resolved to the list of requests.
   */
  async queryPouchDb(q, type, ignore) {
    if (!q) {
      throw new Error('The "q" parameter is required.');
    }
    let r1 = [];
    let r2 = [];
    if (type !== 'saved') {
      r1 = await this.queryHistory(q, ignore);
    }
    if (type !== 'history') {
      r2 = await this.querySaved(q, ignore);
    }
    return r1.concat(r2);
  }

  /**
   * Queries history store using PouchDB quick search plugin (full text search).
   *
   * @param {string} q User query
   * @param {string[]} ignore List of IDs to ignore.
   * @return {Promise<(ARCHistoryRequest|ARCSavedRequest)[]>} Promise resolved to the list of requests.
   */
  queryHistory(q, ignore) {
    return this._queryStore(q, ignore, this.historyDb, this.historyIndexes);
  }

  /**
   * Queries Saved store using PouchDB quick search plugin (full text search).
   *
   * @param {string} q User query
   * @param {string[]=} ignore List of IDs to ignore.
   * @return {Promise<(ARCHistoryRequest|ARCSavedRequest)[]>} Promise resolved to the list of requests.
   */
  async querySaved(q, ignore) {
    return this._queryStore(q, ignore, this.savedDb, this.savedIndexes);
  }

  /**
   * See `query()` function for description.
   * @param {string} q User query
   * @param {string[]} ignore List of IDs to ignore.
   * @param {PouchDB.Database} db A handler to the data store.
   * @param {string[]} indexes List of fields to query
   * @return {Promise<(ARCHistoryRequest|ARCSavedRequest)[]>} A promise resolved to list of PouchDB docs.
   */
  async _queryStore(q, ignore, db, indexes) {
    if (!q) {
      throw new Error('The "q" argument is required.');
    }
    if (ignore !== undefined && !(ignore instanceof Array)) {
      throw new TypeError('The "ignore" argument is not an array.');
    }
    const query = String(q).toLowerCase();
    // @ts-ignore
    const data = await db.search({
      query,
      fields: indexes,
      // jscs:disable
      include_docs: true,
      // jscs:enable
      mm: 100 / q.split(' ').length,
    });
    const rows = data.rows || [];
    const result = [];
    for (let i = rows.length - 1; i >= 0; i--) {
      if (!(ignore && ignore.indexOf(rows[i].id) !== -1)) {
        result[result.length] = rows[i].doc;
      }
    }
    return result;
  }

  /**
   * Performs data indexing using PouchDB api.
   * This is not the same as URL indexing using `url-indexer`.
   *
   * @param {string} type Data type - saved or history.
   * @return {Promise<void>}
   */
  async indexData(type) {
    const db = type === 'history' ? this.historyDb : this.savedDb;
    const fields = type === 'history' ? this.historyIndexes : this.savedIndexes;
    // @ts-ignore
    return db.search({
      fields,
      build: true,
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
    e.detail.result = this.readProjectRequests(e.detail.id, e.detail.opts);
  }

  /**
   * Reads list of requests associated with a project
   * @param {string} id Project id
   * @param {ARCRequestRestoreOptions=} opts Request query options.
   * @return {Promise<(ARCHistoryRequest|ARCSavedRequest)[]>}
   */
  async readProjectRequests(id, opts) {
    if (!id) {
      throw new Error('Project id is not set.');
    }
    const project = await this.readProject(id);
    if (project.requests) {
      return this.readBulk('saved', project.requests, opts);
    }
    return this.readProjectRequestsLegacy(id);
  }

  /**
   * Reads requests data related to the project from a legacy system.
   * @param {String} id Project id
   * @return {Promise<(ARCHistoryRequest|ARCSavedRequest)[]>}
   */
  async readProjectRequestsLegacy(id) {
    const db = this.getDatabase('saved');
    const docsResponse = await db.allDocs();
    const items = docsResponse.rows.filter(
      (item) => item.id.indexOf(id) !== -1
    );
    const requests = [];
    for (const item of items) {
      requests[requests.length] = await db.get(item.id);
    }
    requests.sort(this.sortRequestProjectOrder);
    return requests;
  }

  /**
   * Sorts requests list by `projectOrder` property
   *
   * @param {object} a
   * @param {object} b
   * @return {number}
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
    const { models } = e.detail;
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
   * @param {string|string[]} models Database type or list of types.
   * @return {Promise<void>[]} List of promises. Might be empty array.
   */
  deleteDataModel(models) {
    let items = models;
    if (!Array.isArray(items)) {
      items = [items];
    }
    const p = [];
    if (
      items.indexOf('saved-requests') !== -1 ||
      items.indexOf('saved') !== -1 ||
      items.indexOf('all') !== -1
    ) {
      p[p.length] = this.deleteModel('saved');
    }
    if (
      items.indexOf('history-requests') !== -1 ||
      items.indexOf('history') !== -1 ||
      items.indexOf('all') !== -1
    ) {
      p[p.length] = this.deleteModel('history');
    }
    return p;
  }
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
   * Dispatched when saving request object to the data store and configuration
   * option says to save request to Google Drive.
   * This component does not handles the logic responsible for Drive integration.
   *
   * Note, The request save flow fails when this event is not handled.
   *
   * @event google-drive-data-save
   * @param {Object} content Data to store in the Drive
   * @param {Object} options `contentType` property set to `application/restclient+data`
   * @param {String} file Drive file name
   */
}
