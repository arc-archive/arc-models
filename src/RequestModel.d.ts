import {RequestBaseModel} from './RequestBaseModel';
import {ARCSavedRequest, ARCHistoryRequest, SaveARCRequestOptions, ARCRequestRestoreOptions} from './RequestTypes';
import {Entity} from './types';

/**
 * Event based access to saved and history request datastore.
 *
 * This model creates and updates updates request objects and updates
 * URL index associated with the request.
 * It also supports querying for request data, deleting request data and
 * undeleting it.
 *
 * ## Events API
 *
 * All events must be marked as cancelable or will be ignore by the model.
 * In ARC ecosystem models dispatch the same event after the object is updated
 * (deleted, created, updated) but the event is not cancelable.
 * Components should only react on non cancelable model events as it means
 * that the change has been commited to the datastore.
 *
 * Each handled event is canceled so it's safe to put more than one model in
 * the DOM. Event's detail object will get `result` property with the promise
 * resolved when operation commits.
 *
 * **save-request**
 * This event should be used when dealing with unprocessed request data.
 * Request object may contain Blob or FormData as a payload which would be lost
 * if trying to store it in the data store. This flow handles payload
 * transformation.
 *
 * Detail's parameteres:
 * - request - Required, ArcRequest object
 * - projects - Optional, Array of strings, List of project names to create
 * with this request and associate with the request object.
 * - options - Optional, map of additional options. Currently only `isDrive` is
 * supported. When set `google-drive-data-save` is dispatched. If the event is not
 * handled by the application the save flow fails.
 *
 * ```javascript
 * const e = new CustomEvent('save-request', {
 *  bubbles: true,
 *  composed: true,
 *  cancelable: true,
 *  detail: {
 *    request: {...}
 *    projects: ['Test project'],
 *    options: {
 *      isDrive: true
 *    }
 *  }
 * };
 * this.dispatchEvent(e);
 * ```
 *
 * **request-object-read**
 *
 * Reads the request from the data store.
 *
 * Detail's parameteres:
 *
 * - `id` - Required, String. Request ID
 * - `type` - Required, String. Either `history` or `saved`
 * - `rev` - Optional, String. Specific revision to read
 *
 * **request-object-changed**
 *
 * Should be only used if the payload is not `Blob` or `FormData` and
 * all request properties are set. By default `save-request` event should be
 * used.
 *
 * Detail's parameteres: ArcRequest object.
 * https://github.com/advanced-rest-client/api-components-api/blob/master/docs/
 * arc-models.md#arcrequest
 *
 * **request-object-deleted**
 *
 * Deletes the object from the data store.
 *
 * Detail's parameteres:
 *
 * - `id` - Required, String. Request ID
 * - `type` - Required, String. Either `history` or `saved`
 *
 * **request-objects-deleted**
 *
 * Deletes number of requests in bulk.
 *
 * Detail's parameteres:
 *
 * - `type` - Required, String. Either `history` or `saved`
 * - `items` - Required, Array<String>. List of request IDs to delete.
 *
 * **request-objects-undeleted**
 *
 * Used to restore deleted request data.
 *
 * Detail's parameteres:
 *
 * - `type` - Required, String. Either `history` or `saved`
 * - `items` - Required, Array<Object>. List of requests to restore.
 * Each object must contain `_rev` and `_id`.
 *
 * The `result` property contains result of calling `revertRemove()` function.
 *
 * **request-query**
 *
 * Queries for request data. This flow searches for URL data in a separate index
 * and then performs full text search on the request data store.
 *
 * Detail's parameteres:
 *
 * - `q` - Required, String. User query.
 * - `type` - Optional, String. Either `history` or `saved`. By default it
 * searches in both data stores.
 * - `detailed` - Optional, Boolean. If set it uses slower algorithm but performs full
 * search on the index. When false it only uses filer like query + '*'.
 */
export declare class RequestModel extends RequestBaseModel {

  /**
   * List of fields to index in the history store.
   */
  readonly historyIndexes: string[];

  /**
   * List of fields to index in the saved store.
   */
  readonly savedIndexes: string[];

  constructor();

  /**
   * Adds event listeners.
   */
  _attachListeners(node: EventTarget): void;

  /**
   * Removes event listeners.
   */
  _detachListeners(node: EventTarget): void;

