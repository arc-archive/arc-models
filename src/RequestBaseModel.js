/**
@license
Copyright 2018 The Advanced REST client authors <arc@mulesoft.com>
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
import { v4 } from '@advanced-rest-client/uuid-generator';
import { ArcBaseModel, deletemodelHandler, notifyDestroyed, createChangeRecord } from './ArcBaseModel.js';
import 'pouchdb/dist/pouchdb.js';
import '@advanced-rest-client/pouchdb-quick-search/dist/pouchdb.quick-search.min.js';
import { ArcModelEvents } from './events/ArcModelEvents.js';
import { normalizeRequest, normalizeRequestType, normalizeProjects } from './Utils.js';

/* global PouchQuickSearch */
/* eslint-disable class-methods-use-this */

// @ts-ignore
if (typeof PouchDB !== 'undefined' && typeof PouchQuickSearch !== 'undefined') {
  // @ts-ignore
  PouchDB.plugin(PouchQuickSearch);
}

/** @typedef {import('@advanced-rest-client/arc-types').Project.ARCProject} ARCProject */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ARCSavedRequest} ARCSavedRequest */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ARCHistoryRequest} ARCHistoryRequest */
/** @typedef {import('./types').ARCEntityChangeRecord} ARCEntityChangeRecord */
/** @typedef {import('./types').DeletedEntity} DeletedEntity */
/** @typedef {import('./events/BaseEvents').ARCModelDeleteEvent} ARCModelDeleteEvent */

export const processUpdateProjectBulkResponse = Symbol('processUpdateProjectBulkResponse');

/**
 * A base class for Request and Projects` models.
 *
 * @extends ArcBaseModel
 */
export class RequestBaseModel extends ArcBaseModel {
  get savedDb() {
    /* global PouchDB */
    return new PouchDB('saved-requests');
  }

  get historyDb() {
    return new PouchDB('history-requests');
  }

  /**
   * @return {PouchDB.Database} Reference to legacy projects datastore
   */
  get projectDb() {
    return new PouchDB('legacy-projects');
  }

  /**
   * Returns a reference to a PouchDB database instance for given type.
   *
   * @param {String} type Either `saved-requests` or `history-requests`
   * @return {PouchDB.Database} PouchDB instance for the datastore.
   */
  getDatabase(type) {
    switch (normalizeRequestType(type)) {
      case 'saved':
        return this.savedDb;
      case 'history':
        return this.historyDb;
      case 'projects':
        return this.projectDb;
      default:
        throw new Error('Unknown database type');
    }
  }

  /**
   * Overrides data model delete handler to support dynamic nature of this component
   * @param {ARCModelDeleteEvent} e
   */
  [deletemodelHandler](e) {
    const { stores, detail } = e;
    if (!stores || !stores.length || !this.name) {
      return;
    }
    /* istanbul ignore else */
    if (!Array.isArray(detail.result)) {
      detail.result = [];
    }
    if (stores.indexOf(this.name) !== -1) {
      e.detail.result.push(this.deleteModel(this.name));
    }
  }

  /**
   * Deletes database data by tye.
   * @param {string} type Either `saved-requests` or `history-requests`
   * @return {Promise<void>}
   */
  async deleteModel(type) {
    const db = this.getDatabase(type);
    await db.destroy();
    this[notifyDestroyed](type);
  }

  /**
   * Reads an entry from the datastore.
   *
   * @param {string} id The ID of the datastore entry.
   * @param {string=} rev Specific revision to read. Defaults to the latest revision.
   * @return {Promise<ARCProject>} Promise resolved to a datastore object.
   */
  async readProject(id, rev) {
    if (!id) {
      throw new Error('Project "id" property must be set.');
    }
    const opts = {};
    if (rev) {
      opts.rev = rev;
    }
    return this.projectDb.get(id, opts);
  }

  /**
   * Bulk read a list of projects
   * @param {string[]} ids The list of ids to read.
   * @returns {Promise<ARCProject[]>} Read projects.
   */
  async readProjects(ids) {
    if (!Array.isArray(ids) || !ids.length) {
      throw new Error('The "ids" property is required');
    }
    const response = await this.projectDb.allDocs({
      keys: ids,
      include_docs: true,
    });
    const { rows } = response;
    const result = rows.map((item) => item.doc);
    return result;
  }

  /**
   * Updates / saves a project object in the datastore.
   *
   * @param {ARCProject} project A project to save / update
   * @return {Promise<ARCEntityChangeRecord>} Resolved promise to project's change record.
   */
  async updateProject(project) {
    const copy = { ...project };
    copy.updated = Date.now();
    const oldRev = copy._rev;
    const response = await this.projectDb.put(copy);
    const record = this[createChangeRecord](copy, response, oldRev);
    ArcModelEvents.Project.State.update(this, record);
    return record;
  }

  /**
   * Updates more than one project in a bulk request.
   * @param {ARCProject[]} projects List of requests to update.
   * @return {Promise<ARCEntityChangeRecord[]>}
   */
  async updateProjects(projects) {
    if (!Array.isArray(projects) || !projects.length) {
      throw new Error('The "projects" property is required');
    }
    const items = normalizeProjects(projects);
    const response = await this.projectDb.bulkDocs(items);
    return this[processUpdateProjectBulkResponse](items, response);
  }

