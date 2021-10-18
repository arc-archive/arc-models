import { UrlHistory, Model } from '@advanced-rest-client/arc-types';
import {ArcBaseModel} from './ArcBaseModel.js';

export declare function sortFunction(a: UrlHistory.ARCWebsocketUrlHistory, b: UrlHistory.ARCWebsocketUrlHistory): number;

export const insertHandler: symbol;
export const listHandler: symbol;
export const queryHandler: symbol;

/**
 * Gives an access to the WebSocket entities.
 * @deprecated This has been moved to `@advanced-rest-client/idb-store`
 */
export declare class WebsocketUrlHistoryModel extends ArcBaseModel {
  constructor();

  /**
   * Lists all project objects.
   *
   * @param opts Query options.
   * @returns A promise resolved to a list of projects.
   */
  list(opts?: Model.ARCModelListOptions): Promise<Model.ARCModelListResult<UrlHistory.ARCWebsocketUrlHistory>>;

  /**
   * Adds an URL to the history and checks for already existing entires.
   * @param url The URL to insert
   * @returns A promise resolved to the URL change record
   */
  addUrl(url: string): Promise<Model.ARCEntityChangeRecord<UrlHistory.ARCWebsocketUrlHistory>>;

  /**
   * Updates / saves the object in the datastore.
   * This function dispatches the change event
   *
   * @param obj An entity to store
   * @returns A promise resolved to the URL change record
   */
  update(obj: UrlHistory.ARCWebsocketUrlHistory): Promise<Model.ARCEntityChangeRecord<UrlHistory.ARCWebsocketUrlHistory>>;

  /**
   * Queries for websocket history objects.
   *
   * @param query A partial url to match results. If not set it returns whole history.
   * @returns A promise resolved to a list of PouchDB documents.
   */
  query(query: string): Promise<UrlHistory.ARCWebsocketUrlHistory[]>;

  _attachListeners(node: EventTarget): void;
  _detachListeners(node: EventTarget): void;
}
