/* eslint-disable max-classes-per-file */
import { ArcModelEventTypes } from './ArcModelEventTypes.js';
import { ARCEntityDeletedEvent, ARCEntityListEvent } from './BaseEvents.js';

/** @typedef {import('../types').ARCEntityChangeRecord} ARCEntityChangeRecord */
/** @typedef {import('../types').ARCModelListResult} ARCModelListResult */
/** @typedef {import('../types').DeletedEntity} DeletedEntity */
/** @typedef {import('@advanced-rest-client/arc-types').Variable.ARCVariable} ARCVariable */
/** @typedef {import('@advanced-rest-client/arc-types').Variable.ARCEnvironment} ARCEnvironment */
/** @typedef {import('./VariableEvents').ARCVariablesListOptions} ARCVariablesListOptions */

export const nameValue = Symbol('projectValue');
export const environmentValue = Symbol('environmentValue');
export const environmentIdValue = Symbol('environmentIdValue');
export const variableValue = Symbol('variableValue');
export const variableIdValue = Symbol('variableIdValue');
export const changeRecordValue = Symbol('changeRecordValue');
export const readallValue = Symbol('readallValue');

/**
 * An event to be dispatched to read an ARC Environment from the data store.
 */
export class ARCEnvironmentReadEvent extends CustomEvent {
  /**
   * @return {string} The name of the environment used to initialize this event.
   */
  get name() {
    return this[nameValue];
  }

  /**
   * @param {string} name The name of the environment
   */
  constructor(name) {
    super(ArcModelEventTypes.Environment.read, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {},
    });
    this[nameValue] = name;
  }
}

/**
 * An event dispatched to the store to update an environment.
 */
export class ARCEnvironmentUpdateEvent extends CustomEvent {
  /**
   * @return {ARCEnvironment} An environment used to initialize this event.
   */
  get environment() {
    return this[environmentValue];
  }

  /**
   * @param {ARCEnvironment} environment An environment to update.
   */
  constructor(environment) {
    super(ArcModelEventTypes.Environment.update, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {}
    });
    this[environmentValue] = environment;
  }
}

/**
 * An event dispatched from the store after updating an environment
 */
export class ARCEnvironmentUpdatedEvent extends Event {
  /**
   * @return {ARCEntityChangeRecord} Change record
   */
  get changeRecord() {
    return this[changeRecordValue];
  }

  /**
   * @param {ARCEntityChangeRecord} record Entity change record.
   */
  constructor(record) {
    super(ArcModelEventTypes.Environment.State.update, {
      bubbles: true,
      composed: true,
    });
    this[changeRecordValue] = record;
  }
}

/**
 * An event dispatched to the store to delete an environment and its variables.
 */
export class ARCEnvironmentDeleteEvent extends CustomEvent {
  /**
   * @return {string} The environment id used to initialize the event.
   */
  get id() {
    return this[environmentIdValue];
  }

  /**
   * @param {string} id The environment id
   */
  constructor(id) {
    super(ArcModelEventTypes.Environment.delete, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {}
    });
    this[environmentIdValue] = id;
  }
}

/**
 * An event dispatched by the store after an environment was deleted.
 */
export class ARCEnvironmentDeletedEvent extends ARCEntityDeletedEvent {
  /**
   * @param {string} id The id of the deleted environment
   * @param {string} rev Updated revision
   */
  constructor(id, rev) {
    super(ArcModelEventTypes.Environment.State.delete, id, rev);
  }
}

/**
 * An event to be dispatched to list environments with pagination.
 */
export class ARCEnvironmentListEvent extends ARCEntityListEvent {
  /**
   * @return {boolean|undefined} When set it ignores other list parameters and returns all results in a single query.
   * This also means that the page token is never set.
   */
  get readall() {
    return this[readallValue];
  }

  /**
   * @param {ARCVariablesListOptions=} opts Query options.
   */
  constructor(opts={}) {
    super(ArcModelEventTypes.Environment.list, opts);
    this[readallValue] = opts.readall;
  }
}

/**
 * An event dispatched to the store to update a variable.
 */
export class ARCVariableUpdateEvent extends CustomEvent {
  /**
   * @return {ARCVariable} A variable used to initialize this event.
   */
  get variable() {
    return this[variableValue];
  }

  /**
   * @param {ARCVariable} variable A variable to update.
   */
  constructor(variable) {
    super(ArcModelEventTypes.Variable.update, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {}
    });
    this[variableValue] = variable;
  }
}

/**
 * An event dispatched from the store after updating a variable
 */
export class ARCVariableUpdatedEvent extends Event {
  /**
   * @return {ARCEntityChangeRecord} Change record
   */
  get changeRecord() {
    return this[changeRecordValue];
  }

  /**
   * @param {ARCEntityChangeRecord} record Entity change record.
   */
  constructor(record) {
    super(ArcModelEventTypes.Variable.State.update, {
      bubbles: true,
      composed: true,
    });
    this[changeRecordValue] = record;
  }
}

/**
 * An event dispatched to the store to delete a variable
 */
export class ARCEVariableDeleteEvent extends CustomEvent {
  /**
   * @return {string} The variable id used to initialize the event.
   */
  get id() {
    return this[variableIdValue];
  }

  /**
   * @param {string} id The variable id
   */
  constructor(id) {
    super(ArcModelEventTypes.Variable.delete, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {}
    });
    this[variableIdValue] = id;
  }
}

/**
 * An event dispatched by the store after a variable was deleted.
 */
