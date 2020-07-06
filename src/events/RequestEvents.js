/* eslint-disable max-classes-per-file */
import { ArcModelEventTypes } from './ArcModelEventTypes.js';
import { ARCEntityDeletedEvent } from './BaseEvents.js';

/** @typedef {import('./RequestEvents').ARCRequestEventRequestOptions} ARCRequestEventRequestOptions */
/** @typedef {import('../types').ARCEntityChangeRecord} ARCEntityChangeRecord */
/** @typedef {import('../RequestTypes').ARCSavedRequest} ARCSavedRequest */
/** @typedef {import('../RequestTypes').ARCHistoryRequest} ARCHistoryRequest */
/** @typedef {import('../RequestTypes').SaveARCRequestOptions} SaveARCRequestOptions */

export const requestValue = Symbol('requestValue');
export const requestIdValue = Symbol('requestIdValue');
export const revisionValue = Symbol('revisionValue');
export const optionsValue = Symbol('optionsValue');
export const typeValue = Symbol('typeValue');
export const changeRecordValue = Symbol('changeRecordValue');
export const projectsValue = Symbol('projectsValue');

/**
 * An event to be dispatched to read an ARC request object from the data store.
 */
export class ARCRequestReadEvent extends CustomEvent {
  /**
   * @param {string} type Request type. Either `saved` or `history`.
   * @param {string} id Request id
   * @param {ARCRequestEventRequestOptions=} opts ARC request read options.
   */
  constructor(type, id, opts) {
    if (!id) {
      throw new Error('The request ID is missing.');
    }
    super(ArcModelEventTypes.Request.read, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {},
    });
    this[requestIdValue] = id;
    this[typeValue] = type;
    this[optionsValue] = opts;
  }

  /**
   * Requested ARC request ID.
   * @return {string} ARC request ID used to initialize the event.
   */
  get id() {
    return this[requestIdValue];
  }

  /**
   * @return {ARCRequestEventRequestOptions|null} ARC request read options.
   */
  get opts() {
    return this[optionsValue] || null;
  }

  /**
   * @return {string} The request type. Either `saved` or `history`.
   */
  get requestType() {
    return this[typeValue];
  }
}

/**
 * An event dispatched to the store to update an ARC request entity.
 */
export class ARCRequestUpdateEvent extends CustomEvent {
  /**
   * @param {string} type Request type. Either `saved` or `history`.
   * @param {ARCHistoryRequest|ARCSavedRequest} request An ARC request to update.
   */
  constructor(type, request) {
    super(ArcModelEventTypes.Request.update, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {}
    });
    this[requestValue] = request;
    this[typeValue] = type;
  }

  /**
   * @return {ARCHistoryRequest|ARCSavedRequest} A request entity that is being updated.
   */
  get request() {
    return this[requestValue];
  }

  /**
   * @return {string} The request type. Either `saved` or `history`.
   */
  get requestType() {
    return this[typeValue];
  }
}

/**
 * An event dispatched to store a request with the corresponding related data.
 * This event is used by the UI to update / create request with projects
 * when a "save" action is triggered.
 */
export class ARCRequestStoreEvent extends CustomEvent {
  /**
   * @param {string} type Request type. Either `saved` or `history`.
   * @param {ARCHistoryRequest|ARCSavedRequest} request An ARC request to update.
   * @param {string[]=} projects List of project names to create with this request
   * and attach it to the request object. Only relevant for `saved` type.
   * @param {SaveARCRequestOptions=} opts Save request options.  Only relevant for `saved` type.
   */
  constructor(type, request, projects, opts) {
    super(ArcModelEventTypes.Request.store, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {}
    });
    this[requestValue] = request;
    this[typeValue] = type;
    this[projectsValue] = projects;
    this[optionsValue] = opts;
  }

  /**
   * @return {ARCHistoryRequest|ARCSavedRequest} A request entity that is being updated.
   */
  get request() {
    return this[requestValue];
  }

  /**
   * @return {string} The request type. Either `saved` or `history`.
   */
  get requestType() {
    return this[typeValue];
  }

  /**
   * @return {SaveARCRequestOptions|null} ARC request store options.
   */
  get opts() {
    return this[optionsValue] || null;
  }

  /**
   * @return {string[]|null} List of project names to create with this request
   * and attach it to the request object. Only relevant for `saved` type.
   */
  get projects() {
    return this[projectsValue] || null;
  }
}

/**
 * An event dispatched to the store to update a list of ARC requests in a single transaction.
 */
export class ARCRequestUpdateBulkEvent extends CustomEvent {
  /**
   * @param {string} type Request type. Either `saved` or `history`.
   * @param {(ARCHistoryRequest|ARCSavedRequest)[]} requests A list of ARC request to update.
   */
  constructor(type, requests) {
    super(ArcModelEventTypes.Request.updateBulk, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {}
    });
    this[requestValue] = requests;
    this[typeValue] = type;
  }

  /**
   * @return {(ARCHistoryRequest|ARCSavedRequest)[]} A list of ARC request to update.
   */
  get requests() {
    return this[requestValue];
  }

  /**
   * @return {string} The request type. Either `saved` or `history`.
   */
  get requestType() {
    return this[typeValue];
  }
}

/**
 * An event dispatched from the store after updating an ARC request.
 */
export class ARCRequestUpdatedEvent extends CustomEvent {
  /**
   * @param {string} type ARC request type
   * @param {ARCEntityChangeRecord} record ARC request change record.
   */
  constructor(type, record) {
    super(ArcModelEventTypes.Request.State.update, {
      bubbles: true,
      composed: true,
    });
    this[changeRecordValue] = record;
    this[typeValue] = type;
  }

  /**
   * @return {ARCEntityChangeRecord} Change record
   */
  get changeRecord() {
    return this[changeRecordValue];
  }

