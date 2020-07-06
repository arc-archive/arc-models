import { ARCProject, ARCHistoryRequest, ARCSavedRequest, SaveARCRequestOptions } from '../RequestTypes';
import { ARCRequestEventRequestOptions } from './RequestEvents';
import {
  ARCEntityChangeRecord,
  ARCModelQueryOptions,
  ARCModelQueryResult,
} from '../types';

declare interface ProjectStateFunctions {
  /**
   * Dispatches an event after a project was updated
   *
   * @param target A node on which to dispatch the event.
   * @param record Change record
   */
  update(target: EventTarget, record: ARCEntityChangeRecord<ARCProject>): void;
  /**
   * Dispatches an event after a project was deleted
   *
   * @param target A node on which to dispatch the event.
   * @param id Deleted project ID.
   * @param rev Updated revision of the project.
   */
  delete(target: EventTarget, id: string, rev: string): void;
}

declare interface ProjectFunctions {
  /**
   * Dispatches an event handled by the data store to read the project metadata.
   *
   * @param target A node on which to dispatch the event.
   * @param id The ID of the project
   * @param rev The revision of the project. If not set then the latest revision is used.
   * @returns Promise resolved to a Project model.
   */
  read(target: EventTarget, id: string, rev?: string): Promise<ARCProject>;
  /**
   * Dispatches an event handled by the data store to update a project metadata.
   *
   * @param target A node on which to dispatch the event.
   * @param item The project object to update.
   * @returns Promise resolved to a Project model.
   */
  update(target: EventTarget, item: ARCProject): Promise<ARCEntityChangeRecord<ARCProject>>;

  /**
   * Dispatches an event handled by the data store to update a list of project metadata.
   *
   * @param target A node on which to dispatch the event.
   * @param projects The list of project objects to update.
   * @return Promise resolved to a list of change records
   */
  updateBulk(target: EventTarget, projects: ARCProject[]): Promise<ARCEntityChangeRecord<ARCProject>[]>;
  /**
   * Dispatches an event handled by the data store to delete a project metadata.
   *
   * @param target A node on which to dispatch the event.
   * @param id The id of the project to delete.
   * @param rev The revision of the project. If not set then the latest revision is used.
   * @returns Promise resolved to a new revision after delete.
   */
  delete(target: EventTarget, id: string, rev?: string): Promise<string>;

  /**
   * Dispatches an event to list the project data.
   *
   * @param target A node on which to dispatch the event.
   * @param opts Query options.
   * @returns Project query result.
   */
  query(target: EventTarget, opts?: ARCModelQueryOptions): Promise<ARCModelQueryResult<ARCProject>>;

  State: ProjectStateFunctions;
}

declare interface RequestStateFunctions {
  /**
   * Dispatches an event after a request object was updated
   *
   * @param target A node on which to dispatch the event.
   * @param type ARC request type
   * @param record Change record
   */
  update(target: EventTarget, type: string, record: ARCEntityChangeRecord<ARCHistoryRequest|ARCSavedRequest>): void;
  /**
   * Dispatches an event after a request was deleted
   *
   * @param {EventTarget} target A node on which to dispatch the event.
   * @param {string} type ARC request type
   * @param {string} id Deleted ARC request ID.
   * @param {string} rev Updated revision of the ARC request entity.
   */
  delete(target: EventTarget, type: string, id: string, rev: string): void;
}

declare interface RequestFunctions {
  /**
   * Dispatches an event handled by the data store to read an ARC request metadata.
   *
   * @param target A node on which to dispatch the event.
   * @param type Request type. Either `saved` or `history`.
   * @param id Request id
   * @param opts ARC request read options.
   * @returns Promise resolved to an ARC request model.
   */
  read(target: EventTarget, type: string, id: string, opts?: ARCRequestEventRequestOptions): Promise<ARCHistoryRequest|ARCSavedRequest>;
  /**
   * Dispatches an event handled by the data store to read an ARC request metadata.
   *
   * @param target A node on which to dispatch the event.
   * @param type Request type. Either `saved` or `history`.
   * @param request An ARC request to update.
   * @returns Promise resolved to a change record
   */
  update(target: EventTarget, type: string, request: ARCHistoryRequest|ARCSavedRequest): Promise<ARCEntityChangeRecord<ARCHistoryRequest|ARCSavedRequest>>;

  /**
   * Dispatches an event handled by the data store to read an ARC request metadata.
   *
   * @param target A node on which to dispatch the event.
   * @param type Request type. Either `saved` or `history`.
   * @param requests List of ARC request objects to update.
   * @returns Promise resolved to a list of change record for each object
   */
  updateBulk(target: EventTarget, type: string, requests: (ARCHistoryRequest|ARCSavedRequest)[]): Promise<ARCEntityChangeRecord<ARCHistoryRequest|ARCSavedRequest>[]>;

  /**
   * Dispatches an event handled by the data store to save an ARC request object with metadata`.
   *
   * @param target A node on which to dispatch the event.
   * @param type Request type. Either `saved` or `history`.
   * @param request An ARC request to update.
   * @param projects List of project names to create with this request
   * and attach it to the request object. Only relevant for `saved` type.
   * @param opts Save request options.  Only relevant for `saved` type.
   * @returns Promise resolved to a change record
   */
  store(target: EventTarget, type: string, request: ARCHistoryRequest|ARCSavedRequest, projects?: string[], opts?: SaveARCRequestOptions): Promise<ARCEntityChangeRecord<ARCHistoryRequest|ARCSavedRequest>>;

  /**
   * Dispatches an event handled by the data store to delete an ARC request from the store.
   *
   * @param target A node on which to dispatch the event.
   * @param type Request type. Either `saved` or `history`.
   * @param id Request id
   * @param rev A revision ID to delete
   * @returns Promise resolved to a new revision after delete.
   */
  delete(target: EventTarget, type: string, id: string, rev?: string): Promise<string>;
  State: RequestStateFunctions;
}

declare interface ArcModelEvents {
  Project: ProjectFunctions;
  Request: RequestFunctions;
}

declare const events: ArcModelEvents;
export { events as  ArcModelEvents };
