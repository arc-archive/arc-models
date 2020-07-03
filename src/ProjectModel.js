/**
@license
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
import { RequestBaseModel } from './RequestBaseModel.js';
import { ArcModelEventTypes } from './events/ArcModelEventTypes.js';
import { ArcModelEvents } from './events/ArcModelEvents.js';
import { cancelEvent } from './Utils.js';

/* eslint-disable class-methods-use-this */
/* eslint-disable no-continue */
/* eslint-disable no-plusplus */

/** @typedef {import('./RequestTypes').ARCProject} ARCProject */
/** @typedef {import('./events/ProjectEvents').ARCPRojectReadEvent} ARCPRojectReadEvent */
/** @typedef {import('./events/ProjectEvents').ARCProjectUpdateEvent} ARCProjectUpdateEvent */
/** @typedef {import('./events/ProjectEvents').ARCProjectUpdateBulkEvent} ARCProjectUpdateBulkEvent */
/** @typedef {import('./events/ProjectEvents').ARCProjectDeleteEvent} ARCProjectDeleteEvent */
/** @typedef {import('./events/ProjectEvents').ARCProjectQueryEvent} ARCProjectQueryEvent */
/** @typedef {import('./types').ARCEntityChangeRecord} ARCEntityChangeRecord */
/** @typedef {import('./types').ARCModelQueryResult} ARCModelQueryResult */
/** @typedef {import('./types').ARCModelQueryOptions} ARCModelQueryOptions */

export const readHandler = Symbol('readHandler');
export const updateHandler = Symbol('updateHandler');
export const updateBulkHandler = Symbol('updateBulkHandler');
export const deleteHandler = Symbol('deleteHandler');
export const queryHandler = Symbol('queryHandler');
export const normalizeProjects = Symbol('normalizeProjects');
export const processUpdateBulkResponse = Symbol('processUpdateBulkResponse');

/**
 * A model to access projects data in Advanced REST Client.
 * This component provides direct access to the data via the API
 * and Events API defined in events/ folder.
 */
export class ProjectModel extends RequestBaseModel {
  /**
   * @constructor
   */
  constructor() {
    super('legacy-projects');
    this[readHandler] = this[readHandler].bind(this);
    this[updateHandler] = this[updateHandler].bind(this);
    this[deleteHandler] = this[deleteHandler].bind(this);
    this[queryHandler] = this[queryHandler].bind(this);
  }

  /**
   * Lists all project objects.
   *
   * @param {ARCModelQueryOptions=} opts Query options.
   * @return {Promise<ARCModelQueryResult>} A promise resolved to a list of projects.
   */
  async list(opts={}) {
    return this.listEntities(this.projectDb, opts);
  }

  /**
   * Updates or creats a project object.
   *
   * @param {ARCProject} project Project object to update.
   * @return {Promise<ARCEntityChangeRecord>}
   */
  async post(project) {
    if (!project) {
      throw new Error('The argument is missing');
    }
    if (!project._id) {
      throw new Error('The "id" property of the project is missing');
    }
    const db = this.projectDb;
    let item = { ...project };
    if (!item._rev) {
      try {
        const doc = await db.get(item._id);
        item = { ...doc, ...item };
      } catch (e) {
        if (e.status !== 404) {
          this._handleException(e);
          return undefined;
        }
      }
    }
    return this.updateProject(item);
  }

  /**
   * Link to `#readProject()` for API's consistency
   *
   * @param {string} id The ID of the datastore entry.
   * @param {string=} rev Specific revision to read. Defaults to the latest revision.
   * @return {Promise<ARCProject>} Promise resolved to a datastore object.
   */
  async get(id, rev) {
    return this.readProject(id, rev);
  }

  /**
   * Link to `#removeProject()` for API's consistency
   *
   * @param {string} id The ID of the datastore entry.
   * @param {string=} rev Specific revision to read. Defaults to latest revision.
   * @return {Promise<string>} Promise resolved to a new `_rev` property of deleted object.
   */
  async delete(id, rev) {
    return this.removeProject(id, rev);
  }

  /**
   * Updates more than one project in a bulk request.
   * @param {ARCProject[]} projects List of requests to update.
   * @return {Promise<ARCEntityChangeRecord[]>}
   */
  async postBulk(projects) {
    if (!projects || !projects.length) {
      throw new Error('The "projects" property is required');
    }
    const items = this[normalizeProjects](projects);
    const response = await this.projectDb.bulkDocs(items);
    return this[processUpdateBulkResponse](items, response);
  }

