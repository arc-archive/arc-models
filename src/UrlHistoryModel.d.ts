import {ArcBaseModel} from './ArcBaseModel.js';
import { Entity } from './types';

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
}


/**
 * A function used to sort query list items. It relays on two properties that
 * are set by query function on array entries: `_time` which is a timestamp of
 * the entry and `cnt` which is number of times the URL has been used.
 */
export declare function sortFunction(a: object, b: object): number;

/**
 * An element that saves Request URL in the history and serves list
 * of saved URLs.
 *
 * The `url-history-query` event expects the `q` property set on the `detail`
 * object. It is passed to the `query()` function and result of calling this
 * function is set on detail's `result` property.
 *
 * ### Example
 *
 * ```javascript
 *
 * const e = new CustomEvent('url-history-query', {
 *  detail: {
 *    q: 'http://mulesoft.com/path/'
 *  },
 *  cancelable: true,
 *  bubbles: true,
 *  composed: true // if fired in shaddow DOM
 * });
 * document.body.dispatchEvent(e);
 *
 * e.detail.result.then((urls) => console.log(urls));
 * ```
 *
 * The `url-history-store` requires the `value` property to be set on
 * the `detail` object and it is passed to the `store()` function.
 *
 * ### Example
 *
 * ```javascript
 * const e = new CustomEvent('url-history-store', {
 *  detail: {
 *    value: 'http://mulesoft.com/path/'
 *  },
 *  cancelable: true,
 *  bubbles: true,
 *  composed: true
 * });
 * document.dispatchEvent(e);
 * ```
 *
 * Both events are cancelled and propagation of the event is stopped.
 * Therefore the event should be dispatched with `caneclable` flag set to true.
 *
 * The element listens for events on the `window` object so it can be placed
 * anywhere in the DOM.
 *
 * ### Example
 *
 * ```html
 * <body>
 *  <url-history-saver></url-history-saver>
 * </body>
 * ```
 */
export declare class UrlHistoryModel extends ArcBaseModel {

  /**
   * @param dbname Name of the data store
   * @param revsLimit Limit number of revisions on the data store.
   */
  constructor();
  _attachListeners(node: EventTarget): void;
  _detachListeners(node: EventTarget): void;

  /**
   * Handles `url-history-store` custom event and stores an URL in the
   * datastore.
   * The event is canceled and propagation is topped upon handling. The
   * event should be fired with `cancelable` flag set to `true`.
   *
   * It calls `store()` function with the `value` property of the `detail`
   * object as an attribute.
   *
   * It creates a new `result` property on the `detail` object which is a
   * result of calling `store()` function.
   */
  _handleStore(e: CustomEvent): void;

  /**
   * It creates new entry if the URL wasn't already in the data store or
   * updates a `time` and `cnt` property of existing item.
   *
   * @param url A URL to store in the history store.
   * @returns Resolved promise to the insert response of PouchDB
   * object (`ok`, `id` and `rev` keys)
   */
  store(url: string): Promise<PouchDB.Core.Response>;

  /**
   * Handles the `url-history-query` custom event.
   * It cancels the event and prohibiits bubbling. Therefore the event should be
   * fired as a `cancelable`. It adds the `result` property to the `detail`
   * object which carries a Promise that will resolve to a list of PouchDB
   * documentnts. It is the same as result as for calling `query()` functiuon.
   *
   * The event must contain a `q` property with the query string that is passed
   * to the `query()` function.
   */
  _handleQuery(e: CustomEvent): void;

  /**
   * Gets a list of maching URLs from the datastore.
   * List elements are carrying the `url` property with the full
   * URL and `cnt` property with number of times this URL has been updated in
   * the data store. `cnt` is used to sort the results.
   *
   * Additional properties are regular PouchDB properties like `_id` and `_rev`.
   *
   * @param q A string to search for. It result with entries that url
   * contains (not start with!) a `q`.
   * @returns Resolved promise to a list of history items.
   */
  query(q: string): Promise<ARCUrlHistory[]>;
}
