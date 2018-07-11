/**
 * An index manager for the queries made agains ARC database
 */
class SearchIndexManager {
  /**
   * @return {Number} Data store version nmber
   */
  get databaseVersion() {
    return 1;
  }
  /**
   * Type index to find request objects for saved and history separately.
   */
  get typeIndex() {
    /* global emit */
    return {
      _id: '_design/typeIndex',
      views: {
        'typeIndex': {
          map: function(doc) {
            emit(doc.type);
          }.toString()
        }
      }
    };
  }
  /**
   * Project index to be used to search for a requests related to a project.
   */
  get projectIndex() {
    return {
      _id: '_design/projectIndex',
      views: {
        'projectIndex': {
          map: function(doc) {
            if (doc.legacyProject) {
              emit(doc.legacyProject);
            }
          }.toString()
        }
      }
    };
  }
  /**
   * Definition of the URL index
   */
  get nameIndex() {
    return {
      _id: '_design/nameIndex',
      views: {
        'nameIndex': {
          map: function(doc) {
            if (doc.name) {
              emit(doc.name);
            }
          }.toString()
        }
      }
    };
  }
  /**
   * @param {String} type Name of the data store. Either `saved-requests` or
   * `history-requests`
   */
  constructor(type) {
    /* global PouchDB */
    this.type = type;
    this.db = new PouchDB(type);
  }
  /**
   * Creates indexes if it wasn't already.
   * @return {Promise}
   */
  ensureIndex() {
    const typeIndex = this.typeIndex;
    return this.db.get(typeIndex._id)
    .catch((cause) => {
      if (cause.status === 404) {
        return this._insertIndexes();
      }
      throw cause;
    });
  }
  /**
   * Inserts indexes into the data store.
   * @return {Promise}
   */
  _insertIndexes() {
    const promises = [];
    const db = this.db;
    if (this.type === 'saved-requests') {
      promises[promises.length] = db.put(this.typeIndex)
      .then(() => db.query('typeIndex', {stale: 'update_after'}));
      promises[promises.length] = db.put(this.projectIndex)
      .then(() => db.query('projectIndex', {stale: 'update_after'}));
      promises[promises.length] = db.put(this.nameIndex)
      .then(() => db.query('nameIndex', {stale: 'update_after'}));
      promises[promises.length] =
        this._ensureTextSearchStore('saved-description');
      promises[promises.length] =
        this._ensureTextSearchStore('saved-name');
    }
    promises[promises.length] =
      this._ensureTextSearchStore('saved-headers')
    .then((created) => {
      if (created) {
        this.index('saved-requests', 'saved-headers', 'headers');
      }
    });
    promises[promises.length] =
      this._ensureTextSearchStore('history-headers')
    .then((created) => {
      if (created) {
        this.index('history-requests', 'history-headers', 'headers');
      }
    });
    promises[promises.length] =
      this._ensureTextSearchStore('saved-payload')
    .then((created) => {
      if (created) {
        this.index('saved-requests', 'saved-payload', 'payload');
      }
    });
    promises[promises.length] =
      this._ensureTextSearchStore('history-payload')
    .then((created) => {
      if (created) {
        this.index('history-requests', 'history-payload', 'payload');
      }
    });
    return Promise.all(promises);
  }
  /**
   * Creates the name for the data store that contains full text items.
   * @param {String} name Name of the store to use for particular index.
   * @return {String}
   */
  _createTextSearchStoreName(name) {
    return '_arc_search_' + name;
  }
  /**
   * Ensures the full text data store is created.
   * @param {String} name Name of the index
   * @return {Promise}
   */
  _ensureTextSearchStore(name) {
    return new Promise((resolve, reject) => {
      const dbName = this._createTextSearchStoreName(name);
      const request = window.indexedDB.open(dbName, this.databaseVersion);
      request.onerror = function() {
        reject(new Error('Unable to open store'));
      };
      request.onsuccess = () => resolve(false);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        const store = db.createObjectStore('searchIndex', {
          keyPath: 'id'
        });
        store.createIndex('term', 'term', {unique: false});
        store.createIndex('key', 'key', {unique: false});
        store.transaction.oncomplete = () => resolve(true);
        store.transaction.onerror = () =>
          reject(new Error('Unable to create data store'));
      };
    });
  }
  /**
   * Opens a connection to a data store.
   * @param {String} name
   * @return {Promise}
   */
  _openSearchStore(name) {
    return new Promise((resolve, reject) => {
      const dbName = this._createTextSearchStoreName(name);
      const request = window.indexedDB.open(dbName, this.databaseVersion);
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = function() {
        reject(new Error('Unable to open the store'));
      };
    });
  }
  /**
   * Normalizes text and replaces national accents with latin letters.
   * @param {String} str
   * @return {String}
   */
  _normalizeText(str) {
    if (str.normalize) {
      str = str.normalize('NFD');
    }
    let norm = str.replace(/[\u0300-\u036f]/g, '');
    norm = norm.toLowerCase();
    norm = norm.replace(/[!\?'\.,;:"'-_\+=\(\)\*\^\|\\\%\$\{\}<>]/g, '');
    return norm;
  }
  /**
   * Creates an index from a text.
   * @param {String} index Name of the index
   * @param {String} value Text value to process
   * @param {String} documentId Original document id.
   * @return {Promise}
   */
  createTextIndex(index, value, documentId) {
    const txt = this._normalizeText(value);
    const docs = [];
    txt.split(/\s/).forEach((term) => {
      if (term && term.length > 2) {
        const doc = this._createIndexDoc(term, documentId);
        docs[docs.length] = doc;
      }
    });
    return this._openSearchStore(index)
    .then((db) => {
      return new Promise((resolve) => {
        const tx = db.transaction('searchIndex', 'readwrite');
        const store = tx.objectStore('searchIndex');
        let size = docs.length;
        docs.forEach((doc) => {
          const request = store.add(doc);
          request.onerror = () => {
            size--;
            if (size === 0) {
              resolve();
            }
          };
          request.onsuccess = () => {
            size--;
            if (size === 0) {
              resolve();
            }
          };
        });
      });
    });
  }
  /**
   * Performes full search on an index and return lisrt of IDs of documents
   * that matches the query.
   * @param {String} index
   * @param {String} query
   * @return {Promise}
   */
  searchIndex(index, query) {
    const txt = this._normalizeText(query);
    const terms = [];
    txt.split(/\s/).forEach((term) => {
      if (term && term.length > 2) {
        terms[terms.length] = term;
      }
    });
    // TODO: it should remove terms that contains already existing term
    // in the array as it would find the same object anyway
    return this._openSearchStore(index)
    .then((db) => {
      const promises = terms.map((item) => this._searchIndexValue(db, item));
      return Promise.all(promises);
    })
    .then((results) => {
      const lists = {};
      console.log(results);
    });
  }
  /**
   * Searches the index store for a specific single word
   * @param {Object} db
   * @param {String} value
   * @return {Promise}
   */
  _searchIndexValue(db, value) {
    return new Promise((resolve) => {
      const tx = db.transaction('searchIndex', 'readonly');
      const store = tx.objectStore('searchIndex');
      const index = store.index('term');
      const range = IDBKeyRange.bound(value, value + '\uffff');
      const request = index.openCursor(range);
      const result = [];
      request.onsuccess = function(e) {
        const cursor = e.target.result;
        if (cursor) {
          result[result.length] = cursor.value.key;
          cursor.continue();
        } else {
          resolve(result);
        }
      };
    });
  }
  /**
   * Creates searchable document.
   * @param {[type]} value [description]
   * @param {[type]} docId [description]
   * @return {[type]} [description]
   */
  _createIndexDoc(value, docId) {
    const key = value + '::' + docId;
    return {
      id: key,
      term: value,
      key: docId
    };
  }
  /**
   * Indexes existing entries in the store.
   * The indexing part is performed in new thread in a web worker.
   * The index is ebentually persistant. This function does not return
   * Promise.
   * The app is not notified about indexing.
   * @param {String} dbName Source data store name
   * @param {String} indexName Index store name
   * @param {String} property A property to index
   */
  index(dbName, indexName, property) {
    const worker = new Worker('../workers/index-build.js');
    worker.postMessage({
      dbName,
      indexName,
      property
    });
  }
}
