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
import { cancelEvent } from './Utils.js';

/* eslint-disable class-methods-use-this */
/* eslint-disable no-continue */
/* eslint-disable no-plusplus */

/** @typedef {import('./RequestTypes').ARCProject} ARCProject */

/**
 * Events based access to projects datastore.
 *
 * Note: **All events must be cancelable.** When the event is cancelled by an
 * instance of the element it won't be handled again by other instance that
 * possibly exists in the DOM.
 *
 * Cancellable event is a request to models for change. Non-cancellable event
 * is a notification for views to update their values.
 * For example `project-object-changed` event notifies model to update object in
 * the datastore if the event is cancelable and to update views if it's not
 * cancellable.
 *
 * Each handled event contains the `result` property on the `detail` object. It
 * contains a `Promise` object with a result of the operation. Also, for update
 * or delete events the same non-cancelable event is fired.
 *
 * Events handled by this element are cancelled and propagation of the event is
 * stopped.
 *
 * See model description here:
 * https://github.com/advanced-rest-client/api-components-api/blob/master/docs/arc-models.md#arcproject
 *
 * Supported operations:
 *
 * -   Read project object (`project-read`)
 * -   Update name only (`project-name-changed`)
 * -   Update project object (`project-object-changed`)
 * -   Delete object (`project-object-deleted`)
 * -   Query for projects (`project-model-query`)
 *
 * ### Events description
 *
 * #### `project-read` event
 *
 * Reads a project object from the datastore.
 *
 * ##### Properties
 * -   `id` (String, required) ID of the datastore entry
 * -   `rev` (String, optional) Specific revision to retrieve from the datastore.
 * Latest by default.
 *
 * ##### Example
 *
 * ```javascript
 * const event = new CustomEvent('project-read', {
 *    detail: { id: 'some-id' },
 *    bubbles: true,
 *    composed: true,
 *    cancelable: true
 * });
 * document.body.dispatchEvent(event);
 * if (event.defaultPrevented) {
 *    event.detail.result.then(project => console.log(project));
 * }
 * ```
 *
 * #### `project-object-changed` event
 *
 * Updates / saves new object in the datastore.
 *
 * ##### Properties
 *
 * -   `project` (Object, required) An object to store
 *
 * ##### Example
 *
 * ```javascript
 * const event = new CustomEvent('project-object-changed', {
 *    detail: { project: {...} },
 *    bubbles: true,
 *    composed: true,
 *    cancelable: true
 * });
 * document.body.dispatchEvent(event);
 * if (event.defaultPrevented) {
 *    event.detail.result.then(project => console.log(project));
 * }
 * ```
 *
 * #### `project-object-deleted` event
 *
 * Deletes the object from the datastore. This operation fires
 * `project-object-deleted` custom event. Promise returns object's
 * new `_rev` value.
 *
 * ##### Properties
 * -   `id` (String, required) ID of the datastore entry
 * -   `rev` (String, optional) The `_rev` property of the PouchDB datastore
 * object. If not set it will use latest revision.
 *
 * ##### Example
 *
 * ```javascript
 * const event = new CustomEvent('project-object-deleted', {
 *    detail: { id: 'some-id' },
 *    bubbles: true,
 *    composed: true,
 *    cancelable: true
 * });
 * document.body.dispatchEvent(event);
 * if (event.defaultPrevented) {
 *    event.detail.result.then(newRev => console.log(newRev));
 * }
 * ```
 *
 * #### `project-model-query` event
 *
 * Reads the list of all projects. Promise resolves to the list of projects.
 * This event doesn't requeire any properties but **the `details` object must be set**.
 *
 * ##### Properties
 *
 * -   `ids` (Array<String>, optional) If present it only returns data for
 * ids passed in this array. If the data does not exists in the store anymore
 * this item is `undefined` in the response.
 *
 * ##### Example
 *
 * ```javascript
 * const event = new CustomEvent('project-model-query', {
 *    detail: {}, // THIS MUST BE SET
 *    bubbles: true,
 *    composed: true,
 *    cancelable: true
 * });
 * document.body.dispatchEvent(event);
 * if (event.defaultPrevented) {
 *    event.detail.result.then(list => console.log(list));
 * }
 * ```
 *
 * #### `project-update-bulk` event
 *
 * Used to create / update projects in bulk
 *
 * It expects `projects` property to be set on the detail object.
 * Each item must be an object at least containing the name. Otherwise the
 * object is ignored.
 *
 * ##### Example
 *
 * ```javascript
 * const event = new CustomEvent('project-update-bulk', {
 *    detail: {
 *      projects: [{name: 'my project'}]
 *    },
 *    bubbles: true,
 *    composed: true,
 *    cancelable: true
 * });
 * document.body.dispatchEvent(event);
 * if (event.defaultPrevented) {
 *    event.detail.result.then(list => console.log(list));
 * }
 * ```
 */
export class ProjectModel extends RequestBaseModel {
  /**
   * @constructor
   */
  constructor() {
    super('legacy-projects');
    this._handleRead = this._handleRead.bind(this);
    this._handleObjectSave = this._handleObjectSave.bind(this);
    this._handleObjectDelete = this._handleObjectDelete.bind(this);
    this._queryHandler = this._queryHandler.bind(this);
    this._createBulkHandler = this._createBulkHandler.bind(this);
  }

