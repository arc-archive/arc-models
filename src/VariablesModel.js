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
import { ArcModelEventTypes, ArcModelEvents } from '@advanced-rest-client/events';
import { ArcBaseModel, deletemodelHandler } from './ArcBaseModel.js';

/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
/* eslint-disable no-continue */

/** @typedef {import('@advanced-rest-client/events').Variable.ARCEnvironment} ARCEnvironment */
/** @typedef {import('@advanced-rest-client/events').Variable.ARCVariable} ARCVariable */
/** @typedef {import('@advanced-rest-client/events').Variable.SystemVariables} SystemVariables */
/** @typedef {import('@advanced-rest-client/events').Model.ARCEntityChangeRecord} ARCEntityChangeRecord */
/** @typedef {import('@advanced-rest-client/events').Model.ARCModelListOptions} ARCModelListOptions */
/** @typedef {import('@advanced-rest-client/events').Model.ARCModelListResult} ARCModelListResult */
/** @typedef {import('@advanced-rest-client/events').Model.DeletedEntity} DeletedEntity */
/** @typedef {import('@advanced-rest-client/events').ARCModelDeleteEvent} ARCModelDeleteEvent */
/** @typedef {import('@advanced-rest-client/events').ARCEnvironmentReadEvent} ARCEnvironmentReadEvent */
/** @typedef {import('@advanced-rest-client/events').ARCEnvironmentUpdateEvent} ARCEnvironmentUpdateEvent */
/** @typedef {import('@advanced-rest-client/events').ARCEnvironmentDeleteEvent} ARCEnvironmentDeleteEvent */
/** @typedef {import('@advanced-rest-client/events').ARCEnvironmentListEvent} ARCEnvironmentListEvent */
/** @typedef {import('@advanced-rest-client/events').ARCVariableUpdateEvent} ARCVariableUpdateEvent */
/** @typedef {import('@advanced-rest-client/events').ARCVariableDeleteEvent} ARCVariableDeleteEvent */
/** @typedef {import('@advanced-rest-client/events').ARCVariableListEvent} ARCVariableListEvent */
/** @typedef {import('@advanced-rest-client/events').ARCVariablesListOptions} ARCVariablesListOptions */
/** @typedef {import('@advanced-rest-client/events').EnvironmentStateDetail} EnvironmentStateDetail */
/** @typedef {import('@advanced-rest-client/events').ARCEnvironmentSelectEvent} ARCEnvironmentSelectEvent */
/** @typedef {import('@advanced-rest-client/events').ARCEnvironmentCurrentEvent} ARCEnvironmentCurrentEvent */
/** @typedef {import('@advanced-rest-client/events').ARCVariableSetEvent} ARCVariableSetEvent */

export const envReadHandler = Symbol('envReadHandler');
export const envUpdateHandler = Symbol('envUpdateHandler');
export const envDeleteHandler = Symbol('envDeleteHandler');
export const envListHandler = Symbol('envListHandler');
export const varUpdateHandler = Symbol('varUpdateHandler');
export const varDeleteHandler = Symbol('varDeleteHandler');
export const varListHandler = Symbol('varListHandler');
export const updateEnvironmentName = Symbol('updateEnvironmentName');
export const deleteEnvironmentVariables = Symbol('deleteEnvironmentVariables');
export const deleteEnvironmentsModel = Symbol('deleteEnvironmentsModel');
export const deleteVariablesModel = Symbol('deleteVariablesModel');
export const currentValue = Symbol('currentValue');
export const environmentChangeHandler = Symbol('environmentChangeHandler');
export const environmentCurrentHandler = Symbol('environmentCurrentHandler');
export const selectEnvironment = Symbol('selectEnvironment');
export const variableSetHandler = Symbol('variableSetHandler');
export const systemVariablesValue = Symbol('systemVariablesValue');

/**
 * Model for variables
 */
export class VariablesModel extends ArcBaseModel {
  /**
   * Handler to the environments database.
   *
   * @return {PouchDB.Database}
   */
  get environmentDb() {
    /* global PouchDB */
    return new PouchDB('variables-environments');
  }

  /**
   * Handler to the variables database.
   *
   * @return {PouchDB.Database}
   */
  get variableDb() {
    return new PouchDB('variables');
  }

