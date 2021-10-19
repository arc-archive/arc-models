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
import { v4 } from '@advanced-rest-client/uuid';
import { ArcModelEventTypes, ArcModelEvents } from '@advanced-rest-client/events';
import { normalizeRequestType } from './Utils.js';

/** @typedef {import('@advanced-rest-client/events').Indexer.IndexableRequest} IndexableRequest */
/** @typedef {import('./UrlIndexer').IndexableRequestInternal} IndexableRequestInternal */
/** @typedef {import('./UrlIndexer').IndexableRequestMap} IndexableRequestMap */
/** @typedef {import('./UrlIndexer').ProcessedQueryResults} ProcessedQueryResults */
/** @typedef {import('@advanced-rest-client/events').Indexer.IndexQueryOptions} IndexQueryOptions */
/** @typedef {import('@advanced-rest-client/events').Indexer.IndexQueryResult} IndexQueryResult */
/** @typedef {import('@advanced-rest-client/events').ARCRequestUpdatedEvent} ARCRequestUpdatedEvent */
/** @typedef {import('@advanced-rest-client/events').ARCRequestDeletedEvent} ARCRequestDeletedEvent */
/** @typedef {import('@advanced-rest-client/events').ARCModelStateDeleteEvent} ARCModelStateDeleteEvent */
/** @typedef {import('@advanced-rest-client/events').ARCUrlIndexUpdateEvent} ARCUrlIndexUpdateEvent */
/** @typedef {import('@advanced-rest-client/events').ARCUrlIndexQueryEvent} ARCUrlIndexQueryEvent */

/* eslint-disable class-methods-use-this */
/* eslint-disable no-plusplus */
/* eslint-disable no-continue */

export const indexRequestQueueValue = Symbol('indexRequestQueueValue');
export const deleteRequestQueueValue = Symbol('deleteRequestQueueValue');
export const indexDebounceValue = Symbol('indexDebounceValue');
export const deleteIndexDebounceValue = Symbol('deleteIndexDebounceValue');
export const indexUpdateHandler = Symbol('indexUpdateHandler');
export const indexQueryHandler = Symbol('indexQueryHandler');
export const requestChangeHandler = Symbol('requestChangeHandler');
export const requestDeleteHandler = Symbol('requestDeleteHandler');
export const deletemodelHandler = Symbol('deletemodelHandler');
export const deleteStores = Symbol('deleteStores');
export const quietIndexData = Symbol('quietIndexData');
export const deleteIndexDebounce = Symbol('deleteIndexDebounce');
export const quietIndex = Symbol('quietIndex');
export const indexDebounce = Symbol('indexDebounce');
export const processIndexedRequests = Symbol('processIndexedRequests');
export const prepareRequestIndexData = Symbol('prepareRequestIndexData');
export const storeIndexes = Symbol('storeIndexes');
export const appendQueryParams = Symbol('appendQueryParams');
export const generateId = Symbol('generateId');
export const createIndexIfMissing = Symbol('createIndexIfMissing');
export const getUrlObject = Symbol('getUrlObject');
export const getAuthorityPath = Symbol('getAuthorityPath');
export const getPathQuery = Symbol('getPathQuery');
export const getQueryString = Symbol('getQueryString');
export const removeRedundantIndexes = Symbol('removeRedundantIndexes');
export const getIndexedDataAll = Symbol('getIndexedDataAll');
export const searchIndexOf = Symbol('searchIndexOf');
export const searchCasing = Symbol('searchCasing');
export const nextCasing = Symbol('nextCasing');
export const reindex = Symbol('reindex');

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
 * An element responsible for indexing and querying for ARC request URL data.
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
 */
export class UrlIndexer {
  /**
   * @param {EventTarget} eventsTarget The element to use to listen for the DOM events and dispatch the events on.
   */
  constructor(eventsTarget) {
    /**
     * The element to use to listen for the DOM events and dispatch the events on.
     */
    this.eventsTarget = eventsTarget;

    this[indexUpdateHandler] = this[indexUpdateHandler].bind(this);
    this[indexQueryHandler] = this[indexQueryHandler].bind(this);
    this[requestChangeHandler] = this[requestChangeHandler].bind(this);
    this[requestDeleteHandler] = this[requestDeleteHandler].bind(this);
    this[deletemodelHandler] = this[deletemodelHandler].bind(this);

    this[indexRequestQueueValue] = [];
    this[deleteRequestQueueValue] = [];
  }

