/**
@license
Copyright 2017 The Advanced REST client authors <arc@mulesoft.com>
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
import { cancelEvent } from './Utils.js';

/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */

/** @typedef {import('./VariablesModel').ARCEnvironment} ARCEnvironment */
/** @typedef {import('./VariablesModel').ARCVariable} ARCVariable */
/** @typedef {import('./VariablesModel').DeleteEnvironmentResult} DeleteEnvironmentResult */
/** @typedef {import('./VariablesModel').DeleteVariableResult} DeleteVariableResult */

/**
 * Model for variables
 *
 * Available events:
 *
 * - `environment-read` Read environment object
 * - `environment-updated` Change / add record
 * - `environment-deleted` Remove record
 * - `environment-list-variables` List variables for an environment
 * - `environment-list` List variables
 * - `variable-updated` - Add / update variable
 * - `variable-deleted` - Delete variable
 * - `destroy-model` - Delete model action
 *
 * Each event must be cancelable or it will be ignored.
 * The insert, change and delete events dispatches non cancelable update/delete
 * events. Application should listen for this events to update it's state.
 */
export class VariablesModel extends ArcBaseModel {
  constructor() {
    super();
    this._envReadHandler = this._envReadHandler.bind(this);
    this._envUpdateHandler = this._envUpdateHandler.bind(this);
    this._envDeleteHandler = this._envDeleteHandler.bind(this);
    this._envListHandler = this._envListHandler.bind(this);
    this._varUpdateHandler = this._varUpdateHandler.bind(this);
    this._varDeleteHandler = this._varDeleteHandler.bind(this);
    this._varListHandler = this._varListHandler.bind(this);
  }

  _attachListeners(node) {
    node.addEventListener('environment-read', this._envReadHandler);
    node.addEventListener('environment-updated', this._envUpdateHandler);
    node.addEventListener('environment-deleted', this._envDeleteHandler);
    node.addEventListener('environment-list-variables', this._varListHandler);
    node.addEventListener('environment-list', this._envListHandler);
    node.addEventListener('variable-updated', this._varUpdateHandler);
    node.addEventListener('variable-deleted', this._varDeleteHandler);
    node.addEventListener('destroy-model', this._deleteModelHandler);
  }

  _detachListeners(node) {
    node.removeEventListener('environment-read', this._envReadHandler);
    node.removeEventListener('environment-updated', this._envUpdateHandler);
    node.removeEventListener('environment-deleted', this._envDeleteHandler);
    node.removeEventListener(
      'environment-list-variables',
      this._varListHandler
    );
    node.removeEventListener('environment-list', this._envListHandler);
    node.removeEventListener('variable-updated', this._varUpdateHandler);
    node.removeEventListener('variable-deleted', this._varDeleteHandler);
    node.removeEventListener('destroy-model', this._deleteModelHandler);
  }

  /**
   * Handler to the environments database.
   *
   * @return {Object}
   */
  get environmentDb() {
    /* global PouchDB */
    return new PouchDB('variables-environments');
  }

  /**
   * Handler to the variables database.
   *
   * @return {Object}
   */
  get variableDb() {
    return new PouchDB('variables');
  }

  /**
   * Handler for `environment-read` custom event.
   * Reads environment onject info by it's name.
   * @param {CustomEvent} e
   */
  _envReadHandler(e) {
    if (this._eventCancelled(e)) {
      return;
    }
    cancelEvent(e);
    const { environment } = e.detail;
    e.detail.result = this.readEnvironment(environment);
  }

  /**
   * Reads the environment data.
   * @param {string} environment Environment name to read
   * @return {Promise<ARCEnvironment>}
   */
  async readEnvironment(environment) {
    const list = await this.listEnvironments();
    if (!list) {
      return undefined;
    }
    return list.find((item) => item.name === environment);
  }

  /**
   * A handler for the `environment-updated` custom event.
   * Updates the environment in the data store.
   *
   * The `environment-updated` custom event should be cancellable or the event
   * won't be handled at all.
   *
   * @param {CustomEvent} e
   */
  _envUpdateHandler(e) {
    if (this._eventCancelled(e)) {
      return;
    }
    cancelEvent(e);
    e.detail.result = this.updateEnvironment(e.detail.value);
  }

