import {
  ARCModelReadBulkEventDetail,
  ARCModelUpdateEventDetail,
  ARCEntityListEvent,
} from './BaseEvents';
import { ARCWebsocketUrlHistory } from '../WebsocketUrlHistoryModel';
import {
  ARCEntityChangeRecord,
  ARCModelListOptions,
  ARCModelListResult,
} from '../types';

export declare const urlValue: symbol;
export declare const changeRecordValue: symbol;
export declare const termValue: symbol;

/**
 * An event dispatched to the store WS url in the history
 */
export declare class ARCWSUrlInsertEvent extends CustomEvent<ARCModelUpdateEventDetail<ARCWebsocketUrlHistory>> {
  /**
   * The URL to store used to initialize this event
   */
  readonly url: string;

  /**
   * @param url The URL to store
   */
  constructor(url: string);
}

/**
 * An event dispatched from the store after an URL is updated
 */
export declare class ARCWSUrlUpdatedEvent extends Event {
  /**
   * The change record used to initialize this event
   */
  readonly changeRecord: ARCEntityChangeRecord<ARCWebsocketUrlHistory>;

  /**
   * @param record URL change record.
   */
  constructor(record: ARCEntityChangeRecord<ARCWebsocketUrlHistory>);
}

/**
 * An event to be dispatched to list WS URL history
 */
export declare class ARCWSUrlListEvent extends ARCEntityListEvent<ARCWebsocketUrlHistory> {
  /**
   * @param opts Query options.
   */
  constructor(opts?: ARCModelListOptions);
}

/**
 * An event dispatched by the UI when querying for a list of hostiry URLs
 */
export declare class ARCWSUrlQueryEvent extends CustomEvent<ARCModelReadBulkEventDetail<ARCWebsocketUrlHistory>> {
  /**
   * The search term for the query function used to initialize the event
   */
  readonly term: string;

  /**
   * @param {string} term The search term for the query function
   */
  constructor(term: string);
}

/**
 * Dispatches an event handled by the data store to add a WS URL to the history
 *
 * @param target A node on which to dispatch the event.
 * @param url The URL to insert
 * @returns Promise resolved to the change record for the URL
 */
export declare function insertAction(target: EventTarget, url: string): Promise<ARCEntityChangeRecord<ARCWebsocketUrlHistory>>;

/**
 * Dispatches an event handled by the data store to list a page of the results
 *
 * @param target A node on which to dispatch the event.
 * @param opts List options.
 * @returns Promise resolved to the change record for the URL
 */
export declare function listAction(target: EventTarget, opts?: ARCModelListOptions): Promise<ARCModelListResult<ARCWebsocketUrlHistory>>;

/**
 * Dispatches an event handled by the data store to list a page of the results
 *
 * @param target A node on which to dispatch the event.
 * @param term THe query term
 * @returns Promise resolved to the change record for the URL
 */
export declare function queryAction(target: EventTarget, term: string): Promise<ARCWebsocketUrlHistory[]>;

//
// State events
//

/**
 * Dispatches an event after an URL entity was updated
 *
 * @param target A node on which to dispatch the event.
 * @param record The change record
 */
export declare function updatedState(target: EventTarget, record: ARCEntityChangeRecord<ARCWebsocketUrlHistory>): void;