  /**
   * A handler for `save-request-data` custom event. It's special event to
   * save / update request data dispatched by the request editor.
   */
  _saveRequestHandler(e: CustomEvent): void;

  /**
   * Saves requests with project data.
   * This is actual implementation of `save-request` events.
   *
   * @param request Request object to store.
   * @param projects List of project names to create with this request
   * and attach it to the request object.
   * @param options Save request options. Currently only `isDrive`
   * is supported
   * @returns A promise resolved to updated request object
   */
  saveRequestProject(request: ARCSavedRequest|ARCHistoryRequest, projects?: string[], options?: SaveARCRequestOptions): Promise<ARCSavedRequest>;

  /**
   * Create projects from project names.
   * It is used when creating a request with a new project.
   *
   * @param names Names of projects
   * @param requestId Request ID to add to the projects.
   * @returns Promise resolved to list of project IDs
   */
  createRequestProjects(names: string[], requestId?: string): Promise<string[]>;

  /**
   * Handler for `save-history` object. It computes payload to savable state
   * and saves history object.
   * Note, the ID is is a combination of today's midningt timestamp, url and
   * method. If such ID already exists the object is updated.
   */
  _saveHistoryHandler(e: CustomEvent): void;

  /**
   * Stores a history obvject in the data store, taking care of `_rev`
   * property read.
   *
   * @param request The request object to store
   * @returns A promise resolved to the updated request object.
   */
  saveHistory(request: ARCHistoryRequest): Promise<ARCHistoryRequest>;

  /**
   * Saves a request into a data store.
   * It handles payload to string conversion, handles types, and syncs request
   * with projects. Use `update()` method only if you are storing already
   * prepared request object to the store.
   *
   * @param request ArcRequest object
   * @param opts Save request object. Currently only `isDrive`
   * is supported
   * @returns A promise resilved to updated request object.
   */
  saveRequest<T extends ARCHistoryRequest|ARCSavedRequest>(request: T, opts?: SaveARCRequestOptions): Promise<T>;

  /**
   * Synchronizes project requests to ensure each project contains this
   * `requestId` on their list of requests.
   *
   * @param requestId Request ID
   * @param projects List of request projects.
   */
  _syncProjects(requestId: string, projects?: string[]): Promise<void>;

  /**
   * Normalizes request object to whatever the app is currently using.
   */
  normalizeRequest(request: ARCSavedRequest): ARCSavedRequest;

  /**
   * Reads an entry from the datastore.
   *
   * @param type Request type: `saved-requests` or `history-requests`
   * @param id The ID of the datastore entry.
   * @param rev Specific revision to read. Defaults to
   * latest revision.
   * @param opts Restoration options.
   * @returns Promise resolved to a request object.
   */
  read(type: string, id: string, rev?: string, opts?: ARCRequestRestoreOptions): Promise<ARCHistoryRequest|ARCSavedRequest>|null;

  /**
   * The same as `read()` but for a list of requests.
   *
   * @param type Requests type to restore.
   * @param keys Request ids
   * @param opts Additional options. Currently only `restorePayload`
   * is supported
   */
  readBulk(type: string, keys: string[], opts?: ARCRequestRestoreOptions): Promise<ARCHistoryRequest[]|ARCSavedRequest[]>;

  /**
   * Updates / saves the request object in the datastore.
   * This function dispatches `request-object-changed` event.
   *
   * If any of `name`, `method`, `url` or `legacyProject` properties change
   * then the old object is deleted and new is created with new ID.
   *
   * @param type Request type: `saved-requests` or `history-requests`
   * @param request An object to save / update
   * @returns Resolved promise to request object with updated `_rev`
   */
  update(type: string, request: object|null): Promise<any>|null;

  /**
   * Updates more than one request in a bulk.
   *
   * @param type Request type: `saved-requests` or `history-requests`
   * @param requests List of requests to update.
   * @returns List of PouchDB responses to each insert
   */
  updateBulk(type: string, requests: (ARCHistoryRequest|ARCSavedRequest)[]): Promise<(PouchDB.Core.Response|PouchDB.Core.Error)[]>;

