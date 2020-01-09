/**
 * DO NOT EDIT
 *
 * This file was automatically generated by
 *   https://github.com/Polymer/tools/tree/master/packages/gen-typescript-declarations
 *
 * To modify these typings, edit the source file(s):
 *   src/VariablesModel.js
 */


// tslint:disable:variable-name Describing an API that's defined elsewhere.
// tslint:disable:no-any describes the API as best we are able today

import {ArcBaseModel} from './ArcBaseModel.js';

export {VariablesModel};

declare namespace LogicElements {

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
  class VariablesModel extends ArcBaseModel {

    /**
     * Handler to the environments database.
     */
    readonly environmentDb: object|null;

    /**
     * Handler to the variables database.
     */
    readonly variableDb: object|null;

    /**
     * @param dbname Name of the data store
     * @param revsLimit Limit number of revisions on the data store.
     */
    constructor(dbname: String|null, revsLimit: Number|null);
    _attachListeners(node: any): void;
    _detachListeners(node: any): void;

    /**
     * Handler for `destroy-model` custom event.
     * Deletes saved or history data when scheduled for deletion.
     */
    _deleteModelHandler(e: CustomEvent|null): void;

    /**
     * Handler for `environment-read` custom event.
     * Reads environment onject info by it's name.
     */
    _envReadHandler(e: CustomEvent|null): void;

    /**
     * A handler for the `environment-updated` custom event.
     * Updates the environment in the data store.
     *
     * The `environment-updated` custom event should be cancellable or the event
     * won't be handled at all.
     */
    _envUpdateHandler(e: CustomEvent|null): void;

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
    updateEnvironment(data: object|null): Promise<any>|null;

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
    _envDeleteHandler(e: CustomEvent|null): void;

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
     * @param id The PouchDB `_id` property of the object to delete.
     */
    deleteEnvironment(id: object|null): Promise<any>|null;

    /**
     * To be called after the environment has been deleted. It clears variables
     * for the environment.
     *
     * @param environment The environment name.
     */
    _deleteEnvironmentVariables(environment: String|null): Promise<any>|null;

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
    _envListHandler(e: CustomEvent|null): void;

    /**
     * Lists all user defined environments.
     *
     * @returns Resolved promise with the list of environments.
     */
    listEnvironments(): Promise<any>|null;

    /**
     * A handler for the `variable-list` custom event.
     *
     * Adds a `value` propety of the event `detail` object with the array of the
     * variables restored for current environment. Each item is a PouchDb data
     * store item (with `_id` and `_rev`).
     */
    _varListHandler(e: CustomEvent|null): void;

    /**
     * Refreshes list of variables for the `environment`.
     *
     * @param environment Name of the environment to get the variables
     * from. If not set then `default` fill be used.
     * @returns Resolved promise with the list of variables for the
     * environment.
     */
    listVariables(environment: String|null): Promise<any>|null;

    /**
     * A handler for the `variable-updated` custom event.
     * Updates the variable in the data store.
     *
     * The `variable-updated` custom event should be cancellable or the event
     * won't be handled at all.
     */
    _varUpdateHandler(e: CustomEvent|null): void;

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
    updateVariable(data: object|null): Promise<any>|null;

    /**
     * Deletes a variable from the data store.
     *
     * @param e Optional. If it is called from the event handler, this
     * is the event object. If initial validation fails then it will set `error`
     * property on the `detail` object.
     */
    _varDeleteHandler(e: Event|null): void;

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
    deleteVariable(id: object|null): Promise<any>|null;
    _delVariablesModel(): any;
    _delEnvironmentsModel(): any;
  }
}
