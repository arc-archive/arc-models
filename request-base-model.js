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
import { ArcBaseModel } from './base-model.js';
import '@advanced-rest-client/pouchdb-quick-search/dist/pouchdb.quick-search.min.js';
/* global PouchQuickSearch */
PouchDB.plugin(PouchQuickSearch);
/* eslint-disable require-atomic-updates */
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
   * @return {PouchDB} Reference to legacy projects datastore
   */
  get projectDb() {
    return new PouchDB('legacy-projects');
  }

  /**
   * Returns a reference to a PouchDB database instance for given type.
   *
   * @param {String} type Either `saved-requests` or `history-requests`
   * @return {PouchDB} PouchDB instance for the datastore.
   */
  getDatabase(type) {
    switch (type) {
      case 'saved-requests':
      case 'saved':
        return this.savedDb;
      case 'history-requests':
      case 'history':
        return this.historyDb;
      case 'legacy-projects':
      case 'projects':
        return this.projectDb;
      default: throw new Error('Unknown database type');
    }
  }
  /**
   * Deletes database data by tye.
   * @param {String} type Either `saved-requests` or `history-requests`
   * @return {Promise}
   */
  async deleteModel(type) {
    const db = this.getDatabase(type);
    await db.destroy();
    this._notifyModelDestroyed(type);
  }
  /**
   * Reads an entry from the datastore.
   *
   * @param {String} id The ID of the datastore entry.
   * @param {?String} rev Specific revision to read. Defaults to latest
   * revision.
   * @return {Promise} Promise resolved to a datastore object.
   */
  async readProject(id, rev) {
    if (!id) {
      throw new Error('Project "id" property must be set.');
    }
    const opts = {};
    if (rev) {
      opts.rev = rev;
    }
    return await this.projectDb.get(id, opts);
  }
  /**
   * Updates / saves a project object in the datastore.
   * This function fires `project-object-changed` event.
   *
   * @param {Object} project A project to save / update
   * @return {Promise} Resolved promise to project object with updated `_rev`
   */
  async updateProject(project) {
    project.updated = Date.now();
    const oldRev = project._rev;
    const result = await this.projectDb.put(project);
    project._rev = result.rev;
    this._fireUpdated('project-object-changed', {
      project: project,
      oldRev: oldRev
    });
    return project;
  }

  /**
   * Removed an object from the datastore.
   * This function fires `project-object-deleted` event.
   *
   * @param {String} id The ID of the datastore entry.
   * @param {?String} rev Specific revision to read. Defaults to latest revision.
   * @return {Promise} Promise resolved to a new `_rev` property of deleted object.
   */
  async removeProject(id, rev) {
    if (!id) {
      throw new Error('Missing "id" property.');
    }
    if (!rev) {
      const obj = await this.readProject(id);
      rev = obj._rev;
    }
    const response = await this.projectDb.remove(id, rev);
    const detail = {
      id: id,
      rev: response.rev,
      oldRev: rev
    };
    this._fireUpdated('project-object-deleted', detail);
    return response.rev;
  }
}