export class ARCVariableDeletedEvent extends ARCEntityDeletedEvent {
  /**
   * @param {string} id The id of the deleted variable
   * @param {string} rev Updated revision
   */
  constructor(id, rev) {
    super(ArcModelEventTypes.Variable.State.delete, id, rev);
  }
}

/**
 * An event to be dispatched to list variables with pagination.
 */
export class ARCVariableListEvent extends ARCEntityListEvent {
  /**
   * @return {string} The name of the environment used to initialize this event.
   */
  get name() {
    return this[nameValue];
  }

  /**
   * @return {boolean|undefined} When set it ignores other list parameters and returns all results in a single query.
   * This also means that the page token is never set.
   */
  get readall() {
    return this[readallValue];
  }

  /**
   * @param {string} name The name of the environment
   * @param {ARCVariablesListOptions=} opts Query options.
   */
  constructor(name, opts={}) {
    super(ArcModelEventTypes.Variable.list, opts);
    this[nameValue] = name;
    this[readallValue] = opts.readall;
  }
}

/**
 * Dispatches an event handled by the data store to read the environment metadata
 *
 * @param {EventTarget} target A node on which to dispatch the event.
 * @param {string} name The name of the environment
 * @return {Promise<ARCEnvironment>} Promise resolved to an environment model.
 */
export async function readEnvironmentAction(target, name) {
  const e = new ARCEnvironmentReadEvent(name);
  target.dispatchEvent(e);
  return e.detail.result;
}

/**
 * Dispatches an event handled by the data store to update an environment metadata.
 *
 * @param {EventTarget} target A node on which to dispatch the event.
 * @param {ARCEnvironment} item The environment object to update.
 * @return {Promise<ARCEntityChangeRecord>} Promise resolved to the change record
 */
export async function updateEnvironmentAction(target, item) {
  const e = new ARCEnvironmentUpdateEvent(item);
  target.dispatchEvent(e);
  return e.detail.result;
}

/**
 * Dispatches an event handled by the data store to delete an environment and its variables.
 *
 * @param {EventTarget} target A node on which to dispatch the event.
 * @param {string} id The id of the environment to delete.
 * @return {Promise<DeletedEntity>} Promise resolved to the delete record
 */
export async function deleteEnvironmentAction(target, id) {
  const e = new ARCEnvironmentDeleteEvent(id);
  target.dispatchEvent(e);
  return e.detail.result;
}

/**
 * Dispatches an event to list the environments data.
 *
 * @param {EventTarget} target A node on which to dispatch the event.
 * @param {ARCVariablesListOptions=} opts Query options.
 * @return {Promise<ARCModelListResult>} Model query result.
 */
export async function listEnvironmentAction(target, opts) {
  const e = new ARCEnvironmentListEvent(opts);
  target.dispatchEvent(e);
  return e.detail.result;
}

/**
 * Dispatches an event handled by the data store to update a variable metadata.
 *
 * @param {EventTarget} target A node on which to dispatch the event.
 * @param {ARCVariable} item The variable object to update.
 * @return {Promise<ARCEntityChangeRecord>} Promise resolved to the change record
 */
export async function updateVariableAction(target, item) {
  const e = new ARCVariableUpdateEvent(item);
  target.dispatchEvent(e);
  return e.detail.result;
}

/**
 * Dispatches an event handled by the data store to delete a variable.
 *
 * @param {EventTarget} target A node on which to dispatch the event.
 * @param {string} id The id of the variable to delete.
 * @return {Promise<DeletedEntity>} Promise resolved to the delete record
 */
export async function deleteVariableAction(target, id) {
  const e = new ARCEVariableDeleteEvent(id);
  target.dispatchEvent(e);
  return e.detail.result;
}

/**
 * Dispatches an event to list the variables data.
 *
 * @param {EventTarget} target A node on which to dispatch the event.
 * @param {string} name The name of the environment
 * @param {ARCVariablesListOptions=} opts Query options.
 * @return {Promise<ARCModelListResult>} Model query result.
 */
export async function listVariableAction(target, name, opts) {
  const e = new ARCVariableListEvent(name, opts);
  target.dispatchEvent(e);
  return e.detail.result;
}

//
// State events
//

/**
 * Dispatches an event after an environment was updated
 *
 * @param {EventTarget} target A node on which to dispatch the event.
 * @param {ARCEntityChangeRecord} record Change record
 */
export function updatedEnvironmentState(target, record) {
  const e = new ARCEnvironmentUpdatedEvent(record);
  target.dispatchEvent(e);
}

/**
 * Dispatches an event after an environment was deleted
 *
 * @param {EventTarget} target A node on which to dispatch the event.
 * @param {string} id Deleted record id.
 * @param {string} rev Updated revision.
 */
export function deletedEnvironmentState(target, id, rev) {
  const e = new ARCEnvironmentDeletedEvent(id, rev);
  target.dispatchEvent(e);
}

/**
 * Dispatches an event after a variable was updated
 *
 * @param {EventTarget} target A node on which to dispatch the event.
 * @param {ARCEntityChangeRecord} record Change record
 */
export function updatedVariableState(target, record) {
  const e = new ARCVariableUpdatedEvent(record);
  target.dispatchEvent(e);
}

/**
 * Dispatches an event after an variable was deleted
 *
 * @param {EventTarget} target A node on which to dispatch the event.
 * @param {string} id Deleted record id.
 * @param {string} rev Updated revision.
 */
export function deletedVariableState(target, id, rev) {
  const e = new ARCVariableDeletedEvent(id, rev);
  target.dispatchEvent(e);
}
