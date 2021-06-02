/**
@license
Copyright 2018 The Advanced REST client authors <arc@mulesoft.com>
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
import { TransportEventTypes, ArcModelEventTypes, ArcModelEvents } from '@advanced-rest-client/arc-events';
import { ArcBaseModel } from './ArcBaseModel.js';

/* eslint-disable no-plusplus */

/** @typedef {import('@advanced-rest-client/arc-types').UrlHistory.ARCUrlHistory} ARCUrlHistory */
/** @typedef {import('@advanced-rest-client/arc-events').ARCHistoryUrlInsertEvent} ARCHistoryUrlInsertEvent */
/** @typedef {import('@advanced-rest-client/arc-events').ARCHistoryUrlListEvent} ARCHistoryUrlListEvent */
/** @typedef {import('@advanced-rest-client/arc-events').ARCHistoryUrlQueryEvent} ARCHistoryUrlQueryEvent */
/** @typedef {import('@advanced-rest-client/arc-events').ApiTransportEvent} ApiTransportEvent */
/** @typedef {import('@advanced-rest-client/arc-types').Model.ARCEntityChangeRecord} ARCEntityChangeRecord */
/** @typedef {import('@advanced-rest-client/arc-types').Model.ARCModelListOptions} ARCModelListOptions */
/** @typedef {import('@advanced-rest-client/arc-types').Model.ARCModelListResult} ARCModelListResult */

/**
 * A function used to sort query list items. It relays on two properties that
 * are set by query function on array entries: `_time` which is a timestamp of
 * the entry and `cnt` which is number of times the URL has been used.
 *
 * @param {ARCUrlHistory} a
 * @param {ARCUrlHistory} b
 * @return {number}
 */
export function sortFunction(a, b) {
  const aTime = a.midnight;
  const bTime = b.midnight;
  if (aTime > bTime) {
    return 1;
  }
  const aCnt = a.cnt;
  const bCnt = b.cnt;
  if (aTime === bTime) {
    if (aCnt > bCnt) {
      return 1;
    }
    if (aCnt < bCnt) {
      return -1;
    }
    return 0;
  }
  return -1;
}

export const insertHandler = Symbol('insertHandler');
export const listHandler = Symbol('listHandler');
export const queryHandler = Symbol('queryHandler');
export const transportHandler = Symbol('transportHandler');

/**
 * An element that saves Request URL in the history and serves list
 * of saved URLs.
 *
 * The `url-history-query` event expects the `q` property set on the `detail`
 * object. It is passed to the `query()` function and result of calling this
 * function is set on detail's `result` property.
 */
export class UrlHistoryModel extends ArcBaseModel {
  constructor() {
    super('url-history', 10);
    this[insertHandler] = this[insertHandler].bind(this);
    this[listHandler] = this[listHandler].bind(this);
    this[queryHandler] = this[queryHandler].bind(this);
    this[transportHandler] = this[transportHandler].bind(this);
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
      const historyItem = /** @type ARCUrlHistory */ (item);
      if (!historyItem.midnight) {
        const day = new Date(historyItem.time);
        day.setHours(0, 0, 0, 0);
        historyItem.midnight = day.getTime();
      }
      historyItem.url = historyItem.url || historyItem._id;
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
    const lower = url.toLowerCase();
    const day = new Date();
    const currentTimestamp = day.getTime();
    day.setHours(0, 0, 0, 0);
    const midnight = day.getTime();
    try {
      obj = /** @type ARCUrlHistory */ (await this.read(lower));
      obj.cnt++;
      obj.time = currentTimestamp;
      obj.midnight = midnight;
      if (!obj.url) {
        obj.url = url;
      }
    } catch (e) {
      obj = {
        _id: lower,
        url,
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
   * @param {ARCUrlHistory} obj A project to save / update
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
    ArcModelEvents.UrlHistory.State.update(this, record);
    return record;
  }

  /**
   * Queries for websocket history objects.
   *
   * @param {string} q A partial url to match results. If not set it returns whole history.
   * @return {Promise<ARCUrlHistory[]>} A promise resolved to a list of PouchDB documents.
   */
  async query(q) {
    const query = q.toLowerCase();
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
      const historyItem = /** @type ARCUrlHistory */ (item.doc);
      if (!historyItem.midnight) {
        const day = new Date(historyItem.time);
        day.setHours(0, 0, 0, 0);
        historyItem.midnight = day.getTime();
      }
      historyItem.url = historyItem.url || historyItem._id;
      return historyItem;
    });
    result.sort(sortFunction);
    return result;
  }

  _attachListeners(node) {
    super._attachListeners(node);
    node.addEventListener(ArcModelEventTypes.UrlHistory.insert, this[insertHandler]);
    node.addEventListener(ArcModelEventTypes.UrlHistory.list, this[listHandler]);
    node.addEventListener(ArcModelEventTypes.UrlHistory.query, this[queryHandler]);
    node.addEventListener(TransportEventTypes.transport, this[transportHandler]);
  }

  _detachListeners(node) {
    super._detachListeners(node);
    node.removeEventListener(ArcModelEventTypes.UrlHistory.insert, this[insertHandler]);
    node.removeEventListener(ArcModelEventTypes.UrlHistory.list, this[listHandler]);
    node.removeEventListener(ArcModelEventTypes.UrlHistory.query, this[queryHandler]);
    node.removeEventListener(TransportEventTypes.transport, this[transportHandler]);
  }

  /**
   * @param {ARCHistoryUrlInsertEvent} e
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
   * @param {ARCHistoryUrlListEvent} e
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
   * @param {ARCHistoryUrlQueryEvent} e
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

  /**
   * Processes API response action.
   * @param {ApiTransportEvent} e
   */
  [transportHandler](e) {
    const { request } = e.detail;
    // Async so the response can be rendered to the user faster.
    setTimeout(() => this.addUrl(request.url)); 
  }
}
