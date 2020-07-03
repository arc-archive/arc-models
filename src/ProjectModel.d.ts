import { RequestBaseModel } from './RequestBaseModel.js';
import { ARCProject } from './RequestTypes';
import { ARCEntityChangeRecord, ARCModelQueryResult, ARCModelQueryOptions } from './types';

/**
 * A model to access projects data in Advanced REST Client.
 * This component provides direct access to the data via the API
 * and Events API defined in events/ folder.
 */
export declare class ProjectModel extends RequestBaseModel {
  constructor();
  _attachListeners(node: EventTarget): void;
  _detachListeners(node: EventTarget): void;

  /**
   * Lists all project objects.
   *
   * @param opts Query options.
   * @returns A promise resolved to a list of projects.
   */
  list(opts?: ARCModelQueryOptions): Promise<ARCModelQueryResult<ARCProject>>;

  /**
   * Updates more than one project in a bulk request.
   *
   * @param projects List of requests to update.
   */
  postBulk(projects: ARCProject[]): Promise<ARCEntityChangeRecord<ARCProject>[]>;

  /**
   * Updates project object taking care of `_rew` value read if missing.
   *
   * @param project Project object to update.
   */
  post(project: ARCProject): Promise<ARCEntityChangeRecord<ARCProject>>;

  /**
   * Link to `#readProject()` for API's consistency
   *
   * @param id The ID of the datastore entry.
   * @param rev Specific revision to read. Defaults to the latest revision.
   * @returns Promise resolved to a datastore object.
   */
  get(id: string, rev?: string): Promise<ARCProject>;

  /**
   * Processes datastore response after calling `updateBulk()` function.
   *
   * @param projects List of requests to update.
   * @param response PouchDB response
   * @returns List of projects with updated `_id` and `_rew`
   */
  _processUpdateBulkResponse(projects: ARCProject[], response: Array<PouchDB.Core.Response|PouchDB.Core.Error>): ARCProject[];

  /**
   * Handles object save / update
   */
  _handleObjectSave(e: CustomEvent): void;

  /**
   * Deletes the object from the datastore.
   */
  _handleObjectDelete(e: CustomEvent): void;

  /**
   * Queries for a list of projects.
   */
  _queryHandler(e: CustomEvent): void;
}
