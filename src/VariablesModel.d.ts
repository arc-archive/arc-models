import { Variable } from '@advanced-rest-client/arc-types';
import {ArcBaseModel} from './ArcBaseModel';
import {
  DeletedEntity,
  ARCEntityChangeRecord,
  ARCModelListOptions,
  ARCModelListResult,
} from './types';

/**
 * Model for variables
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
  updateEnvironment(data: Variable.ARCEnvironment): Promise<ARCEntityChangeRecord<Variable.ARCEnvironment>>;

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
  deleteEnvironment(id: string): Promise<DeletedEntity|null>;

  /**
   * Lists all user defined environments.
   *
   * @param opts Query options.
   * @returns A promise resolved to a list of projects.
   */
  listEnvironments(opts?: ARCModelListOptions): Promise<ARCModelListResult<Variable.ARCEnvironment>>;

  /**
   * Lists all user defined environments.
   *
   * @returns Resolved promise with the list of environments.
   */
  listAllEnvironments(): Promise<ARCModelListResult<Variable.ARCEnvironment>>;

  /**
   * Reads all variables for the `environment`
   *
   * @param environment Name of the environment to get the variables
   * for.
   * @returns Resolved promise with the list of variables for the environment.
   */
  listAllVariables(environment: string): Promise<ARCModelListResult<Variable.ARCVariable>>;

  /**
   * Lists all user defined environments.
   *
   * @param name The name of the environment
   * @param opts Query options.
   * @returns A promise resolved to a list of projects.
   */
  listVariables(name: string, opts?: ARCModelListOptions): Promise<ARCModelListResult<Variable.ARCVariable>>;

  /**
   * Updates a variable entity.
   *
   * @param data An entity to update
   * @returns Promise resolved to the variable change record
   */
  updateVariable(data: Variable.ARCVariable): Promise<ARCEntityChangeRecord<Variable.ARCVariable>>;

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
  deleteVariable(id: string): Promise<DeletedEntity>;

  _attachListeners(node: EventTarget): void;
  _detachListeners(node: EventTarget): void;
}
