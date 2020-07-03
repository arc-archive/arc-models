import { ArcBaseModel } from './ArcBaseModel';
import { ARCProject } from './RequestTypes';
import { ARCEntityChangeRecord } from './types';

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
   * Deletes database data by tye.
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
  removeProject(id: string, rev?: string): Promise<string>;
}