  /**
   * Removes a project entity from the data store.
   * It also calls `removeProjectRequests()` to clean up requests.
   *
   * @param {string} id The ID of the datastore entry.
   * @return {Promise<DeletedEntity>}
   */
  async removeProject(id) {
    if (!id) {
      throw new Error('Missing project "id" property.');
    }
    await this.removeProjectRequests(id);
    const obj = await this.readProject(id);
    const response = await this.projectDb.remove(id, obj._rev);
    ArcModelEvents.Project.State.delete(this, id, response.rev);
    return {
      id,
      rev: response.rev,
    };
  }

  /**
   * Removes requests associated with the project.
   * Requests that are association with only one project are deleted.
   * Requests that are association with more than one project are updated
   * to remove project reference.
   * 
   * Note, the project is not updated.
   * 
   * @param {string} id
   */
  async removeProjectRequests(id) {
    const project = await this.readProject(id);
    const { requests, _id } = project;
    if (!Array.isArray(requests) || !requests.length) {
      return;
    }
    const items = /** @type ARCSavedRequest[] */ (await ArcModelEvents.Request.readBulk(this, 'saved', requests, {
      preserveOrder: true,
    }));
    const remove = [];
    const update = [];
    items.forEach((request) => {
      if (!request) {
        return;
      }
      const { projects } = request;
      if (!Array.isArray(projects) || !projects.length) {
        return;
      }
      if (!projects.includes(_id)) {
        return;
      }
      if (projects.length > 1) {
        const rIndex = projects.indexOf(_id);
        projects.splice(rIndex, 1);
        update.push(request);
      } else {
        remove.push(request._id);
      }
    });
    if (remove.length) {
      await ArcModelEvents.Request.deleteBulk(this, 'saved', remove);
    }
    if (update.length) {
      await ArcModelEvents.Request.updateBulk(this, 'saved', update);
    }
  }

  /**
   * Transforms a history request to a saved request object
   * @param {ARCHistoryRequest} history 
   * @returns {ARCSavedRequest}
   */
  historyToSaved(history) {
    const copy = /** @type ARCSavedRequest */({ ...history });
    copy.type = 'saved';    
    delete copy._rev;
    copy.name = 'Unnamed request';
    copy._id = v4();
    // @ts-ignore
    return this.normalizeRequestWithTime(copy, true);
  }

  /**
   * Normalizes the request to a common request object and updates time values (updated, midnight)
   * @param {ARCHistoryRequest|ARCSavedRequest} request The request to normalize
   * @param {boolean=} setMidnight Whether the `midnight` property should be set.
   * @returns {ARCHistoryRequest|ARCSavedRequest} Updated request
   */
  normalizeRequestWithTime(request, setMidnight=false) {
    const updated = Date.now();
    const timeValues = { updated };
    if (setMidnight) {
      const day = new Date(updated);
      day.setHours(0, 0, 0, 0);
      timeValues.midnight = day.getTime();
    }
    return normalizeRequest({ ...request, ...timeValues });
  }

  /**
   * Removes the request from all projects it is added to.
   * Note, this does not update request itself!
   * @param {ARCSavedRequest} request The request to process 
   * @returns {Promise<ARCEntityChangeRecord[]>} Change record for each changed project.
   */
  async removeFromProjects(request) {
    const { projects, _id: id } = request;
    if (!Array.isArray(projects) || !projects.length) {
      return [];
    }
    const response = await this.projectDb.allDocs({
      include_docs: true,
      keys: projects,
    });
    const updates = [];
    response.rows.forEach((doc) => {
      const project = /** @type ARCProject */ (doc.doc);
      if (!project) {
        return;
      }
      const { requests } = project;
      if (!Array.isArray(requests) || !requests.length) {
        return;
      }
      if (requests.includes(id)) {
        const index = requests.indexOf(id);
        requests.splice(index, 1);
        updates.push(this.updateProject(project));
      }
    });
    return Promise.all(updates);
  }

  /**
   * Processes datastore response after calling `updateBulk()` function.
   * @param {ARCProject[]} projects List of requests to update.
   * @param {Array<PouchDB.Core.Response|PouchDB.Core.Error>} responses PouchDB response
   * @return {ARCEntityChangeRecord[]} List of projects with updated `_id` and `_rew`
   */
  [processUpdateProjectBulkResponse](projects, responses) {
    const result = /** @type ARCEntityChangeRecord[] */ ([]);
    responses.forEach((response, i) => {
      const project = { ...projects[i] };
      const typedError = /** @type PouchDB.Core.Error */ (response);
      /* istanbul ignore if */
      if (typedError.error) {
        this._handleException(typedError, true);
        return;
      }
      const oldRev = project._rev;
      project._rev = response.rev;
      /* istanbul ignore if */
      if (!project._id) {
        project._id = response.id;
      }
      const record = /** @type ARCEntityChangeRecord */ ({
        id: project._id,
        rev: response.rev,
        item: project,
      });
      if (oldRev) {
        record.oldRev = oldRev;
      }
      result.push(record);
      ArcModelEvents.Project.State.update(this, record);
    });
    return result;
  }
}
