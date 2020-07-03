import { ARCEntityChangeRecord, ARCModelQueryResultDetail, ARCModelQueryOptions } from '../types';
/**
 * Detail definition for a read event.
 */
export declare interface ARCModelReadEventDetail<T> {
  /**
   * This property is set by the models, a promise resolved to the
   * requested object.
   */
  result?: Promise<T>|null;
}

/**
 * Detail definition for a read event.
 */
export declare interface ARCModelReadBulkEventDetail<T> {
  /**
   * The list of ids of the entities to read.
   */
  ids: string[];
  /**
   * This property is set by the models, a promise resolved to the
   * list of requested object.
   */
  result?: Promise<T[]>|null;
}

/**
 * Detail definition for an object create/update event.
 */
export declare interface ARCModelUpdateEventDetail<T> {
  /**
   * This property is set by the store, a promise resolved when a transaction finish.
   * The value if the same as the value of the change state event.
   */
  result?: Promise<ARCEntityChangeRecord<T>>;
}

/**
 * Detail definition for a bulk object create/update event.
 */
export declare interface ARCModelUpdateBulkEventDetail<T> {
  /**
   * This property is set by the store, a promise resolved when the transaction finish.
   */
  result?: Promise<ARCEntityChangeRecord<T>[]>;
}

/**
 * Detail definition for an entity delete event.
 */
export declare interface ARCModelDeleteEventDetail {
  /**
   * This property is set by the data store, a promise resolved to the
   * new revision of an entity.
   */
  result?: Promise<string>|null;
}

export declare class ARCEntityDeletedEvent extends CustomEvent<void> {
  /**
   * The id of the deleted entity
   */
  readonly id: string;
  /**
   * New revision id.
   */
  readonly rev: string;
  /**
   * @param type The event type
   * @param id Entity id
   * @param rev Entity updated revision id
   */
  constructor(type: string, id: string, rev: string);
}

export declare class ARCEntityQueryEvent<T> extends CustomEvent<ARCModelQueryResultDetail<T>> {
  /**
   * The number of results per the page.
   */
  readonly limit?: number|null;
  /**
   * A string that should be used with pagination.
   */
  readonly nextPageToken?: string|null;

  /**
   * @param type The event type
   * @param opts Query options.
   */
  constructor(type: string, opts?: ARCModelQueryOptions);
}
