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
import '@advanced-rest-client/uuid-generator/uuid-generator.js';
/**
 * An element responsible for indexing and querying for URL data.
 *
 * To index an URL it requires the following properties:
 * - url - the URL to index
 * - id - datastore id of referenced object
 * - type - type of the object - it's data store name. Type is returned
 * with query results.
 *
 * It queries for indexed data by looking into URL structure. When the query
 * result is ready it returns ordered list of results (by relevance) with
 * `id` (referenced object), and `type`. The query function do not read the
 * data from referenced data store.
 *
 * The component is used to cooperate with saved/history request data model
 * and with REST APIs model. However it can index any URL.
 *
 * The component automatically handles request update/delete events to index or
 * remove index of a request object.
 *
 * ## Usage
 *
 * ### Storing URL data
 *
 * ```javascript
 * const e = new CustomEvent('url-index-update', {
 *  composed: true,
 *  bubbles: true,
 *  cancelable: true,
 *  detail: {
 *    data: [{
 *      id: 'xxx',
 *      type: 'saved-requests',
 *      url: 'https://domain.com'
 *    }]
 *  }
 * });
 * this.dispatchEvent(e);
 * e.detail.result
 * .then((result) => {
 *  console.log(result);
 * });
 * ```
 *
 * or directly on the component:
 *
 * ```javascript
 * const node = document.querySelector('url-indexer');
 * node.index([{
 *  id: 'xxx',
 *  type: 'saved',
 *  url: 'https://domain.com'
 * }])
 * .then((result) => {});
 * ```
 *
 * ### Querying for data
 *
 * ```javascript
 * const e = new CustomEvent('url-index-query', {
 *  composed: true,
 *  bubbles: true,
 *  cancelable: true,
 *  detail: {
 *    q: 'https://...',
 *    type: 'saved', // optional
 *    detailed: false // Optional, default to `false`
 *  }
 * });
 * this.dispatchEvent(e);
 * e.detail.result
 * .then((result) => {
 *  console.log(result);
 * });
 * ```
 *
 * or direct call:
 *
 * ```javascript
 * const node = document.querySelector('url-indexer');
 * node.query('https://...', {
 *  type: 'saved-requests', // optional
 *  detailed: false // Optional, default to `false`
 * })
 * .then((result) => {});
 * ```
 * See query method for description of parameters.
 *
 * @customElement
 * @memberof LogicElements
 */
export class UrlIndexer extends HTMLElement {
  /**
   * @return {Element} Instance of `uuid-generator`
   */
  get uuid() {
    if (this._uuid) {
      return this._uuid;
    }
    this._uuid = document.createElement('uuid-generator');
    return this._uuid;
  }

  get indexStoreName() {
    return 'request-index';
  }

  get indexStoreVersion() {
    return 1;
  }
  /**
   * @constructor
   */
  constructor() {
    super();
    this._indexUpdateHandler = this._indexUpdateHandler.bind(this);
    this._indexQueryHandler = this._indexQueryHandler.bind(this);
    this._requestChangeHandler = this._requestChangeHandler.bind(this);
    this._requestDeleteHandler = this._requestDeleteHandler.bind(this);
    this._deleteModelHandler = this._deleteModelHandler.bind(this);
  }

  connectedCallback() {
    window.addEventListener('url-index-update', this._indexUpdateHandler);
    window.addEventListener('url-index-query', this._indexQueryHandler);
    window.addEventListener('request-object-changed', this._requestChangeHandler);
    window.addEventListener('request-object-deleted', this._requestDeleteHandler);
    window.addEventListener('datastore-destroyed', this._deleteModelHandler);
  }

  disconnectedCallback() {
    if (this._uuid) {
      delete this._uuid;
    }
    window.removeEventListener('url-index-update', this._indexUpdateHandler);
    window.removeEventListener('url-index-query', this._indexQueryHandler);
    window.removeEventListener('request-object-changed', this._requestChangeHandler);
    window.removeEventListener('request-object-deleted', this._requestDeleteHandler);
    window.removeEventListener('datastore-destroyed', this._deleteModelHandler);
  }

  _indexUpdateHandler(e) {
    if (e.defaultPrevented) {
      return;
    }
    const { data } = e.detail;
    e.detail.result = this.index(data);
  }

