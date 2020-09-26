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
import { ArcBaseModel, deletemodelHandler, notifyDestroyed, createChangeRecord } from './ArcBaseModel.js';
import 'pouchdb/dist/pouchdb.js';
import '@advanced-rest-client/pouchdb-quick-search/dist/pouchdb.quick-search.min.js';
import { ArcModelEvents } from './events/ArcModelEvents.js';
import { generateHistoryId, normalizeRequest, normalizeRequestType } from './Utils.js';

/* global PouchQuickSearch */
/* eslint-disable class-methods-use-this */

// @ts-ignore
if (typeof PouchDB !== 'undefined' && typeof PouchQuickSearch !== 'undefined') {
  // @ts-ignore
  PouchDB.plugin(PouchQuickSearch);
}

/** @typedef {import('./RequestTypes').ARCProject} ARCProject */
/** @typedef {import('./RequestTypes').ARCSavedRequest} ARCSavedRequest */
/** @typedef {import('./RequestTypes').ARCHistoryRequest} ARCHistoryRequest */
/** @typedef {import('./types').ARCEntityChangeRecord} ARCEntityChangeRecord */
/** @typedef {import('./types').DeletedEntity} DeletedEntity */
/** @typedef {import('./events/BaseEvents').ARCModelDeleteEvent} ARCModelDeleteEvent */

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
   * Removes a project from the datastore.
   *
   * @param {string} id The ID of the datastore entry.
   * @param {string=} rev Specific revision to read. Defaults to latest revision.
   * @return {Promise<DeletedEntity>} Promise resolved to a new `_rev` property of deleted object.
   */
  async removeProject(id, rev) {
    if (!id) {
      throw new Error('Missing project "id" property.');
    }
    let winningRev = rev;
    if (!winningRev) {
      const obj = await this.readProject(id);
      winningRev = obj._rev;
    }
    const response = await this.projectDb.remove(id, winningRev);
    ArcModelEvents.Project.State.delete(this, id, response.rev);
    return {
      id,
      rev: response.rev,
    };
  }

  /**
   * Transforms a history request to a saved request object
   * @param {ARCHistoryRequest} history 
   * @returns {ARCSavedRequest}
   */
  historyToSaved(history) {
    const copy = /** @type ARCSavedRequest */({ ...history });
    copy.type = 'saved';
    delete copy._id;
    delete copy._rev;
    copy.name = 'Unnamed request';
    copy._id = generateHistoryId(copy);
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
}
