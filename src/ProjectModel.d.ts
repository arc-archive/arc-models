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
  /**
   * Lists all project objects.
   *
   * @param opts Query options.
   * @returns A promise resolved to a list of projects.
   */
  list(opts?: ARCModelQueryOptions): Promise<ARCModelQueryResult<ARCProject>>;

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
   * Link to `#removeProject()` for API's consistency
   *
   * @param  id The ID of the datastore entry.
   * @param rev Specific revision to read. Defaults to latest revision.
   * @returns Promise resolved to a new `_rev` property of deleted object.
   */
  delete(id: string, rev?: string): Promise<string>;

  /**
   * Updates more than one project in a bulk request.
   *
   * @param projects List of requests to update.
   */
  postBulk(projects: ARCProject[]): Promise<ARCEntityChangeRecord<ARCProject>[]>;


  _attachListeners(node: EventTarget): void;
  _detachListeners(node: EventTarget): void;
}
