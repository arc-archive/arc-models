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
import { createChangeRecord } from './ArcBaseModel.js';

/* eslint-disable class-methods-use-this */
/* eslint-disable no-continue */
/* eslint-disable no-plusplus */

/** @typedef {import('./RequestTypes').ARCProject} ARCProject */
/** @typedef {import('./events/ProjectEvents').ARCProjectReadEvent} ARCProjectReadEvent */
/** @typedef {import('./events/ProjectEvents').ARCProjectUpdateEvent} ARCProjectUpdateEvent */
/** @typedef {import('./events/ProjectEvents').ARCProjectUpdateBulkEvent} ARCProjectUpdateBulkEvent */
/** @typedef {import('./events/ProjectEvents').ARCProjectDeleteEvent} ARCProjectDeleteEvent */
/** @typedef {import('./events/ProjectEvents').ARCProjectListEvent} ARCProjectListEvent */
/** @typedef {import('./events/ProjectEvents').ARCProjectListAllEvent} ARCProjectListAllEvent */
/** @typedef {import('./events/ProjectEvents').ARCProjectMoveEvent} ARCProjectMoveEvent */
/** @typedef {import('./types').ARCEntityChangeRecord} ARCEntityChangeRecord */
/** @typedef {import('./types').ARCModelListResult} ARCModelListResult */
/** @typedef {import('./types').ARCModelListOptions} ARCModelListOptions */
/** @typedef {import('./types').DeletedEntity} DeletedEntity */
/** @typedef {import('./RequestTypes').ARCSavedRequest} ARCSavedRequest */

