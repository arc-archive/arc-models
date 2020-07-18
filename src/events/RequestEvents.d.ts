import {
  ARCModelReadEventDetail,
  ARCModelReadBulkEventDetail,
  ARCModelUpdateEventDetail,
  ARCModelDeleteEventDetail,
  ARCModelDeleteBulkEventDetail,
  ARCEntityDeletedEvent,
  ARCModelUpdateBulkEventDetail,
  ARCEntityListEvent,
} from './BaseEvents';
import { ARCHistoryRequest, ARCSavedRequest, ARCRequestRestoreOptions, SaveARCRequestOptions } from '../RequestTypes';
import {
  ARCEntityChangeRecord,
  DeletedEntity,
  ARCModelListOptions,
  ARCModelListResult,
} from '../types';

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
  readonly opts?: ARCRequestEventRequestOptions;
  /**
   * @param type Request type. Either `saved` or `history`.
   * @param id ARC request id
   * @param opts ARC request read options.
   */
  constructor(requestType: string, id: string, opts?: ARCRequestEventRequestOptions);
}

/**
 * An event to be dispatched to read in bulk ARC request objects from the data store.
 */
export class ARCRequestReadBulkEvent extends CustomEvent<ARCModelReadBulkEventDetail<ARCHistoryRequest|ARCSavedRequest>> {
  /**
   * The list of ids used to initialize this event.
   */
  readonly ids: string[];
  /**
   * The request type. Either `saved` or `history`.
   */
  readonly requestType: string;
  /**
   * ARC request read options.
   */
  readonly opts?: ARCRequestEventRequestOptions;
  /**
   * @param type Request type. Either `saved` or `history`.
   * @param ids List of ids to read.
   * @param opts ARC request read options.
   */
  constructor(requestType: string, ids: string[], opts?: ARCRequestEventRequestOptions);
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
  constructor(requestType: string, request: ARCHistoryRequest|ARCSavedRequest);
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
  readonly opts?: SaveARCRequestOptions;
  /**
   * List of project names to create with this request
   * and attach it to the request object. Only relevant for `saved` type.
   */
  readonly projects?: string[];

  /**
   * @param requestType Request type. Either `saved` or `history`.
   * @param request An ARC request to update.
   * @param projects List of project names to create with this request
   * and attach it to the request object. Only relevant for `saved` type.
   * @param opts Save request options.  Only relevant for `saved` type.
   */
  constructor(requestType: string, request: ARCHistoryRequest|ARCSavedRequest, projects?: string[], opts?: SaveARCRequestOptions);
}

/**
 * An event dispatched to the store to update a list of ARC requests in a single transaction.
 */
export declare class ARCRequestUpdateBulkEvent extends CustomEvent<ARCModelUpdateBulkEventDetail<ARCHistoryRequest|ARCSavedRequest>> {
  /**
   * A project that is being updated.
   */
  readonly requests: (ARCHistoryRequest|ARCSavedRequest)[];
  /**
   * The request type. Either `saved` or `history`.
   */
  readonly requestType: string;

  /**
   * @param requestType Request type. Either `saved` or `history`.
   * @param requests A list of ARC request to update.
   */
  constructor(requestType: string, requests: (ARCHistoryRequest|ARCSavedRequest)[]);
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
   * @param requestType ARC request type
   * @param record ARC request change record.
   */
  constructor(requestType: string, record: ARCEntityChangeRecord<ARCHistoryRequest|ARCSavedRequest>);
}

/**
 * An event to be dispatched to delete an ARC request object from the data store.
 */
export declare class ARCRequestDeleteEvent extends CustomEvent<ARCModelDeleteEventDetail> {
  /**
   * Requested ARC request ID.
   */
  readonly id: string;
  /**
   * RA revision ID to delete
   */
  readonly rev?: string;
  /**
   * The request type. Either `saved` or `history`.
   */
  readonly requestType: string;
  /**
   * @param requestType Request type. Either `saved` or `history`.
   * @param id Request id
   * @param rev A revision ID to delete
   */
  constructor(requestType: string, id: string, rev?: string);
}

/**
 * An event to be dispatched to delete a list of ARC request objects from the data store.
 */
export declare class ARCRequestDeleteBulkEvent extends CustomEvent<ARCModelDeleteBulkEventDetail> {
  /**
   * List of requests to delete used to initialize the event.
   */
  readonly ids: string[];
  /**
   * The request type. Either `saved` or `history`.
   */
  readonly requestType: string;
  /**
   * @param requestType Request type. Either `saved` or `history`.
   * @param ids List of requests to delete
   */
  constructor(requestType: string, id: string[]);
}