  /**
   * @returns {string} The id of the currently selected environment or null when the default is selected.
   */
  get currentEnvironment() {
    return this[currentValue] || null;
  }

  /**
   * @param {string} value The id of the environment to select or null when the default is selected.
   */
  set currentEnvironment(value) {
    const old = this[currentValue];
    if (old === value || !old && !value) {
      return;
    }
    this[currentValue] = value;
    this[selectEnvironment]();
  }

  /**
   * @returns {SystemVariables} List of previously set system variables
   */
  get systemVariables() {
    return this[systemVariablesValue];
  }

  /**
   * @param {SystemVariables} value
   */
  set systemVariables(value) {
    const old = this[systemVariablesValue];
    if (old === value) {
      return;
    }
    let setValue;
    if (value) {
      setValue = Object.freeze(value);
    }
    this[systemVariablesValue] = setValue;
  }

  constructor() {
    super();
    this[envReadHandler] = this[envReadHandler].bind(this);
    this[envUpdateHandler] = this[envUpdateHandler].bind(this);
    this[envDeleteHandler] = this[envDeleteHandler].bind(this);
    this[envListHandler] = this[envListHandler].bind(this);
    this[varUpdateHandler] = this[varUpdateHandler].bind(this);
    this[varDeleteHandler] = this[varDeleteHandler].bind(this);
    this[varListHandler] = this[varListHandler].bind(this);
    this[environmentChangeHandler] = this[environmentChangeHandler].bind(this);
    this[environmentCurrentHandler] = this[environmentCurrentHandler].bind(this);
    this[variableSetHandler] = this[variableSetHandler].bind(this);
    /** 
     * @type {string}
     */
    this[currentValue] = undefined;
  }

  /**
   * Reads environment from the data store by its id.
   * @param {string} id
   * @return {Promise<ARCEnvironment>}
   */
  async getEnvironment(id) {
    return this.environmentDb.get(id);
  }

  /**
   * Reads the environment meta data.
   *
   * @param {string} environment Environment name to read
   * @return {Promise<ARCEnvironment|undefined>}
   */
  async readEnvironment(environment) {
    const list = await this.listAllEnvironments();
    return list.items.find((item) => item.name === environment);
  }