export const readHandler = Symbol('readHandler');
export const updateHandler = Symbol('updateHandler');
export const updateBulkHandler = Symbol('updateBulkHandler');
export const deleteHandler = Symbol('deleteHandler');
export const listHandler = Symbol('listHandler');
export const listAllHandler = Symbol('listAllHandler');
export const moveToHandler = Symbol('moveToHandler');
export const addToHandler = Symbol('addToHandler');
export const removeFromHandler = Symbol('removeFromHandler');
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
    this[listHandler] = this[listHandler].bind(this);
    this[listAllHandler] = this[listAllHandler].bind(this);
    this[updateBulkHandler] = this[updateBulkHandler].bind(this);
    this[moveToHandler] = this[moveToHandler].bind(this);
    this[addToHandler] = this[addToHandler].bind(this);
    this[removeFromHandler] = this[removeFromHandler].bind(this);
  }

  /**
   * Paginate project entities
   *
   * @param {ARCModelListOptions=} opts Query options.
   * @return {Promise<ARCModelListResult>} A promise resolved to a list of projects.
   */
  async list(opts={}) {
    return this.listEntities(this.projectDb, opts);
  }

  /**
   * Lists all project entities.
   *
   * @param {string[]=} keys Project keys to read. When not set it reads all projects
   * @return {Promise<ARCProject[]>} A promise resolved to a list of projects.
   */
  async listAll(keys) {
    const opts = {
      include_docs: true,
    };
    if (Array.isArray(keys) && keys.length) {
      opts.keys = keys;
    }
    const response = await this.projectDb.allDocs(opts);
    let items = [];
    if (response && response.rows.length > 0) {
      items = response.rows.map((item) => item.doc);
    }
    return items;
  }

  /**
   * Updates or creates a project object.
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
        /* istanbul ignore if */
        if (e.status !== 404) {
          this._handleException(e);
          return undefined;
        }
      }
    }
    return this.updateProject(item);
  }

  /**
   * Link to `#readProject()` for API consistency
   *
   * @param {string} id The ID of the datastore entry.
   * @param {string=} rev Specific revision to read. Defaults to the latest revision.
   * @return {Promise<ARCProject>} Promise resolved to a datastore object.
   */
  async get(id, rev) {
    return this.readProject(id, rev);
  }

  /**
   * Link to `#removeProject()` for API consistency
   *
   * @param {string} id The ID of the datastore entry.
   * @param {string=} rev Specific revision to read. Defaults to latest revision.
   * @return {Promise<DeletedEntity>} Promise resolved to a new `_rev` property of deleted object.
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
    if (!Array.isArray(projects) || !projects.length) {
      throw new Error('The "projects" property is required');
    }
    const items = this[normalizeProjects](projects);
    const response = await this.projectDb.bulkDocs(items);
    return this[processUpdateBulkResponse](items, response);
  }

  /**
   * Adds a request to a project.
   * @param {string} pid Project id
   * @param {string} rid Request id
   * @param {string} type Request type
   * @returns {Promise<void>}
   */
  async addRequest(pid, rid, type) {
    // handle project first
    const project = await this.readProject(pid);
    if (!project.requests) {
      project.requests = /** @type string[] */ ([]);
    }
    if (!project.requests.includes(rid)) {
      project.requests.push(rid);
      await this.updateProject(project);
    }

    const requestDb = this.getDatabase(type);
    const request = /** @type ARCSavedRequest */ (await requestDb.get(rid));
    const isHistory = type === 'history';
    let copy = /** @type ARCSavedRequest */ (null);
    if (isHistory) {
      copy = this.historyToSaved(request);
    } else {
      copy = /** @type ARCSavedRequest */ (this.normalizeRequestWithTime(request));
    }
    const oldRev = copy._rev;
    if (!copy.projects) {
      copy.projects = /** @type string[] */ ([]);
    }
    if (!copy.projects.includes(pid)) {
      copy.projects.push(pid);
      const response = await this.savedDb.put(copy);
      const record = this[createChangeRecord](copy, response, oldRev);
      ArcModelEvents.Request.State.update(this, type, record);
    }
  }

  /**
   * Moves a request to a project.
   * @param {string} pid Target project id
   * @param {string} rid Request id
   * @param {string} type Request type
   * @returns {Promise<void>}
   */
  async moveRequest(pid, rid, type) {
    // handle project first
    const project = await this.readProject(pid);
    if (!project.requests) {
      project.requests = /** @type string[] */ ([]);
    }
    if (!project.requests.includes(rid)) {
      project.requests.push(rid);
      await this.updateProject(project);
    }

    const requestDb = this.getDatabase(type);
    const request = /** @type ARCSavedRequest */ (await requestDb.get(rid));
    const isHistory = type === 'history';
    let copy = /** @type ARCSavedRequest */ (null);
    if (isHistory) {
      copy = this.historyToSaved(request);
    } else {
      copy = /** @type ARCSavedRequest */ (this.normalizeRequestWithTime(request));
      await this.removeFromProjects(copy);
      copy.projects = undefined;
    }
    const oldRev = copy._rev;
    if (!copy.projects) {
      copy.projects = /** @type string[] */ ([]);
    }
    if (!copy.projects.includes(pid)) {
      copy.projects.push(pid);
      const response = await this.savedDb.put(copy);
      const record = this[createChangeRecord](copy, response, oldRev);
      ArcModelEvents.Request.State.update(this, type, record);
    }
  }

  /**
   * Removes request from a project
   * @param {string} pid Project id
   * @param {string} rid Request id
   * @returns {Promise<void>}
   */
  async removeRequest(pid, rid) {
    const project = await this.readProject(pid);
    if (!project.requests) {
      project.requests = /** @type string[] */ ([]);
    }
    const request = /** @type ARCSavedRequest */ (await this.savedDb.get(rid));
    if (!request.projects) {
      request.projects = /** @type string[] */ ([]);
    }
    if (request.projects.includes(pid)) {
      const index = request.projects.indexOf(pid);
      request.projects.splice(index, 1);
      const oldRev = request._id;
      const copy = /** @type ARCSavedRequest */ (this.normalizeRequestWithTime(request));
      const response = await this.savedDb.put(copy);
      const record = this[createChangeRecord](copy, response, oldRev);
      ArcModelEvents.Request.State.update(this, 'saved', record);
    }
    if (project.requests.includes(rid)) {
      const index = project.requests.indexOf(pid);
      project.requests.splice(index, 1);
      await this.updateProject(project);
    }
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
    node.addEventListener(ArcModelEventTypes.Project.list, this[listHandler]);
    node.addEventListener(ArcModelEventTypes.Project.listAll, this[listAllHandler]);
    node.addEventListener(ArcModelEventTypes.Project.moveTo, this[moveToHandler]);
    node.addEventListener(ArcModelEventTypes.Project.addTo, this[addToHandler]);
    node.addEventListener(ArcModelEventTypes.Project.removeFrom, this[removeFromHandler]);
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
    node.removeEventListener(ArcModelEventTypes.Project.list, this[listHandler]);
    node.removeEventListener(ArcModelEventTypes.Project.listAll, this[listAllHandler]);
    node.removeEventListener(ArcModelEventTypes.Project.moveTo, this[moveToHandler]);
    node.removeEventListener(ArcModelEventTypes.Project.addTo, this[addToHandler]);
    node.removeEventListener(ArcModelEventTypes.Project.removeFrom, this[removeFromHandler]);
  }

  /**
   * Handler for project read event request.
   * @param {ARCProjectReadEvent} e
   */
  [readHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const { id, rev } = e;
    e.detail.result = this.readProject(id, rev);
  }

  /**
   * Handles project save / update
   * @param {ARCProjectUpdateEvent} e
   */
  [updateHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const { project } = e;
    e.detail.result = this.post(project);
  }

  /**
   * Handler for `project-update-bulk` custom event.
   * @param {ARCProjectUpdateBulkEvent} e
   */
  [updateBulkHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

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
      /* istanbul ignore if */
      if (typedError.error) {
        this._handleException(typedError, true);
        continue;
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
    }
    return result;
  }

  /**
   * Removes a project from the data store.
   *
   * @param {ARCProjectDeleteEvent} e
   */
  [deleteHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const { id, rev } = e;
    e.detail.result = this.removeProject(id, rev);
  }

  /**
   * Queries for a list of projects in pagination
   * @param {ARCProjectListEvent} e
   */
  [listHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const { limit, nextPageToken } = e;
    e.detail.result = this.list({
      limit,
      nextPageToken,
    });
  }

  /**
   * List all projects.
   * @param {ARCProjectListAllEvent} e
   */
  [listAllHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const { keys } = e;
    e.detail.result = this.listAll(keys);
  }

  /** 
   * @param {ARCProjectMoveEvent} e
   */
  [moveToHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const { projectId, requestId, requestType } = e;
    e.detail.result = this.moveRequest(projectId, requestId, requestType);
  }

  /** 
   * @param {ARCProjectMoveEvent} e
   */
  [addToHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const { projectId, requestId, requestType } = e;
    e.detail.result = this.addRequest(projectId, requestId, requestType);
  }

  /** 
   * @param {ARCProjectMoveEvent} e
   */
  [removeFromHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const { projectId, requestId } = e;
    e.detail.result = this.removeRequest(projectId, requestId);
  }
}
