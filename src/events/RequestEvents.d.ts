import {
  ARCModelReadEventDetail,
  ARCModelUpdateEventDetail,
  ARCModelDeleteEventDetail,
  ARCEntityDeletedEvent,
  ARCModelUpdateBulkEventDetail,
} from './BaseEvents';
import { ARCHistoryRequest, ARCSavedRequest, ARCRequestRestoreOptions, SaveARCRequestOptions } from '../RequestTypes';
import { ARCEntityChangeRecord } from '../types';

export declare interface ARCRequestEventRequestOptions extends ARCRequestRestoreOptions {
  /**
   * Requested ARC request revision ID.
   */
  rev?: string;
}

/**
 * An event to be dispatched to read an ARC request object from the data store.
 */
export declare class ARCRequestReadEvent extends CustomEvent<ARCModelReadEventDetail<ARCHistoryRequest|ARCSavedRequest>> {
  /**
   * Requested ARC request ID.
   */
  readonly id: string;
  /**
   * The request type. Either `saved` or `history`.
   */
  readonly requestType: string;
  /**
   * ARC request read options.
   */
  readonly opts: ARCRequestEventRequestOptions|null;
  /**
   * @param id ARC request id
   * @param type Request type. Either `saved` or `history`.
   * @param opts ARC request read options.
   */
  constructor(type: string, id: string, opts?: ARCRequestEventRequestOptions);
}

/**
 * An event dispatched to the store to update an ARC request entity.
 */
export declare class ARCRequestUpdateEvent extends CustomEvent<ARCModelUpdateEventDetail<ARCHistoryRequest|ARCSavedRequest>> {
  /**
   * A request that is being updated.
   */
  readonly request: ARCHistoryRequest|ARCSavedRequest;
  /**
   * The request type. Either `saved` or `history`.
   */
  readonly requestType: string;
  constructor(type: string, request: ARCHistoryRequest|ARCSavedRequest);
}

/**
 * An event dispatched to store a request with the corresponding related data.
 * This event is used by the UI to update / create request with projects
 * when a "save" action is triggered.
 */
export class ARCRequestStoreEvent extends CustomEvent<ARCModelUpdateEventDetail<ARCHistoryRequest|ARCSavedRequest>> {
  /**
   * A request that is being updated.
   */
  readonly request: ARCHistoryRequest|ARCSavedRequest;

  /**
   * The request type. Either `saved` or `history`.
   */
  readonly requestType: string;

  /**
   * ARC request store options.
   */
  readonly opts: SaveARCRequestOptions|null;
  /**
   * List of project names to create with this request
   * and attach it to the request object. Only relevant for `saved` type.
   */
  readonly optprojectss: string[]|null;

  /**
   * @param type Request type. Either `saved` or `history`.
   * @param request An ARC request to update.
   * @param projects List of project names to create with this request
   * and attach it to the request object. Only relevant for `saved` type.
   * @param opts Save request options.  Only relevant for `saved` type.
   */
  constructor(type: string, request: ARCHistoryRequest|ARCSavedRequest, projects?: string[], opts?: SaveARCRequestOptions);
}

/**
 * An event dispatched to the store to update a list of ARC requests in a single transaction.
 */
export declare class ARCRequestUpdateBulkEvent extends CustomEvent<ARCModelUpdateBulkEventDetail<ARCHistoryRequest|ARCSavedRequest>[]> {
  /**
   * A project that is being updated.
   */
  readonly requests: (ARCHistoryRequest|ARCSavedRequest)[];
  /**
   * The request type. Either `saved` or `history`.
   */
  readonly requestType: string;

  /**
   * @param type Request type. Either `saved` or `history`.
   * @param requests A list of ARC request to update.
   */
  constructor(type: string, requests: (ARCHistoryRequest|ARCSavedRequest)[]);
}

/**
 * An event dispatched from the store after updating an ARC request.
 */
export declare class ARCRequestUpdatedEvent extends CustomEvent<ARCEntityChangeRecord<ARCHistoryRequest|ARCSavedRequest>> {
  readonly changeRecord: ARCEntityChangeRecord<ARCHistoryRequest|ARCSavedRequest>;
  /**
   * The request type. Either `saved` or `history`.
   */
  readonly requestType: string;