  /**
   * Listens for the DOM events.
   */
  listen() {
    const { eventsTarget } = this;
    eventsTarget.addEventListener(ArcModelEventTypes.UrlIndexer.update, this[indexUpdateHandler]);
    eventsTarget.addEventListener(ArcModelEventTypes.UrlIndexer.query, this[indexQueryHandler]);
    eventsTarget.addEventListener(ArcModelEventTypes.Request.State.update, this[requestChangeHandler]);
    eventsTarget.addEventListener(ArcModelEventTypes.Request.State.delete, this[requestDeleteHandler]);
    eventsTarget.addEventListener(ArcModelEventTypes.destroyed, this[deletemodelHandler]);
  }

  /**
   * Removes the DOM event listeners.
   */
  unlisten() {
    const { eventsTarget } = this;
    eventsTarget.removeEventListener(ArcModelEventTypes.UrlIndexer.update, this[indexUpdateHandler]);
    eventsTarget.removeEventListener(ArcModelEventTypes.UrlIndexer.query, this[indexQueryHandler]);
    eventsTarget.removeEventListener(ArcModelEventTypes.Request.State.update, this[requestChangeHandler]);
    eventsTarget.removeEventListener(ArcModelEventTypes.Request.State.delete, this[requestDeleteHandler]);
    eventsTarget.removeEventListener(ArcModelEventTypes.destroyed, this[deletemodelHandler]);
  }

  /**
   * @param {ARCUrlIndexUpdateEvent} e
   */
  [indexUpdateHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    const { requests } = e;
    e.detail.result = this.index(requests);
  }

  /**
   * @param {ARCUrlIndexQueryEvent} e
   */
  [indexQueryHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    const { term, requestType, detailed } = e;
    const opts = {};
    if (requestType) {
      opts.type = normalizeRequestType(requestType);
    }
    if (typeof detailed === 'boolean') {
      opts.detailed = detailed;
    }
    e.detail.result = this.query(term, opts);
  }

  /**
   * @param {ARCRequestUpdatedEvent} e
   */
  [requestChangeHandler](e) {
    if (e.cancelable) {
      return;
    }
    const { changeRecord, requestType } = e;
    const { id, item } = changeRecord;
    const { url } = item;

    const type = normalizeRequestType(requestType);
    this[indexDebounce](id, url, type);
  }

  /**
   * Calls index function with debouncer.
   * The debouncer runs the queue after 25 ms. Bulk operations should be called
   * once unless there's a lot of data to process.
   *
   * @param {string} id Request ID
   * @param {string} url Request URL
   * @param {string} type Request type (saved or history)
   */
  [indexDebounce](id, url, type) {
    const index = this[indexRequestQueueValue].findIndex((i) => i.id === id);
    if (index !== -1) {
      this[indexRequestQueueValue][index].url = url;
      this[indexRequestQueueValue][index].type = type;
      return;
    }
    if (this[indexDebounceValue]) {
      clearTimeout(this[indexDebounceValue]);
    }
    this[indexRequestQueueValue].push({
      id,
      url,
      type,
    });
    this[indexDebounceValue] = setTimeout(() => {
      this[indexDebounceValue] = undefined;
      const data = this[indexRequestQueueValue];
      this[indexRequestQueueValue] = [];
      if (data && data.length) {
        this[quietIndex](data);
      }
    }, 25);
  }