/**
 * An event to be dispatched to undelete a list of ARC request objects from the data store.
 */
export class ARCRequestUndeleteBulkEvent extends CustomEvent<ARCModelUpdateBulkEventDetail<ARCHistoryRequest|ARCSavedRequest>> {
  /**
   * List of requests to restore used to initialize the event.
   */
  readonly requests: DeletedEntity[];
  /**
   * The request type. Either `saved` or `history`.
   */
  readonly requestType: string;

  /**
   * @param requestType Request type. Either `saved` or `history`.
   * @param {DeletedEntity[]} requests List of requests to restore
   */
  constructor(requestType: string, requests: DeletedEntity[]);
}

/**
 * An event dispatched by the data store when a request object was deleted.
 */
export class ARCRequestDeletedEvent extends ARCEntityDeletedEvent {
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
   * @param requestType Request type. Either `saved` or `history`.
   * @param id Request id
   * @param rev An updated revision ID of the delete object.
   */
  constructor(requestType: string, id: string, rev: string);
}

/**
 * An event dispatched by the UI when requesting a list of requests
 */
export class ARCRequestListEvent extends ARCEntityListEvent<ARCHistoryRequest|ARCSavedRequest> {
  /**
   * The request type. Either `saved` or `history`.
   */
  readonly requestType: string;
  /**
   * @param requestType Request type. Either `saved` or `history`.
   * @param opts Query options.
   */
  constructor(requestType: string, opts?: ARCModelListOptions);
}

/**
 * An event dispatched by the UI when querying the request models for specific data.
 */
export class ARCRequestQueryEvent extends CustomEvent<ARCModelReadBulkEventDetail<ARCHistoryRequest|ARCSavedRequest>> {
  /**
   * @param term The search term for the query function
   * @param requestType The type of the requests to search for. By default it returns all data.
   * @param detailed If set it uses slower algorithm but performs full search on the index. When false it only uses filer like query + '*'.
   */
  constructor(term: string, requestType?: string, detailed?: boolean);

  /**
   * The request type. Either `saved` or `history`.
   */
  readonly requestType?: string;

  /**
   * The search term for the query function used to initialize the event
   */
  readonly term: string;

  /**
   * If set it uses slower algorithm but performs full search on the index.
   */
  readonly detailed: boolean;
}

/**
 * An event dispatched by the UI to query for the list of requests in a project.
 */
export class ARCRequestListProjectRequestsEvent extends CustomEvent<ARCModelReadBulkEventDetail<ARCHistoryRequest|ARCSavedRequest>> {
  /**
   * @param id The project id
   * @param opts Request restore options.
   */
  constructor(id: string, opts?: ARCRequestRestoreOptions);

  /**
   * The project id
   */
  readonly id: string;

  /**
   * ARC request read options.
   */
  readonly opts?: ARCRequestRestoreOptions;
}

/**
 * Dispatches an event handled by the data store to read an ARC request metadata.
 *
 * @param target A node on which to dispatch the event.
 * @param requestType Request type. Either `saved` or `history`.
 * @param id Request id
 * @param opts ARC request read options.
 * @returns Promise resolved to an ARC request model.
 */
export declare function readAction(target: EventTarget, requestType: string, id: string, opts?: ARCRequestEventRequestOptions): Promise<ARCHistoryRequest|ARCSavedRequest>;

/**
 * Dispatches an event handled by the data store to read a list of ARC requests metadata.
 *
 * @param target A node on which to dispatch the event.
 * @param requestType Request type. Either `saved` or `history`.
 * @param ids List of ids to read
 * @param opts ARC request read options.
 * @return Promise resolved to a list of ARC requests.
 */
export declare function readBulkAction(target: EventTarget, requestType: string, ids: string[], opts?: ARCRequestEventRequestOptions): Promise<(ARCHistoryRequest|ARCSavedRequest)[]>;

/**
 * Dispatches an event handled by the data store to read an ARC request metadata.
 *
 * @param target A node on which to dispatch the event.
 * @param requestType Request type. Either `saved` or `history`.
 * @param opts List options.
 * @returns Promise resolved to list of results
 */
export declare function listAction(target: EventTarget, requestType: string, opts?: ARCModelListOptions): Promise<ARCModelListResult<ARCHistoryRequest|ARCSavedRequest>>;

/**
 * Dispatches an event handled by the data store to query for ARC request data
 *
 * @param target A node on which to dispatch the event.
 * @param term The search term for the query function
 * @param requestType The type of the requests to search for. By default it returns all data.
 * @param detailed If set it uses slower algorithm but performs full search on the index. When false it only uses filer like query + '*'.
 * @returns Promise resolved to list of results
 */
