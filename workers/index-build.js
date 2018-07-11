importScripts('../../pouchdb/dist/pouchdb.js');
/**
 * A web worker class responsible for indexing a datastore
 */
class ArcIndexer {
  /**
   * @param {String} dbName Source data store name
   * @param {String} indexName Index store name
   * @param {String} property A property to index
   */
  constructor(dbName, indexName, property) {
    this.dbName = dbName;
    this.indexName = indexName;
    this.property = property;
    this.queryOptions = {
      include_docs: true,
      limit: 800
    };
    this.pdb = new PouchDB(dbName);
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
   * Opens a connection to a data store.
   * @param {String} name
   * @return {Promise}
   */
  _openSearchStore(name) {
    if (this.__db) {
      return Promise.resolve(this.__db);
    }
    return new Promise((resolve, reject) => {
      const dbName = this._createTextSearchStoreName(name);
      const request = indexedDB.open(dbName, this.databaseVersion);
      request.onsuccess = (e) => {
        this.__db = e.target.result;
        resolve(e.target.result);
      };
      request.onerror = function() {
        reject(new Error('Unable to open the store'));
      };
    });
  }
  /**
   * Indexes the data store in a batch operation.
   * @return {Promise}
   */
  index() {
    return new Promise((resolve, reject) => {
      this._resolver = resolve;
      this._rejecter = reject;

      this._indexRecursive();
    });
  }
  /**
   * Recursively creates an index.
   */
  _indexRecursive() {
    this.pdb.allDocs(this.queryOptions)
    .then((response) => {
      if (response.rows.length) {
        this._processResponse(response.rows)
        .then(() => {
          this._indexRecursive();
        });
      } else {
        this._resolver();
      }
    })
    .catch((cause) => this._rejecter(cause));
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
   * Creates an indexed documents to be stored in the data store.
   * @param {String} value Text value to process
   * @param {String} documentId Original document id.
   * @return {Array<Object>|undefined} List of documents to store.
   */
  createTextIndexDocuments(value, documentId) {
    if (value.indexOf('http') !== -1) {
      // Takes care about URL field
      value = value.replace(/^http(s?)/, '');
    }
    let txt = this._normalizeText(value);
    const docs = [];
    txt.split(/\s/).forEach((term) => {
      if (term && term.length > 2) {
        const doc = this._createIndexDoc(term, documentId);
        docs[docs.length] = doc;
      }
    });
    return docs.length ? docs : undefined;
  }
  /**
   * Creates an index from a text.
   * @param {Object} db Handler to the database
   * @param {String} value Text value to process
   * @param {String} documentId Original document id.
   * @return {Promise}
   */
  createTextIndex(db, value, documentId) {
    if (value.indexOf('http') !== -1) {
      // Takes care about URL field
      value = value.replace(/^http(s?)/, '');
    }
    let txt = this._normalizeText(value);
    const docs = [];
    txt.split(/\s/).forEach((term) => {
      if (term && term.length > 2) {
        const doc = this._createIndexDoc(term, documentId);
        docs[docs.length] = doc;
      }
    });
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
  }
  /**
   * Stores =generated index in the data store.
   * @param {[type]} db [description]
   * @param {[type]} index [description]
   * @return {[type]} [description]
   */
  _storeIndex(db, index) {
    console.info('Storing indexes', index);
    return new Promise((resolve) => {
      const tx = db.transaction('searchIndex', 'readwrite');
      const store = tx.objectStore('searchIndex');
      let size = index.length;
      index.forEach((doc) => {
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
   * Indexes incomming data.
   * @param {Array<Object>} data PouchDB data list
   * @return {Promise}
   */
  _processResponse(data) {
    this.queryOptions.startkey = data[data.length - 1].key;
    this.queryOptions.skip = 1;

    if (!this._processed) {
      this._processed = 0;
    }

    this._processed += data.length;
    console.log('Processed', this._processed, 'entries');

    let inserts = [];
    return this._openSearchStore(this.indexName)
    .then((db) => {
      const promises = [];
      data.forEach((doc) => {
        promises[promises.length] = this._clearIndex(db, doc.key)
        .then(() => {
          const value = doc.doc[this.property];
          if (value && typeof value === 'string') {
            const toInsert = this.createTextIndexDocuments(value, doc.key);
            if (toInsert) {
              inserts = inserts.concat(toInsert);
            }
            // return this.createTextIndex(db, value, doc.key);
          }
        });
      });
      return Promise.all(promises)
      .then(() => this._storeIndex(db, inserts));
    });
  }
  /**
   * Removes previously indexed values.
   * @param {Object} db Handler for thr IDB
   * @param {String} key Document id
   * @return {Promise}
   */
  _clearIndex(db, key) {
    return new Promise((resolve) => {
      const tx = db.transaction('searchIndex', 'readwrite');
      const store = tx.objectStore('searchIndex');
      const index = store.index('key');
      const range = IDBKeyRange.only(key);
      const request = index.openCursor(range);
      request.onsuccess = function(e) {
        const cursor = e.target.result;
        if (cursor) {
          const deleteRequest = store.delete(cursor.key);
          deleteRequest.onsuccess = function() {
            cursor.continue();
          };
          deleteRequest.onerror = function() {
            cursor.continue();
          };
        } else {
          resolve();
        }
      };
    });
  }
}
/* global self, IDBKeyRange, PouchDB, indexedDB */
self.addEventListener('message', (e) => {
  const c = e.data;
  const builder = new ArcIndexer(c.dbName, c.indexName, c.property);
  builder.index()
  .then(() => {
    self.postMessage({
      payload: 'index-ready',
      dbName: c.dbName,
      indexName: c.indexName
    });
  });
});