  async [quietIndex](data) {
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
   * @param {ARCRequestDeletedEvent} e
   */
  [requestDeleteHandler](e) {
    if (e.cancelable) {
      return;
    }
    const { id } = e;
    this[deleteIndexDebounce](id);
  }

  /**
   * Calls deleteIndexedData function with debouncer.
   * The debouncer runs the queue after 25 ms. Bulk operations should be called
   * once unless there's a lot of data to process.
   *
   * @param {String} id Request ID
   */
  [deleteIndexDebounce](id) {
    if (!this[deleteRequestQueueValue]) {
      this[deleteRequestQueueValue] = [];
    }
    if (this[deleteRequestQueueValue].indexOf(id) !== -1) {
      return;
    }
    if (this[deleteIndexDebounceValue]) {
      clearTimeout(this[deleteIndexDebounceValue]);
    }
    this[deleteRequestQueueValue].push(id);
    this[deleteIndexDebounceValue] = setTimeout(() => {
      this[deleteIndexDebounceValue] = undefined;
      const data = this[deleteRequestQueueValue];
      this[deleteRequestQueueValue] = [];
      if (data && data.length) {
        this[quietIndexData](data);
      }
    }, 25);
  }

  async [quietIndexData](data) {
    try {
      await this.deleteIndexedData(data);
    } catch (e) {
      // ...
    }
  }

  /**
   * Handler for a event that destroys the application data.
   * @param {ARCModelStateDeleteEvent} e
   */
  async [deletemodelHandler](e) {
    const { store } = e;
    return this[deleteStores](store);
  }

  /**
   * Removes indexed data from select stores.
   *
   * @param {string} store A stores that has been destroyed in the app.
   * @return {Promise<void>}
   */
  async [deleteStores](store) {
    const ps = [];
    if (['saved-requests', 'saved', 'all'].includes(store)) {
      ps[ps.length] = this.deleteIndexedType('saved');
    }
    if (['history-requests', 'history', 'all'].includes(store)) {
      ps[ps.length] = this.deleteIndexedType('history');
    }
    await Promise.all(ps);
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
        result.onclose = () => {
          this.__db = undefined;
        };
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
    const result = await this[getIndexedDataAll](
      db,
      requests.map((i) => i.id)
    );
    const data = this[processIndexedRequests](requests, result);
    if (data.index.length) {
      await this[storeIndexes](db, data.index);
    }
    if (data.remove.length) {
      await this[removeRedundantIndexes](db, data.remove);
    }
    db.close();
    this.__db = null;
    ArcModelEvents.UrlIndexer.State.finished(this.eventsTarget);
  }

  /**
   *
   * @param {IndexableRequest[]} requests List of requests to index.
   * @param {IndexableRequestMap} map
   * @return {ProcessedQueryResults}
   */
  [processIndexedRequests](requests, map) {
    const toIndex = [];
    const toRemove = [];
    requests.forEach((request) => {
      const indexed = map[request.id] || [];
      const indexes = this[prepareRequestIndexData](request, indexed);
      toIndex.splice(toIndex.length, 0, ...indexes);
      toRemove.splice(toRemove.length, 0, ...indexed);
    });

    return {
      index: toIndex,
      remove: toRemove,
    };
  }

  /**
   * Removes indexed data for given requests.
   * @param {string[]} ids List of request ids to remove.
   * @return {Promise<void>}
   */
  async deleteIndexedData(ids) {
    const db = await this.openSearchStore();
    const map = await this[getIndexedDataAll](db, ids);
    let items = [];
    Object.keys(map).forEach((rid) => {
      const list = map[rid];
      if (list.length) {
        items = items.concat(list);
      }
    });
    if (items.length) {
      await this[removeRedundantIndexes](db, items);
    }
    db.close();
    this.__db = null;
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
      tx.oncomplete = () => {
        db.close();
        this.__db = null;
        resolve();
      };
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
        db.close();
        this.__db = null;
        resolve();
      };
      store.clear();
    });
  }

  /**
   * Retrieves index data for requests.
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
  [getIndexedDataAll](db, ids) {
    return new Promise((resolve) => {
      const result = /** @type IndexableRequestMap */ ({});
      if (!db.objectStoreNames.contains('urls')) {
        resolve(result);
        return;
      }
      const tx = db.transaction('urls', 'readonly');
      const store = tx.objectStore('urls');
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
  [prepareRequestIndexData](request, indexed) {
    const result = [];
    const { id, url } = request;
    const type = normalizeRequestType(request.type);
    let parser;
    try {
      parser = new URL(url);
    } catch (_) {
      return [];
    }
    const urlIndex = this[getUrlObject](request, indexed);
    if (urlIndex) {
      urlIndex.fullUrl = 1;
      result[result.length] = urlIndex;
    }

    const authorityIndex = this[getAuthorityPath](parser, id, type, indexed);
    if (authorityIndex) {
      result[result.length] = authorityIndex;
    }

    const pq = this[getPathQuery](parser, id, type, indexed);
    if (pq) {
      result[result.length] = pq;
    }

    const qs = this[getQueryString](parser, id, type, indexed);
    if (qs) {
      result[result.length] = qs;
    }

    this[appendQueryParams](parser, id, type, indexed, result);
    return result;
  }

  /**
   * Generates ID for URL index object
   * @param {string} url URL to search for. It should be lower case
   * @param {string} type Request type
   * @return {string}
   */
  [generateId](url, type) {
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
  [createIndexIfMissing](url, id, type, indexed) {
    const lowerUrl = url.toLowerCase();
    const index = indexed.findIndex(
      (item) => item.url.toLowerCase() === lowerUrl
    );
    if (index !== -1) {
      indexed.splice(index, 1);
      return undefined;
    }
    return {
      id: this[generateId](lowerUrl, type),
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
  [getUrlObject](request, indexed) {
    return this[createIndexIfMissing](
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
  [getAuthorityPath](parser, id, type, indexed) {
    const url = parser.host + parser.pathname + parser.search;
    return this[createIndexIfMissing](url, id, type, indexed);
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
  [getPathQuery](parser, id, type, indexed) {
    const url = parser.pathname + parser.search;
    return this[createIndexIfMissing](url, id, type, indexed);
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
  [getQueryString](parser, id, type, indexed) {
    let url = parser.search;
    if (!url || url === '?') {
      return undefined;
    }
    url = url.substr(1);
    return this[createIndexIfMissing](url, id, type, indexed);
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
  [appendQueryParams](parser, id, type, indexed, target) {
    parser.searchParams.forEach((value, name) => {
      const qString = `${name}=${value}`;
      const qIndex = this[createIndexIfMissing](qString, id, type, indexed);
      if (qIndex) {
        target.push(qIndex);
      }
      const vIndex = this[createIndexIfMissing](value, id, type, indexed);
      if (vIndex) {
        target.push(vIndex);
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
  [storeIndexes](db, indexes) {
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
  [removeRedundantIndexes](db, items) {
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
    const type = normalizeRequestType(opts.type);
    if (opts.detailed) {
      return this[searchIndexOf](db, query, type);
    }
    return this[searchCasing](db, query, type);
  }

  /**
   * Performance search on the data store using `indexOf` on the primary key.
   * This function is slower than `[searchCasing]()` but much, much faster than
   * other ways to search for this data.
   * It allows to perform a search on the part of the url only like:
   * `'*' + q + '*'` while `[searchCasing]()` only allows `q + '*'` type search.
   *
   * @param {IDBDatabase} db Reference to the database
   * @param {string} q A string to search for
   * @param {string=} type A type of the request to include into results.
   * @return {Promise<IndexQueryResult>}
   */
  [searchIndexOf](db, q, type) {
    // console.debug('Performing search using "indexOf" algorithm');
    const lowerNeedle = q.toLowerCase();
    return new Promise((resolve) => {
      // performance.mark('search-key-scan-2-start');
      const tx = db.transaction('urls', 'readonly');
      const store = tx.objectStore('urls');
      const results = /** @type IndexQueryResult */ ({});
      tx.onerror = () => {
        // console.warn('Transaction error');
        db.close();
        this.__db = null;
        resolve(results);
      };
      tx.oncomplete = () => {
        // performance.mark('search-key-scan-2-end');
        // performance.measure('search-key-scan-2-end',
        //  'search-key-scan-2-start');
        db.close();
        this.__db = null;
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
   * This is much faster than `[searchIndexOf]()` function. However may not find
   * some results. For ARC it's a default search function.
   *
   * @param {IDBDatabase} db Reference to the database
   * @param {string} q A string to search for
   * @param {string=} type A type of the request to include into results.
   * @return {Promise<IndexQueryResult>}
   */
  [searchCasing](db, q, type) {
    // console.debug('Performing search using "casing" algorithm');
    const lowerNeedle = q.toLowerCase();
    return new Promise((resolve) => {
      // performance.mark('search-casing-start');
      const tx = db.transaction('urls', 'readonly');
      const store = tx.objectStore('urls');
      const results = /** @type IndexQueryResult */ ({});
      tx.onerror = () => {
        // console.warn('Query index transaction error');
        db.close();
        this.__db = null;
        resolve(results);
      };
      tx.oncomplete = () => {
        // performance.mark('search-casing-end');
        // performance.measure('search-casing-end',
        //  'search-casing-start');
        db.close();
        this.__db = null;
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
        const nextNeedle = this[nextCasing](
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
  [nextCasing](key, lowerKey, upperNeedle, lowerNeedle) {
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
    return this[reindex]('saved');
  }

  /**
   * Reindexes history requests
   * @return {Promise<void>}
   */
  async reindexHistory() {
    return this[reindex]('history');
  }

  /**
   * Reindexes a request by the type.
   * @param {string} type Either `saved` or `history`
   * @return {Promise<void>}
   */
  async [reindex](type) {
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
