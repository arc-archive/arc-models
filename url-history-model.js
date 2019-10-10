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
import { ArcBaseModel } from './src/ArcBaseModel.js';
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
 *
 * @customElement
 * @polymer
 * @memberof LogicElements
 */
export class UrlHistoryModel extends ArcBaseModel {
  constructor() {
    super('url-history', 10);
    this._handleStore = this._handleStore.bind(this);
    this._handleQuery = this._handleQuery.bind(this);
  }

  _attachListeners(node) {
    super._attachListeners(node);
    node.addEventListener('url-history-store', this._handleStore);
    node.addEventListener('url-history-query', this._handleQuery);
  }

  _detachListeners(node) {
    super._detachListeners(node);
    node.removeEventListener('url-history-store', this._handleStore);
    node.removeEventListener('url-history-query', this._handleQuery);
  }
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
   *
   * @param {CustomEvent} e
   */
  _handleStore(e) {
    e.preventDefault();
    e.stopPropagation();
    const { value } = e.detail;
    if (!value) {
      e.detail.result = Promise.reject(new Error('The "value" property is not defined.'));
      return;
    }
    e.detail.result = this.store(value);
  }
  /**
   * It creates new entry if the URL wasn't already in the data store or
   * updates a `time` and `cnt` property of existing item.
   *
   * @param {String} url A URL to store in the history store.
   * @return {Promise} Resolved promise to the insert response of PouchDB
   * object (`ok`, `id` and `rev` keys)
   */
  store(url) {
    const db = this.db;
    const lower = url.toLowerCase();
    return db.get(lower)
    .catch((e) => {
      if (e.status === 404) {
        return;
      }
      return this._handleException(e);
    })
    .then((doc) => {
      if (!doc) {
        doc = {
          _id: lower,
          cnt: 1,
          time: Date.now(),
          url: url
        };
      } else {
        doc.cnt++;
        doc.time = Date.now();
      }
      return db.put(doc);
    })
    .catch((cause) => this._handleException(cause));
  }
  /**
   * Handles the `url-history-query` custom event.
   * It cancels the event and prohibiits bubbling. Therefore the event should be
   * fired as a `cancelable`. It adds the `result` property to the `detail`
   * object which carries a Promise that will resolve to a list of PouchDB
   * documentnts. It is the same as result as for calling `query()` functiuon.
   *
   * The event must contain a `q` property with the query string that is passed
   * to the `query()` function.
   *
   * @param {CustomEvent} e
   */
  _handleQuery(e) {
    e.preventDefault();
    e.stopPropagation();
    const { q } = e.detail;
    if (!q) {
      const err = new Error('The "q" property is not defined.');
      e.detail.result = Promise.reject(err);
      return;
    }
    e.detail.result = this.query(q);
  }
  /**
   * Gets a list of maching URLs from the datastore.
   * List elements are carrying the `url` property with the full
   * URL and `cnt` property with number of times this URL has been updated in
   * the data store. `cnt` is used to sort the results.
   *
   * Additional properties are regular PouchDB properties like `_id` and `_rev`.
   *
   * @param {String} q A string to search for. It result with entries that url
   * contains (not start with!) a `q`.
   * @return {Promise} Resolved promise to a list of history items.
   */
  query(q) {
    const db = this.db;
    q = q.toLowerCase();
    return db.allDocs()
    .then((response) => {
      return response.rows.filter(function(item) {
        return item.id.indexOf(q) !== -1;
      });
    })
    .then((matches) => {
      const ps = matches.map(function(i) {
        return db.get(i.id);
      });
      return Promise.all(ps);
    })
    .then((items) => {
      // That's for sorting function.
      items = items.map(function(i) {
        const d = new Date(i.time);
        d.setHours(0, 0, 0, 0);
        i._time = d.getTime();
        i.url = i.url || i._id;
        return i;
      });
      return items.sort(this._sortFunction);
    })
    .catch((cause) => this._handleException(cause));
  }
  /**
   * A function used to sort query list items. It relays on two properties that
   * are set by query function on array entries: `_time` which is a timestamp of
   * the entry and `cnt` which is number of times the URL has been used.
   *
   * @param {Object} a
   * @param {Object} b
   * @return {Number}
   */
  _sortFunction(a, b) {
    const aTime = a._time;
    const bTime = b._time;
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
}
window.customElements.define('url-history-model', UrlHistoryModel);
