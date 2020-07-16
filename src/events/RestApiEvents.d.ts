import {
  ARCModelReadEventDetail,
  ARCModelUpdateEventDetail,
  ARCModelDeleteEventDetail,
  ARCEntityDeletedEvent,
  ARCModelUpdateBulkEventDetail,
  ARCEntityListEvent,
} from './BaseEvents';
import {
  ARCEntityChangeRecord,
  ARCModelListOptions,
  ARCModelListResult,
  DeletedEntity,
} from '../types';
import { ARCRestApi, ARCRestApiIndex } from '../RestApiModel';

export const entityValue: symbol;
export const dataValue: symbol;
export const idValue: symbol;
export const revisionValue: symbol;
export const changeRecordValue: symbol;

/**
 * An event to be dispatched to read a REST API index data.
 */
export class ARCRestApiReadEvent extends CustomEvent<ARCModelReadEventDetail<ARCRestApiIndex>> {
  /**
   * Entity revision ID used to initialize the event.
   */
  readonly rev?: string;

  /**
   * Entity id used to initialize the event.
   */
  readonly id: string;

  /**
   * @param id The entity id
   * @param rev The entity revision
   */
  constructor(id: string, rev?: string);
}

/**
 * An event dispatched to update a REST API index data.
 */
export class ARCRestApiUpdateEvent extends CustomEvent<ARCModelUpdateEventDetail<ARCRestApiIndex>> {
  /**
   * The entity used to initialize this event
   */
  readonly entity: ARCRestApiIndex;

  /**
   * @param entity The entity to update.
   */
  constructor(entity: ARCRestApiIndex);
}

/**
 * An event dispatched to the store to update list of projects in a single transaction.
 */
export class ARCRestApiUpdateBulkEvent extends CustomEvent<ARCModelUpdateBulkEventDetail<ARCRestApiIndex>> {
  /**
   * A list of entities used to initialize the event
   */
  readonly entities: ARCRestApiIndex[];

  /**
   * @param entities A list of entities to update.
   */
  constructor(entities: ARCRestApiIndex[]);
}

/**
 * An event dispatched from the store after a REST API index data has changed
 */
export class ARCRestApiUpdatedEvent extends CustomEvent<ARCEntityChangeRecord<ARCRestApiIndex>> {
  /**
   * Change record for the updated entity used to initialize this event.
   */
  readonly changeRecord: ARCEntityChangeRecord<ARCRestApiIndex>;

  /**
   * @param record Change record for the updated entity
   */
  constructor(record: ARCEntityChangeRecord<ARCRestApiIndex>);
}

/**
 * An event dispatched to the store to delete a REST API index data
 */
export class ARCRestApiDeleteEvent extends CustomEvent<ARCModelDeleteEventDetail> {
  /**
   * The id of the entity used to initialize the event.
   */
  readonly id: string;

  /**
   * The optional revision used to initialize the event.
   */
  readonly rev?: string;

  /**
   * @param id The id of the entity to delete
   * @param rev The optional revision of the entity
   */
  constructor(id: string, rev?: string);
}

/**
 * An event dispatched by the store after a REST API index data was deleted.
 */
export class ARCRestApiDeletedEvent extends ARCEntityDeletedEvent {
  /**
   * @param id Deleted entity id
   * @param rev Updated revision
   */
  constructor(id: string, rev: string);
}

/**
 * An event to be dispatched to list the REST API index data
 */
export class ARCRestApiListEvent extends ARCEntityListEvent<ARCRestApiIndex> {
  /**
   * @param opts Query options.
   */
  constructor(opts?: ARCModelListOptions);
}

/**
 * An event to be dispatched to read a REST API data model.
 */
export class ARCRestApiDataReadEvent extends CustomEvent<ARCModelReadEventDetail<ARCRestApi>> {
  /**
   * Entity revision ID used to initialize the event.
   */
  readonly rev?: string;

  /**
   * Entity id used to initialize the event.
   */
  readonly id: string;

  /**
   * @param id The entity id
   * @param rev The entity revision
   */
  constructor(id: string, rev?: string);
}

/**
 * An event dispatched to update a REST API data model.
 */
export class ARCRestApiDataUpdateEvent extends CustomEvent<ARCModelUpdateEventDetail<ARCRestApi>> {
  /**
   * The entity used to initialize this event
   */
  readonly entity: ARCRestApi;

  /**
   * @param entity The entity to update.
   */
  constructor(entity: ARCRestApi);
}

/**
 * An event dispatched from the store after a REST API data model has changed
 */
export class ARCRestApiDataUpdatedEvent extends CustomEvent<ARCEntityChangeRecord<ARCRestApi>> {
  /**
   * Change record for the updated entity used to initialize this event.
   */
  readonly changeRecord: ARCEntityChangeRecord<ARCRestApi>;

  /**
   * @param record Change record for the updated entity
   */
  constructor(record: ARCEntityChangeRecord<ARCRestApi>);
}

