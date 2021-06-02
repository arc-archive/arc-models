import { Variable, Model } from '@advanced-rest-client/arc-types';
import { ARCEnvironmentCurrentEvent, ARCEnvironmentSelectEvent, EnvironmentStateDetail } from '@advanced-rest-client/arc-events';
import {ArcBaseModel} from './ArcBaseModel';

export declare const envReadHandler: unique symbol;
export declare const envUpdateHandler: unique symbol;
export declare const envDeleteHandler: unique symbol;
export declare const envListHandler: unique symbol;
export declare const varUpdateHandler: unique symbol;
export declare const varDeleteHandler: unique symbol;
export declare const varListHandler: unique symbol;
export declare const updateEnvironmentName: unique symbol;
export declare const deleteEnvironmentVariables: unique symbol;
export declare const deleteEnvironmentsModel: unique symbol;
export declare const deleteVariablesModel: unique symbol;
export declare const currentValue: unique symbol;
export declare const environmentChangeHandler: unique symbol;
export declare const environmentCurrentHandler: unique symbol;
export declare const selectEnvironment: unique symbol;

/**
 * Model for variables
 */
export declare class VariablesModel extends ArcBaseModel {

  /**
   * Handler to the environments database.
   */
  get environmentDb(): PouchDB.Database;
  
  /**
   * Handler to the variables database.
   */
  get variableDb(): PouchDB.Database;

  /**
   * The id of the currently selected environment or null when the default is selected.
   */
  currentEnvironment: string;

  /**
   * The list of system variables.
   */
  systemVariables?: Variable.SystemVariables;

  constructor();

  /**
   * Reads environment from the data store by its id.
   */
  getEnvironment(id: string): Promise<Variable.ARCEnvironment>;

  /**
   * Reads the environment meta data.
   *
   * @param environment Environment name to read
   */
  readEnvironment(environment: string): Promise<Variable.ARCEnvironment|undefined>;

  /**
   * Updates the environment entity.
   *
   * @param data Entity to store
   */
  updateEnvironment(data: Variable.ARCEnvironment): Promise<Model.ARCEntityChangeRecord<Variable.ARCEnvironment>>;

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
   * @param id The id of the entity to delete
   * @returns Null when the document cannot be found
   */
  deleteEnvironment(id: string): Promise<Model.DeletedEntity|null>;

  /**
   * Lists all user defined environments.
   *
   * @param opts Query options.
   * @returns A promise resolved to a list of projects.
   */
  listEnvironments(opts?: Model.ARCModelListOptions): Promise<Model.ARCModelListResult<Variable.ARCEnvironment>>;

  /**
   * Lists all user defined environments.
   *
   * @returns Resolved promise with the list of environments.
   */
  listAllEnvironments(): Promise<Model.ARCModelListResult<Variable.ARCEnvironment>>;

  /**
   * Reads all variables for the `environment`
   *
   * @param environment Name of the environment to get the variables
   * for.
   * @returns Resolved promise with the list of variables for the environment.
   */
  listAllVariables(environment: string): Promise<Model.ARCModelListResult<Variable.ARCVariable>>;

  /**
   * Lists all user defined environments.
   *
   * @param name The name of the environment
   * @param opts Query options.
   * @returns A promise resolved to a list of projects.
   */
  listVariables(name: string, opts?: Model.ARCModelListOptions): Promise<Model.ARCModelListResult<Variable.ARCVariable>>;

  /**
   * Updates a variable entity.
   *
   * @param data An entity to update
   * @returns Promise resolved to the variable change record
   */
  updateVariable(data: Variable.ARCVariable): Promise<Model.ARCEntityChangeRecord<Variable.ARCVariable>>;

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
  deleteVariable(id: string): Promise<Model.DeletedEntity>;

  /**
   * Reads the current environment and it's variables.
   * @returns The environment state object.
   */
  readCurrent(): Promise<EnvironmentStateDetail>;

  /**
   * Sets a variable for the current environment.
   * If the variable already exist then its value is updated. Otherwise a new variable is added.
   * 
   * @param name The name of the variable. Case sensitive.
   * @param value The value to set on the variable.
   * @returns Promise resolved to the promise id, whether 
   */
  setVariable(name: string, value: string): Promise<Model.ARCEntityChangeRecord<Variable.ARCVariable>>;

  /**
   * A handler for the `currentEnvironment` property change.
   * Reads the current state and informs the components about the change.
   */
  [selectEnvironment](): Promise<void>;

  _attachListeners(node: EventTarget): void;
  _detachListeners(node: EventTarget): void;

  /**
   * A handler for the environment change event
   */
  [environmentChangeHandler](e: ARCEnvironmentSelectEvent): void;

  /**
   * A handler for the current environment read event
   */
  [environmentCurrentHandler](e: ARCEnvironmentCurrentEvent): void;
}
