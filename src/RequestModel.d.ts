import {RequestBaseModel} from './RequestBaseModel';
import { Project, ArcRequest, Model } from '@advanced-rest-client/events';

export declare const syncProjects: unique symbol;
export declare const readBulkHandler: unique symbol;
export declare const updateHandler: unique symbol;
export declare const updatebulkHandler: unique symbol;
export declare const deleteHandler: unique symbol;
export declare const deleteBulkHandler: unique symbol;
export declare const undeleteBulkHandler: unique symbol;
export declare const storeHandler: unique symbol;
export declare const sortRequestProjectOrder: unique symbol;
export declare const queryStore: unique symbol;
export declare const revertRemoveProject: unique symbol;

/**
 * A model to access request data in Advanced REST Client.
 *
 * Requests are stored as a "history" and "saved" requests. The history
 * request is stored each time a HTTP request in the application is made.
 * The "saved" request is a special type that has additional metadata
 * like name, description, or project ID.
 *
 * This model offers standard CRUD operation on both saved and history stores.
 * Search function requires passing the "type" parameter which is either `saved`
 * or `history` which corresponds to the corresponding request type.
 *
 * ## Querying for data
 *
 * Bother IndexedDB and PouchDB aren't designed for full text queries.
 * This model works with the `UrlIndexer` that is responsible for indexing the data
 * to perform a semi-full search operation. When a `detailed` options is set on the query
 * then it uses slower algorithm but performs full search on the index.
 * When it is not set it only uses filer like query + '*'.
 */
export declare class RequestModel extends RequestBaseModel {

  /**
   * List of fields to index in the history store.
   */
  get historyIndexes(): string[];

  /**
   * List of fields to index in the saved store.
   */
  get savedIndexes(): string[];

  constructor();

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
  get(type: string, id: string, rev?: string, opts?: ArcRequest.ARCRequestRestoreOptions): Promise<ArcRequest.ARCHistoryRequest|ArcRequest.ARCSavedRequest>|null;

  /**
   * The same as `get()` but for a list of requests.
   *
   * @param type Requests type to restore.
   * @param keys Request ids
   * @param opts Additional options. Currently only `restorePayload`
   * is supported
   */
  getBulk(type: string, keys: string[], opts?: ArcRequest.ARCRequestRestoreOptions): Promise<(ArcRequest.ARCHistoryRequest|ArcRequest.ARCSavedRequest)[]>;

  /**
   * Updates / saves the request object in the datastore.
   * This function dispatches `request-object-changed` event.
   *
   * If any of `name`, `method`, `url` or `legacyProject` properties change
   * then the old object is deleted and new is created with new ID.
   *
   * @param type Request type: `saved-requests` or `history-requests`
   * @param request An object to save / update
   * @returns A promise resolved to the change record
   */
  post(type: string, request: ArcRequest.ARCHistoryRequest|ArcRequest.ARCSavedRequest): Promise<Model.ARCEntityChangeRecord<ArcRequest.ARCHistoryRequest|ArcRequest.ARCSavedRequest>>;

  /**
   * Updates more than one request in a bulk.
   *
   * @param type Request type: `saved-requests` or `history-requests`
   * @param requests List of requests to update.
   * @returns List of PouchDB responses to each insert
   */
  postBulk(type: string, requests: (ArcRequest.ARCHistoryRequest|ArcRequest.ARCSavedRequest)[]): Promise<Model.ARCEntityChangeRecord<ArcRequest.ARCHistoryRequest|ArcRequest.ARCSavedRequest>[]>;

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
  delete(type: string, id: string, rev?: string): Promise<Model.DeletedEntity>;

  /**
   * Removes documents in a bulk operation.
   *
   * @param type Database type
   * @param items List of keys to remove
   */
  deleteBulk(type: string, items: string[]): Promise<Model.DeletedEntity[]>;

  /**
   * Removes requests reference from projects in a batch operation
   * @param projectIds List of project ids to update
   * @param requestIds List of requests to remove from projects
   */
  removeRequestsFromProjects(projectIds: string[], requestIds: string[]): Promise<void>;

