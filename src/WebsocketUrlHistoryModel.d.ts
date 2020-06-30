import {ArcBaseModel} from './ArcBaseModel.js';

import { Entity } from './types';

export declare interface ARCWebsocketUrlHistory extends Entity {
  /**
   * A number of times the URL was used
   */
  cnt: number;
  /**
   * Last use timestamp.
   */
  time: number;
}

export declare function sortFunction(a: ARCWebsocketUrlHistory, b: ARCWebsocketUrlHistory): number;

/**
 * Events based access to websockets URL history datastore.
 *
 * Note: **All events must be cancelable.** When the event is cancelled by an instance
 * of the element it won't be handled again by other instance that possibly exists
 * in the DOM.
 *
 * Cancellable event is a request to models for change. Non-cancellable event
 * is a notification for views to update their values.
 * For example `request-object-changed` event notifies model to update object in
 * the datastore if the event is cancelable and to update views if it's not
 * cancellable.
 *
 * Each handled event contains the `result` property on the `detail` object. It
 * contains a `Promise` object with a result of the operation. Also, for update / delete
 * events the same non-cancelable event is fired.
 *
 * Events handled by this element are cancelled and propagation of the event is
 * stopped.
 */
export declare class WebsocketUrlHistoryModel extends ArcBaseModel {

  constructor();

  _attachListeners(node: EventTarget): void;
  _detachListeners(node: EventTarget): void;

  /**
   * Handles the read object event
   */
  _handleRead(e: CustomEvent): void;
  _handleChange(e: CustomEvent): void;

  /**
   * Updates / saves the object in the datastore.
   * This function fires `websocket-url-history-changed` event.
   *
   * @param obj A project to save / update
   * @returns Resolved promise to project object with updated `_rev`
   */
  update(obj: ARCWebsocketUrlHistory): Promise<ARCWebsocketUrlHistory>;
  _handleQueryHistory(e: CustomEvent): void;
  _handleQuery(e: CustomEvent): void;

  /**
   * Lists websocket history objects.
   *
   * @param query A partial url to match results.
   * @returns A promise resolved to a list of PouchDB documents.
   */
  list(query: string): Promise<ARCWebsocketUrlHistory[]>;
}