  /**
   * @return {string} The request type. Either `saved` or `history`.
   */
  get requestType() {
    return this[typeValue];
  }
}

/**
 * An event to be dispatched to delete an ARC request object from the data store.
 */
export class ARCPRequestDeleteEvent extends CustomEvent {
  /**
   * @param {string} type Request type. Either `saved` or `history`.
   * @param {string} id Request id
   * @param {string=} rev A revision ID to delete
   */
  constructor(type, id, rev) {
    if (!id) {
      throw new Error('The request ID is missing.');
    }
    super(ArcModelEventTypes.Request.delete, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {},
    });
    this[requestIdValue] = id;
    this[typeValue] = type;
    this[revisionValue] = rev;
  }

  /**
   * Requested ARC request ID.
   * @return {string} ARC request ID used to initialize the event.
   */
  get id() {
    return this[requestIdValue];
  }

  /**
   * @return {string|null} A revision ID to delete
   */
  get rev() {
    return this[revisionValue] || null;
  }

  /**
   * @return {string} The request type. Either `saved` or `history`.
   */
  get requestType() {
    return this[typeValue];
  }
}

/**
 * An event dispatched by the data store when a request object was deleted.
 */
export class ARCPRequestDeletedEvent extends ARCEntityDeletedEvent {
  /**
   * @param {string} type Request type. Either `saved` or `history`.
   * @param {string} id Request id
   * @param {string} rev An updated revision ID of the delete object.
   */
  constructor(type, id, rev) {
    if (!id) {
      throw new Error('The request ID is missing.');
    }
    super(ArcModelEventTypes.Request.State.delete, id, rev);
    this[typeValue] = type;
  }

  /**
   * @return {string} The request type. Either `saved` or `history`.
   */
  get requestType() {
    return this[typeValue];
  }
}

/**
 * Dispatches an event handled by the data store to read an ARC request metadata.
 *
 * @param {EventTarget} target A node on which to dispatch the event.
 * @param {string} type Request type. Either `saved` or `history`.
 * @param {string} id Request id
 * @param {ARCRequestEventRequestOptions=} opts ARC request read options.
 * @return {Promise<ARCHistoryRequest|ARCSavedRequest>} Promise resolved to an ARC request model.
 */
export async function readAction(target, type, id, opts) {
  const e = new ARCRequestReadEvent(type, id, opts);
  target.dispatchEvent(e);
  return e.detail.result;
}

/**
 * Dispatches an event handled by the data store to update an ARC request metadata.
 *
 * @param {EventTarget} target A node on which to dispatch the event.
 * @param {string} type Request type. Either `saved` or `history`.
 * @param {ARCHistoryRequest|ARCSavedRequest} request An ARC request to update.
 * @return {Promise<ARCEntityChangeRecord>} Promise resolved to a change record
 */
export async function updateAction(target, type, request) {
  const e = new ARCRequestUpdateEvent(type, request);
  target.dispatchEvent(e);
  return e.detail.result;
}

/**
 * Dispatches an event handled by the data store to save an ARC request object with metadata`.
 *
 * @param {EventTarget} target A node on which to dispatch the event.
 * @param {string} type Request type. Either `saved` or `history`.
 * @param {ARCHistoryRequest|ARCSavedRequest} request An ARC request to update.
 * @param {string[]=} projects List of project names to create with this request
 * and attach it to the request object. Only relevant for `saved` type.
 * @param {SaveARCRequestOptions=} opts Save request options.  Only relevant for `saved` type.
 * @return {Promise<ARCEntityChangeRecord>} Promise resolved to a change record
 */
export async function storeAction(target, type, request, projects, opts) {
  const e = new ARCRequestStoreEvent(type, request, projects, opts);
  target.dispatchEvent(e);
  return e.detail.result;
}

/**
 * Dispatches an event handled by the data store to read an ARC request metadata.
 *
 * @param {EventTarget} target A node on which to dispatch the event.
 * @param {string} type Request type. Either `saved` or `history`.
 * @param {(ARCHistoryRequest|ARCSavedRequest)[]} requests List of ARC request objects to update.
 * @return {Promise<ARCEntityChangeRecord[]>} Promise resolved to a list of change record for each object
 */
export async function updateBulkAction(target, type, requests) {
  const e = new ARCRequestUpdateBulkEvent(type, requests);
  target.dispatchEvent(e);
  return e.detail.result;
}

/**
 * Dispatches an event handled by the data store to delete an ARC request from the store.
 *
 * @param {EventTarget} target A node on which to dispatch the event.
 * @param {string} type Request type. Either `saved` or `history`.
 * @param {string} id Request id
 * @param {string=} rev A revision ID to delete
 * @return {Promise<string>} Promise resolved to a new revision after delete.
 */
export async function deleteAction(target, type, id, rev) {
  const e = new ARCPRequestDeleteEvent(type, id, rev);
  target.dispatchEvent(e);
  return e.detail.result;
}


//
// State events
//

/**
 * Dispatches an event after a request object was updated
 *
 * @param {EventTarget} target A node on which to dispatch the event.
 * @param {string} type ARC request type
 * @param {ARCEntityChangeRecord} record Change record
 */
export function updatedState(target, type, record) {
  const e = new ARCRequestUpdatedEvent(type, record);
  target.dispatchEvent(e);
}

/**
 * Dispatches an event after a request was deleted
 *
 * @param {EventTarget} target A node on which to dispatch the event.
 * @param {string} type ARC request type
 * @param {string} id Deleted ARC request ID.
 * @param {string} rev Updated revision of the deleted ARC request entity.
 */
export function deletedState(target, type, id, rev) {
  const e = new ARCPRequestDeletedEvent(type, id, rev);
  target.dispatchEvent(e);
}