  /**
   * Removed an object from the datastore.
   * This function fires `request-object-deleted` event.
   *
   * @param type Request type: `saved-requests` or `history-requests`
   * @param id The ID of the datastore entry.
   * @param rev Specific revision to read. Defaults to
   * latest revision.
   * @returns Promise resolved to a new `_rev` property of deleted
   * object.
   */
  delete(type: string, id: string, rev?: string): Promise<string>;

  /**
   * Reverts deleted items.
   * This function fires `request-object-changed` event for each restored
   * request.
   *
   * @param type Request type: `saved-requests` or `history-requests`
   * @param items List of request objects. Required properties are
   * `_id` and `_rev`.
   * @returns Resolved promise with restored objects. Objects have
   * updated `_rev` property.
   */
  revertRemove(type: String|null, items: Entity[]): Promise<(ARCHistoryRequest|ARCSavedRequest)[]>;

  /**
   * Finds last not deleted revision of a document.
   *
   * @param db PouchDB instance
   * @param items List of documents to process
   * @returns Last not deleted version of each document.
   */
  _findNotDeleted(db: PouchDB.Database, items: Entity[]): Promise<(ARCHistoryRequest|ARCSavedRequest)[]>;

  /**
   * Finds a next revision after the `deletedRevision` in the revisions history
   * which is the one that reverts any changes made after it.
   *
   * @param revs PouchDB revision history object
   * @param deletedRevision Revision of deleted object (after delete).
   * @returns Revision ID of the object before a change registered in
   * `deletedRevision`
   */
  _findUndeletedRevision(revs: object, deletedRevision: string): string|null;

  /**
   * Handler for request read event request.
   */
  _handleRead(e: CustomEvent): void;

  /**
   * Handles onject save / update
   */
  _handleObjectSave(e: CustomEvent): void;
  _saveObjectHanlder(type: string, request: ARCHistoryRequest|ARCSavedRequest): any;

  /**
   * Handler for `request-objects-changed` event. Updates requests in bulk operation.
   */
  _handleObjectsSave(e: CustomEvent): void;

  /**
   * Deletes the object from the datastore.
   */
  _handleObjectDelete(e: CustomEvent): void;

  /**
   * Queries for a list of projects.
   */
  _handleObjectsDelete(e: CustomEvent): void;

  /**
   * Removes documents in a bulk operation.
   *
   * @param type Database type
   * @param items List of keys to remove
   */
  bulkDelete(type: string, items: string[]): Promise<object>;

  /**
   * handlers `request-objects-undeleted` event to restore deleted items
   */
  _handleUndelete(e: CustomEvent|null): void;

  /**
   * Filters query results to return only successfuly read data.
   *
   * @param result PouchDB query result
   * @returns List of request that has been read.
   */
  _filterExistingItems(result: PouchDB.Core.AllDocsResponse<any>): object[];

  /**
   * Finds a `_rev` for a doc.
   *
   * @param docs List of PouchDB documents to search for `_rev`
   * @param id Document ID
   * @returns Associated `_rev`
   */
  _findOldRef(docs: object[], id: string): string;

  /**
   * Saves the request on Google Drive.
   * It dispatches `google-drive-data-save` event to call a component responsible
   * for saving the request on Google Drive.
   *
   * This do nothing if `opts.drive is not set.`
   *
   * @param data Data to save
   * @param opts Save request options. See `saveRequest` for more info.
   * @returns Resolved promise to updated object.
   */
  _saveGoogleDrive(data: ARCHistoryRequest|ARCSavedRequest, opts: SaveARCRequestOptions): Promise<ARCHistoryRequest|ARCSavedRequest>;

  /**
   * Handler for `request-list` custom event.
   * The `result` property will contain a result of calling `list()` function.
   *
   * The event has to be cancelable and not already cancelled in order to handle
   * it.
   *
   * Required properties on `detail` object:
   * - `type` {String} Datastore type
   * - `queryOptions` {Object} PouchDB query options.
   */
  _handleList(e: CustomEvent): void;

  /**
   * Performs a query for the request data.
   *
   * This is not the same as searching for a request. This only lists
   * data from the datastore for given query options.
   *
   * @param type Datastore type
   * @param queryOptions PouchDB query options.
   * @returns List of PouchDB documents for the query.
   */
  list(type: string, queryOptions: PouchDB.Core.AllDocsOptions): Promise<any>|null;