  _indexQueryHandler(e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    const query = e.detail.q;
    const opts = {};
    if (e.detail.type) {
      opts.type = this._normalizeType(e.detail.type);
    }
    if (e.detail.detailed) {
      opts.detailed = e.detail.detailed;
    }
    e.detail.result = this.query(query, opts);
  }

  _normalizeType(type) {
    switch (type) {
      case 'saved-requests':
        return 'saved';
      case 'history-requests':
        return 'history';
      default:
        return type;
    }
  }

  _requestChangeHandler(e) {
    if (e.cancelable) {
      return;
    }
    const r = e.detail.request;
    const type = this._normalizeType(r.type);
    this._indexDebounce(r._id, r.url, type);
  }
  /**
   * Calles index function with debouncer.
   * The debouncer runs the queue after 25 ms. Bulk operations should be called
   * onece unless there's a lot of data to process.
   *
   * @param {String} id Request ID
   * @param {String} url Request URL
   * @param {String} type Request type (saved or history)
   */
  _indexDebounce(id, url, type) {
    if (!this.__indexRequestQueue) {
      this.__indexRequestQueue = [];
    }
    const index = this.__indexRequestQueue.findIndex((i) => i.id === id);
    if (index !== -1) {
      this.__indexRequestQueue[index].url = url;
      this.__indexRequestQueue[index].type = type;
      return;
    }
    if (this.__indexDebounce) {
      clearTimeout(this.__indexDebounce);
    }
    this.__indexRequestQueue.push({
      id,
      url,
      type
    });
    this.__indexDebounce = setTimeout(() => {
      this.__indexDebounce = undefined;
      const data = this.__indexRequestQueue;
      this.__indexRequestQueue = undefined;
      if (data && data.length) {
        this.index(data).catch((cause) => {});
      }
    }, 25);
  }
  /**
   * Handler for `request-object-deleted` custom event.
   * It expects `id` property to be set on event detail object.
   * Cancelable events are ignored.
   * @param {CustomEvent} e
   */
  _requestDeleteHandler(e) {
    if (e.cancelable) {
      return;
    }
    this._deleteIndexDebounce(e.detail.id);
  }
  /**
   * Calles deleteIndexedData function with debouncer.
   * The debouncer runs the queue after 25 ms. Bulk operations should be called
   * onece unless there's a lot of data to process.
   *
   * @param {String} id Request ID
   */
  _deleteIndexDebounce(id) {
    if (!this.__deleteRequestQueue) {
      this.__deleteRequestQueue = [];
    }
    if (this.__deleteRequestQueue.indexOf(id) !== -1) {
      return;
    }
    if (this.__deleteIndexDebounce) {
      clearTimeout(this.__deleteIndexDebounce);
    }
    this.__deleteRequestQueue.push(id);
    this.__deleteIndexDebounce = setTimeout(() => {
      this.__deleteIndexDebounce = undefined;
      const data = this.__deleteRequestQueue;
      this.__deleteRequestQueue = undefined;
      if (data && data.length) {
        this.deleteIndexedData(data).catch((cause) => {});
      }
    }, 25);
  }

  _deleteModelHandler(e) {
    let store = e.detail.datastore;
    if (!Array.isArray(store)) {
      store = [store];
    }
    return this._deleteStores(store);
  }

  async _deleteStores(store) {
    try {
      if (store.indexOf('saved-requests') !== -1 || store.indexOf('saved') !== -1) {
        await this.deleteIndexedType('saved');
      }
    } catch (_) {
      // ...
    }
    try {
      if (store.indexOf('history-requests') !== -1 || store.indexOf('history') !== -1) {
        await this.deleteIndexedType('history');
      }
    } catch (_) {
      // ...
    }
    try {
      if (store.indexOf('all') !== -1) {
        await this.clearIndexedData();
      }
    } catch (_) {
      // ...
    }
  }

  //
  // Indexer implementation
  //