  /**
   * Updates environment value.
   *
   * If the `value` doesn't contains the `_id` property a new environment is
   * created. The `_rev` property is always updated to the latest value.
   *
   * @param {ARCEnvironment} data A PouchDB object to be stored. It should contain the
   * `_id` property if the object is about to be updated. If the `_id` doesn't
   * exists a new object is created.
   * @return {Promise<ARCEnvironment>}
   */
  async updateEnvironment(data) {
    if (!data.name) {
      const error = new Error("Can't create an environment without the name.");
      return Promise.reject(error);
    }
    if (!data.created) {
      data.created = Date.now();
    }
    const { created } = data;
    if (created instanceof Date) {
      const typed = /** @type Date */ (created);
      data.created = typed.getTime();
    }

    let oldName;
    if (data._id) {
      try {
        const doc = await this.environmentDb.get(data._id);
        if (data.name !== doc.name) {
          oldName = doc.name;
        }
        data._rev = doc._rev;
      } catch (e) {
        if (e.status === 404) {
          delete data._id;
          delete data._rev;
        } else {
          this._handleException(e);
        }
      }
    }
    try {
      const result = await this.environmentDb[data._id ? 'put' : 'post'](data);
      if (!result.ok) {
        this._handleException(result);
      }
      data._id = result.id;
      data._rev = result.rev;
      if (oldName) {
        await this._updateEnvironmentName(oldName, data);
      }
      this._fireUpdated('environment-updated', {
        value: { ...data },
      });
      return data;
    } catch (cause) {
      this._handleException(cause);
      throw new Error(cause.message);
    }
  }

  /**
   * A special case when the name of the environment changes.
   * It updates any related to this environment variables.
   *
   * If this is current environment it also changes its name.
   *
   * @param {String} oldName Name of the environment befoe the change
   * @param {ARCEnvironment} data Updated data store entry
   * @return {Promise<void>}
   */
  async _updateEnvironmentName(oldName, data) {
    const variables = await this.listVariables(oldName);
    if (!variables || !variables.length) {
      return;
    }
    variables.forEach((item) => {
      item.environment = data.name;
    });
    await this.variableDb.bulkDocs(variables);
  }

  /**
   * A handler for the `environment-deleted` custom event.
   * Deletes a variable in the data store.
   *
   * The `environment-deleted` custom event should be cancellable or the event
   * won't be handled at all.
   *
   * The delete function fires non cancellable `environment-deleted` custom
   * event so the UI components can use it to update their values.
   *
   * @param {CustomEvent} e
   */
  _envDeleteHandler(e) {
    if (this._eventCancelled(e)) {
      return;
    }
    cancelEvent(e);
    e.detail.result = this.deleteEnvironment(e.detail.id);
  }

  /**
   * Deletes an environment from the data store.
   *
   * After updating the data store this method sends the `environment-deleted`
   * event that can't be cancelled so other managers that are present in the DOM
   * will not update the value again. If you don't need updated `_rev` you don't
   * have to listen for this event.
   *
   * Because this function changes the `environments` array the
   * `environments-list-changed` event is fired alongside the `environment-deleted`
   * event.
   *
   * @param {string} id `_id` property of the object to delete.
   * @return {Promise<DeleteEnvironmentResult|null>} Null when the document cannot be found
   */
  async deleteEnvironment(id) {
    if (!id) {
      throw new Error("Can't delete an environment without its id");
    }
    const db = this.environmentDb;
    try {
      const doc = await db.get(id);
      const environment = doc.name;
      const result = await db.remove(doc);
      if (!result.ok) {
        this._handleException(result);
      }
      await this._deleteEnvironmentVariables(environment);
      const detail = {
        id: result.id,
        rev: result.rev,
      };
      this._fireUpdated('environment-deleted', detail);
      return detail;
    } catch (e) {
      if (e.status === 404) {
        return null;
      }
      this._handleException(e);
    }
    return null;
  }

  /**
   * To be called after the environment has been deleted. It clears variables
   * for the environment.
   *
   * @param {string} environment The environment name.
   * @return {Promise<void>}
   */
  async _deleteEnvironmentVariables(environment) {
    if (!environment) {
      return;
    }
    environment = environment.toLowerCase();
    if (environment === 'default') {
      return;
    }

    try {
      const variables = await this.listVariables(environment);
      // It is possible to not have a result here.
      if (!variables || !variables.length) {
        return;
      }
      variables.forEach((doc) => {
        // @ts-ignore
        doc._deleted = true;
      });
      const result = await this.variableDb.bulkDocs(variables);
      result.forEach((item) => {
        if (item.error) {
          this._handleException(item, true);
        }
      });
    } catch (error) {
      this._handleException(error);
    }
  }

  /**
   * A handler for the `environment-list` custom event.
   * Adds a `value` propety of the event `detail` object with the array of the
   * user defined environments objects. Each item is a PouchDb data store item
   * (with `_id` and `_rev`).
   *
   * The `value` set on the details object can be undefined if the user haven't
   * defined any environments or if the manager haven't restored the list yet.
   * In the later case the event target element should listen for
   * `environments-list-changed` event to update the list of available environments.
   *
   * The `environment-current` custom event should be cancellable or the event
   * won't be handled at all.
   *
   * @param {CustomEvent} e
   */
  _envListHandler(e) {
    if (this._eventCancelled(e)) {
      return;
    }
    cancelEvent(e);
    e.detail.result = this.listEnvironments();
  }

  /**
   * Lists all user defined environments.
   *
   * @return {Promise<ARCEnvironment[]>} Resolved promise with the list of environments.
   */
  async listEnvironments() {
    const docs = await this.environmentDb.allDocs({ include_docs: true });
    return docs.rows.map((i) => i.doc);
  }

