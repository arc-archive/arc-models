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
import { ArcBaseModel } from './ArcBaseModel.js';
import 'pouchdb/dist/pouchdb.js';
import '@advanced-rest-client/pouchdb-quick-search/dist/pouchdb.quick-search.min.js';

/* global PouchQuickSearch */
/* eslint-disable class-methods-use-this */
/* eslint-disable require-atomic-updates */

// @ts-ignore
if (typeof PouchDB !== 'undefined' && typeof PouchQuickSearch !== 'undefined') {
  // @ts-ignore
  PouchDB.plugin(PouchQuickSearch);
}

/** @typedef {import('./RequestTypes').ARCProject} ARCProject */

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
      default:
        throw new Error('Unknown database type');
    }
  }

  /**
   * Handler for `destroy-model` custom event.
   * Deletes current data when scheduled for deletion.
   * @param {CustomEvent} e
   */
  _deleteModelHandler(e) {
    const { models } = e.detail;
    if (!models || !models.length || !this.name) {
      return;
    }
    if (models.indexOf(this.name) !== -1) {
      if (!e.detail.result) {
        e.detail.result = [];
      }
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
    this._notifyModelDestroyed(type);
  }

  /**
   * Reads an entry from the datastore.
   *
   * @param {string} id The ID of the datastore entry.
   * @param {string=} rev Specific revision to read. Defaults to latest
   * revision.
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
   * This function fires `project-object-changed` event.
   *
   * @param {ARCProject} project A project to save / update
   * @return {Promise<ARCProject>} Resolved promise to project object with updated `_rev`
   */
  async updateProject(project) {
    const copy = { ...project };
    copy.updated = Date.now();
    const oldRev = copy._rev;
    const result = await this.projectDb.put(copy);
    copy._rev = result.rev;
    this._fireUpdated('project-object-changed', {
      project: copy,
      oldRev,
    });
    return copy;
  }

  /**
   * Removed an object from the datastore.
   * This function fires `project-object-deleted` event.
   *
   * @param {string} id The ID of the datastore entry.
   * @param {string=} rev Specific revision to read. Defaults to latest revision.
   * @return {Promise<string>} Promise resolved to a new `_rev` property of deleted object.
   */
  async removeProject(id, rev) {
    if (!id) {
      throw new Error('Missing "id" property.');
    }
    let winningRev = rev;
    if (!winningRev) {
      const obj = await this.readProject(id);
      winningRev = obj._rev;
    }
    const response = await this.projectDb.remove(id, winningRev);
    const detail = {
      id,
      rev: response.rev,
      oldRev: winningRev,
    };
    this._fireUpdated('project-object-deleted', detail);
    return response.rev;
  }
}
