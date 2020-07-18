import {
  ARCModelReadEventDetail,
  ARCModelUpdateEventDetail,
  ARCModelDeleteEventDetail,
  ARCEntityDeletedEvent,
  ARCEntityListEvent,
} from './BaseEvents';
import {
  ARCEntityChangeRecord,
  ARCModelListOptions,
  ARCModelListResult,
  DeletedEntity,
} from '../types';
import { ARCVariable, ARCEnvironment } from '../VariablesModel';

export const nameValue: symbol;
export const environmentValue: symbol;
export const environmentIdValue: symbol;
export const variableValue: symbol;
export const variableIdValue: symbol;
export const changeRecordValue: symbol;

export declare interface ARCVariablesListOptions extends ARCModelListOptions {
  /**
   * When set it ignores other list parameters and returns all results in a single query.
   * This also means that the page token is never set.
   * Default to false.
   */
  readall?: boolean;
}

/**
 * An event to be dispatched to read an ARC Environment from the data store.
 */
export class ARCEnvironmentReadEvent extends CustomEvent<ARCModelReadEventDetail<ARCEnvironment>> {
  /**
   * The name of the environment used to initialize this event.
   */
  readonly name: string;

  /**
   * @param name The name of the environment
   */
  constructor(name: string);
}

/**
 * An event dispatched to the store to update an environment.
 */
export class ARCEnvironmentUpdateEvent extends CustomEvent<ARCModelUpdateEventDetail<ARCEnvironment>> {
  /**
   * An environment used to initialize this event.
   */
  readonly environment: ARCEnvironment;

  /**
   * @param environment An environment to update.
   */
  constructor(environment: ARCEnvironment);
}

/**
 * An event dispatched from the store after updating an environment
 */
export class ARCEnvironmentUpdatedEvent extends CustomEvent<ARCEntityChangeRecord<ARCEnvironment>> {
  /**
   * The change record
   */
  readonly changeRecord: ARCEntityChangeRecord<ARCEnvironment>;

  /**
   * @param record Entity change record.
   */
  constructor(record: ARCEntityChangeRecord<ARCEnvironment>);
}

/**
 * An event dispatched to the store to delete an environment and its variables.
 */
export class ARCEnvironmentDeleteEvent extends CustomEvent<ARCModelDeleteEventDetail> {
  /**
   * The environment id used to initialize the event.
   */
  readonly id: string;

  /**
   * @param id The environment id
   */
  constructor(id: string);
}

/**
 * An event dispatched by the store after an environment was deleted.
 */
export class ARCEnvironmentDeletedEvent extends ARCEntityDeletedEvent {
  /**
   * @param id The id of the deleted environment
   * @param rev Updated revision
   */
  constructor(id: string, rev: string);
}

/**
 * An event to be dispatched to list environments with pagination.
 */
export class ARCEnvironmentListEvent extends ARCEntityListEvent<ARCEnvironment> {
  /**
   * When set it ignores other list parameters and returns all results in a single query.
   * This also means that the page token is never set.
   */
  readonly readall?: boolean;
  /**
   * @param {ARCVariablesListOptions=} opts Query options.
   */
  constructor(opts?: ARCVariablesListOptions);
}

/**
 * An event dispatched to the store to update a variable.
 */
export class ARCVariableUpdateEvent extends CustomEvent<ARCModelUpdateEventDetail<ARCVariable>> {
  /**
   * A variable used to initialize this event.
   */
  readonly variable: ARCVariable;

  /**
   * @param variable A variable to update.
   */
  constructor(variable: ARCVariable);
}

/**
 * An event dispatched from the store after updating a variable
 */
export class ARCVariableUpdatedEvent extends CustomEvent<ARCEntityChangeRecord<ARCVariable>> {
  /**
   * The change record
   */
  readonly changeRecord: ARCEntityChangeRecord<ARCVariable>;

  /**
   * @param record Entity change record.
   */
  constructor(record: ARCEntityChangeRecord<ARCVariable>);
}

/**
 * An event dispatched to the store to delete a variable
 */
export class ARCEVariableDeleteEvent extends CustomEvent<ARCModelDeleteEventDetail> {
  /**
   * The variable id used to initialize the event.
   */
  readonly id: string;

