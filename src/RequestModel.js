/* eslint-disable arrow-body-style */
/* eslint-disable no-param-reassign */
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
import { BodyProcessor } from '@advanced-rest-client/libs';
import { v4 } from '@advanced-rest-client/uuid';
import { ArcModelEventTypes, ArcModelEvents } from '@advanced-rest-client/events';
import { RequestBaseModel } from './RequestBaseModel.js';
import '../url-indexer.js';
import { UrlIndexer } from './UrlIndexer.js';
import { normalizeRequest, cancelEvent, revertDelete, restoreTransformedPayload } from './Utils.js';

/* eslint-disable class-methods-use-this */
/* eslint-disable no-continue */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */

/** @typedef {import('@advanced-rest-client/events').Project.ARCProject} ARCProject */
/** @typedef {import('@advanced-rest-client/events').ArcRequest.ARCSavedRequest} ARCSavedRequest */
/** @typedef {import('@advanced-rest-client/events').ArcRequest.ARCHistoryRequest} ARCHistoryRequest */
/** @typedef {import('@advanced-rest-client/events').ArcRequest.ARCRequestRestoreOptions} ARCRequestRestoreOptions */
/** @typedef {import('@advanced-rest-client/events').ArcResponse.TransformedPayload} TransformedPayload */
/** @typedef {import('@advanced-rest-client/events').Model.DeletedEntity} DeletedEntity */
/** @typedef {import('@advanced-rest-client/events').Model.ARCEntityChangeRecord} ARCEntityChangeRecord */
/** @typedef {import('@advanced-rest-client/events').Model.ARCModelListResult} ARCModelListResult */
/** @typedef {import('@advanced-rest-client/events').Model.ARCModelListOptions} ARCModelListOptions */
/** @typedef {import('@advanced-rest-client/events').ARCRequestReadEvent} ARCRequestReadEvent */
/** @typedef {import('@advanced-rest-client/events').ARCRequestReadBulkEvent} ARCRequestReadBulkEvent */
/** @typedef {import('@advanced-rest-client/events').ARCRequestUpdateEvent} ARCRequestUpdateEvent */
/** @typedef {import('@advanced-rest-client/events').ARCRequestUpdateBulkEvent} ARCRequestUpdateBulkEvent */
/** @typedef {import('@advanced-rest-client/events').ARCRequestStoreEvent} ARCRequestStoreEvent */
/** @typedef {import('@advanced-rest-client/events').ARCRequestDeleteEvent} ARCRequestDeleteEvent */
/** @typedef {import('@advanced-rest-client/events').ARCRequestListEvent} ARCRequestListEvent */
/** @typedef {import('@advanced-rest-client/events').ARCRequestQueryEvent} ARCRequestQueryEvent */
/** @typedef {import('@advanced-rest-client/events').ARCRequestListProjectRequestsEvent} ARCRequestListProjectRequestsEvent */
/** @typedef {import('@advanced-rest-client/events').ARCRequestDeleteBulkEvent} ARCRequestDeleteBulkEvent */
/** @typedef {import('@advanced-rest-client/events').ARCRequestUndeleteBulkEvent} ARCRequestUndeleteBulkEvent */
/** @typedef {import('@advanced-rest-client/events').ARCModelUpdateEventDetail} ARCModelUpdateEventDetail */
/** @typedef {import('@advanced-rest-client/events').ARCModelDeleteEvent} ARCModelDeleteEvent */

export const readHandler = Symbol('readHandler');
export const readBulkHandler = Symbol('readBulkHandler');
export const updateHandler = Symbol('updateHandler');
export const updatebulkHandler = Symbol('updatebulkHandler');
export const deleteHandler = Symbol('deleteHandler');
export const deleteBulkHandler = Symbol('deleteBulkHandler');
export const undeleteBulkHandler = Symbol('undeleteBulkHandler');
export const deletemodelHandler = Symbol('deletemodelHandler');
export const listHandler = Symbol('listHandler');
export const queryHandler = Symbol('queryHandler');
export const projectlistHandler = Symbol('projectlistHandler');
export const storeHandler = Symbol('storeHandler');
export const syncProjects = Symbol('syncProjects');
export const sortRequestProjectOrder = Symbol('sortRequestProjectOrder');
export const queryStore = Symbol('queryStore');
export const revertRemoveProject = Symbol('revertRemoveProject');

