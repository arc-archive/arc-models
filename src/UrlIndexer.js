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
import { v4 } from '@advanced-rest-client/uuid-generator';

/** @typedef {import('./UrlIndexer').IndexableRequest} IndexableRequest */
/** @typedef {import('./UrlIndexer').IndexableRequestInternal} IndexableRequestInternal */
/** @typedef {import('./UrlIndexer').IndexableRequestMap} IndexableRequestMap */
/** @typedef {import('./UrlIndexer').ProcessedQueryResults} ProcessedQueryResults */
/** @typedef {import('./UrlIndexer').IndexQueryOptions} IndexQueryOptions */
/** @typedef {import('./UrlIndexer').IndexQueryResult} IndexQueryResult */

/* eslint-disable class-methods-use-this */
/* eslint-disable no-plusplus */
/* eslint-disable no-continue */

export function normalizeType(type) {
  switch (type) {
    case 'saved-requests':
      return 'saved';
    case 'history-requests':
      return 'history';
    default:
      return type;
  }
}

export const STORE_NAME = 'request-index';
export const STORE_VERSION = 1;

/**
 * Creates a database schema when is newly created.
 * @param {Event} e Database create request event
 */
export function createSchema(e) {
  const evTarget = /** @type IDBOpenDBRequest */ (e.target);
  const db = evTarget.result;
  const store = db.createObjectStore('urls', { keyPath: 'id' });
  store.createIndex('url', 'url', { unique: false });
  store.createIndex('requestId', 'requestId', { unique: false });
  store.createIndex('fullUrl', 'fullUrl', { unique: false });
  store.createIndex('type', 'type', { unique: false });
}

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
 */
