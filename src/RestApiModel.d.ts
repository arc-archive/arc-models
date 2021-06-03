import { RestApi, Model } from '@advanced-rest-client/arc-types';
import { ArcBaseModel } from './ArcBaseModel';

export const readHandler: symbol;
export const updateHandler: symbol;
export const updatebulkHandler: symbol;
export const deleteHandler: symbol;
export const listHandler: symbol;
export const datareadHandler: symbol;
export const dataupdateHandler: symbol;
export const versionDeleteHandler: symbol;
export const removeVersion: symbol;
export const removeVersions: symbol;
export const deleteIndexModel: symbol;
export const deleteDataModel: symbol;

/**
 * REST APIs model.
 */
export declare class RestApiModel extends ArcBaseModel {

  /**
   * A handler to the datastore. Contains listing data.
   *
   */
  get indexDb(): PouchDB.Database;

  /**
   * A handler to the datastore containing REST API data
   * (AMF model).
   *
   */
  get dataDb(): PouchDB.Database;

  constructor();

  /**
   * Reads an entry from the index datastore.
   *
   * @param id The ID of the datastore entry.
   * @param rev Specific revision to read. Defaults to latest revision.
   * @returns Promise resolved to an index object.
   */
  readIndex(id: string, rev?: string): Promise<RestApi.ARCRestApiIndex>;

  /**
   * Creates / updates API index object.
   *
   * @param doc PouchDB document.
   * @returns Promise resolved to a change record.
   */
  updateIndex(doc: RestApi.ARCRestApiIndex): Promise<Model.ARCEntityChangeRecord<RestApi.ARCRestApiIndex>>;

  /**
   * Updates many index objects in one request.
   *
   * @param docs List of PouchDB documents to update.
   * @returns Promise resolved to a list of the change records.
   */
  updateIndexBatch(docs: RestApi.ARCRestApiIndex[]): Promise<Model.ARCEntityChangeRecord<RestApi.ARCRestApiIndex>[]>

  /**
   * Removes all AMF and index data from datastores for given index id.
   *
   * @param {string} id Index entry ID to delete.
   * @return {Promise<Model.DeletedEntity>} Promise resolved to a delete record
   */
  delete(id: string): Promise<Model.DeletedEntity>;

  /**
   * Lists index data.
   *
   * @param opts Query options.
   * @returns A promise resolved to a list of REST APIs.
   */
  list(opts?: Model.ARCModelListOptions): Promise<Model.ARCModelListResult<RestApi.ARCRestApiIndex>>;

  /**
   * Reads an entry from the raml data datastore.
   *
   * @param id The ID of the datastore entry.
   * @param rev Specific revision to read. Defaults to latest revision.
   * @returns Promise resolved to a project object.
   */
  readData(id: string, rev?: string): Promise<RestApi.ARCRestApi>;

  /**
   * Creates / updates API data object.
   *
   * @param entity The entity to update.
   * @returns Promise resolved to a change record.
   */
  updateData(entity: RestApi.ARCRestApi): Promise<Model.ARCEntityChangeRecord<RestApi.ARCRestApi>>;

  /**
   * Removes information about version from ARC data datastore and from index
   * data.
   *
   * @param id Index object ID
   * @param version Version to remove.
   */
  removeVersion(id: string, version: string): Promise<Model.DeletedEntity>

  /**
   * Removes versions of API data in a bulk operation.
   *
   * @param indexId Index object ID
   * @param versions List of versions to remove.
   */
  removeVersions(indexId: string, versions: string[]): Promise<void>;

  _attachListeners(node: EventTarget): void;
  _detachListeners(node: EventTarget): void;
}
