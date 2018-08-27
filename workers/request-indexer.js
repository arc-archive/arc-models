this.importScripts('request-db.js');
/* global RequestDb, self, IDBKeyRange */
/**
 * A web worker responsible for indexing request data.
 *
 * Most request properties are indexed using PouchDB search plugin.
 * The problem is with the `url`. The plugin can't search for parts of the words
 * (like the url) and therefore the user would have to search for full URL.
 * This indexer splits request url into parts and indexes them separately.
 * Then the search logic can separately use PouchDB search for searching for
 * and request data and separate logic for querying for url data only.
 */
class RequestIndexer extends RequestDb {
  /**
   * Listens for message event.
   */
  listen() {
    self.onmessage = this._messageHandler.bind(this);
  }
  /**
   * A function handling a message from the main thread.
   * @param {Event} e
   */
  _messageHandler(e) {
    const data = e.data;
    switch (data.task) {
      case 'index-requests':
        if (typeof URL === 'undefined') {
          this.notifyError(new Error('URL object not supported in worker'));
          return;
        }
        this._indexRequests(data.requests);
        break;
      case 'delete-index':
        this._deleteIndexedData(data.ids);
        break;
      case 'clear-index':
        this._clearIndexedData();
        break;
      case 'query-data':
        const opts = {
          type: data.type,
          detailed: data.detailed || false
        };
        this._queryIndex(data.id, data.q, opts);
        break;
    }
  }
  /**
   * Notifies owner about end of task.
   * @param {String} task Task name
   */
  notifyEnd(task) {
    if (self.mocha) {
      return;
    }
    try {
      self.postMessage({
        task: 'task-finished',
        name: task
      });
    } catch (_) {}
  }
  /**
   * Notifies owner about error
   * @param {Error} cause
   */
  notifyError(cause) {
    console.error(cause);
    if (self.mocha) {
      return;
    }
    self.postMessage({
      task: 'task-error',
      message: cause.message || 'Unknown error'
    });
  }
  /**
   * Indexes request data in dedicated index store for requests.
   * @param {Array} requests List of requests to index.
   * @return {Promise}
   */
  _indexRequests(requests) {
    const request = requests.shift();
    if (!request) {
      this.notifyEnd('index-requests');
      return Promise.resolve();
    }
    return this.openSearchStore()
    .then((db) => {
      let dbIndexes;
      return this._getIndexedData(db, request.id)
      .then((indexed) => {
        dbIndexes = indexed;
        return this._prepareRequestIndexData(request, indexed);
      })
      .then((indexes) => this._storeIndexes(db, indexes))
      .then(() => {
        if (dbIndexes.length) {
          return this._removeRedundantIndexes(db, dbIndexes);
        }
      })
      .catch((cause) => {
        console.error(cause);
        this.notifyError(cause);
      })
      .then(() => this._indexRequests(requests));
    });
  }
  /**
   * Removes indexed data for given requests.
   * @param {Array<String>} ids List of request ids to remove.
   * @return {Promise}
   */
  _deleteIndexedData(ids) {
    let database;
    return this.openSearchStore()
    .then((db) => {
      database = db;
      const p = [];
      for (let i = 0, len = ids.length; i < len; i++) {
        p.push(this._getIndexedData(db, ids[i]));
      }
      return Promise.all(p);
    })
    .then((results) => {
      let items = [];
      for (let i = 0, len = results.length; i < len; i++) {
        const list = results[i];
        if (list.length) {
          items = items.concat(list);
        }
      }
      if (items.length) {
        return this._removeRedundantIndexes(database, items);
      }
    })
    .then(() => {
      this.notifyEnd('delete-index');
    })
    .catch((cause) => this.notifyError(cause));
  }
  /**
   * Retreives existing index data for the request.
   * @param {Object} db Database reference
   * @param {String} requestId Request ID.
   * @return {Promise<Array<Object>>}
   */
  _getIndexedData(db, requestId) {
    return new Promise((resolve) => {
      const tx = db.transaction('urls', 'readonly');
      const store = tx.objectStore('urls');
      const results = [];
      tx.onerror = () => {
        console.warn('Transaction error');
        resolve(results);
      };

      tx.oncomplete = () => {
        resolve(results);
      };
      const index = store.index('requestId');
      const request = index.openCursor(requestId);
      request.onsuccess = function(e) {
        const cursor = e.target.result;
        if (cursor) {
          results[results.length] = cursor.value;
          cursor.continue();
        }
      };
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
    const id = request.id;
    const url = request.url;
    const type = request.type;
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
    return url + '::' + type + '::' + this.uuid();
  }
  /**
   * Creates an index datastore object if it doesn't exists in the list
   * of indexed items.
   * @param {String} url URL to search for.
   * @param {String} id Request ID
   * @param {String} type Request type
   * @param {Array<Object>} indexed Already indexed data.
   * @return {Object} Index object to store.
   */
  _createIndexIfMissing(url, id, type, indexed) {
    const lowerUrl = url.toLowerCase();
    const index = indexed.findIndex((item) =>
      item.url.toLowerCase() === lowerUrl);
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
    return this._createIndexIfMissing(request.url, request.id,
      request.type, indexed);
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
   * Queries for indexed data
   * @param {String} id An ID returned to the calling application
   * @param {String} query The query
   * @param {Object} opts Search options:
   * - type (string: saved || history): Request type
   * - detailed (Booelan): If set it uses slower algorithm but performs full
   * search on the index. When false it only uses filer like query + '*'.
   * @return {Promise}
   */
  _queryIndex(id, query, opts) {
    opts = opts || {};
    return this.openSearchStore()
    .then((db) => {
      if (opts.detailed) {
        return this._searchIndexOf(db, query, opts.type);
      } else {
        return this._searchCasing(db, query, opts.type);
      }
    })
    .then((results) => {
      try {
        self.postMessage({
          task: 'query-finished',
          id,
          results
        });
      } catch (_) {}
      return results;
    })
    .catch((cause) => {
      try {
        self.postMessage({
          task: 'task-error',
          id,
          message: cause.message
        });
      } catch (_) {}
      throw cause;
    });
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
    const lowerNeedle = q.toLowerCase();
    return new Promise((resolve) => {
      // performance.mark('search-key-scan-2-start');
      const tx = db.transaction('urls', 'readonly');
      const store = tx.objectStore('urls');
      const results = {};
      tx.onerror = () => {
        console.warn('Transaction error');
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
        const cursor = e.target.result;
        if (!cursor) {
          return;
        }
        const record = cursor.value;
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
    const lowerNeedle = q.toLowerCase();
    return new Promise((resolve) => {
      // performance.mark('search-casing-start');
      const tx = db.transaction('urls', 'readonly');
      const store = tx.objectStore('urls');
      const results = {};
      tx.onerror = () => {
        console.warn('Transaction error');
        resolve(results);
      };

      tx.oncomplete = () => {
        // performance.mark('search-casing-end');
        // performance.measure('search-casing-end', 'search-casing-start');
        resolve(results);
      };
      const request = store.openCursor();
      request.onsuccess = (e) => {
        const cursor = e.target.result;
        if (!cursor) {
          return;
        }
        const record = cursor.value;
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
        const nextNeedle = this._nextCasing(keyUrl, keyUrl, upperNeedle,
          lowerNeedle);
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
    let length = Math.min(key.length, lowerNeedle.length);
    let llp = -1;
    for (let i = 0; i < length; ++i) {
      let lwrKeyChar = lowerKey[i];
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
          return key.substr(0, llp) + lowerKey[llp] +
            upperNeedle.substr(llp + 1);
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
        return key.substr(0, llp) + lowerNeedle[llp] +
          upperNeedle.substr(llp + 1);
      }
    }
  }
  /**
   * Removes all indexed data.
   *
   * @return {Promise}
   */
  _clearIndexedData() {
    return this.openSearchStore()
    .then((db) => {
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
    })
    .then(() => {
      this.notifyEnd('clear-index');
    })
    .catch((cause) => {
      console.error(cause);
      this.notifyError(cause);
    });
  }
}
const indexer = new RequestIndexer();
indexer.listen();