export class UrlIndexer extends HTMLElement {
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
    window.addEventListener(
      'request-object-changed',
      this._requestChangeHandler
    );
    window.addEventListener(
      'request-object-deleted',
      this._requestDeleteHandler
    );
    window.addEventListener('datastore-destroyed', this._deleteModelHandler);
  }

  disconnectedCallback() {
    window.removeEventListener('url-index-update', this._indexUpdateHandler);
    window.removeEventListener('url-index-query', this._indexQueryHandler);
    window.removeEventListener(
      'request-object-changed',
      this._requestChangeHandler
    );
    window.removeEventListener(
      'request-object-deleted',
      this._requestDeleteHandler
    );
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
      opts.type = normalizeType(e.detail.type);
    }
    if (e.detail.detailed) {
      opts.detailed = e.detail.detailed;
    }
    e.detail.result = this.query(query, opts);
  }

  _requestChangeHandler(e) {
    if (e.cancelable) {
      return;
    }
    const r = e.detail.request;
    const type = normalizeType(r.type);
    this._indexDebounce(r._id, r.url, type);
  }

  /**
   * Calles index function with debouncer.
   * The debouncer runs the queue after 25 ms. Bulk operations should be called
   * onece unless there's a lot of data to process.
   *
   * @param {string} id Request ID
   * @param {string} url Request URL
   * @param {string} type Request type (saved or history)
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
      type,
    });
    this.__indexDebounce = setTimeout(() => {
      this.__indexDebounce = undefined;
      const data = this.__indexRequestQueue;
      this.__indexRequestQueue = undefined;
      if (data && data.length) {
        this.__quietTndex(data);
      }
    }, 25);
  }

  async __quietTndex(data) {
    try {
      await this.index(data);
    } catch (e) {
      // ...
    }
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
        this.__quietIndexData(data);
      }
    }, 25);
  }

  async __quietIndexData(data) {
    try {
      await this.deleteIndexedData(data);
    } catch (e) {
      // ...
    }
  }

  _deleteModelHandler(e) {
    let store = e.detail.datastore;
    if (!Array.isArray(store)) {
      store = [store];
    }
    return this._deleteStores(store);
  }

  /**
   * Removes indexed data from select stores.
   * @param {string[]} store A stores that being destroyed in the app.
   * @return {Promise<void>}
   */
  async _deleteStores(store) {
    try {
      if (
        store.indexOf('saved-requests') !== -1 ||
        store.indexOf('saved') !== -1
      ) {
        await this.deleteIndexedType('saved');
      }
    } catch (_) {
      // ...
    }
    try {
      if (
        store.indexOf('history-requests') !== -1 ||
        store.indexOf('history') !== -1
      ) {
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
   * @return {Promise<IDBDatabase>}
   */
  openSearchStore() {
    if (this.__db) {
      return Promise.resolve(this.__db);
    }
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(STORE_NAME, STORE_VERSION);
      request.onsuccess = (e) => {
        const evTarget = /** @type IDBOpenDBRequest */ (e.target);
        const { result } = evTarget;
        this.__db = result;
        resolve(result);
      };
      request.onerror = () => {
        reject(new Error('Unable to open the store'));
      };
      request.onupgradeneeded = createSchema;
    });
  }

  /**
   * Indexes request data in dedicated index store for requests.
   *
   * Each item on the `requests` list must contain:
   * - `id` - stored object ID (returned by the query)
   * - `type` - store name or identifier (returned by the query)
   * - `url` - the URL to index
   *
   * @param {IndexableRequest[]} requests List of requests to index.
   * @return {Promise<void>}
   */
  async index(requests) {
    const db = await this.openSearchStore();
    const result = await this._getIndexedDataAll(
      db,
      requests.map((i) => i.id)
    );
    const data = this._processIndexedRequests(requests, result);
    if (data.index.length) {
      await this._storeIndexes(db, data.index);
    }
    if (data.remove.length) {
      await this._removeRedundantIndexes(db, data.remove);
    }
    this._notifyIndexFinished();
  }

  /**
   *
   * @param {IndexableRequest[]} requests List of requests to index.
   * @param {IndexableRequestMap} map
   * @return {ProcessedQueryResults}
   */
  _processIndexedRequests(requests, map) {
    const toIndex = [];
    const toRemove = [];
    requests.forEach((request) => {
      const indexed = map[request.id] || [];
      const indexes = this._prepareRequestIndexData(request, indexed);
      toIndex.splice(toIndex.length, 0, ...indexes);
      toRemove.splice(toRemove.length, 0, ...indexed);
    });

    return {
      index: toIndex,
      remove: toRemove,
    };
  }

  _notifyIndexFinished() {
    this.dispatchEvent(
      new CustomEvent('request-indexing-finished', {
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Removes indexed data for given requests.
   * @param {string[]} ids List of request ids to remove.
   * @return {Promise<void>}
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
   * @return {Promise<void>}
   */
  async deleteIndexedType(type) {
    const db = await this.openSearchStore();
    const tx = db.transaction('urls', 'readwrite');
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => {
        // console.warn('Unable to clear index by type.', e);
        reject(new Error('Transaction error'));
      };
      const store = tx.objectStore('urls');
      const keyRange = IDBKeyRange.only(type);
      const index = store.index('type');
      const request = index.openKeyCursor(keyRange);
      request.onsuccess = (e) => {
        const rq = /** @type IDBRequest<IDBCursor> */ (e.target);
        const cursor = rq.result;
        if (!cursor) {
          return;
        }
        store.delete(cursor.primaryKey);
        cursor.continue();
      };
    });
  }

  /**
   * Removes all indexed data.
   *
   * @return {Promise<void>}
   */
  async clearIndexedData() {
    const db = await this.openSearchStore();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('urls', 'readwrite');
      const store = tx.objectStore('urls');
      tx.onerror = () => {
        reject(new Error('Unable to clear URL indexed data'));
      };
      tx.oncomplete = () => {
        resolve();
      };
      store.clear();
    });
  }

  /**
   * Retreives index data for requests.
   * @param {IDBDatabase} db Database reference
   * @param {string[]} ids List of request ids
   * @return {Promise<IndexableRequestMap>} A map where keys are request IDs and values are
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
      const result = /** @type IndexableRequestMap */ ({});
      tx.onerror = () => {
        resolve(result);
      };
      tx.oncomplete = () => {
        resolve(result);
      };
      /**
       * @param {string} id
       * @param {Event} e
       */
      function processResult(id, e) {
        const request = /** @type IDBRequest<IDBCursorWithValue> */ (e.target);
        const cursor = /** @type IDBCursorWithValue */ (request.result);
        if (!cursor) {
          return;
        }
        const record = cursor.value;
        if (record) {
          if (!(id in result)) {
            result[id] = [];
          }
          result[id][
            result[id].length
          ] = /* @type IndexableRequestInternal */ record;
        }
        cursor.continue();
      }
      const index = store.index('requestId');
      ids.forEach((id) => {
        const request = index.openCursor(id);
        request.onsuccess = processResult.bind(this, id);
      });
    });
  }

  /**
   * Prepares a list of objects to put into the indexeddb to index the request.
   * @param {IndexableRequest} request Request object with `id` and `url` properties
   * @param {IndexableRequestInternal[]} indexed List of already indexed properties
   * @return {IndexableRequestInternal[]} A list of objects to store
   */
  _prepareRequestIndexData(request, indexed) {
    const result = [];
    const { id, url } = request;
    const type = normalizeType(request.type);
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
      result[result.length] = qs;
    }

    this._appendQueryParams(parser, id, type, indexed, result);
    return result;
  }

  /**
   * Generates ID for URL index object
   * @param {string} url URL to search for. It should be lower case
   * @param {string} type Request type
   * @return {string}
   */
  _generateId(url, type) {
    return `${url}::${type}::${v4()}`;
  }

  /**
   * Creates an index datastore object if it doesn't exists in the list
   * of indexed items.
   * @param {string} url URL to search for.
   * @param {string} id Request ID
   * @param {string} type Request type
   * @param {IndexableRequestInternal[]} indexed Already indexed data.
   * @return {IndexableRequestInternal|undefined} Index object to store or `undefined` if already
   * indexed.
   */
  _createIndexIfMissing(url, id, type, indexed) {
    const lowerUrl = url.toLowerCase();
    const index = indexed.findIndex(
      (item) => item.url.toLowerCase() === lowerUrl
    );
    if (index !== -1) {
      indexed.splice(index, 1);
      return undefined;
    }
    return {
      id: this._generateId(lowerUrl, type),
      url,
      requestId: id,
      type,
      fullUrl: 0,
    };
  }

  /**
   * Creates an index object for the whole url, if it doesn't exists in already
   * indexed data.
   *
   * @param {IndexableRequest} request The request object to index
   * @param {IndexableRequestInternal[]} indexed Already indexed data.
   * @return {IndexableRequestInternal|undefined} Object to store or `undefined` if the object
   * already exists.
   */
  _getUrlObject(request, indexed) {
    return this._createIndexIfMissing(
      request.url,
      request.id,
      request.type,
      indexed
    );
  }

  /**
   * Creates an index object for authority part of the url,
   * if it doesn't exists in already indexed data.
   *
   * @param {URL} parser Instance of URL object
   * @param {string} id Request ID
   * @param {string} type Request type
   * @param {IndexableRequestInternal[]} indexed Already indexed data.
   * @return {IndexableRequestInternal|undefined} Object to store or `undefined` if the object
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
   * @param {string} id Request ID
   * @param {string} type Request type
   * @param {IndexableRequestInternal[]} indexed Already indexed data.
   * @return {IndexableRequestInternal|undefined} Object to store or `undefined` if the object
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
   * @param {string} id Request ID
   * @param {string} type Request type
   * @param {IndexableRequestInternal[]} indexed Already indexed data.
   * @return {IndexableRequestInternal|undefined} Object to store or `undefined` if the object
   * already exists.
   */
  _getQueryString(parser, id, type, indexed) {
    let url = parser.search;
    if (!url || url === '?') {
      return undefined;
    }
    url = url.substr(1);
    return this._createIndexIfMissing(url, id, type, indexed);
  }

  /**
   * Creates an index object for each query parameter of the url,
   * if it doesn't exists in already indexed data.
   *
   * @param {URL} parser Instance of URL object
   * @param {string} id Request ID
   * @param {string} type Request type
   * @param {IndexableRequestInternal[]} indexed Already indexed data.
   * @param {IndexableRequestInternal[]} target A list where to put generated data
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
   * @param {IDBDatabase} db
   * @param {IndexableRequestInternal[]} indexes List of indexes to store.
   * @return {Promise<void>}
    window
   */
  _storeIndexes(db, indexes) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('urls', 'readwrite');
      const store = tx.objectStore('urls');
      tx.oncomplete = () => {
        resolve();
      };
      tx.onerror = () => {
        reject(new Error('Unable to store indexes in the store'));
      };
      indexes.forEach((item) => {
        store.add(item);
      });
    });
  }

  /**
   * Removes indexed items that are no longer relevant for the request.
   * @param {IDBDatabase} db
   * @param {IndexableRequestInternal[]} items List of datastore index items.
   * @return {Promise<void>}
   */
  _removeRedundantIndexes(db, items) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('urls', 'readwrite');
      const store = tx.objectStore('urls');
      tx.oncomplete = () => {
        resolve();
      };
      tx.onerror = () => {
        reject(new Error('Unable to remove redundant indexes from the store'));
      };
      items.forEach((item) => {
        store.delete(item.id);
      });
    });
  }

  /**
   * Queries for indexed data.
   *
   * @param {string} query The query
   * @param {IndexQueryOptions=} opts Search options
   * @return {Promise<IndexQueryResult>}
   */
  async query(query, opts = {}) {
    const db = await this.openSearchStore();
    const type = normalizeType(opts.type);
    if (opts.detailed) {
      return this._searchIndexOf(db, query, type);
    }
    return this._searchCasing(db, query, type);
  }

  /**
   * Performance search on the data store using `indexOf` on the primary key.
   * This function is slower than `_searchCasing` but much, much faster than
   * other ways to search for this data.
   * It allows to perform a search on the part of the url only like:
   * `'*' + q + '*'` while `_searchCasing` only allows `q + '*'` type search.
   *
   * @param {IDBDatabase} db Reference to the database
   * @param {string} q A string to search for
   * @param {string=} type A type of the request to include into results.
   * @return {Promise<IndexQueryResult>}
   */
  _searchIndexOf(db, q, type) {
    // console.debug('Performing search using "indexof" algorithm');
    const lowerNeedle = q.toLowerCase();
    return new Promise((resolve) => {
      // performance.mark('search-key-scan-2-start');
      const tx = db.transaction('urls', 'readonly');
      const store = tx.objectStore('urls');
      const results = /** @type IndexQueryResult */ ({});
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
      const keyRange = IDBKeyRange.only(1);
      const index = store.index('fullUrl');
      const request = index.openCursor(keyRange);
      request.onsuccess = (e) => {
        const rq = /** @type IDBRequest<IDBCursorWithValue> */ (e.target);
        const cursor = /** @type IDBCursorWithValue */ (rq.result);
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
   * @param {IDBDatabase} db Reference to the database
   * @param {string} q A string to search for
   * @param {string=} type A type of the request to include into results.
   * @return {Promise<IndexQueryResult>}
   */
  _searchCasing(db, q, type) {
    // console.debug('Performing search using "casing" algorithm');
    const lowerNeedle = q.toLowerCase();
    return new Promise((resolve) => {
      // performance.mark('search-casing-start');
      const tx = db.transaction('urls', 'readonly');
      const store = tx.objectStore('urls');
      const results = /** @type IndexQueryResult */ ({});
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
        const rq = /** @type IDBRequest<IDBCursorWithValue> */ (e.target);
        const cursor = /** @type IDBCursorWithValue */ (rq.result);
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
        const { key } = cursor;
        const typedKey = String(key);
        const keyUrl = typedKey.substr(0, typedKey.indexOf('::'));
        if (keyUrl.indexOf(lowerNeedle) !== -1) {
          if (!results[record.requestId]) {
            results[record.requestId] = record.type;
          }
          cursor.continue();
          return;
        }
        const upperNeedle = q.toUpperCase();
        const nextNeedle = this._nextCasing(
          keyUrl,
          keyUrl,
          upperNeedle,
          lowerNeedle
        );
        if (nextNeedle) {
          cursor.continue(nextNeedle);
        }
      };
    });
  }

  /**
   * https://www.codeproject.com/Articles/744986/How-to-do-some-magic-with-indexedDB
   * Distributed under Apache 2 license
   * @param {string} key [description]
   * @param {string} lowerKey [description]
   * @param {string} upperNeedle [description]
   * @param {string} lowerNeedle [description]
   * @return {string|undefined}
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
          return (
            key.substr(0, llp) + lowerKey[llp] + upperNeedle.substr(llp + 1)
          );
        }
        return undefined;
      }
      if (key[i] < lwrKeyChar) {
        llp = i;
      }
      if (length < lowerNeedle.length) {
        return key + upperNeedle.substr(key.length);
      }
      if (llp < 0) {
        return undefined;
      }
      return (
        key.substr(0, llp) + lowerNeedle[llp] + upperNeedle.substr(llp + 1)
      );
    }
    return undefined;
  }

  /**
   * Reindexes a request by the type.
   * @param {string} type Either `saved` or `history`
   * @return {Promise<void>}
   */
  async reindex(type) {
    if (type === 'history') {
      return this.reindexHistory();
    }
    if (type === 'saved') {
      return this.reindexSaved();
    }
    throw new Error('Unknown type');
  }

  /**
   * Reindexes saved requests
   * @return {Promise<void>}
   */
  async reindexSaved() {
    return this._renindex('saved');
  }

  /**
   * Reindexes history requests
   * @return {Promise<void>}
   */
  async reindexHistory() {
    return this._renindex('history');
  }

  /**
   * Reindexes a request by the type.
   * @param {string} type Either `saved` or `history`
   * @return {Promise<void>}
   */
  async _renindex(type) {
    /* global PouchDB */
    const pdb = new PouchDB(`${type}-requests`);
    const response = await pdb.allDocs({ include_docs: true });
    const { rows } = response;
    if (!rows.length) {
      return;
    }
    const data = rows.map((item) => {
      const { doc } = item;
      return {
        id: doc._id,
        url: doc.url,
        type,
      };
    });
    await this.index(data);
  }
}