  /**
   * @param id The variable id
   */
  constructor(id: string);
}

/**
 * An event dispatched by the store after a variable was deleted.
 */
export class ARCVariableDeletedEvent extends ARCEntityDeletedEvent {
  /**
   * @param id The id of the deleted variable
   * @param rev Updated revision
   */
  constructor(id: string, rev: string);
}

/**
 * An event to be dispatched to list variables with pagination.
 */
export class ARCVariableListEvent extends ARCEntityListEvent<ARCVariable> {
  /**
   * The name of the environment used to initialize this event.
   */
  readonly name: string;
  /**
   * When set it ignores other list parameters and returns all results in a single query.
   * This also means that the page token is never set.
   */
  readonly readall?: boolean;

  /**
   * @param  name The name of the environment
   * @param opts Query options.
   */
  constructor(name: string, opts?: ARCVariablesListOptions);
}

/**
 * Dispatches an event handled by the data store to read the environment metadata
 *
 * @param target A node on which to dispatch the event.
 * @param name The name of the environment
 * @returns Promise resolved to an environment model.
 */
export declare function readEnvironmentAction(target: EventTarget, name: string): Promise<ARCEnvironment>;

/**
 * Dispatches an event handled by the data store to update an environment metadata.
 *
 * @param target A node on which to dispatch the event.
 * @param item The environment object to update.
 * @returns Promise resolved to the change record
 */
export declare function updateEnvironmentAction(target: EventTarget, item: ARCEnvironment): Promise<ARCEntityChangeRecord<ARCEnvironment>>;

/**
 * Dispatches an event handled by the data store to delete an environment and its variables.
 *
 * @param target A node on which to dispatch the event.
 * @param id The id of the environment to delete.
 * @returns Promise resolved to the delete record
 */
export declare function deleteEnvironmentAction(target: EventTarget, id: string): Promise<DeletedEntity>;

/**
 * Dispatches an event to list the environemnts data.
 *
 * @param target A node on which to dispatch the event.
 * @param opts Query options.
 * @returns Model query result.
 */
export declare function listEnvironmentAction(target: EventTarget, opts?: ARCVariablesListOptions): Promise<ARCModelListResult<ARCEnvironment>>;

/**
 * Dispatches an event handled by the data store to update a variable metadata.
 *
 * @param target A node on which to dispatch the event.
 * @param item The variable object to update.
 * @returns Promise resolved to the change record
 */
export declare function updateVariableAction(target: EventTarget, item: ARCVariable): Promise<ARCEntityChangeRecord<ARCVariable>>;

/**
 * Dispatches an event handled by the data store to delete a variable.
 *
 * @param target A node on which to dispatch the event.
 * @param id The id of the variable to delete.
 * @returns Promise resolved to the delete record
 */
export declare function deleteVariableAction(target: EventTarget, id: string): Promise<DeletedEntity>;

/**
 * Dispatches an event to list the variables data.
 *
 * @param target A node on which to dispatch the event.
 * @param name The name of the environment
 * @param opts Query options.
 * @returns Model query result.
 */
export declare function listVariableAction(target: EventTarget, name: string, opts?: ARCVariablesListOptions): Promise<ARCModelListResult<ARCVariable>>;

//
// State events
//

/**
 * Dispatches an event after an environment was updated
 *
 * @param target A node on which to dispatch the event.
 * @param record Change record
 */
export declare function updatedEnvironmentState(target: EventTarget, record: ARCEntityChangeRecord<ARCEnvironment>): void;

/**
 * Dispatches an event after an environment was deleted
 *
 * @param target A node on which to dispatch the event.
 * @param id Deleted record id.
 * @param rev Updated revision.
 */
export declare function deletedEnvironmentState(target: EventTarget, id: string, rev: string): void;

/**
 * Dispatches an event after a variable was updated
 *
 * @param target A node on which to dispatch the event.
 * @param record Change record
 */
export declare function updatedVariableState(target: EventTarget, record: ARCEntityChangeRecord<ARCVariable>): void;

/**
 * Dispatches an event after an variable was deleted
 *
 * @param target A node on which to dispatch the event.
 * @param id Deleted record id.
 * @param rev Updated revision.
 */
export declare function deletedVariableState(target: EventTarget, id: string, rev: string): void;