/**
 * A model to access request data in Advanced REST Client.
 *
 * Requests are stored as a "history" and "saved" requests. The history
 * request is stored each time a HTTP request in the application is made.
 * The "saved" request is a special type that has additional metadata
 * like name, description, or project ID.
 *
 * This model offers standard CRUD operation on both saved and history stores.
 * Search function requires passing the "type" parameter which is either `saved`
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
   * @return {string[]}
   */
  get historyIndexes() {
    return ['headers', 'payload', 'method'];
  }

  /**
   * List of fields to index in the saved store.
   * @return {string[]}
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
    this[readBulkHandler] = this[readBulkHandler].bind(this);
    this[storeHandler] = this[storeHandler].bind(this);
    this[updateHandler] = this[updateHandler].bind(this);
    this[updatebulkHandler] = this[updatebulkHandler].bind(this);
    this[deleteHandler] = this[deleteHandler].bind(this);
    this[deleteBulkHandler] = this[deleteBulkHandler].bind(this);
    this[undeleteBulkHandler] = this[undeleteBulkHandler].bind(this);
    this[deletemodelHandler] = this[deletemodelHandler].bind(this);
    this[listHandler] = this[listHandler].bind(this);
    this[queryHandler] = this[queryHandler].bind(this);
    this[projectlistHandler] = this[projectlistHandler].bind(this);
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
    if (opts.ignorePayload) {
      delete request.payload;
    } else {
      request = BodyProcessor.restorePayload(request);
      if (request.response && request.response.payload) {
        const p = request.response.payload;
        if (p.type && p.data) {
          request.response.payload = restoreTransformedPayload(p);
        }
      }
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
  async getBulk(type, keys, opts={}) {
    const db = this.getDatabase(type);
    const response = await db.allDocs({
      include_docs: true,
      keys,
    });
    const requests = [];
    response.rows.forEach((item) => {
      let request = /** @type ARCHistoryRequest|ARCSavedRequest */ (item.doc);
      if (!request) {
        if (opts.preserveOrder) {
          requests[requests.length] = undefined;
        }
        return;
      }
      if (opts.ignorePayload) {
        delete request.payload;
      } else {
        request = BodyProcessor.restorePayload(request);
        if (request.response && request.response.payload) {
          const p = /** @type TransformedPayload */ (request.response.payload);
          if (p.type && p.data) {
            request.response.payload = restoreTransformedPayload(p);
          }
        }
      }
      requests[requests.length] = normalizeRequest(request);
    });
    return requests;
  }

  /**
   * Updates / saves the request object in the datastore.
   *
   * @param {string} type Request type: `saved` or `history`
   * @param {ARCHistoryRequest|ARCSavedRequest} request An object to save / update
   * @return {Promise<ARCEntityChangeRecord>} A promise resolved to the change record
   */
  async post(type, request) {
    const db = this.getDatabase(type);
    const oldRev = request._rev;
    const updated = Date.now();
    const day = new Date(updated);
    day.setHours(0, 0, 0, 0);

    const timeValues = { updated, midnight: day.getTime() };
    const typedCopy = { ...request };
    if (!typedCopy.type) {
      typedCopy.type = type;
    }
    let copy = /** @type ARCHistoryRequest|ARCSavedRequest */ (normalizeRequest({ ...typedCopy, ...timeValues }));
    if (!copy._id) {
      copy._id = v4();
    }
    if (!copy._rev) {
      try {
        const dbRequest = await db.get(copy._id);
        copy = { ...dbRequest, ...copy };
      } catch (e) {
        /* istanbul ignore if */
        if (e.status !== 404) {
          this._handleException(e);
        }
      }
    }
    const originalPayload = copy.payload;
    copy = await BodyProcessor.payloadToString(copy);
    const response = await db.put(copy);
    copy.payload = originalPayload;
    delete copy.blob;
    delete copy.multipart;
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
    if (copy.type === 'saved') {
      // @ts-ignore
      await this[syncProjects](copy._id, copy.projects);
    }
    return result;
  }

  /**
   * Updates more than one request in a bulk operation.
   * @param {string} type Request type: `saved-requests` or `history-requests`
   * @param {(ARCHistoryRequest|ARCSavedRequest)[]} requests List of requests to update.
   * @return {Promise<ARCEntityChangeRecord[]>} List of PouchDB responses to each insert
   */
  async postBulk(type, requests) {
    const items = [...requests];
    const db = this.getDatabase(type);
    const updated = Date.now();
    const day = new Date(updated);
    day.setHours(0, 0, 0, 0);
    const timeValues = { updated, midnight: day.getTime() };
    const processed = items.map(async (request) => {
      let copy = /** @type ARCHistoryRequest|ARCSavedRequest */ ({ ...request, ...timeValues });
      copy = normalizeRequest(copy);
      const { payload } = copy;
      copy = await BodyProcessor.payloadToString(copy);
      return {
        request: copy,
        payload,
      }
    });
    const processedItems = await Promise.all(processed);
    const responses = await db.bulkDocs(processedItems.map((item) => item.request));
    const result = /** @type ARCEntityChangeRecord[] */ ([]);
    responses.forEach((response, i) => {
      const typedError = /** @type PouchDB.Core.Error */ (response);
      /* istanbul ignore if */
      if (typedError.error) {
        this._handleException(typedError, true);
        return;
      }
      const { request } = processedItems[i];
      request.payload = processedItems[i].payload;
      delete request.blob;
      delete request.multipart;
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
      if (request.type === 'saved') {
        // @ts-ignore
        this[syncProjects](request._id, request.projects);
      }
    });
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
   * @return {Promise<DeletedEntity>} Promise resolved to a new `_rev` property of deleted
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
    return {
      rev: response.rev,
      id,
    };
  }

  /**
   * Removes documents in a bulk operation.
   *
   * @param {string} type Database type
   * @param {string[]} items List of keys to remove
   * @return {Promise<DeletedEntity[]>}
   */
  async deleteBulk(type, items) {
    if (!type) {
      throw new Error('Request "type" property is missing.');
    }
    if (!Array.isArray(items)) {
      throw new Error('The "items" property is expected to be an array.');
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
        /* istanbul ignore if */
        if (!updateResult.ok) {
          continue;
        }
        removedIds.push(item.id);
        if (requestData.projects && requestData.projects.length) {
          projectIds = projectIds.concat(requestData.projects);
        }
        ArcModelEvents.Request.State.delete(this, type, item.id, updateResult.rev);
        result.push({
          rev: updateResult.rev,
          id: item.id,
        });
      } catch (e) {
        /* istanbul ignore next */
        continue;
      }
    }
    await this.removeRequestsFromProjects(projectIds, removedIds);
    return result;
  }

  /**
   * Removes requests reference from projects in a batch operation
   *
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
   *
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
   * Reverts deleted items and dispatches state change events for each restored item.
   *
   * @param {string} type Request type: `saved` or `history`
   * @param {DeletedEntity[]} items List of request to restore.
   * @return {Promise<ARCEntityChangeRecord[]>} Resolved promise with restored objects.
   */
  async revertRemove(type, items) {
    if (!type) {
      throw new Error('The "type" argument is missing');
    }
    if (!items) {
      throw new Error('The "items" argument is missing');
    }
    const db = this.getDatabase(type);
    const result = await revertDelete(db, items);
    await this[revertRemoveProject](result);
    result.forEach((record) => {
      ArcModelEvents.Request.State.update(this, type, record);
    });
    return result;
  }

  /**
   * Checks for project data in the restored requests and re-inserts the request to the corresponding projects.
   * @param {ARCEntityChangeRecord[]} result
   */
  async [revertRemoveProject](result) {
    const projects = {};
    result.forEach((record) => {
      const req = /** @type ARCSavedRequest */ (record.item);
      if (!Array.isArray(req.projects) || !req.projects.length) {
        return;
      }
      req.projects.forEach((pid) => {
        if (!projects[pid]) {
          projects[pid] = [];
        }
        projects[pid].push(req._id);
      });
    });
    const keys = Object.keys(projects);
    if (!keys.length) {
      return;
    }
    const dbProjects = await this.readProjects(keys);
    dbProjects.forEach((project) => {
      if (!project.requests) {
        project.requests = [];
      }
      project.requests = project.requests.concat(projects[project._id]);
      // https://stackoverflow.com/a/14438954/1127848
      project.requests = project.requests.filter((v, i, a) => a.indexOf(v) === i);
    });
    await this.updateProjects(dbProjects);
  }

  /**
   * Performs a query for the request data.
   *
   * This is not the same as searching for a request. This only lists
   * data from the datastore for given query options.
   *
   * @param {string} type Datastore type
   * @param {ARCModelListOptions=} opts Query options.
   * @return {Promise<ARCModelListResult>} A promise resolved to a query result for requests.
   */
  async list(type, opts={}) {
    if (!type) {
      throw new Error('The "type" parameter is required.');
    }
    const db = this.getDatabase(type);
    const result = await this.listEntities(db, opts);
    result.items = result.items.map((item) => {
      const typed = /** @type ARCSavedRequest */ (item);
      return normalizeRequest(typed);
    });
    return result;
  }

  /**
   * Saves requests with project data.
   *
   * @param {ARCSavedRequest} request Request object to store.
   * @param {string[]=} projects List of project names to create with this request
   * and attach it to the request object.
   * @return {Promise<ARCEntityChangeRecord>} A promise resolved to updated request object
   */
  async saveRequestProject(request, projects) {
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
    return this.post(typed.type, typed);
  }

  /**
   * Create projects from project names and adds a request into the projects.
   * It is used when creating a request with a new project.
   *
   * @param {string[]} names Names of projects
   * @param {string=} requestId Request ID to add to the projects.
   * @return {Promise<string[]>} Promise resolved to list of saved project ids
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
      /* istanbul ignore if */
      if (typedError.error) {
        this._handleException(typedError, true);
        continue;
      }
      const project = /** @type ARCProject */ (projects[i]);
      project._rev = r.rev;
      project._id = r.id;
      const record = {
        id: r.id,
        rev: r.rev,
        item: project,
      };
      ArcModelEvents.Project.State.update(this, record);
      result[result.length] = r.id;
    }
    return result;
  }

  /**
   * Queries both URL and PouchDb data.
   *
   * It calls, in order, `queryUrlData()` and `queryPouchDb()` functions.
   *
   * @param {string} q The search term
   * @param {string=} type Optional, type of the requests to search for.
   * By default it returns all data.
   * @param {boolean=} detailed If set it uses slower algorithm but performs full
   * search on the index. When false it only uses filer like query + '*'.
   * @return {Promise<(ARCHistoryRequest|ARCSavedRequest)[]>} Promise resolved to the list of requests.
   */
  async query(q, type, detailed) {
    if (!q) {
      throw new Error('The "q" property is missing.');
    }
    const urlSearchResults = await this.queryUrlData(q, type, detailed);
    const ignore = urlSearchResults.map((item) => item._id);
    const result = await this.queryPouchDb(q, type, ignore);
    return urlSearchResults.concat(result);
  }

  /**
   * Performs a query on the URL index data.
   *
   * @param {String} q Search term
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
    const db = await indexer.openSearchStore();
    db.close();
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
        /* istanbul ignore if */
        // @ts-ignore
        if (response.rows[j].error) {
          continue;
        }
        result[result.length] = normalizeRequest(response.rows[j].doc);
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
    return this[queryStore](q, ignore, this.historyDb, this.historyIndexes);
  }

  /**
   * Queries Saved store using PouchDB quick search plugin (full text search).
   *
   * @param {string} q User query
   * @param {string[]=} ignore List of IDs to ignore.
   * @return {Promise<(ARCHistoryRequest|ARCSavedRequest)[]>} Promise resolved to the list of requests.
   */
  async querySaved(q, ignore) {
    return this[queryStore](q, ignore, this.savedDb, this.savedIndexes);
  }

  /**
   * See `query()` function for description.
   * @param {string} q User query
   * @param {string[]} ignore List of IDs to ignore.
   * @param {PouchDB.Database} db A handler to the data store.
   * @param {string[]} indexes List of fields to query
   * @return {Promise<(ARCHistoryRequest|ARCSavedRequest)[]>} A promise resolved to list of PouchDB docs.
   */
  async [queryStore](q, ignore, db, indexes) {
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
        result[result.length] = normalizeRequest(rows[i].doc);
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
   * Reads list of requests associated with a project.
   *
   * @param {string} id The project id
   * @param {ARCRequestRestoreOptions=} opts Request restore options.
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
      requests[requests.length] = normalizeRequest(await db.get(item.id));
    }
    requests.sort(this[sortRequestProjectOrder]);
    return requests;
  }

  /**
   * Adds event listeners.
   * @param {EventTarget} node
   */
  listen(node) {
    super.listen(node);
    node.addEventListener(ArcModelEventTypes.Request.read, this[readHandler]);
    node.addEventListener(ArcModelEventTypes.Request.readBulk, this[readBulkHandler]);
    node.addEventListener(ArcModelEventTypes.Request.store, this[storeHandler]);
    node.addEventListener(ArcModelEventTypes.Request.update, this[updateHandler]);
    node.addEventListener(ArcModelEventTypes.Request.updateBulk, this[updatebulkHandler]);
    node.addEventListener(ArcModelEventTypes.Request.delete, this[deleteHandler]);
    node.addEventListener(ArcModelEventTypes.Request.deleteBulk, this[deleteBulkHandler]);
    node.addEventListener(ArcModelEventTypes.Request.undeleteBulk, this[undeleteBulkHandler]);
    node.addEventListener(ArcModelEventTypes.Request.list, this[listHandler]);
    node.addEventListener(ArcModelEventTypes.Request.query, this[queryHandler]);
    node.addEventListener(ArcModelEventTypes.Request.projectlist, this[projectlistHandler]);
    node.addEventListener(ArcModelEventTypes.destroy, this[deletemodelHandler]);
  }

  /**
   * Removes event listeners.
   * @param {EventTarget} node
   */
  unlisten(node) {
    super.unlisten(node);
    node.removeEventListener(ArcModelEventTypes.Request.read, this[readHandler]);
    node.removeEventListener(ArcModelEventTypes.Request.readBulk, this[readBulkHandler]);
    node.removeEventListener(ArcModelEventTypes.Request.store, this[storeHandler]);
    node.removeEventListener(ArcModelEventTypes.Request.update, this[updateHandler]);
    node.removeEventListener(ArcModelEventTypes.Request.updateBulk, this[updatebulkHandler]);
    node.removeEventListener(ArcModelEventTypes.Request.delete, this[deleteHandler]);
    node.removeEventListener(ArcModelEventTypes.Request.deleteBulk, this[deleteBulkHandler]);
    node.removeEventListener(ArcModelEventTypes.Request.undeleteBulk, this[undeleteBulkHandler]);
    node.removeEventListener(ArcModelEventTypes.Request.list, this[listHandler]);
    node.removeEventListener(ArcModelEventTypes.Request.query, this[queryHandler]);
    node.removeEventListener(ArcModelEventTypes.Request.projectlist, this[projectlistHandler]);
    node.removeEventListener(ArcModelEventTypes.destroy, this[deletemodelHandler]);
  }

  /**
   * Requests to store saved / history item.
   * It's similar to the `post` method but it also takes care about payload
   * transformation, project synchronization, etc.
   * This should not be used to update request meta like name or description.
   *
   * @param {ARCRequestStoreEvent} e
   */
  [storeHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    cancelEvent(e);
    const { requestType, request, projects } = e;
    if (requestType === 'history') {
      e.detail.result = this.post(requestType,request);
    } else if (requestType === 'saved') {
      const typed = /** @type ARCSavedRequest */ (request);
      e.detail.result = this.saveRequestProject(typed, projects);
    } else {
      e.detail.result = Promise.reject(new Error(`Unknown request type ${requestType}`));
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
  async [syncProjects](requestId, projects) {
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
      /* istanbul ignore if */
      if (typedError.error) {
        this._handleException(r, true);
        continue;
      }
      const project = update[i];
      const oldRev = project._rev;
      project._rev = r.rev;
      const record = {
        id: r.id,
        rev: r.rev,
        item: project,
        oldRev,
      };
      ArcModelEvents.Project.State.update(this, record);
    }
  }

  /**
   * Handler for the request read event.
   * @param {ARCRequestReadEvent} e
   */
  [readHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    cancelEvent(e);
    const { id, requestType, opts } = e;
    const userOptions = opts || {};
    if (!id) {
      e.detail.result = Promise.reject(
        new Error('Request "id" property is missing.')
      );
      return;
    }
    if (!requestType) {
      e.detail.result = Promise.reject(
        new Error('Request "requestType" property is missing.')
      );
      return;
    }
    const options = { ...userOptions };
    delete options.rev;
    e.detail.result = this.get(requestType, id, userOptions.rev, options);
  }

  /**
   * Handler for the read event in bulk.
   * @param {ARCRequestReadBulkEvent} e
   */
  [readBulkHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    cancelEvent(e);
    const { ids, requestType, opts={} } = e;
    if (!Array.isArray(ids)) {
      e.detail.result = Promise.reject(
        new Error('Request "ids" property is missing.')
      );
      return;
    }
    if (!requestType) {
      e.detail.result = Promise.reject(
        new Error('Request "type" property is missing.')
      );
      return;
    }
    const options = { ...opts };
    delete options.rev;
    e.detail.result = this.getBulk(requestType, ids, options);
  }

  /**
   * Updates request metadata
   * @param {ARCRequestUpdateEvent} e
   */
  [updateHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    cancelEvent(e);
    const { request, requestType } = e;
    if (!requestType) {
      e.detail.result = Promise.reject(
        new Error('The "requestType" property is missing.')
      );
      return;
    }
    if (!request) {
      e.detail.result = Promise.reject(
        new Error('The "request" property is missing.')
      );
      return;
    }
    e.detail.result = this.post(requestType, request);
  }


  /**
   * Updated requests objects in a bulk operation.
   * @param {ARCRequestUpdateBulkEvent} e
   */
  [updatebulkHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    cancelEvent(e);

    const { requests, requestType } = e;
    if (!requests) {
      e.detail.result = Promise.reject(
        new Error('The "requests" property is missing.')
      );
      return;
    }
    if (!requestType) {
      e.detail.result = Promise.reject(
        new Error('The "requestType" property is missing.')
      );
      return;
    }
    e.detail.result = this.postBulk(requestType, requests);
  }

  /**
   * Deletes the object from the datastore.
   *
   * @param {ARCRequestDeleteEvent} e
   */
  [deleteHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    cancelEvent(e);
    const { requestType, id, rev } = e;
    if (!requestType) {
      e.detail.result = Promise.reject(
        new Error('Request "type" property is missing.')
      );
      return;
    }

    if (!id) {
      e.detail.result = Promise.reject(new Error('Missing "id" property.'));
      return;
    }

    e.detail.result = this.delete(requestType, id, rev);
  }

  /**
   * Delete in bulk event handler
   * @param {ARCRequestDeleteBulkEvent} e
   */
  [deleteBulkHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const { requestType, ids } = e;
    if (!requestType) {
      e.detail.result = Promise.reject(
        new Error('The "requestType" property is missing.')
      );
      return;
    }
    if (!Array.isArray(ids)) {
      e.detail.result = Promise.reject(
        new Error('The "ids" property is missing.')
      );
      return;
    }
    e.detail.result = this.deleteBulk(requestType, ids);
  }

  /**
   * Handles an event to restore deleted requests.
   * @param {ARCRequestUndeleteBulkEvent} e
   */
  [undeleteBulkHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const { requestType, requests } = e;
    if (!requestType) {
      e.detail.result = Promise.reject(
        new Error('The "requestType" property is missing.')
      );
      return;
    }
    if (!Array.isArray(requests)) {
      e.detail.result = Promise.reject(
        new Error('The "requests" property is missing.')
      );
      return;
    }

    e.detail.result = this.revertRemove(requestType, requests);
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
   * @param {ARCRequestListEvent} e
   */
  [listHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const { limit, nextPageToken, requestType } = e;
    if (!requestType) {
      e.detail.result = Promise.reject(
        new Error('The "requestType" property is missing.')
      );
      return;
    }
    e.detail.result = this.list(requestType, {
      limit,
      nextPageToken,
    });
  }

  /**
   * A handler for the request query event.
   *
   * @param {ARCRequestQueryEvent} e
   */
  [queryHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const { term, requestType, detailed } = e;
    e.detail.result = this.query(term, requestType, detailed);
  }

  /**
   * Handler for event dispatched to query for a list of requests in a project.
   * @param {ARCRequestListProjectRequestsEvent} e
   */
  [projectlistHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const { id, opts } = e;
    e.detail.result = this.readProjectRequests(id, opts);
  }

  /**
   * Sorts requests list by `projectOrder` property
   *
   * @param {object} a
   * @param {object} b
   * @return {number}
   */
  [sortRequestProjectOrder](a, b) {
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
   * Handler for a event that destroys the application data.
   * @param {ARCModelDeleteEvent} e
   */
  [deletemodelHandler](e) {
    const { stores, detail } = e;
    if (!stores || !stores.length) {
      return;
    }
    const promises = this.deleteDataModel(stores);
    /* istanbul ignore else */
    if (promises.length) {
      /* istanbul ignore else */
      if (!Array.isArray(detail.result)) {
        detail.result = [];
      }
      detail.result = detail.result.concat(promises);
    }
  }
}
