import { ArcBaseModel } from './ArcBaseModel';
import { ARCProject, ARCHistoryRequest, ARCSavedRequest } from './RequestTypes';
import { ARCEntityChangeRecord, DeletedEntity } from './types';

/**
 * A base class for Request and Projects` models.
 */
export declare class RequestBaseModel extends ArcBaseModel {
  readonly savedDb: PouchDB.Database;
  readonly historyDb: PouchDB.Database;
  readonly projectDb: PouchDB.Database;

  /**
   * Returns a reference to a PouchDB database instance for given type.
   *
   * @param type Either `saved` or `history`
   * @returns PouchDB instance for the datastore.
   */
  getDatabase(type: string): PouchDB.Database;

  /**
   * Deletes database data by type.
   *
   * @param type Either `saved` or `history`
   */
  deleteModel(type: string): Promise<void>;

  /**
   * Reads an entry from the datastore.
   *
   * @param id The ID of the datastore entry.
   * @param rev Specific revision to read. Defaults to latest
   * revision.
   * @returns Promise resolved to a datastore object.
   */
  readProject(id: string, rev?: string): Promise<ARCProject>;

  /**
   * Updates / saves a project object in the datastore.
   * This function fires `project-object-changed` event.
   *
   * @param project A project to save / update
   * @returns Resolved promise to project object with updated `_rev`
   */
  updateProject(project: ARCProject): Promise<ARCEntityChangeRecord<ARCProject>>;

  /**
   * Removed an object from the datastore.
   * This function fires `project-object-deleted` event.
   *
   * @param id The ID of the datastore entry.
   * @param rev Specific revision to read. Defaults to latest revision.
   * @returns Promise resolved to a new `_rev` property of deleted object.
   */
  removeProject(id: string, rev?: string): Promise<DeletedEntity>;

  /**
   * Transforms a history request to a saved request object
   */
  historyToSaved(history: ARCHistoryRequest): ARCSavedRequest;

  /**
   * Normalizes the request to a common request object and updates time values (updated, midnight)
   * @param request The request to normalize
   * @param setMidnight Whether the `midnight` property should be set.
   * @returns Updated request
   */
  normalizeRequestWithTime<T extends ARCHistoryRequest|ARCSavedRequest>(request: T, setMidnight?: boolean): T;

  /**
   * Removes the request from all projects it is added to.
   * Note, this does not update request itself!
   * @param request The request to process 
   * @returns Change record for each changed project.
   */
  removeFromProjects(request: ARCSavedRequest): Promise<ARCEntityChangeRecord<ARCProject>[]>
}