  /**
   * @param type ARC request type
   * @param record ARC request change record.
   */
  constructor(type: string, record: ARCEntityChangeRecord<ARCHistoryRequest|ARCSavedRequest>);
}

/**
 * An event to be dispatched to delete an ARC request object from the data store.
 */
export declare class ARCPRequestDeleteEvent extends CustomEvent<ARCModelDeleteEventDetail> {
  /**
   * Requested ARC request ID.
   */
  readonly id: string;
  /**
   * RA revision ID to delete
   */
  readonly rev: string|null;
  /**
   * The request type. Either `saved` or `history`.
   */
  readonly requestType: string;
  /**
   * @param {string} type Request type. Either `saved` or `history`.
   * @param {string} id Request id
   * @param {string=} rev A revision ID to delete
   */
  constructor(type: string, id: string, rev?: string);
}

/**
 * An event dispatched by the data store when a request object was deleted.
 */
export class ARCPRequestDeletedEvent extends ARCEntityDeletedEvent {
  /**
   * Deleted ARC request ID.
   */
  readonly id: string;
  /**
   * An updated revision ID of the delete object.
   */
  readonly rev: string;
  /**
   * The request type. Either `saved` or `history`.
   */
  readonly requestType: string;
  /**
   * @param type Request type. Either `saved` or `history`.
   * @param id Request id
   * @param rev An updated revision ID of the delete object.
   */
  constructor(type: string, id: string, rev: string);
}

/**
 * Dispatches an event handled by the data store to read an ARC request metadata.
 *
 * @param target A node on which to dispatch the event.
 * @param type Request type. Either `saved` or `history`.
 * @param id Request id
 * @param opts ARC request read options.
 * @returns Promise resolved to an ARC request model.
 */
export declare function readAction(target: EventTarget, type: string, id: string, opts?: ARCRequestEventRequestOptions): Promise<ARCHistoryRequest|ARCSavedRequest>;

/**
 * Dispatches an event handled by the data store to read an ARC request metadata.
 *
 * @param target A node on which to dispatch the event.
 * @param type Request type. Either `saved` or `history`.
 * @param request An ARC request to update.
 * @returns Promise resolved to a change record
 */
export declare function updateAction(target: EventTarget, type: string, request: ARCHistoryRequest|ARCSavedRequest): Promise<ARCEntityChangeRecord<ARCHistoryRequest|ARCSavedRequest>>;

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
export declare function storeAction(target: EventTarget, type: string, request: ARCHistoryRequest|ARCSavedRequest, projects?: string[], opts?: SaveARCRequestOptions): Promise<ARCEntityChangeRecord<ARCHistoryRequest|ARCSavedRequest>>;

/**
 * Dispatches an event handled by the data store to read an ARC request metadata.
 *
 * @param target A node on which to dispatch the event.
 * @param type Request type. Either `saved` or `history`.
 * @param requests List of ARC request objects to update.
 * @returns Promise resolved to a list of change record for each object
 */
export declare function updateBulkAction(target: EventTarget, type: string, requests: (ARCHistoryRequest|ARCSavedRequest)[]): Promise<ARCEntityChangeRecord<ARCHistoryRequest|ARCSavedRequest>[]>;

/**
 * Dispatches an event handled by the data store to delete an ARC request from the store.
 *
 * @param target A node on which to dispatch the event.
 * @param type Request type. Either `saved` or `history`.
 * @param id Request id
 * @param rev A revision ID to delete
 * @returns Promise resolved to a new revision after delete.
 */
export declare function deleteAction(target: EventTarget, type: string, id: string, rev?: string): Promise<string>;

/**
 * Dispatches an event after a request object was updated
 *
 * @param target A node on which to dispatch the event.
 * @param type ARC request type
 * @param record Change record
 */
export declare function updatedState(target: EventTarget, type: string, record: ARCEntityChangeRecord<ARCHistoryRequest|ARCSavedRequest>): void;

/**
 * Dispatches an event after a request was deleted
 *
 * @param {EventTarget} target A node on which to dispatch the event.
 * @param {string} type ARC request type
 * @param {string} id Deleted ARC request ID.
 * @param {string} rev Updated revision of the ARC request entity.
 */
export declare function deletedState(target: EventTarget, type: string, id: string, rev: string): void;
