this.importScripts('request-db.js');
/* global RequestDb, RequestDb, self */
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
    }
  }
  /**
   * Notifies owner about end of task.
   * @param {String} task Task name
   */
  notifyEnd(task) {
    self.postMessage({
      task: 'task-finished',
      name: task
    });
  }
  /**
   * Notifies owner about error
   * @param {Error} cause
   */
  notifyError(cause) {
    console.error(cause);
    self.postMessage({
      task: 'task-error',
      message: cause.message || 'Unknown error'
    });
  }
  /**
   * Indexes request data in dedicated index store for requests.
   * @param {Array} requests List of requests to index.
   */
  _indexRequests(requests) {
    const request = requests.shift();
    if (!request) {
      this.notifyEnd('index-requests');
      return;
    }
    this.openSearchStore()
    .then((db) => {
      let dbIndexes;
      this._getIndexedData(db, request.id)
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
        console.log('Transaction error');
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
      return url;
    }
    const urlIndex = this._getUrlObject(request, indexed);
    if (urlIndex) {
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
    const index = indexed.findIndex((item) => item.url.toLowerCase() === url);
    if (index !== -1) {
      indexed.splice(index, 1);
      return;
    }
    return {
      id: this._generateId(lowerUrl, type),
      url,
      requestId: id,
      type
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
}
const indexer = new RequestIndexer();
indexer.listen();