  /**
   * A handler for the `request-query` custom event. Queries the datastore for
   * request data.
   * The event must have `q` property set on the detail object.
   */
  _handleQuery(e: CustomEvent): void;

  /**
   * Queries both URL and PouchDb data.
   *
   * It calls, in order, `queryUrlData()` and `queryPouchDb()` functions.
   *
   * @param q User query
   * @param type Optional, type of the requests to search for.
   * By default it returns all data.
   * @param detailed If set it uses slower algorithm but performs full
   * search on the index. When false it only uses filer like query + '*'.
   * @returns Promise resolved to the list of requests.
   */
  query(q: string, type: string, detailed: boolean): Promise<(ARCHistoryRequest|ARCSavedRequest)[]>;

  /**
   * Performs a query on the URL index data.
   *
   * @param q User query
   * @param type Optional, type of the requests to search for.
   * By default it returns all data.
   * @param detailed If set it uses slower algorithm but performs full
   * search on the index. When false it only uses filer like query + '*'.
   * @returns Promise resolved to the list of requests.
   */
  queryUrlData(q: String|null, type: String|null, detailed: Boolean|null): Promise<Array<object|null>|null>;

  /**
   * Performs a query on the request and/or history data store.
   * It uses PouchDB `query` function on built indexes.
   * Note, it does not query for URL data.
   *
   * @param q User query
   * @param type Optional, type of the requests to search for.
   * By default it returns all data for both history and saved.
   * @param ignore List of IDs to ignore.
   * @returns Promise resolved to the list of requests.
   */
  queryPouchDb(q: string, type?: string, ignore?: string[]): Promise<(ARCHistoryRequest|ARCSavedRequest)[]>;

  /**
   * Queries history store using PouchDB quick search plugin (full text search).
   *
   * @param q User query
   * @param ignore List of IDs to ignore.
   * @returns Promise resolved to the list of requests.
   */
  queryHistory(q: string, ignore?: string[]): Promise<(ARCHistoryRequest|ARCSavedRequest)[]>;

  /**
   * Queries Saved store using PouchDB quick search plugin (full text search).
   *
   * @param q User query
   * @param ignore List of IDs to ignore.
   * @returns Promise resolved to the list of requests.
   */
  querySaved(q: string, ignore?: string[]): Promise<(ARCHistoryRequest|ARCSavedRequest)[]>;

  /**
   * See `query()` function for description.
   *
   * @param q User query
   * @param ignore List of IDs to ignore.
   * @param db A handler to the data store.
   * @param indexes List of fields to query
   * @returns A promise resolved to list of PouchDB docs.
   */
  _queryStore(q: string, ignore: string[], db: PouchDB.Database, indexes: string[]): Promise<(ARCHistoryRequest|ARCSavedRequest)[]>;

  /**
   * Performs data inding using PouchDB api.
   * This is not the same as URL indexing using `url-indexer`.
   *
   * @param type Data type - saved or history.
   */
  indexData(type: string): Promise<void>;

  /**
   * Handler for `request-project-list` event to query for list of requests in
   * a project.
   */
  _listProjectRequestsHandler(e: CustomEvent): void;

  /**
   * Reads list of requests associated with a project
   *
   * @param id Project id
   * @param opts Additional options. Currently only `restorePayload`
   * is supported
   */
  readProjectRequests(id: string, opts?: ARCRequestRestoreOptions): Promise<(ARCHistoryRequest|ARCSavedRequest)[]>;

  /**
   * Reads requests data related to the project from a legacy system.
   *
   * @param id Project id
   */
  readProjectRequestsLegacy(id: string): Promise<(ARCHistoryRequest|ARCSavedRequest)[]>;


  /**
   * Sorts requests list by `projectOrder` property
   */
  sortRequestProjectOrder(a: ARCHistoryRequest|ARCSavedRequest, b: ARCHistoryRequest|ARCSavedRequest): number;

  /**
   * Handler for `destroy-model` custom event.
   * Deletes saved or history data when scheduled for deletion.
   */
  _deleteModelHandler(e: CustomEvent): void;

  /**
   * Deletes all data of selected type.
   *
   * @param models Database type or list of types.
   * @returns List of promises. Might be empty array.
   */
  deleteDataModel(models: string|string[]): Promise<void>[];
}
