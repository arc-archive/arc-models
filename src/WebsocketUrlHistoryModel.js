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
import { computeTime } from './Utils.js';

/** @typedef {import('./WebsocketUrlHistoryModel').ARCWebsocketUrlHistory} ARCWebsocketUrlHistory */

/* eslint-disable no-plusplus */
/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */

export function sortFunction(a, b) {
  const aTime = a._time;
  const bTime = b._time;
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
    this._handleChange = this._handleChange.bind(this);
    this._handleRead = this._handleRead.bind(this);
    this._handleQuery = this._handleQuery.bind(this);
    this._handleQueryHistory = this._handleQueryHistory.bind(this);
  }

  _attachListeners(node) {
    super._attachListeners(node);
    node.addEventListener('websocket-url-history-changed', this._handleChange);
    node.addEventListener('websocket-url-history-read', this._handleRead);
    node.addEventListener('websocket-url-history-query', this._handleQuery);
    node.addEventListener(
      'websocket-url-history-list',
      this._handleQueryHistory
    );
  }

  _detachListeners(node) {
    super._detachListeners(node);
    node.removeEventListener(
      'websocket-url-history-changed',
      this._handleChange
    );
    node.removeEventListener('websocket-url-history-read', this._handleRead);
    node.removeEventListener('websocket-url-history-query', this._handleQuery);
    node.removeEventListener(
      'websocket-url-history-list',
      this._handleQueryHistory
    );
  }

  // Handles the read object event
  _handleRead(e) {
    if (this._eventCancelled(e)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    e.detail.result = this.read(e.detail.url).catch((ev) => {
      if (ev.status === 404) {
        return;
      }
      this._handleException(ev);
    });
  }

  _handleChange(e) {
    if (this._eventCancelled(e)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    if (!e.detail.item) {
      e.detail.result = Promise.reject(new Error('Missing "item" property.'));
      return;
    }
    if (!e.detail.item._id) {
      e.detail.result = Promise.reject(new Error('Missing "_id" property.'));
      return;
    }
    e.detail.result = this.update(e.detail.item).catch((ev) =>
      this._handleException(ev)
    );
  }

  /**
   * Updates / saves the object in the datastore.
   * This function fires `websocket-url-history-changed` event.
   *
   * @param {ARCWebsocketUrlHistory} obj A project to save / update
   * @return {Promise<ARCWebsocketUrlHistory>} Resolved promise to project object with updated `_rev`
   */
  async update(obj) {
    const item = { ...obj };
    const oldRev = item._rev;
    const result = await this.db.put(item);
    item._rev = result.rev;
    this._fireUpdated('websocket-url-history-changed', {
      item,
      oldRev,
    });
    return item;
  }

  _handleQueryHistory(e) {
    if (this._eventCancelled(e)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    e.detail.result = this.list().catch((ev) => this._handleException(ev));
  }

  _handleQuery(e) {
    if (this._eventCancelled(e)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const { q } = e.detail;
    e.detail.result = this.list(q).catch((ev) => this._handleException(ev));
  }

  /**
   * Lists websocket history objects.
   *
   * @param {string=} query A partial url to match results.
   * @return {Promise<ARCWebsocketUrlHistory[]>} A promise resolved to a list of PouchDB documents.
   */
  async list(query) {
    const { db } = this;
    const response = await db.allDocs();
    const { rows } = response;
    const result = [];
    for (let i = 0, len = rows.length; i < len; i++) {
      const item = rows[i];
      if (query && item.id.indexOf(query) === -1) {
        continue;
      }
      let doc = await db.get(item.id);
      doc = computeTime(doc);
      result.push(doc);
    }
    result.sort(sortFunction);
    return result;
  }
}