  /**
   * Removes a request reference from a project.
   * @param} project The project to remove the request from
   * @param requestIds List of requests to remove from project
   * @returns Promise resolved when the operation finishes.
   */
  removeRequestsFromProject(project: Project.ARCProject, requestIds: string[]): Promise<void>;

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
  revertRemove(type: string, items: Model.DeletedEntity[]): Promise<Model.ARCEntityChangeRecord<ArcRequest.ARCHistoryRequest|ArcRequest.ARCSavedRequest>[]>;

  /**
   * Checks for project data in the restored requests and re-inserts the request to the corresponding projects.
   * @param {} result
   */
  [revertRemoveProject](result: Model.ARCEntityChangeRecord<ArcRequest.ARCHistoryRequest|ArcRequest.ARCSavedRequest>[]): Promise<void>;

  /**
   * Performs a query for the request data.
   *
   * This is not the same as searching for a request. This only lists
   * data from the datastore for given query options.
   *
   * @param type Datastore type
   * @param opts Query options.
   * @returns A promise resolved to a query result for requests.
   */
  list(type: string, opts?: Model.ARCModelListOptions): Promise<Model.ARCModelListResult<ArcRequest.ARCHistoryRequest|ArcRequest.ARCSavedRequest>>;

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
  saveRequestProject(request: ArcRequest.ARCSavedRequest|ArcRequest.ARCHistoryRequest, projects?: string[]): Promise<Model.ARCEntityChangeRecord<ArcRequest.ARCHistoryRequest|ArcRequest.ARCSavedRequest>>;

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
  query(q: string, type?: string, detailed?: boolean): Promise<(ArcRequest.ARCHistoryRequest|ArcRequest.ARCSavedRequest)[]>;

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
  queryUrlData(q: string, type: string, detailed: boolean): Promise<(ArcRequest.ARCHistoryRequest|ArcRequest.ARCSavedRequest)[]>;

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
  queryPouchDb(q: string, type?: string, ignore?: string[]): Promise<(ArcRequest.ARCHistoryRequest|ArcRequest.ARCSavedRequest)[]>;

  /**
   * Queries history store using PouchDB quick search plugin (full text search).
   *
   * @param q User query
   * @param ignore List of IDs to ignore.
   * @returns Promise resolved to the list of requests.
   */
  queryHistory(q: string, ignore?: string[]): Promise<(ArcRequest.ARCHistoryRequest|ArcRequest.ARCSavedRequest)[]>;

  /**
   * Queries Saved store using PouchDB quick search plugin (full text search).
   *
   * @param q User query
   * @param ignore List of IDs to ignore.
   * @returns Promise resolved to the list of requests.
   */
  querySaved(q: string, ignore?: string[]): Promise<(ArcRequest.ARCHistoryRequest|ArcRequest.ARCSavedRequest)[]>;

  /**
   * Performs data indexing using PouchDB api.
   * This is not the same as URL indexing using `url-indexer`.
   *
   * @param type Data type - saved or history.
   */
  indexData(type: string): Promise<void>;

  /**
   * Deletes all data of selected type.
   *
   * @param models Database type or list of types.
   * @returns List of promises. Might be empty array.
   */
  deleteDataModel(models: string|string[]): Promise<void>[];

  /**
   * Reads list of requests associated with a project
   *
   * @param id Project id
   * @param opts Additional options. Currently only `restorePayload`
   * is supported
   */
  readProjectRequests(id: string, opts?: ArcRequest.ARCRequestRestoreOptions): Promise<(ArcRequest.ARCHistoryRequest|ArcRequest.ARCSavedRequest)[]>;

  /**
   * Reads requests data related to the project from a legacy system.
   *
   * @param id Project id
   */
  readProjectRequestsLegacy(id: string): Promise<(ArcRequest.ARCHistoryRequest|ArcRequest.ARCSavedRequest)[]>;
}
