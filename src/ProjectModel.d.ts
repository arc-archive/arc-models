import { RequestBaseModel } from './RequestBaseModel.js';
import { ARCProject } from './RequestTypes';

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
export declare class ProjectModel extends RequestBaseModel {
  constructor();
  _attachListeners(node: EventTarget): void;
  _detachListeners(node: EventTarget): void;

  /**
   * Handler for project read event request.
   */
  _handleRead(e: CustomEvent): void;

  /**
   * Handler for `project-update-bulk` custom event.
   */
  _createBulkHandler(e: CustomEvent): void;

  /**
   * Normalizes projects list to common model.
   * It updates `updated` property to current time.
   * If an item is not an object then it is removed.
   *
   * @param projects List of projects.
   */
  _normalizeProjects(projects: ARCProject[]): ARCProject[];

  /**
   * Updates more than one project in a bulk request.
   *
   * @param projects List of requests to update.
   */
  updateBulk(projects: ARCProject[]): Promise<ARCProject[]>;

  /**
   * Processes datastore response after calling `updateBulk()` function.
   *
   * @param projects List of requests to update.
   * @param response PouchDB response
   * @returns List of projects with updated `_id` and `_rew`
   */
  _processUpdateBulkResponse(projects: ARCProject[], response: Array<PouchDB.Core.Response|PouchDB.Core.Error>): ARCProject[];

  /**
   * Lists all project objects.
   *
   * @param ids Optional, list of project IDs to limit the
   * response to specific projects
   * @returns A promise resolved to a list of projects.
   */
  listProjects(ids?: string[]): Promise<ARCProject[]>;

  /**
   * Handles object save / update
   */
  _handleObjectSave(e: CustomEvent): void;

  /**
   * Updates project object taking care of `_rew` value read if missing.
   *
   * @param project Project object to update.
   */
  saveProject(project: ARCProject): Promise<ARCProject>;

  /**
   * Deletes the object from the datastore.
   */
  _handleObjectDelete(e: CustomEvent): void;

  /**
   * Queries for a list of projects.
   */
  _queryHandler(e: CustomEvent): void;
}
