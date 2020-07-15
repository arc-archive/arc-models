/**
@license
Copyright 2016 The Advanced REST client authors <arc@mulesoft.com>
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
*/
import { ArcBaseModel } from './ArcBaseModel.js';
import { ArcModelEventTypes } from './events/ArcModelEventTypes.js';
import { ArcModelEvents } from './events/ArcModelEvents.js';

/** @typedef {import('./WebsocketUrlHistoryModel').ARCWebsocketUrlHistory} ARCWebsocketUrlHistory */
/** @typedef {import('./events/WSUrlHistoryEvents').ARCWSUrlInsertEvent} ARCWSUrlInsertEvent */
/** @typedef {import('./events/WSUrlHistoryEvents').ARCWSUrlListEvent} ARCWSUrlListEvent */
/** @typedef {import('./events/WSUrlHistoryEvents').ARCWSUrlQueryEvent} ARCWSUrlQueryEvent */
/** @typedef {import('./types').ARCModelListResult} ARCModelListResult */
/** @typedef {import('./types').ARCModelListOptions} ARCModelListOptions */
/** @typedef {import('./types').ARCEntityChangeRecord} ARCEntityChangeRecord */

/* eslint-disable no-plusplus */
/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */

/**
 * Sotring functions for url history
 * @param {ARCWebsocketUrlHistory} a
 * @param {ARCWebsocketUrlHistory} b
 * @return {number}
 */
export function sortFunction(a, b) {
  const aTime = a.midnight;
  const bTime = b.midnight;
  if (aTime > bTime) {
    return 1;
  }
  if (aTime < bTime) {
    return -1;
  }
  const aCnt = a.cnt;
  const bCnt = b.cnt;
  if (aCnt > bCnt) {
    return 1;
  }
  if (aCnt < bCnt) {
    return -1;
  }
  return 0;
}

export const insertHandler = Symbol('insertHandler');
export const listHandler = Symbol('listHandler');
export const queryHandler = Symbol('queryHandler');

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
export class WebsocketUrlHistoryModel extends ArcBaseModel {
  constructor() {
    super('websocket-url-history', 10);
    this[insertHandler] = this[insertHandler].bind(this);
    this[listHandler] = this[listHandler].bind(this);
    this[queryHandler] = this[queryHandler].bind(this);
  }

  /**
   * Lists all project objects.
   *
   * @param {ARCModelListOptions=} opts Query options.
   * @return {Promise<ARCModelListResult>} A promise resolved to a list of projects.
   */
  async list(opts={}) {
    const result = await this.listEntities(this.db, opts);
    result.items.forEach((item) => {
      const historyItem = /** @type ARCWebsocketUrlHistory */ (item);
      if (!historyItem.midnight) {
        const day = new Date(historyItem.time);
        day.setHours(0, 0, 0, 0);
        historyItem.midnight = day.getTime();
      }
    });
    return result;
  }

  /**
   * Adds an URL to the history and checks for already existing entires.
   * @param {string} url The URL to insert
   * @return {Promise<ARCEntityChangeRecord>} A promise resolved to the URL change record
   */
  async addUrl(url) {
    let obj;
    const day = new Date();
    const currentTimestamp = day.getTime();
    day.setHours(0, 0, 0, 0);
    const midnight = day.getTime();
    try {
      obj = /** @type ARCWebsocketUrlHistory */ (await this.read(url));
      obj.cnt++;
      obj.time = currentTimestamp;
      obj.midnight = midnight;
    } catch (e) {
      obj = {
        _id: url,
        cnt: 1,
        time: currentTimestamp,
        midnight,
      };
    }
    return this.update(obj);
  }

  /**
   * Updates / saves the object in the datastore.
   * This function fires `websocket-url-history-changed` event.
   *
   * @param {ARCWebsocketUrlHistory} obj A project to save / update
   * @return {Promise<ARCEntityChangeRecord>} A promise resolved to the URL change record
   */
  async update(obj) {
    const item = { ...obj };
    const oldRev = item._rev;
    const result = await this.db.put(item);
    item._rev = result.rev;
    const record = {
      id: item._id,
      rev: result.rev,
      oldRev,
      item,
    };
    ArcModelEvents.WSUrlHistory.State.update(this, record);
    return record;
  }

  /**
   * Queries for websocket history objects.
   *
   * @param {string} query A partial url to match results. If not set it returns whole history.
   * @return {Promise<ARCWebsocketUrlHistory[]>} A promise resolved to a list of PouchDB documents.
   */
  async query(query) {
    const { db } = this;
    const initial = await db.allDocs();
    const { rows } = initial;
    const keys = [];
    rows.forEach((item) => {
      if (query && !item.id.includes(query)) {
        return;
      }
      keys[keys.length] = item.id;
    });
    if (!keys.length) {
      return [];
    }
    const response = await db.allDocs({
      keys,
      include_docs: true,
    });
    const result = response.rows.map((item) => {
      const historyItem = /** @type ARCWebsocketUrlHistory */ (item.doc);
      if (!historyItem.midnight) {
        const day = new Date(historyItem.time);
        day.setHours(0, 0, 0, 0);
        historyItem.midnight = day.getTime();
      }
      return historyItem;
    });
    result.sort(sortFunction);
    return result;
  }

  _attachListeners(node) {
    super._attachListeners(node);
    node.addEventListener(ArcModelEventTypes.WSUrlHistory.insert, this[insertHandler]);
    node.addEventListener(ArcModelEventTypes.WSUrlHistory.list, this[listHandler]);
    node.addEventListener(ArcModelEventTypes.WSUrlHistory.query, this[queryHandler]);
  }

  _detachListeners(node) {
    super._detachListeners(node);
    node.removeEventListener(ArcModelEventTypes.WSUrlHistory.insert, this[insertHandler]);
    node.removeEventListener(ArcModelEventTypes.WSUrlHistory.list, this[listHandler]);
    node.removeEventListener(ArcModelEventTypes.WSUrlHistory.query, this[queryHandler]);
  }

  /**
   * @param {ARCWSUrlInsertEvent} e
   */
  [insertHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const { url } = e;
    if (typeof url !== 'string') {
      e.detail.result = Promise.reject(new Error('Expected url argument to be a string'));
      return;
    }
    e.detail.result = this.addUrl(url);
  }

  /**
   * @param {ARCWSUrlListEvent} e
   */
  [listHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const { limit, nextPageToken } = e;
    e.detail.result = this.list({
      limit,
      nextPageToken,
    });
  }

  /**
   * @param {ARCWSUrlQueryEvent} e
   */
  [queryHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const { term } = e;
    e.detail.result = this.query(term);
  }
}
