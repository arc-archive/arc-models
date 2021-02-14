import { Project } from '@advanced-rest-client/arc-types';
import { ARCProjectDeleteEvent, ARCProjectListAllEvent, ARCProjectListEvent, ARCProjectMoveEvent, ARCProjectReadEvent, ARCProjectUpdateBulkEvent, ARCProjectUpdateEvent } from './events/ProjectEvents.js';
import { RequestBaseModel } from './RequestBaseModel.js';
import { ARCEntityChangeRecord, ARCModelListResult, ARCModelListOptions } from './types';

export declare const readHandler: unique symbol;
export declare const updateHandler: unique symbol;
export declare const updateBulkHandler: unique symbol;
export declare const deleteHandler: unique symbol;
export declare const listHandler: unique symbol;
export declare const listAllHandler: unique symbol;
export declare const moveToHandler: unique symbol;
export declare const addToHandler: unique symbol;
export declare const removeFromHandler: unique symbol;
export declare const normalizeProjects: unique symbol;
export declare const processUpdateBulkResponse: unique symbol;

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
  list(opts?: ARCModelListOptions): Promise<ARCModelListResult<Project.ARCProject>>;

  /**
   * Lists all project entities.
   *
   * @param keys Project keys to read. When not set it reads all projects
   * @returns A promise resolved to a list of projects.
   */
  listAll(keys?: string[]): Promise<Project.ARCProject[]>;

  /**
   * Updates project object taking care of `_rew` value read if missing.
   *
   * @param project Project object to update.
   */
  post(project: Project.ARCProject): Promise<ARCEntityChangeRecord<Project.ARCProject>>;

  /**
   * Link to `#readProject()` for API consistency
   *
   * @param id The ID of the datastore entry.
   * @param rev Specific revision to read. Defaults to the latest revision.
   * @returns Promise resolved to a datastore object.
   */
  get(id: string, rev?: string): Promise<Project.ARCProject>;

  /**
   * Bulk read a list of projects
   * @param ids The list of ids to read.
   * @returns Read projects.
   */
  getBulk(ids: string[]): Promise<Project.ARCProject[]>;

  /**
   * Link to `#removeProject()` for API consistency
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
  postBulk(projects: Project.ARCProject[]): Promise<ARCEntityChangeRecord<Project.ARCProject>[]>;

  /**
   * Adds a request to a project.
   * @param pid Project id
   * @param rid Request id
   * @param type Request type
   * @param position The index at which to add the request. Default to the last position
   */
  addRequest(pid: string, rid: string, type: string, position?: number): Promise<void>;

  /**
   * Moves a request to a project.
   * @param pid Project id
   * @param rid Request id
   * @param type Request type
   * @param position The index at which to add the request. Default to the last position
   */
  moveRequest(pid: string, rid: string, type: string, position?: number): Promise<void>;

  /**
   * Removes request from a project
   * @param pid Project id
   * @param rid Request id
   */
  removeRequest(pid: string, rid: string): Promise<void>;

  _attachListeners(node: EventTarget): void;
  _detachListeners(node: EventTarget): void;

  /**
   * Handler for project read event request.
   */
  [readHandler](e: ARCProjectReadEvent): void;

  /**
   * Handles project save / update
   */
  [updateHandler](e: ARCProjectUpdateEvent): void;

  /**
   * Handler for `project-update-bulk` custom event.
   */
  [updateBulkHandler](e: ARCProjectUpdateBulkEvent): void;

  /**
   * Normalizes projects list to common model.
   * It updates `updated` property to current time.
   * If an item is not an object then it is removed.
   *
   * @param projects List of projects.
   */
  [normalizeProjects](projects: Project.ARCProject[]): Project.ARCProject[];

  /**
   * Processes datastore response after calling `updateBulk()` function.
   * @param projects List of requests to update.
   * @param responses PouchDB response
   * @returns List of projects with updated `_id` and `_rew`
   */
  [processUpdateBulkResponse](projects: Project.ARCProject[], responses: (PouchDB.Core.Response|PouchDB.Core.Error)[]): ARCEntityChangeRecord<Project.ARCProject>[];

  /**
   * Removes a project from the data store.
   */
  [deleteHandler](e: ARCProjectDeleteEvent): void;

  /**
   * Queries for a list of projects in pagination
   */
  [listHandler](e: ARCProjectListEvent): void;

  /**
   * List all projects.
   */
  [listAllHandler](e: ARCProjectListAllEvent): void;

  [moveToHandler](e: ARCProjectMoveEvent): void;

  [addToHandler](e: ARCProjectMoveEvent): void;

  [removeFromHandler](e: ARCProjectMoveEvent): void;
}