  /**
   * Opens search index data store.
   * @return {Promise}
   */
  openSearchStore() {
    if (this.__db) {
      return Promise.resolve(this.__db);
    }
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(this.indexStoreName, this.indexStoreVersion);
      request.onsuccess = (e) => {
        this.__db = e.target.result;
        resolve(e.target.result);
      };
      request.onerror = function() {
        reject(new Error('Unable to open the store'));
      };
      request.onupgradeneeded = this.createSchema;
    });
  }
  /**
   * Creates a database schema when is newly created.
   * @param {Event} e Database create request event
   */
  createSchema(e) {
    // DO NOT CALL `this` HERE
    const db = e.target.result;
    const store = db.createObjectStore('urls', { keyPath: 'id' });
    store.createIndex('url', 'url', { unique: false });
    store.createIndex('requestId', 'requestId', { unique: false });
    store.createIndex('fullUrl', 'fullUrl', { unique: false });
    store.createIndex('type', 'type', { unique: false });
  }

  /**
   * Indexes request data in dedicated index store for requests.
   *
   * Each item on the `requests` list must contain:
   * - `id` - stored object ID (returned by the query)
   * - `type` - store name or identifier (returned by the query)
   * - `url` - the URL to index
   *
   * @param {Array} requests List of requests to index.
   * @return {Promise}
   */
  async index(requests) {
    const db = await this.openSearchStore();
    const result = await this._getIndexedDataAll(db, requests.map((i) => i.id));
    const data = this._processIndexedRequests(requests, result);
    if (data.index.length) {
      await this._storeIndexes(db, data.index);
    }
    if (data.remove.length) {
      await this._removeRedundantIndexes(db, data.remove);
    }
    this._notifyIndexFinished();
  }

  _processIndexedRequests(requests, map) {
    const toIndex = [];
    const toRemove = [];
    for (let i = 0, len = requests.length; i < len; i++) {
      const request = requests[i];
      const indexed = map[request.id] || [];
      const indexes = this._prepareRequestIndexData(request, indexed);
      toIndex.splice(toIndex.length, 0, ...indexes);
      toRemove.splice(toRemove.length, 0, ...indexed);
    }
    return {
      index: toIndex,
      remove: toRemove
    };
  }

  _notifyIndexFinished() {
    this.dispatchEvent(
      new CustomEvent('request-indexing-finished', {
        bubbles: true,
        composed: true
      })
    );
  }

  /**
   * Removes indexed data for given requests.
   * @param {Array<String>} ids List of request ids to remove.
   * @return {Promise}
   */
  async deleteIndexedData(ids) {
    const db = await this.openSearchStore();
    const map = await this._getIndexedDataAll(db, ids);
    let items = [];
    Object.keys(map).forEach((rid) => {
      const list = map[rid];
      if (list.length) {
        items = items.concat(list);
      }
    });
    if (items.length) {
      await this._removeRedundantIndexes(db, items);
    }
  }

  /**
   * Removes indexed data for given `type`.
   * @param {String} type `history` or `saved`
   * @return {Promise}
   */
  deleteIndexedType(type) {
    return this.openSearchStore().then((db) => {
      const tx = db.transaction('urls', 'readwrite');
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => {
          // console.warn('Unable to clear index by type.', e);
          reject(new Error('Transaction error'));
        };
        const store = tx.objectStore('urls');
        const keyRange = window.IDBKeyRange.only(type);
        const index = store.index('type');
        const request = index.openKeyCursor(keyRange);
        request.onsuccess = (e) => {
          const cursor = e.target.result;
          if (!cursor) {
            return;
          }
          store.delete(cursor.primaryKey);
          cursor.continue();
        };
      });
    });
  }
  /**
   * Removes all indexed data.
   *
   * @return {Promise}
   */
  clearIndexedData() {
    return this.openSearchStore().then((db) => {
      return new Promise((resolve, reject) => {
        const tx = db.transaction('urls', 'readwrite');
        const store = tx.objectStore('urls');
        const results = [];
        tx.onerror = () => {
          reject(results);
        };
        tx.oncomplete = () => {
          resolve(results);
        };
        store.clear();
      });
    });
  }
  /**
   * Retreives index data for requests.
   * @param {Object} db Database reference
   * @param {Array<String>} ids List of request ids
   * @return {Promise<Object>} A map where keys are request IDs and values are
   * an array of index data.
   * ```
   * {
   *  "[request-id]": [{
   *    "id": "...",
   *    "requestId": [request-id],
   *    "url": "...",
   *    "type": "..."
   *   }]
   * }
   * ```
   */
  _getIndexedDataAll(db, ids) {
    return new Promise((resolve) => {
      const tx = db.transaction('urls', 'readonly');
      const store = tx.objectStore('urls');
      const result = {};
      tx.onerror = () => {
        // console.warn('Transaction error: _getIndexedDataAll');
        resolve(result);
      };
      tx.oncomplete = () => {
        resolve(result);
      };
      function processResult(id, e) {
        const cursor = e.target.result;
        if (cursor) {
          const record = cursor.value;
          if (record) {
            if (!(id in result)) {
              result[id] = [];
            }
            result[id][result[id].length] = record;
          }
          cursor.continue();
        }
      }
      const index = store.index('requestId');
      for (let i = 0, len = ids.length; i < len; i++) {
        const id = ids[i];
        const request = index.openCursor(id);
        request.onsuccess = processResult.bind(this, id);
      }
    });
  }
  /**
   * Prepares a list of objects to put into the indexeddb to index the request.
   * @param {Object} request Request object with `id` and `url` properties
   * @param {Array<Object>} indexed List of already indexed properties
   * @return {Array<Object>} A list of objects to store
   */
  _prepareRequestIndexData(request, indexed) {
    const result = [];
    const { id, url } = request;
    const type = this._normalizeType(request.type);
    let parser;
    try {
      parser = new URL(url);
    } catch (_) {
      return [];
    }
    const urlIndex = this._getUrlObject(request, indexed);
    if (urlIndex) {
      urlIndex.fullUrl = 1;
      result[result.length] = urlIndex;
    }

    const authorityIndex = this._getAuthorityPath(parser, id, type, indexed);
    if (authorityIndex) {
      result[result.length] = authorityIndex;
    }

    const pq = this._getPathQuery(parser, id, type, indexed);
    if (pq) {
      result[result.length] = pq;
    }

    const qs = this._getQueryString(parser, id, type, indexed);
    if (qs) {
      result.push(qs);
    }

    this._appendQueryParams(parser, id, type, indexed, result);
    return result;
  }
  /**
   * Generates ID for URL index object
   * @param {String} url URL to search for. It should be lower case
   * @param {String} type Request type
   * @return {String}
   */
  _generateId(url, type) {
    return url + '::' + type + '::' + this.uuid.generate();
  }
  /**
   * Creates an index datastore object if it doesn't exists in the list
   * of indexed items.
   * @param {String} url URL to search for.
   * @param {String} id Request ID
   * @param {String} type Request type
   * @param {Array<Object>} indexed Already indexed data.
   * @return {Object|undefined} Index object to store or `undefined` if already
   * indexed.
   */
  _createIndexIfMissing(url, id, type, indexed) {
    const lowerUrl = url.toLowerCase();
    const index = indexed.findIndex((item) => item.url.toLowerCase() === lowerUrl);
    if (index !== -1) {
      indexed.splice(index, 1);
      return;
    }
    return {
      id: this._generateId(lowerUrl, type),
      url,
      requestId: id,
      type,
      fullUrl: 0
    };
  }
  /**
   * Creates an index object for the whole url, if it doesn't exists in already
   * indexed data.
   *
   * @param {Object} request The request object to index
   * @param {Array<Object>} indexed Already indexed data.
   * @return {Object|undefined} Object to store or `undefined` if the object
   * already exists.
   */
  _getUrlObject(request, indexed) {
    return this._createIndexIfMissing(request.url, request.id, request.type, indexed);
  }
  /**
   * Creates an index object for authority part of the url,
   * if it doesn't exists in already indexed data.
   *
   * @param {URL} parser Instance of URL object
   * @param {String} id Request ID
   * @param {String} type Request type
   * @param {Array<Object>} indexed Already indexed data.
   * @return {Object|undefined} Object to store or `undefined` if the object
   * already exists.
   */
  _getAuthorityPath(parser, id, type, indexed) {
    const url = parser.host + parser.pathname + parser.search;
    return this._createIndexIfMissing(url, id, type, indexed);
  }
  /**
   * Creates an index object for path part of the url,
   * if it doesn't exists in already indexed data.
   *
   * @param {URL} parser Instance of URL object
   * @param {String} id Request ID
   * @param {String} type Request type
   * @param {Array<Object>} indexed Already indexed data.
   * @return {Object|undefined} Object to store or `undefined` if the object
   * already exists.
   */
  _getPathQuery(parser, id, type, indexed) {
    const url = parser.pathname + parser.search;
    return this._createIndexIfMissing(url, id, type, indexed);
  }
  /**
   * Creates an index object for query string of the url,
   * if it doesn't exists in already indexed data.
   *
   * @param {URL} parser Instance of URL object
   * @param {String} id Request ID
   * @param {String} type Request type
   * @param {Array<Object>} indexed Already indexed data.
   * @return {Object|undefined} Object to store or `undefined` if the object
   * already exists.
   */
  _getQueryString(parser, id, type, indexed) {
    let url = parser.search;
    if (!url || url === '?') {
      return;
    }
    url = url.substr(1);
    return this._createIndexIfMissing(url, id, type, indexed);
  }
  /**
   * Creates an index object for each query parameter of the url,
   * if it doesn't exists in already indexed data.
   *
   * @param {URL} parser Instance of URL object
   * @param {String} id Request ID
   * @param {String} type Request type
   * @param {Array<Object>} indexed Already indexed data.
   * @param {Array<Object>} target A list where to put generated data
   */
  _appendQueryParams(parser, id, type, indexed, target) {
    parser.searchParams.forEach((value, name) => {
      const qstring = `${name}=${value}`;
      const qindex = this._createIndexIfMissing(qstring, id, type, indexed);
      if (qindex) {
        target.push(qindex);
      }
      const vindex = this._createIndexIfMissing(value, id, type, indexed);
      if (vindex) {
        target.push(vindex);
      }
    });
  }
  /**
   * Stores indexes in the data store.
   *
   * @param {Object} db
   * @param {Array<Object>} indexes List of indexes to store.
   * @return {Promise}
    window
   */
  _storeIndexes(db, indexes) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('urls', 'readwrite');
      const store = tx.objectStore('urls');
      tx.oncomplete = function() {
        resolve();
      };
      tx.onerror = function(e) {
        reject(e.target.error);
      };
      for (let i = 0, len = indexes.length; i < len; i++) {
        store.add(indexes[i]);
      }
    });
  }
  /**
   * Removes indexed items that are no longer relevant for the request.
   * @param {Object} db
   * @param {Array<Object>} items List of datastore index items.
   * @return {Promise}
   */
  _removeRedundantIndexes(db, items) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('urls', 'readwrite');
      const store = tx.objectStore('urls');
      tx.oncomplete = function() {
        resolve();
      };
      tx.onerror = function(e) {
        reject(e.target.error);
      };
      for (let i = 0, len = items.length; i < len; i++) {
        store.delete(items[i].id);
      }
    });
  }
  /**
   * Queries for indexed data.
   *
   * @param {String} query The query
   * @param {Object} opts Search options:
   * - type (string: saved || history): Request type
   * - detailed (Booelan): If set it uses slower algorithm but performs full
   * search on the index. When false it only uses filer like query + '*'.
   * @return {Promise}
   */
  async query(query, opts) {
    opts = opts || {};
    const db = await this.openSearchStore();
    const type = this._normalizeType(opts.type);
    if (opts.detailed) {
      return await this._searchIndexOf(db, query, type);
    } else {
      return await this._searchCasing(db, query, type);
    }
  }
  /**
   * Performance search on the data store using `indexOf` on the primary key.
   * This function is slower than `_searchCasing` but much, much faster than
   * other ways to search for this data.
   * It allows to perform a search on the part of the url only like:
   * `'*' + q + '*'` while `_searchCasing` only allows `q + '*'` type search.
   *
   * @param {Object} db Reference to the database
   * @param {String} q A string to search for
   * @param {?String} type A type of the request to include into results.
   * @return {Promise}
   */
  _searchIndexOf(db, q, type) {
    // console.debug('Performing search using "indexof" algorithm');
    const lowerNeedle = q.toLowerCase();
    return new Promise((resolve) => {
      // performance.mark('search-key-scan-2-start');
      const tx = db.transaction('urls', 'readonly');
      const store = tx.objectStore('urls');
      const results = {};
      tx.onerror = () => {
        // console.warn('Transaction error');
        resolve(results);
      };
      tx.oncomplete = () => {
        // performance.mark('search-key-scan-2-end');
        // performance.measure('search-key-scan-2-end',
        //  'search-key-scan-2-start');
        resolve(results);
      };
      const keyRange = window.IDBKeyRange.only(1);
      const index = store.index('fullUrl');
      const request = index.openCursor(keyRange);
      request.onsuccess = (e) => {
        const cursor = e.target.result;
        if (!cursor) {
          return;
        }
        const record = cursor.value;
        if (!record) {
          cursor.continue();
          return;
        }
        if (type && record.type !== type) {
          cursor.continue();
          return;
        }
        const key = record.id;
        const keyUrl = key.substr(0, key.indexOf('::'));
        if (keyUrl.indexOf(lowerNeedle) !== -1) {
          if (!results[record.requestId]) {
            results[record.requestId] = record.type;
          }
        }
        cursor.continue();
      };
    });
  }
  /**
   * Uses (in most parts) algorithm described at
   * https://www.codeproject.com/Articles/744986/How-to-do-some-magic-with-indexedDB
   * Distributed under Apache 2 license
   *
   * This is much faster than `_searchIndexOf` function. However may not find
   * some results. For ARC it's a default search function.
   *
   * @param {Object} db Reference to the database
   * @param {String} q A string to search for
   * @param {?String} type A type of the request to include into results.
   * @return {Promise}
   */
  _searchCasing(db, q, type) {
    // console.debug('Performing search using "casing" algorithm');
    const lowerNeedle = q.toLowerCase();
    return new Promise((resolve) => {
      // performance.mark('search-casing-start');
      const tx = db.transaction('urls', 'readonly');
      const store = tx.objectStore('urls');
      const results = {};
      tx.onerror = () => {
        // console.warn('Query index transaction error');
        resolve(results);
      };
      tx.oncomplete = () => {
        // performance.mark('search-casing-end');
        // performance.measure('search-casing-end',
        //  'search-casing-start');
        resolve(results);
      };
      const request = store.openCursor();
      request.onsuccess = (e) => {
        const cursor = e.target.result;
        if (!cursor) {
          return;
        }
        const record = cursor.value;
        if (!record) {
          cursor.continue();
          return;
        }
        if (type && record.type !== type) {
          cursor.continue();
          return;
        }
        const key = cursor.key;
        const keyUrl = key.substr(0, key.indexOf('::'));
        if (keyUrl.indexOf(lowerNeedle) !== -1) {
          if (!results[record.requestId]) {
            results[record.requestId] = record.type;
          }
          cursor.continue();
          return;
        }
        const upperNeedle = q.toUpperCase();
        const nextNeedle = this._nextCasing(keyUrl, keyUrl, upperNeedle, lowerNeedle);
        if (nextNeedle) {
          cursor.continue(nextNeedle);
        }
      };
    });
  }
  /**
   * https://www.codeproject.com/Articles/744986/How-to-do-some-magic-with-indexedDB
   * Distributed under Apache 2 license
   * @param {String} key [description]
   * @param {String} lowerKey [description]
   * @param {String} upperNeedle [description]
   * @param {String} lowerNeedle [description]
   * @return {String|undefined}
   */
  _nextCasing(key, lowerKey, upperNeedle, lowerNeedle) {
    const length = Math.min(key.length, lowerNeedle.length);
    let llp = -1;
    for (let i = 0; i < length; ++i) {
      const lwrKeyChar = lowerKey[i];
      if (lwrKeyChar === lowerNeedle[i]) {
        continue;
      }
      if (lwrKeyChar !== lowerNeedle[i]) {
        if (key[i] < upperNeedle[i]) {
          return key.substr(0, i) + upperNeedle[i] + upperNeedle.substr(i + 1);
        }
        if (key[i] < lowerNeedle[i]) {
          return key.substr(0, i) + lowerNeedle[i] + upperNeedle.substr(i + 1);
        }
        if (llp >= 0) {
          return key.substr(0, llp) + lowerKey[llp] + upperNeedle.substr(llp + 1);
        }
        return;
      }
      if (key[i] < lwrKeyChar) {
        llp = i;
      }
      if (length < lowerNeedle.length) {
        return key + upperNeedle.substr(key.length);
      }
      if (llp < 0) {
        return;
      } else {
        return key.substr(0, llp) + lowerNeedle[llp] + upperNeedle.substr(llp + 1);
      }
    }
  }

  async reindex(type) {
    if (type === 'history') {
      return await this.reindexHistory();
    } else if (type === 'saved') {
      return await this.reindexSaved();
    } else {
      throw new Error('Unknown type');
    }
  }

  async reindexSaved() {
    return await this._renindex('saved');
  }

  async reindexHistory() {
    return await this._renindex('history');
  }

  async _renindex(type) {
    /* global PouchDB */
    const pdb = new PouchDB(`${type}-requests`);
    const response = await pdb.allDocs({ include_docs: true });
    const rows = response.rows;
    if (!rows.length) {
      return;
    }
    const data = rows.map((item) => {
      const doc = item.doc;
      return {
        id: doc._id,
        url: doc.url,
        type: type
      };
    });
    return this.index(data);
  }
}
