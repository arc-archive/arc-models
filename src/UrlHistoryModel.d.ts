import {ArcBaseModel} from './ArcBaseModel.js';
import {
  Entity,
  ARCEntityChangeRecord,
  ARCModelListOptions,
  ARCModelListResult,
} from './types';

export declare interface ARCUrlHistory extends Entity {
  /**
   * A number of times the URL was used
   */
  cnt: number;
  /**
   * Last use timestamp.
   */
  time: number;
  /**
   * The request URL stored in the history.
   */
  url: string;
  /**
   * A timestamp of the midnight that corresponds to the `time` property.
   */
  midnight: number;
}

export const insertHandler: symbol;
export const listHandler: symbol;
export const queryHandler: symbol;

/**
 * A function used to sort query list items. It relays on two properties that
 * are set by query function on array entries: `_time` which is a timestamp of
 * the entry and `cnt` which is number of times the URL has been used.
 */
export declare function sortFunction(a: ARCUrlHistory, b: ARCUrlHistory): number;

/**
 * An element that saves Request URL in the history and serves list
 * of saved URLs.
 *
 * The `url-history-query` event expects the `q` property set on the `detail`
 * object. It is passed to the `query()` function and result of calling this
 * function is set on detail's `result` property.
 */
export declare class UrlHistoryModel extends ArcBaseModel {
  constructor();
  /**
   * Lists all project objects.
   *
   * @param opts Query options.
   * @returns A promise resolved to a list of projects.
   */
  list(opts?: ARCModelListOptions): Promise<ARCModelListResult<ARCUrlHistory>>;

  /**
   * Adds an URL to the history and checks for already existing entires.
   * @param url The URL to insert
   * @returns A promise resolved to the URL change record
   */
  addUrl(url: string): Promise<ARCEntityChangeRecord<ARCUrlHistory>>;

  /**
   * Updates / saves the object in the datastore.
   * This function dispatches the change event
   *
   * @param obj An entity to store
   * @returns A promise resolved to the URL change record
   */
  update(obj: ARCUrlHistory): Promise<ARCEntityChangeRecord<ARCUrlHistory>>;

  /**
   * Queries for websocket history objects.
   *
   * @param query A partial url to match results. If not set it returns whole history.
   * @returns A promise resolved to a list of PouchDB documents.
   */
  query(query: string): Promise<ARCUrlHistory[]>;

  _attachListeners(node: EventTarget): void;
  _detachListeners(node: EventTarget): void;
}
