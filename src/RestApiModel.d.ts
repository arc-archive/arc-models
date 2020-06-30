import { ArcBaseModel } from './ArcBaseModel.js';
import { Entity } from './types';

export declare interface ARCRestApiIndex extends Entity {
  /**
   * API title
   */
  title: string;
  /**
   * API media type
   */
  type: string;
  /**
   * API order on the list
   */
  order: number;
  /**
   * List of version names stored with this API.
   */
  versions: string[];
  /**
   * The latest added version name.
   */
  latest: string;
}

export declare interface ARCRestApi extends Entity {
  /**
   * The ID of the index item that this entry refers to.
   */
  indexId: string;
  /**
   * Version name of the API
   */
  version: string;
  /**
   * API data model. It is the output of the AMF parser run on the API.
   */
  data: string;
  /**
   * The AMF parser version used to parse this document.
   */
  amfVersion?: string;
}

export declare interface UpdateApiIndexResult {
  /**
   * Previous revision id
   */
  oldRev: string;
  /**
   * API index object
   */
  apiInfo: ARCRestApi;
}

export declare interface ApiIndexQueryOptions {
  /**
   * Received from previous query page token.
   */
  nextPageToken?: string;
}

export declare interface ApiIndexQueryResult {
  /**
   * Received from previous query page token.
   */
  nextPageToken?: string;
  /**
   * API index items
   */
  items: ARCRestApiIndex[];
}

/**
 * Events based access to REST APIs datastore.
 */
export declare class RestApiModel extends ArcBaseModel {

  /**
   * A handler to the datastore. Contains listing data.
   *
   */
  readonly indexDb: PouchDB.Database;

  /**
   * A handler to the datastore containing REST API data
   * (AMF model).
   *
   */
  readonly dataDb: PouchDB.Database;

  _cachedQueryOptions: object;

  constructor();
  _attachListeners(node: EventTarget): void;
  _detachListeners(node: EventTarget): void;



  /**
   * Reads an entry from the index datastore.
   *
   * @param id The ID of the datastore entry.
   * @param rev Specific revision to read. Defaults to latest revision.
   * @returns Promise resolved to a project object.
   */
  readIndex(id: string, rev?: string): Promise<ARCRestApiIndex>;

  /**
   * Reads an entry from the raml data datastore.
   *
   * @param id The ID of the datastore entry.
   * @param rev Specific revision to read. Defaults to latest revision.
   * @returns Promise resolved to a project object.
   */
  readData(id: string, rev?: string): Promise<ARCRestApi>;

  /**
   * Creates / updates API data object.
   *
   * @param indexId Id of the index object
   * @param version Version of the API data
   * @param data AMF model to store
   * @returns Resolved promise to a document with updated `_rev`
   */
  updateData(indexId: string, version: string, data: object): Promise<ARCRestApi>;

  /**
   * Creates / updates API index object.
   * The `_id` property must be already set on the object.
   *
   * This function fires `api-index-changed` custom event on success.
   *
   * @param doc PouchDB document.
   * @returns Resolved promise to a document with updated `_rev`
   */
  updateIndex(doc: ARCRestApiIndex): Promise<ARCRestApiIndex>;

  /**
   * Updates many index objects in one request.
   *
   * @param docs List of PouchDB documents to update.
   * @returns Resolved promise to a list of document with updated `_rev`
   */
  updateIndexBatch(docs: ARCRestApiIndex[]): Promise<ARCRestApiIndex[]>;

  /**
   * Removes all AMF and index data from datastores for given index id.
   *
   * @param id Index entry ID to delete.
   * @returns Promise resolved to a new `_rev` property of deleted object.
   */
  delete(id: string): Promise<string>;

  /**
   * Removes information about version from ARC data datastore and from index
   * data.
   *
   * @param id Index object ID
   * @param version Version to remove.
   */
  removeVersion(id: string, version: string): Promise<void>;

  /**
   * Removes versions of API data in a bulk operation.
   *
   * @param indexId Index object ID
   * @param versions List of versions to remove.
   */
  removeVersions(indexId: string, versions: string[]): Promise<void>;

  /**
   * Removes API versions from the store.
   * @param ids A list of IDs to remove
   */
  _removeVersions(ids: string[]): Promise<void>;

  /**
   * Removes a version from the data store.
   * @param id Version id
   */
  _removeVersion(id: string): Promise<void>;

  /**
   * Lists index data.
   *
   * @param opts Query options
   * @returns A promise resolved to a query result object on success.
   */
  listIndex(opts?: ApiIndexQueryOptions): Promise<ApiIndexQueryResult>;

  /**
   * Generates `nextPageToken` as a random string.
   *
   * @returns Random 32 characters long string.
   */
  _makeNextPageToken(): string;

  /**
   * A handler for `api-index-changed` custom event.
   */
  _indexChangeHandler(e: CustomEvent): void;

  /**
   * Handler for the `api-data-read` custom event.
   *
   * Event `detail` object must contain the `id` property with datastore entry
   * id and may contain a `rev` property to read a specific revision.
   *
   * It sets a `result` property on the event `detail` object that is a
   * promise returned by `readData()` function.
   */
  _readHandler(e: CustomEvent): void;
  _readIndexHandler(e: CustomEvent): void;

  /**
   * Handler for the `api-data-changed` custom event.
   */
  _dataUpdateHandler(e: CustomEvent): void;

  /**
   * Deletes the object from the datastores.
   * It is only handled if the event in cancelable and not cancelled.
   *
   * Event has to have `id` property set on the detail object.
   *
   * It sets `result` property on the event detail object with a result of
   * calling `remove()` function.
   */
  _deletedHandler(e: CustomEvent): void;
  _versionDeletedHandler(e: CustomEvent): void;

  /**
   * Handler for the `api-index-changed-batch` custom event.
   * It requires to have `items` property set to event detail as an array of
   * PouchDB documents to update.
   *
   * It sets `result` property on the event detail object with a result of
   * calling `updateIndexBatch()` function.
   */
  _indexesUpdatedHandler(e: CustomEvent): void;

  /**
   * Handler for the `api-index-list` custom event.
   */
  _indexListHandler(e: CustomEvent): void;

  /**
   * Handler for `destroy-model` custom event.
   * Deletes saved or history data when scheduled for deletion.
   */
  _deleteModelHandler(e: CustomEvent|null): void;
  _delIndexModel(): Promise<void>;
  _delDataModel(): Promise<void>;
}