export declare function queryAction(target: EventTarget, term: string, requestType?: string, detailed?: boolean): Promise<(ARCHistoryRequest|ARCSavedRequest)[]>;

/**
 * Dispatches an event handled by the data store to read an ARC request metadata.
 *
 * @param target A node on which to dispatch the event.
 * @param requestType Request type. Either `saved` or `history`.
 * @param request An ARC request to update.
 * @returns Promise resolved to a change record
 */
export declare function updateAction(target: EventTarget, requestType: string, request: ARCHistoryRequest|ARCSavedRequest): Promise<ARCEntityChangeRecord<ARCHistoryRequest|ARCSavedRequest>>;

/**
 * Dispatches an event handled by the data store to save an ARC request object with metadata`.
 *
 * @param target A node on which to dispatch the event.
 * @param requestType Request type. Either `saved` or `history`.
 * @param request An ARC request to update.
 * @param projects List of project names to create with this request
 * and attach it to the request object. Only relevant for `saved` type.
 * @param opts Save request options.  Only relevant for `saved` type.
 * @returns Promise resolved to a change record
 */
export declare function storeAction(target: EventTarget, requestType: string, request: ARCHistoryRequest|ARCSavedRequest, projects?: string[], opts?: SaveARCRequestOptions): Promise<ARCEntityChangeRecord<ARCHistoryRequest|ARCSavedRequest>>;

/**
 * Dispatches an event handled by the data store to read an ARC request metadata.
 *
 * @param target A node on which to dispatch the event.
 * @param requestType Request type. Either `saved` or `history`.
 * @param requests List of ARC request objects to update.
 * @returns Promise resolved to a list of change record for each object
 */
export declare function updateBulkAction(target: EventTarget, requestType: string, requests: (ARCHistoryRequest|ARCSavedRequest)[]): Promise<ARCEntityChangeRecord<ARCHistoryRequest|ARCSavedRequest>[]>;

/**
 * Dispatches an event handled by the data store to delete an ARC request from the store.
 *
 * @param target A node on which to dispatch the event.
 * @param requestType Request type. Either `saved` or `history`.
 * @param id Request id
 * @param rev A revision ID to delete
 * @returns Promise resolved to a new revision after delete.
 */
export declare function deleteAction(target: EventTarget, requestType: string, id: string, rev?: string): Promise<DeletedEntity>;
/**
 * Dispatches an event handled by the data store to delete an ARC request from the store.
 *
 * @param target A node on which to dispatch the event.
 * @param requestType Request type. Either `saved` or `history`.
 * @param ids List of ids to delete.
 * @returns Promise resolved to a a list of deleted revisions
 */
export declare function deleteBulkAction(target: EventTarget, requestType: string, ids: string[]): Promise<DeletedEntity[]>;

/**
 * Dispatches an event handled by the data store to delete an ARC request from the store.
 *
 * @param target A node on which to dispatch the event.
 * @param requestType Request type. Either `saved` or `history`.
 * @param requests List of requests to restore
 * @returns Promise resolved to a a list of change records
 */
export declare function undeleteBulkAction(target: EventTarget, requestType: string, requests: DeletedEntity[]): Promise<ARCEntityChangeRecord<ARCHistoryRequest|ARCSavedRequest>[]>;

/**
 * Dispatches an event handled by the data store to list all requests that are association with a project.
 *
 * @param target A node on which to dispatch the event.
 * @param id The project id
 * @param opts ARC request read options.
 * @returns Promise resolved to a a list of requests
 */
export declare function listProjectAction(target: EventTarget, id: string, opts?: ARCRequestRestoreOptions): Promise<(ARCHistoryRequest|ARCSavedRequest)[]>;

/**
 * Dispatches an event after a request object was updated
 *
 * @param target A node on which to dispatch the event.
 * @param requestType ARC request type
 * @param record Change record
 */
export declare function updatedState(target: EventTarget, requestType: string, record: ARCEntityChangeRecord<ARCHistoryRequest|ARCSavedRequest>): void;

/**
 * Dispatches an event after a request was deleted
 *
 * @param {EventTarget} target A node on which to dispatch the event.
 * @param {string} requestType ARC request type
 * @param {string} id Deleted ARC request ID.
 * @param {string} rev Updated revision of the ARC request entity.
 */
export declare function deletedState(target: EventTarget, requestType: string, id: string, rev: string): void;