  /**
   * @param {EventTarget} node
   */
  _attachListeners(node) {
    super._attachListeners(node);
    node.addEventListener('project-read', this._handleRead);
    node.addEventListener('project-object-changed', this._handleObjectSave);
    node.addEventListener('project-object-deleted', this._handleObjectDelete);
    node.addEventListener('project-model-query', this._queryHandler);
    node.addEventListener('project-update-bulk', this._createBulkHandler);
  }

  /**
   * @param {EventTarget} node
   */
  _detachListeners(node) {
    super._detachListeners(node);
    node.removeEventListener('project-read', this._handleRead);
    node.removeEventListener('project-object-changed', this._handleObjectSave);
    node.removeEventListener(
      'project-object-deleted',
      this._handleObjectDelete
    );
    node.removeEventListener('project-model-query', this._queryHandler);
    node.removeEventListener('project-update-bulk', this._createBulkHandler);
  }

  /**
   * Handler for project read event request.
   * @param {CustomEvent} e
   */
  _handleRead(e) {
    if (this._eventCancelled(e)) {
      return;
    }
    cancelEvent(e);
    e.detail.result = this.readProject(e.detail.id, e.detail.rev).catch((ev) =>
      this._handleException(ev)
    );
  }

  /**
   * Handler for `project-update-bulk` custom event.
   * @param {CustomEvent} e
   */
  _createBulkHandler(e) {
    if (this._eventCancelled(e)) {
      return;
    }
    cancelEvent(e);
    const { projects } = e.detail;
    e.detail.result = this.updateBulk(projects);
  }

  /**
   * Normalizes projects list to common model.
   * It updates `updated` property to current time.
   * If an item is not an object then it is removed.
   *
   * @param {ARCProject[]} projects List of projects.
   * @return {ARCProject[]}
   */
  _normalizeProjects(projects) {
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
   * Updates more than one project in a bulk request.
   * @param {ARCProject[]} projects List of requests to update.
   * @return {Promise<ARCProject[]>}
   */
  async updateBulk(projects) {
    if (!projects || !projects.length) {
      throw new Error('The "projects" property is required');
    }
    const items = this._normalizeProjects(projects);
    const response = await this.projectDb.bulkDocs(items);
    return this._processUpdateBulkResponse(items, response);
  }

  /**
   * Processes datastore response after calling `updateBulk()` function.
   * @param {ARCProject[]} projects List of requests to update.
   * @param {Array<PouchDB.Core.Response|PouchDB.Core.Error>} response PouchDB response
   * @return {ARCProject[]} List of projects with updated `_id` and `_rew`
   */
  _processUpdateBulkResponse(projects, response) {
    const result = [];
    for (let i = 0, len = response.length; i < len; i++) {
      const r = response[i];
      const project = projects[i];
      const typedError = /** @type PouchDB.Core.Error */ (r);
      if (typedError.error) {
        this._handleException(typedError, true);
        result.push({ error: true, ...project });
        continue;
      }
      const oldRev = project._rev;
      project._rev = r.rev;
      if (!project._id) {
        project._id = r.id;
      }
      const detail = {
        project,
        oldRev,
      };
      this._fireUpdated('project-object-changed', detail);
      result.push(project);
    }
    return result;
  }

  /**
   * Lists all project objects.
   *
   * @param {string[]=} ids Optional, list of project IDs to limit the
   * response to specific projects
   * @return {Promise<ARCProject[]>} A promise resolved to a list of projects.
   */
  async listProjects(ids) {
    const opts = {
      include_docs: true,
    };
    if (ids && ids.length) {
      opts.keys = ids;
    }
    const result = await this.projectDb.allDocs(opts);
    return result.rows.map((item) => item.doc);
  }

  /**
   * Handles object save / update
   * @param {CustomEvent} e
   */
  _handleObjectSave(e) {
    if (this._eventCancelled(e)) {
      return;
    }
    cancelEvent(e);
    const { project } = e.detail;
    e.detail.result = this.saveProject(project);
  }

  /**
   * Updates project object taking care of `_rew` value read if missing.
   *
   * @param {ARCProject} project Project object to update.
   * @return {Promise<ARCProject>}
   */
  async saveProject(project) {
    if (!project || !project._id) {
      throw new Error('The "project" property is missing');
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
    try {
      return this.updateProject(item);
    } catch (e) {
      this._handleException(e);
      return undefined;
    }
  }

  /**
   * Deletes the object from the datastore.
   * @param {CustomEvent} e
   */
  _handleObjectDelete(e) {
    if (this._eventCancelled(e)) {
      return;
    }
    cancelEvent(e);

    const { id, rev } = e.detail;
    e.detail.result = this.removeProject(id, rev).catch((ev) =>
      this._handleException(ev)
    );
  }

  /**
   * Queries for a list of projects.
   * @param {CustomEvent} e
   */
  _queryHandler(e) {
    if (this._eventCancelled(e)) {
      return;
    }
    cancelEvent(e);
    if (!e.detail) {
      throw new Error(
        'The `detail` object must be set prior sending the event'
      );
    }
    e.detail.result = this.listProjects(e.detail.keys);
  }
  /**
   * Fired when the project entity has been saved / updated in the datastore.
   *
   * @event project-object-changed
   * @param {Object} project Project object with new `_rev`.
   * @param {String} oldRev Entity old `_rev` property. May be `undefined` when
   * creating new entity.
   */

  /**
   * @event project-object-deleted
   * @param {String} id Removed project ID
   * @param {String} rev Updated `_rev` property of the object.
   * @param {String} oldRev Entity old `_rev` property (before delete).
   */
}