  /**
   * A handler for the `variable-list` custom event.
   *
   * Adds a `value` propety of the event `detail` object with the array of the
   * variables restored for current environment. Each item is a PouchDb data
   * store item (with `_id` and `_rev`).
   *
   * @param {CustomEvent} e
   */
  _varListHandler(e) {
    if (this._eventCancelled(e)) {
      return;
    }
    cancelEvent(e);
    e.detail.result = this.listVariables(e.detail.environment);
  }

  /**
   * Refreshes list of variables for the `environment`.
   *
   * @param {string} environment Name of the environment to get the variables
   * from.
   *
   * @return {Promise<ARCVariable[]>} Resolved promise with the list of variables for the
   * environment.
   */
  async listVariables(environment) {
    const q = environment.toLowerCase();
    const docs = await this.variableDb.allDocs({ include_docs: true });
    const result = [];
    docs.rows.forEach((item) => {
      const { doc } = item;
      if (!doc.environment) {
        return;
      }
      if (doc.environment.toLowerCase() === q) {
        result.push(doc);
      }
    });
    return result;
  }

  /**
   * A handler for the `variable-updated` custom event.
   * Updates the variable in the data store.
   *
   * The `variable-updated` custom event should be cancellable or the event
   * won't be handled at all.
   * @param {CustomEvent} e
   */
  _varUpdateHandler(e) {
    if (this._eventCancelled(e)) {
      return;
    }
    cancelEvent(e);
    e.detail.result = this.updateVariable(e.detail.value);
  }

  /**
   * Updates a variable value.
   *
   * If the `value` doesn't contains the `_id` property a new variable will
   * be created. The `_rev` property will be always updated to the latest value
   * so there's no need to set it on the object.
   *
   * After saving the data this method sends the `variable-updated` event that
   * can't be cancelled so other managers that are present in the DOM will not
   * update the value again.
   *
   * @param {ARCVariable} data A PouchDB object to be stored. It should contain the
   * `_id` property if the object is about to be updated. If the `_id` doesn't
   * exists a new object is created.
   * @return {Promise<ARCVariable>} Updated variable
   */
  async updateVariable(data) {
    if (!data.variable) {
      const m = "Can't create a variable without the variable property";
      throw new Error(m);
    }
    const db = this.variableDb;
    if (data._id) {
      try {
        const doc = await db.get(data._id);
        data._rev = doc._rev;
      } catch (e) {
        if (e.status !== 404) {
          this._handleException(e);
        }
      }
    }
    const result = await db[data._id ? 'put' : 'post'](data);
    if (!result.ok) {
      this._handleException(result);
    }
    data._id = result.id;
    data._rev = result.rev;
    this._fireUpdated('variable-updated', {
      value: { ...data },
    });
    return data;
  }

  /**
   * Deletes a variable from the data store.
   *
   * @param {CustomEvent} e Optional. If it is called from the event handler, this
   * is the event object. If initial validation fails then it will set `error`
   * property on the `detail` object.
   */
  _varDeleteHandler(e) {
    if (this._eventCancelled(e)) {
      return;
    }
    cancelEvent(e);
    e.detail.result = this.deleteVariable(e.detail.id);
  }

  /**
   * Deletes a variable from the data store.
   *
   * After updating the data store this method sends the `variable-deleted`
   * event that can't be cancelled so other managers that are present in the DOM
   * will not update the value again. If you don't need updated `_rev` you don't
   * have to listen for this event.
   *
   * Because this function changes the `variables` array the
   * `variables-list-changed` event is fired alongside the `variable-deleted`
   * event.
   *
   * @param {string} id The PouchDB `_id` property of the object to delete.
   * @return {Promise<DeleteVariableResult>}
   */
  async deleteVariable(id) {
    if (!id) {
      throw new Error("Can't delete a variable without its id");
    }
    const db = this.variableDb;
    try {
      const doc = await db.get(id);
      const result = await db.remove(doc);
      if (!result.ok) {
        this._handleException(result);
      }
      const detail = {
        id: result.id,
        rev: result.rev,
      };
      this._fireUpdated('variable-deleted', detail);
      return detail;
    } catch (e) {
      if (e.status !== 404) {
        this._handleException(e);
      }
    }
    // this is for linter only
    return null;
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
    if (models.indexOf('variables') === -1) {
      return;
    }
    const p = [this._delVariablesModel(), this._delEnvironmentsModel()];
    if (!e.detail.result) {
      e.detail.result = [];
    }
    e.detail.result = e.detail.result.concat(p);
  }

  async _delVariablesModel() {
    await this.variableDb.destroy();
    this._notifyModelDestroyed('variables');
  }

  async _delEnvironmentsModel() {
    await this.environmentDb.destroy();
    this._notifyModelDestroyed('variables-environments');
  }
}
