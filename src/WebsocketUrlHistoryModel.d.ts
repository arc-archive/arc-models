import {ArcBaseModel} from './ArcBaseModel.js';
import {
  Entity,
  ARCEntityChangeRecord,
  ARCModelListOptions,
  ARCModelListResult,
} from './types';

export declare interface ARCWebsocketUrlHistory extends Entity {
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

export declare function sortFunction(a: ARCWebsocketUrlHistory, b: ARCWebsocketUrlHistory): number;

export const insertHandler: symbol;
export const listHandler: symbol;
export const queryHandler: symbol;

/**
 * Gives an access to the WebScoket entities.
 */
export declare class WebsocketUrlHistoryModel extends ArcBaseModel {
  constructor();

  /**
   * Lists all project objects.
   *
   * @param opts Query options.
   * @returns A promise resolved to a list of projects.
   */
  list(opts?: ARCModelListOptions): Promise<ARCModelListResult<ARCWebsocketUrlHistory>>;

  /**
   * Adds an URL to the history and checks for already existing entires.
   * @param url The URL to insert
   * @returns A promise resolved to the URL change record
   */
  addUrl(url: string): Promise<ARCEntityChangeRecord<ARCWebsocketUrlHistory>>;

  /**
   * Updates / saves the object in the datastore.
   * This function dispatches the change event
   *
   * @param obj An entity to store
   * @returns A promise resolved to the URL change record
   */
  update(obj: ARCWebsocketUrlHistory): Promise<ARCEntityChangeRecord<ARCWebsocketUrlHistory>>;

  /**
   * Queries for websocket history objects.
   *
   * @param query A partial url to match results. If not set it returns whole history.
   * @returns A promise resolved to a list of PouchDB documents.
   */
  query(query: string): Promise<ARCWebsocketUrlHistory[]>;

  _attachListeners(node: EventTarget): void;
  _detachListeners(node: EventTarget): void;
}