/**
 * An event dispatched to the store to delete a REST API version data
 */
export class ARCRestApiVersionDeleteEvent extends CustomEvent<ARCModelDeleteEventDetail> {
  /**
   * The id of the entity used to initialize the event.
   */
  readonly id: string;

  /**
   * The API version used to initialize the event.
   */
  readonly version: string;

  /**
   * @param id The id of the entity to delete
   * @param version The version of the API to delete
   */
  constructor(id: string, version: string);
}

/**
 * An event dispatched by the store after a REST API version was deleted.
 */
export class ARCRestApiVersionDeletedEvent extends ARCEntityDeletedEvent {
  /**
   * Index id of the removed item
   */
  readonly indexId: string;

  /**
   * Removed version name
   */
  readonly version: string;

  /**
   * @param id Deleted entity id
   * @param rev Updated revision
   * @param indexId Index id of the removed item
   * @param version Removed version name
   */
  constructor(id: string, rev: string, indexId: string, version: string);
}

/**
 * Dispatches an event handled by the data store to read the REST API index metadata.
 *
 * @param target A node on which to dispatch the event.
 * @param id The entity id
 * @param rev The optional revision
 * @returns Promise resolved to the entity
 */
export declare function readAction(target: EventTarget, id: string, rev?: string): Promise<ARCRestApiIndex>;

/**
 * Dispatches an event handled by the data store to update an API Index entity
 *
 * @param target A node on which to dispatch the event.
 * @param entity The entity to update.
 * @returns Promise resolved to a the change record
 */
export declare function updateAction(target: EventTarget, entity: ARCRestApiIndex): ARCEntityChangeRecord<ARCRestApiIndex>;

/**
 * Dispatches an event handled by the data store to update a list of REST API index entities.
 *
 * @param target A node on which to dispatch the event.
 * @param entities The list of entities to update.
 * @returns Promise resolved to a list of change records
 */
export declare function updateBulkAction(target: EventTarget, entities: ARCRestApiIndex[]): Promise<ARCEntityChangeRecord<ARCRestApiIndex>[]>;

/**
 * Dispatches an event handled by the data store to delete a RETS API.
 *
 * @param target A node on which to dispatch the event.
 * @param id The id of the entity to delete.
 * @param rev The revision of the entity.
 * @returns Promise resolved to the delete record
 */
export declare function deleteAction(target: EventTarget, id: string, rev?: string): Promise<DeletedEntity>;

/**
 * Dispatches an event to list the REST API index data.
 *
 * @param target A node on which to dispatch the event.
 * @param opts Query options.
 * @returns List query result.
 */
export declare function listAction(target: EventTarget, opts?: ARCModelListOptions): Promise<ARCModelListResult<ARCRestApiIndex>>;

/**
 * Dispatches an event handled by the data store to read the REST API data metadata.
 *
 * @param target A node on which to dispatch the event.
 * @param id The entity id
 * @param rev The optional revision
 * @returns Promise resolved to the entity
 */
export declare function dataReadAction(target: EventTarget, id: string, rev?: string): Promise<ARCRestApi>;

/**
 * Dispatches an event handled by the data store to update a REST API data entity
 *
 * @param target A node on which to dispatch the event.
 * @param entity The entity to update.
 * @returns Promise resolved to a the change record
 */
export declare function dataUpdateAction(target: EventTarget, entity: ARCRestApi): Promise<ARCEntityChangeRecord<ARCRestApi>>;

/**
 * Dispatches an event handled by the data store to delete a version of a RETS API.
 *
 * @param target A node on which to dispatch the event.
 * @param id The id of the entity to delete.
 * @param version The version of the API to delete
 * @returns Promise resolved to the delete record
 */
export declare function versionDeleteAction(target: EventTarget, id: string, version: string): Promise<DeletedEntity>;

//
// State events
//

/**
 * Dispatches an event after a REST API index entity was updated
 *
 * @param target A node on which to dispatch the event.
 * @param record Change record
 */
export declare function updatedState(target: EventTarget, record: ARCEntityChangeRecord<ARCRestApiIndex>): void;

/**
 * Dispatches an event after a REST API was deleted
 *
 * @param target A node on which to dispatch the event.
 * @param id Deleted entity id
 * @param rev Updated revision of the entity.
 */
export declare function deletedState(target: EventTarget, id: string, rev: string): void;

/**
 * Dispatches an event after a REST API data entity was updated
 *
 * @param target A node on which to dispatch the event.
 * @param record Change record
 */
export declare function dataUpdatedState(target: EventTarget, record: ARCEntityChangeRecord<ARCRestApi>): void;

/**
 * Dispatches an event after a REST API version was deleted
 *
 * @param target A node on which to dispatch the event.
 * @param id Deleted entity id
 * @param rev Updated revision of the entity.
 * @param indexId Index id of the removed item
 * @param version Removed version name
 */
export declare function versionDeletedState(target: EventTarget, id: string, rev: string, indexId: string, version: string): void;