  /**
   * @param {EventTarget} node
   */
  _attachListeners(node) {
    super._attachListeners(node);

    node.addEventListener(ArcModelEventTypes.Project.read, this[readHandler]);
    node.addEventListener(ArcModelEventTypes.Project.update, this[updateHandler]);
    node.addEventListener(ArcModelEventTypes.Project.updateBulk, this[updateBulkHandler]);
    node.addEventListener(ArcModelEventTypes.Project.delete, this[deleteHandler]);
    node.addEventListener(ArcModelEventTypes.Project.query, this[queryHandler]);
  }

  /**
   * @param {EventTarget} node
   */
  _detachListeners(node) {
    super._detachListeners(node);

    node.removeEventListener(ArcModelEventTypes.Project.read, this[readHandler]);
    node.removeEventListener(ArcModelEventTypes.Project.update, this[updateHandler]);
    node.removeEventListener(ArcModelEventTypes.Project.updateBulk, this[updateBulkHandler]);
    node.removeEventListener(ArcModelEventTypes.Project.delete, this[deleteHandler]);
    node.removeEventListener(ArcModelEventTypes.Project.query, this[queryHandler]);
  }

  /**
   * Handler for project read event request.
   * @param {ARCPRojectReadEvent} e
   */
  [readHandler](e) {
    if (this._eventCancelled(e)) {
      return;
    }
    cancelEvent(e);
    const { id, rev } = e;
    e.detail.result = this.readProject(id, rev);
  }

  /**
   * Handles project save / update
   * @param {ARCProjectUpdateEvent} e
   */
  [updateHandler](e) {
    if (this._eventCancelled(e)) {
      return;
    }
    cancelEvent(e);
    const { project } = e;
    e.detail.result = this.post(project);
  }

  /**
   * Handler for `project-update-bulk` custom event.
   * @param {ARCProjectUpdateBulkEvent} e
   */
  [updateBulkHandler](e) {
    if (this._eventCancelled(e)) {
      return;
    }
    cancelEvent(e);
    const { projects } = e;
    e.detail.result = this.postBulk(projects);
  }

  /**
   * Normalizes projects list to common model.
   * It updates `updated` property to current time.
   * If an item is not an object then it is removed.
   *
   * @param {ARCProject[]} projects List of projects.
   * @return {ARCProject[]}
   */
  [normalizeProjects](projects) {
    const items = [...projects];
    for (let i = items.length - 1; i >= 0; i--) {
      let item = items[i];
      if (!item || typeof item !== 'object') {
        items.splice(i, 1);
        continue;
      }
      item = {
        order: 0,
        requests: [],
        ...item,
      };
      item.updated = Date.now();
      if (!item.created) {
        item.created = item.updated;
      }
      items[i] = item;
    }
    return items;
  }

  /**
   * Processes datastore response after calling `updateBulk()` function.
   * @param {ARCProject[]} projects List of requests to update.
   * @param {Array<PouchDB.Core.Response|PouchDB.Core.Error>} responses PouchDB response
   * @return {ARCEntityChangeRecord[]} List of projects with updated `_id` and `_rew`
   */
  [processUpdateBulkResponse](projects, responses) {
    const result = /** @type ARCEntityChangeRecord[] */ ([]);
    for (let i = 0, len = responses.length; i < len; i++) {
      const response = responses[i];
      const project = { ...projects[i] };
      const typedError = /** @type PouchDB.Core.Error */ (response);
      if (typedError.error) {
        this._handleException(typedError, true);
        continue;
      }
      const oldRev = project._rev;
      project._rev = response.rev;
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
    }
    return result;
  }

  /**
   * Removes a project from the data store.
   *
   * @param {ARCProjectDeleteEvent} e
   */
  [deleteHandler](e) {
    if (this._eventCancelled(e)) {
      return;
    }
    cancelEvent(e);

    const { id, rev } = e;
    e.detail.result = this.removeProject(id, rev);
  }

  /**
   * Queries for a list of projects.
   * @param {ARCProjectQueryEvent} e
   */
  [queryHandler](e) {
    if (this._eventCancelled(e)) {
      return;
    }
    cancelEvent(e);
    if (!e.detail) {
      throw new Error(
        'The `detail` object must be set prior sending the event'
      );
    }
    const { limit, nextPageToken } = e;
    e.detail.result = this.list({
      limit,
      nextPageToken,
    });
  }
}
