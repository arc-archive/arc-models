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
import '../url-indexer.js';
import { UrlIndexer } from '../index.js';
import { generateHistoryId, normalizeRequest, cancelEvent } from './Utils.js';
import { ArcModelEvents } from './events/ArcModelEvents.js';

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
/** @typedef {import('./events/RequestEvents').ARCRequestReadEvent} ARCRequestReadEvent */
/** @typedef {import('./types').ARCEntityChangeRecord} ARCEntityChangeRecord */
/** @typedef {import('./types').ARCModelQueryResult} ARCModelQueryResult */
/** @typedef {import('./types').ARCModelQueryOptions} ARCModelQueryOptions */

export const readHandler = Symbol('readHandler');
export const updateHandler = Symbol('updateHandler');
export const deleteHandler = Symbol('deleteHandler');

/**
 * A model to access request data in Advanced REST Client.
 *
 * Requests are stored as a "history" and "saved" requests. The history
 * request is stored each time a HTTP request in the application is made.
 * The "saved" request is a spoecial type that has additional metadata
 * like name, description, or project ID.
 *
 * This model offers standard CRUD operation on both saved and hostory stores.
 * Seach function requires passing the "type" parameter which is either `saved`
 * or `history` which corresponds to the corresponding request type.
 *
 * ## Querying for data
 *
 * Bother IndexedDB and PouchDB aren't designed for full text queries.
 * This model works with the `UrlIndexer` that is responsible for indexing the data
 * to perform a semi-full search operation. When a `detailed` options is set on the query
 * then it uses slower algorithm but performs full search on the index.
 * When it is not set it only uses filer like query + '*'.
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
    this[readHandler] = this[readHandler].bind(this);
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
   * Reads a request entity from the datastore.
   *
   * @param {string} type Request type: `saved` or `history`
   * @param {string} id The ID of the datastore entry.
   * @param {string=} rev Specific revision to read. Defaults to the latest revision.
   * @param {ARCRequestRestoreOptions=} opts Request options.
   * @return {Promise<ARCHistoryRequest|ARCSavedRequest>} Promise resolved to a request object.
   */
  async get(type, id, rev, opts = {}) {
    const conf = {};
    if (rev) {
      conf.rev = rev;
    }
    const db = this.getDatabase(type);
    let request = await db.get(id, conf);
    if (opts.restorePayload) {
      request = PayloadProcessor.restorePayload(request);
    }
    return normalizeRequest(request);
  }

  /**
   * The same as `get()` but for a list of requests.
   * Additionally this function ignores non-existing entities. When a requested entity is
   * not in the store it won't report an error and it will not be added to the list of results.
   *
   * @param {String} type Requests type to restore.
   * @param {string[]=} keys Request ids
   * @param {ARCRequestRestoreOptions=} opts Restoration options.
   * @return {Promise<(ARCHistoryRequest|ARCSavedRequest)[]>}
   */
  async getBulk(type, keys, opts) {
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
   *
   * Note, this method only works on the meta data. When handling request obejct
   * store action, which includes payload processing and project association, please,
   * use `saveRequest` or `saveHistory` functions.
   *
   * @param {string} type Request type: `saved` or `history`
   * @param {ARCHistoryRequest|ARCSavedRequest} request An object to save / update
   * @return {Promise<ARCEntityChangeRecord>} A promise resolved to the change record
   */
  async post(type, request) {
    const db = this.getDatabase(type);
    const oldRev = request._rev;
    const copy = normalizeRequest({ ...request });
    if (!copy._id) {
      copy._id = v4();
    }
    copy.updated = Date.now();
    const response = await db.put(copy);
    copy._rev = response.rev;
    const result = {
      id: copy._id,
      rev: response.rev,
      item: copy,
    }
    if (oldRev) {
      result.oldRev = oldRev;
    }
    ArcModelEvents.Request.State.update(this, type, result);
    return result;
  }

  /**
   * Updates more than one request in a bulk.
   * @param {string} type Request type: `saved-requests` or `history-requests`
   * @param {(ARCHistoryRequest|ARCSavedRequest)[]} requests List of requests to update.
   * @return {Promise<ARCEntityChangeRecord[]>} List of PouchDB responses to each insert
   */
  async postBulk(type, requests) {
    const items = [...requests];
    const db = this.getDatabase(type);
    for (let i = 0; i < items.length; i++) {
      items[i] = normalizeRequest(items[i]);
    }
    const responses = await db.bulkDocs(items);
    const result = /** @type ARCEntityChangeRecord[] */ ([]);
    for (let i = 0, len = responses.length; i < len; i++) {
      const response = responses[i];
      const request = items[i];
      const typedError = /** @type PouchDB.Core.Error */ (response);
      if (typedError.error) {
        this._handleException(typedError, true);
        continue;
      }
      const oldRev = request._rev;
      request._rev = response.rev;
      if (!request._id) {
        request._id = response.id;
      }
      const record = /** @type ARCEntityChangeRecord */ ({
        id: request._id,
        rev: response.rev,
        item: request,
      });
      if (oldRev) {
        record.oldRev = oldRev;
      }
      result.push(record);
      ArcModelEvents.Request.State.update(this, type, record);
    }
    return result;
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
    const obj = await this.get(type, id);
    if (!winningRev) {
      winningRev = obj._rev;
    }
    const db = this.getDatabase(type);
    const response = await db.remove(id, winningRev);
    ArcModelEvents.Request.State.delete(this, type, id, response.rev);
    const typedObj = /** @type ARCSavedRequest */ (obj);
    if (typedObj.projects) {
      await this.removeRequestsFromProjects(typedObj.projects, [id]);
    }
    return response.rev;
  }

  /**
   * Removes documents in a bulk operation.
   *
   * @param {string} type Database type
   * @param {string[]} items List of keys to remove
   * @return {Promise<string[]>}
   */
  async deleteBulk(type, items) {
    if (!type) {
      throw new Error('Request "type" property is missing.');
    }
    if (!items) {
      throw new Error('The "items" property is missing.');
    }
    const db = this.getDatabase(type);
    const response = await db.allDocs({
      keys: items,
      include_docs: true,
    });
    const result = [];
    const removedIds = [];
    let projectIds = [];
    for (let i = 0, len = response.rows.length; i < len; i++) {
      const item = response.rows[i];
      const typedError = /** @type PouchDB.Core.Error */ (item);
      if (typedError.error) {
        continue;
      }
      // technically it can be a history object but for convenience
      // I use saved object instead.
      const requestData = /** ARCSavedRequest */ (item.doc);
      try {
        requestData._deleted = true;
        const updateResult = await db.put(requestData);
        if (!updateResult.ok) {
          continue;
        }
        removedIds.push(item.id);
        if (requestData.projects && requestData.projects.length) {
          projectIds = projectIds.concat(requestData.projects);
        }
        ArcModelEvents.Request.State.delete(this, type, item.id, updateResult.rev);
        result.push(updateResult.rev);
      } catch (e) {
        continue;
      }
    }
    await this.removeRequestsFromProjects(projectIds, removedIds);
    return result;
  }

  /**
   * Removes requests reference from projects in a batch operation
   * @param {string[]} projectIds List of project ids to update
   * @param {string[]} requestIds List of requests to remove from projects
   * @return {Promise<void>}
   */
  async removeRequestsFromProjects(projectIds, requestIds) {
    if (!projectIds.length || !requestIds.length) {
      return;
    }
    const db = this.projectDb;
    const projects = await db.allDocs({
      keys: projectIds,
      include_docs: true,
    });
    const ps = projects.rows.map((item) => this.removeRequestsFromProject(item.doc, requestIds));
    await Promise.all(ps);
  }

  /**
   * Removes a request reference from a project.
   * @param {ARCProject} project The project to remove the request from
   * @param {string[]} requestIds List of requests to remove from project
   * @return {Promise<void>} Promise resolved when the operation finishes.
   */
  async removeRequestsFromProject(project, requestIds) {
    try {
      const { requests } = project;
      if (!requests || !requests.length) {
        return;
      }
      for (let i = requests.length -1; i > -1; i--) {
        const request = requests[i];
        for (let j = 0, jLen = requestIds.length; j < jLen; j++) {
          if (requestIds[j] === request) {
            requests.splice(i, 1);
            break;
          }
        }
      }
      await this.updateProject(project);
    } catch (_) {
      // ...
    }
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
      const record = {
        id: request.id,
        rev: request.value.rev,
        item: request.doc,
        oldRev: items[i]._rev,
      }
      ArcModelEvents.Request.State.update(this, type, record);
    });
    return result.rows.map((item) => item.doc);
  }

  /**
   * Stores a history object in the data store, taking care of `_rev` property read.
   *
   * @param {ARCHistoryRequest} request The request object to store
   * @return {Promise<ARCHistoryRequest>} A promise resolved to the updated request object.
   */
  async saveHistory(request) {
    const info = { ...request };
    if (!info._id) {
      info._id = generateHistoryId(info);
    }
    info.type = 'history';
    const db = this.getDatabase(info.type);
    let doc;
    try {
      doc = await db.get(info._id);
    } catch (e) {
      if (e.status !== 404) {
        this._handleException(e);
        return undefined;
      }
    }
    if (doc) {
      info._rev = doc._rev;
    }
    return this.saveRequest(info);
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
   * @return {Promise<ARCHistoryRequest|ARCSavedRequest>} A promise resilved to updated request object.
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
      typed = (await this.post(typed.type, typed)).item;
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
   * Performs a query for the request data.
   *
   * This is not the same as searching for a request. This only lists
   * data from the datastore for given query options.
   *
   * @param {String} type Datastore type
   * @param {ARCModelQueryOptions=} opts Query options.
   * @return {Promise<ARCModelQueryResult>} A promise resolved to a query result for requests.
   */
  async list(type, opts={}) {
    if (!type) {
      throw new Error('The "type" parameter is required.');
    }
    const db = this.getDatabase(type);
    return this.listEntities(db, opts);
  }

  /**
   * Adds event listeners.
   * @param {EventTarget} node
   */
  _attachListeners(node) {
    node.addEventListener('save-request', this._saveRequestHandler);
    node.addEventListener('save-history', this._saveHistoryHandler);
    node.addEventListener('request-object-read', this[readHandler]);
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
    node.removeEventListener('request-object-read', this[readHandler]);
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
   * This is an actual implementation of `save-request` events.
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
   * Handler for the request read event.
   * @param {ARCRequestReadEvent} e
   */
  [readHandler](e) {
    if (this._eventCancelled(e)) {
      return;
    }
    cancelEvent(e);
    const { id, type, opts={} } = e;
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
    const options = { ...opts };
    delete options.rev;
    e.detail.result = this.get(type, id, opts.rev, options);
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
      return this.post(type, item);
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
    e.detail.result = this.postBulk(type, requests);
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
    e.detail.result = this.deleteBulk(type, items);
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
  async queryUrlData(q, type, detailed=false) {
    const indexer = new UrlIndexer();
    const opts = {
      type,
      detailed,
    };
    const data = await indexer.query(q, opts);
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
      return this.getBulk('saved', project.requests, opts);
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
}
