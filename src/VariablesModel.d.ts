import {ArcBaseModel} from './ArcBaseModel';
import { Entity } from './types';

export declare interface ARCEnvironment extends Entity {
  name: string;
  created?: number|Date;
}

export declare interface ARCVariable extends Entity {
  /**
   * The name of the environment the variable is added to.
   */
  environment: string;
  /**
   * The name of the variable
   */
  variable: string;
  /**
   * The value of the variable
   */
  value: string;
  /**
   * Whether the variable is enabled.
   */
  enabled: boolean;
}

export declare interface DeleteEnvironmentResult {
  /** id of the targeted document */
  id: string;
  /** resulting revision of the targeted document */
  rev: string;
}

export declare interface DeleteVariableResult {
  /** id of the targeted document */
  id: string;
  /** resulting revision of the targeted document */
  rev: string;
}

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
export declare class VariablesModel extends ArcBaseModel {

  /**
   * Handler to the environments database.
   */
  readonly environmentDb: PouchDB.Database;

  /**
   * Handler to the variables database.
   */
  readonly variableDb: PouchDB.Database;

  constructor();

  _attachListeners(node: EventTarget): void;
  _detachListeners(node: EventTarget): void;


  /**
   * Handler for `environment-read` custom event.
   * Reads environment onject info by it's name.
   */
  _envReadHandler(e: CustomEvent): void;

  /**
   * Reads the environment data.
   * @param environment Environment name to read
   */
  readEnvironment(environment: string): Promise<ARCEnvironment>;

  /**
   * A handler for the `environment-updated` custom event.
   * Updates the environment in the data store.
   *
   * The `environment-updated` custom event should be cancellable or the event
   * won't be handled at all.
   */
  _envUpdateHandler(e: CustomEvent): void;

  /**
   * Updates environment value.
   *
   * If the `value` doesn't contains the `_id` property a new environment is
   * created. The `_rev` property is always updated to the latest value.
   *
   * @param data A PouchDB object to be stored. It should contain the
   * `_id` property if the object is about to be updated. If the `_id` doesn't
   * exists a new object is created.
   */
  updateEnvironment(data: ARCEnvironment): Promise<ARCEnvironment>;

  /**
   * A special case when the name of the environment changes.
   * It updates any related to this environment variables.
   *
   * If this is current environment it also changes its name.
   *
   * @param oldName Name of the environment befoe the change
   * @param data Updated data store entry
   */
  _updateEnvironmentName(oldName: string, data: ARCEnvironment): Promise<void>;

  /**
   * A handler for the `environment-deleted` custom event.
   * Deletes a variable in the data store.
   *
   * The `environment-deleted` custom event should be cancellable or the event
   * won't be handled at all.
   *
   * The delete function fires non cancellable `environment-deleted` custom
   * event so the UI components can use it to update their values.
   */
  _envDeleteHandler(e: CustomEvent): void;

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
   * @param id The `_id` of the object to delete.
   */
   deleteEnvironment(id: string): Promise<DeleteEnvironmentResult>;

  /**
   * To be called after the environment has been deleted. It clears variables
   * for the environment.
   *
   * @param environment The environment name.
   */
  _deleteEnvironmentVariables(environment: string): Promise<void>;

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
   */
  _envListHandler(e: CustomEvent): void;

  /**
   * Lists all user defined environments.
   *
   * @returns Resolved promise with the list of environments.
   */
  listEnvironments(): Promise<ARCEnvironment[]>;

  /**
   * A handler for the `variable-list` custom event.
   *
   * Adds a `value` propety of the event `detail` object with the array of the
   * variables restored for current environment. Each item is a PouchDb data
   * store item (with `_id` and `_rev`).
   */
  _varListHandler(e: CustomEvent): void;

  /**
   * Refreshes list of variables for the `environment`.
   *
   * @param environment Name of the environment to get the variables
   * from.
   * @returns Resolved promise with the list of variables for the
   * environment.
   */
  listVariables(environment: string): Promise<ARCVariable[]>;

  /**
   * A handler for the `variable-updated` custom event.
   * Updates the variable in the data store.
   *
   * The `variable-updated` custom event should be cancellable or the event
   * won't be handled at all.
   */
  _varUpdateHandler(e: CustomEvent): void;

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
   * @param data A PouchDB object to be stored. It should contain the
   * `_id` property if the object is about to be updated. If the `_id` doesn't
   * exists a new object is created.
   */
  updateVariable(data: ARCVariable): Promise<ARCVariable>;

  /**
   * Deletes a variable from the data store.
   *
   * @param e Optional. If it is called from the event handler, this
   * is the event object. If initial validation fails then it will set `error`
   * property on the `detail` object.
   */
  _varDeleteHandler(e: CustomEvent): void;

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
   * @param id The PouchDB `_id` property of the object to delete.
   */
  deleteVariable(id: string): Promise<DeleteVariableResult>;

  /**
   * Handler for `destroy-model` custom event.
   * Deletes saved or history data when scheduled for deletion.
   */
  _deleteModelHandler(e: CustomEvent): void;
  _delVariablesModel(): Promise<void>;
  _delEnvironmentsModel(): Promise<void>;
}
