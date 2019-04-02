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
import {ArcBaseModel} from './base-model.js';
if (typeof PouchQuickSearch !== 'undefined') {
  /* global PouchQuickSearch */
  PouchDB.plugin(PouchQuickSearch);
}

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
    /* global PouchDB */
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
  deleteModel(type) {
    try {
      const db = this.getDatabase(type);
      return db.destroy()
      .then(() => this._notifyModelDestroyed(type));
    } catch (e) {
      return Promise.reject(e);
    }
  }
  /**
   * Reads an entry from the datastore.
   *
   * @param {String} id The ID of the datastore entry.
   * @param {?String} rev Specific revision to read. Defaults to latest
   * revision.
   * @return {Promise} Promise resolved to a datastore object.
   */
  readProject(id, rev) {
    const opts = {};
    if (rev) {
      opts.rev = rev;
    }
    return this.projectDb.get(id, opts);
  }
  /**
   * Updates / saves a project object in the datastore.
   * This function fires `project-object-changed` event.
   *
   * @param {Object} project A project to save / update
   * @return {Promise} Resolved promise to project object with updated `_rev`
   */
  updateProject(project) {
    project.updated = Date.now();
    const oldRev = project._rev;
    return this.projectDb.put(project)
    .then((result) => {
      project._rev = result.rev;
      this._fireUpdated('project-object-changed', {
        project: project,
        oldRev: oldRev
      });
      return project;
    });
  }

  /**
   * Removed an object from the datastore.
   * This function fires `project-object-deleted` event.
   *
   * @param {String} id The ID of the datastore entry.
   * @param {?String} rev Specific revision to read. Defaults to latest revision.
   * @return {Promise} Promise resolved to a new `_rev` property of deleted object.
   */
  removeProject(id, rev) {
    let promise;
    if (!rev) {
      promise = this.readProject(id)
      .then((obj) => rev = obj._rev);
    } else {
      promise = Promise.resolve();
    }
    return promise
    .then(() => this.projectDb.remove(id, rev))
    .then((response) => {
      const detail = {
        id: id,
        rev: response.rev,
        oldRev: rev
      };
      this._fireUpdated('project-object-deleted', detail);
      return response.rev;
    });
  }
}