  /**
   * Updates the environment entity.
   *
   * @param {ARCEnvironment} data Entity to store
   * @return {Promise<ARCEntityChangeRecord>}
   */
  async updateEnvironment(data) {
    if (!data.name) {
      throw new Error("Can't create an environment without the name.");
    }
    if (!data.created) {
      data.created = Date.now();
    }

    let oldName;
    let oldRev;
    if (data._id) {
      try {
        const doc = await this.environmentDb.get(data._id);
        if (data.name !== doc.name) {
          oldName = doc.name;
        }
        data._rev = doc._rev;
        oldRev = doc._rev;
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
      let result;
      if (data._id) {
        result = await this.environmentDb.put(data);
      } else {
        result = await this.environmentDb.post(data);
      }
      if (!result.ok) {
        this._handleException(result);
      }
      data._id = result.id;
      data._rev = result.rev;
      if (oldName) {
        await this[updateEnvironmentName](oldName, data);
      }

      const record = {
        id: result.id,
        rev: result.rev,
        oldRev,
        item: data,
      };
      ArcModelEvents.Environment.State.update(this, record);

      return record;
    } catch (cause) {
      this._handleException(cause);
      throw new Error(cause.message);
    }
  }

  /**
   * A special case when the name of the environment changes.
   * It updates any related to this environment variable.
   *
   * If this is current environment it also changes its name.
   *
   * @param {string} oldName Name of the environment before the change
   * @param {ARCEnvironment} data Updated data store entry
   * @return {Promise<void>}
   */
  async [updateEnvironmentName](oldName, data) {
    const variables = await this.listAllVariables(oldName);
    if (!variables.items.length) {
      return;
    }
    variables.items.forEach((item) => {
      item.environment = data.name;
    });
    await this.variableDb.bulkDocs(variables.items);
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
   * @return {Promise<DeletedEntity|null>} Null when the document cannot be found
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
      await this[deleteEnvironmentVariables](environment);
      ArcModelEvents.Environment.State.delete(this, result.id, result.rev);
      return {
        id: result.id,
        rev: result.rev,
      };
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
  async [deleteEnvironmentVariables](environment) {
    if (!environment) {
      return;
    }
    environment = environment.toLowerCase();
    if (environment === 'default') {
      return;
    }

    try {
      const variables = await this.listAllVariables(environment);
      // It is possible to not have a result here.
      if (!variables.items.length) {
        return;
      }
      variables.items.forEach((doc) => {
        // @ts-ignore
        doc._deleted = true;
      });
      const result = await this.variableDb.bulkDocs(variables.items);
      result.forEach((item) => {
        // @ts-ignore
        if (item.error) {
          this._handleException(item, true);
        }
      });
    } catch (error) {
      this._handleException(error);
    }
  }

  /**
   * Lists all user defined environments.
   *
   * @param {ARCModelListOptions=} opts Query options.
   * @return {Promise<ARCModelListResult>} A promise resolved to a list of projects.
   */
  async listEnvironments(opts={}) {
    return this.listEntities(this.environmentDb, opts);
  }

  /**
   * Lists all user defined environments.
   *
   * @return {Promise<ARCModelListResult>} Resolved promise with the list of environments.
   */
  async listAllEnvironments() {
    const docs = await this.environmentDb.allDocs({ include_docs: true });
    const items = docs.rows.map((i) => i.doc);
    return {
      items,
    };
  }

  /**
   * Reads all variables for the `environment`
   *
   * @param {string} environment Name of the environment to get the variables
   * for.
   * @return {Promise<ARCModelListResult>} Resolved promise with the list of variables for the
   * environment.
   */
  async listAllVariables(environment) {
    const q = environment.toLowerCase();
    const docs = await this.variableDb.allDocs({ include_docs: true });
    const items = [];
    docs.rows.forEach((item) => {
      const { doc } = item;
      if (!doc.environment) {
        return;
      }
      if (doc.environment.toLowerCase() === q) {
        if (!doc.name) {
          doc.name = doc.variable;
        }
        items.push(doc);
      }
    });
    return {
      items,
    };
  }

  /**
   * Lists all user defined environments.
   *
   * @param {string} name The name of the environment
   * @param {ARCModelListOptions=} opts Query options.
   * @return {Promise<ARCModelListResult>} A promise resolved to a list of projects.
   */
  async listVariables(name, opts={}) {
    const q = name.toLowerCase();
    const { limit=25, nextPageToken } = opts;
    let queryOptions = { limit };
    if (nextPageToken) {
      const pageOptions = this.decodePageToken(nextPageToken);
      if (pageOptions) {
        queryOptions = { ...queryOptions, ...pageOptions };
      }
    }
    const items = [];
    let lastKey;
    const response = await this.variableDb.allDocs({ include_docs: true });
    const { rows } = response;
    const itLimit = Math.min(rows.length, limit);
    let keyStarted = false;
    while (items.length < itLimit) {
      const item = rows.shift();
      if (!item) {
        break;
      }
      if (queryOptions.startkey && !keyStarted && item.key !== queryOptions.startkey) {
        continue;
      } else if (queryOptions.startkey && item.key === queryOptions.startkey) {
        keyStarted = true;
      }
      const { doc } = item;
      if (String(doc.environment).toLowerCase() === q) {
        if (!doc.name) {
          doc.name = doc.variable;
        }
        items.push(doc);
        lastKey = item.key;
      }
    }
    let token;
    if (lastKey) {
      const params = {
        startkey: lastKey,
      }
      token = this.encodePageToken(params);
    }
    return {
      items,
      nextPageToken: token,
    };
  }

  /**
   * Updates a variable entity.
   *
   * @param {ARCVariable} data An entity to update
   * @return {Promise<ARCEntityChangeRecord>} Promise resolved to the variable change record
   */
  async updateVariable(data) {
    const entity = { ...data };
    if (!entity.name) {
      entity.name = entity.variable;
    }
    delete entity.variable;
    if (!entity.name) {
      const m = "Can't create a variable without the \"name\" property";
      throw new Error(m);
    }
    const db = this.variableDb;
    let oldRev;
    if (entity._id) {
      try {
        const doc = await db.get(entity._id);
        entity._rev = doc._rev;
        oldRev = doc._rev;
      } catch (e) {
        if (e.status !== 404) {
          this._handleException(e);
        }
      }
    }
    let result;
    if (entity._id) {
      result = await db.put(entity);
    } else {
      result = await db.post(entity);
    }
    if (!result.ok) {
      this._handleException(result);
    }
    entity._id = result.id;
    entity._rev = result.rev;
    const record = {
      id: result.id,
      rev: result.rev,
      oldRev,
      item: entity,
    };
    ArcModelEvents.Variable.State.update(this, record);
    return record;
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
   * @return {Promise<DeletedEntity>}
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
      ArcModelEvents.Variable.State.delete(this, result.id, result.rev);
      return {
        id: result.id,
        rev: result.rev,
      };
    } catch (e) {
      if (e.status !== 404) {
        this._handleException(e);
      }
    }
    // this is for the linter only
    return null;
  }

  /**
   * Reads the current environment and it's variables.
   * @returns {Promise<EnvironmentStateDetail>} The environment state object.
   */
  async readCurrent() {
    const { currentEnvironment, systemVariables } = this;
    const result = /** @type EnvironmentStateDetail */ ({
      environment: null,
      variables: [],
    });
    if (currentEnvironment) {
      result.environment = await this.getEnvironment(currentEnvironment);
    }
    if (systemVariables) {
      result.systemVariables = systemVariables;
    }
    const name = result.environment ? result.environment.name : 'default';
    const vars = await this.listAllVariables(name);
    result.variables = vars.items;
    return result;
  }

  /**
   * A handler for the `currentEnvironment` property change.
   * Reads the current state and informs the components about the change.
   */
  async [selectEnvironment]() {
    /** @type EnvironmentStateDetail */
    let state;
    try {
      state = await this.readCurrent();
    } catch (e) {
      if (this.currentEnvironment) {
        this.currentEnvironment = undefined;
        return;
      }
      state = {
        environment: null,
        variables: [],
      };
      if (this.systemVariables) {
        state.systemVariables = this.systemVariables;
      }
    }
    ArcModelEvents.Environment.State.select(this, state);
  }

  /**
   * Handler for destroy-model custom event.
   *
   * @param {ARCModelDeleteEvent} e
   */
  [deletemodelHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    const { stores, detail } = e;
    if (!Array.isArray(stores) || stores.indexOf('variables') === -1) {
      return;
    }
    /* istanbul ignore else */
    if (!Array.isArray(detail.result)) {
      detail.result = [];
    }
    e.detail.result.push(this[deleteVariablesModel]());
    e.detail.result.push(this[deleteEnvironmentsModel]());
  }

  /**
   * Sets a variable for the current environment.
   * If the variable already exist then its value is updated. Otherwise a new variable is added.
   * 
   * @param {string} name The name of the variable. Case sensitive.
   * @param {string} value The value to set on the variable.
   * @returns {Promise<ARCEntityChangeRecord>} Promise resolved to the promise id, whether 
   */
  async setVariable(name, value) {
    const info = await this.readCurrent();
    const { variables, environment } = info;
    let variable = variables.find((item) => item.name === name);
    if (!variable) {
      const eName = environment ? environment.name : 'default';
      variable = /** @type ARCVariable */ ({
        environment: eName,
        enabled: true,
      });
    }
    variable.enabled = true;
    variable.name = name;
    variable.value = value;
    return this.updateVariable(variable);
  }


  async [deleteVariablesModel]() {
    await this.variableDb.destroy();
    ArcModelEvents.destroyed(this, 'variables');
  }

  async [deleteEnvironmentsModel]() {
    await this.environmentDb.destroy();
    ArcModelEvents.destroyed(this, 'variables-environments');
  }

  /**
   * @param {EventTarget} node
   */
  listen(node) {
    super.listen(node);
    node.addEventListener(ArcModelEventTypes.Environment.read, this[envReadHandler]);
    node.addEventListener(ArcModelEventTypes.Environment.update, this[envUpdateHandler]);
    node.addEventListener(ArcModelEventTypes.Environment.delete, this[envDeleteHandler]);
    node.addEventListener(ArcModelEventTypes.Environment.list, this[envListHandler]);
    node.addEventListener(ArcModelEventTypes.Environment.select, this[environmentChangeHandler]);
    node.addEventListener(ArcModelEventTypes.Environment.current, this[environmentCurrentHandler]);
    node.addEventListener(ArcModelEventTypes.Variable.update, this[varUpdateHandler]);
    node.addEventListener(ArcModelEventTypes.Variable.delete, this[varDeleteHandler]);
    node.addEventListener(ArcModelEventTypes.Variable.list, this[varListHandler]);
    node.addEventListener(ArcModelEventTypes.Variable.set, this[variableSetHandler]);
  }

  /**
   * @param {EventTarget} node
   */
  unlisten(node) {
    super.unlisten(node);
    node.removeEventListener(ArcModelEventTypes.Environment.read, this[envReadHandler]);
    node.removeEventListener(ArcModelEventTypes.Environment.update, this[envUpdateHandler]);
    node.removeEventListener(ArcModelEventTypes.Environment.delete, this[envDeleteHandler]);
    node.removeEventListener(ArcModelEventTypes.Environment.list, this[envListHandler]);
    node.removeEventListener(ArcModelEventTypes.Environment.select, this[environmentChangeHandler]);
    node.removeEventListener(ArcModelEventTypes.Environment.current, this[environmentCurrentHandler]);
    node.removeEventListener(ArcModelEventTypes.Variable.update, this[varUpdateHandler]);
    node.removeEventListener(ArcModelEventTypes.Variable.delete, this[varDeleteHandler]);
    node.removeEventListener(ArcModelEventTypes.Variable.list, this[varListHandler]);
    node.removeEventListener(ArcModelEventTypes.Variable.set, this[variableSetHandler]);
  }

  /**
   * Handler for the environment read event.
   *
   * @param {ARCEnvironmentReadEvent} e
   */
  [envReadHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const { name } = e;
    e.detail.result = this.readEnvironment(name);
  }

  /**
   * A handler for the environment update event.
   * Updates the environment in the data store.
   *
   * @param {ARCEnvironmentUpdateEvent} e
   */
  [envUpdateHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const { environment } = e;
    e.detail.result = this.updateEnvironment(environment);
  }

  /**
   * A handler for the environment delete event.
   * Deletes the environment and its variables from the data store.
   *
   * @param {ARCEnvironmentDeleteEvent} e
   */
  [envDeleteHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const { id } = e;
    e.detail.result = this.deleteEnvironment(id);
  }

  /**
   * A handler for the environment list event.
   *
   * @param {ARCEnvironmentListEvent} e
   */
  [envListHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const { limit, nextPageToken, readall } = e;
    if (readall) {
      e.detail.result = this.listAllEnvironments();
    } else {
      e.detail.result = this.listEnvironments({
        limit,
        nextPageToken,
      });
    }
  }

  /**
   * A handler for the variable update custom event.
   *
   * @param {ARCVariableUpdateEvent} e
   */
  [varUpdateHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const { variable } = e;
    e.detail.result = this.updateVariable(variable);
  }

  /**
   * A handler for the variable delete custom event.
   *
   * @param {ARCVariableDeleteEvent} e
   */
  [varDeleteHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const { id } = e;
    e.detail.result = this.deleteVariable(id);
  }

  /**
   * A handler for the variable list custom event.
   *
   * @param {ARCVariableListEvent} e
   */
  [varListHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const { name, limit, nextPageToken, readall } = e;
    if (readall) {
      e.detail.result = this.listAllVariables(name);
    } else {
      e.detail.result = this.listVariables(name, {
        limit,
        nextPageToken,
      });
    }
  }
  
  /**
   * A handler for the environment change event
   *
   * @param {ARCEnvironmentSelectEvent} e
   */
  [environmentChangeHandler](e) {
    const id = e.detail;
    this.currentEnvironment = id;
  }

  /**
   * A handler for the current environment read event
   *
   * @param {ARCEnvironmentCurrentEvent} e
   */
  [environmentCurrentHandler](e) {
    e.detail.result = this.readCurrent();
  }

  /**
   * A handler for the current environment read event
   *
   * @param {ARCVariableSetEvent} e
   */
  [variableSetHandler](e) {
    const { name, value } = e;
    e.detail.result = this.setVariable(name, value);
  }
}
