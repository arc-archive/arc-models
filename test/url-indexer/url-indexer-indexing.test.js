import { fixture, assert } from '@open-wc/testing';
import '../../url-indexer.js';

describe('<url-indexer> - Indexing test', function() {
  async function basicFixture() {
    return /** @type {UrlIndexer} */ (await fixture('<url-indexer></url-indexer>'));
  }

  describe('Data indexing', function() {
    function allIndexes(db) {
      return new Promise((resolve, reject) => {
        const tx = db.transaction('urls', 'readonly');
        const store = tx.objectStore('urls');
        const results = [];
        tx.onerror = () => {
          reject(results);
        };
        tx.oncomplete = () => {
          resolve(results);
        };
        const request = store.openCursor();
        request.onsuccess = function(e) {
          const cursor = e.target.result;
          if (cursor) {
            results[results.length] = cursor.value;
            cursor.continue();
          }
        };
      });
    }
    function clearAllIndexes(db) {
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
    }

    describe('_storeIndexes()', function() {
      let element;
      let inserts;
      beforeEach(async () => {
        element = await basicFixture();
        inserts = [{
          id: 't1',
          url: 'u1',
          requestId: 'r1',
          type: 'saved'
        }, {
          id: 't2',
          url: 'u2',
          requestId: 'r2',
          type: 'saved'
        }];
      });

      afterEach(() => {
        return element.openSearchStore()
        .then((db) => clearAllIndexes(db));
      });

      it('Stores data into the data store', function() {
        let database;
        return element.openSearchStore()
        .then((db) => {
          database = db;
          return element._storeIndexes(db, inserts);
        })
        .then(() => allIndexes(database))
        .then((data) => {
          assert.lengthOf(data, 2);
        });
      });
    });

    describe('_getIndexedDataAll()', function() {
      let element;
      let inserts;
      beforeEach(async () => {
        element = await basicFixture();
        inserts = [{
          id: 't1',
          url: 'u1',
          requestId: 'r1',
          type: 'saved'
        }, {
          id: 't2',
          url: 'u2',
          requestId: 'r1',
          type: 'saved'
        }, {
          id: 't3',
          url: 'u3',
          requestId: 'r2',
          type: 'saved'
        }];
      });

      afterEach(() => {
        return element.openSearchStore()
        .then((db) => clearAllIndexes(db));
      });

      it('Results to empty array when no indexes found', function() {
        return element.openSearchStore()
        .then((db) => element._getIndexedDataAll(db, ['test']))
        .then((result) => {
          assert.typeOf(result, 'object');
          assert.lengthOf(Object.keys(result), 0);
        });
      });

      it('Returns requests for given ID', function() {
        let database;
        return element.openSearchStore()
        .then((db) => {
          database = db;
          return element._storeIndexes(db, inserts);
        })
        .then(() => element._getIndexedDataAll(database, ['r1']))
        .then((result) => {
          assert.typeOf(result.r1, 'array');
          assert.lengthOf(result.r1, 2);
        });
      });

      it('Returns multiple requests', function() {
        let database;
        return element.openSearchStore()
        .then((db) => {
          database = db;
          return element._storeIndexes(db, inserts);
        })
        .then(() => element._getIndexedDataAll(database, ['r1', 'r2']))
        .then((result) => {
          assert.typeOf(result.r1, 'array');
          assert.lengthOf(result.r1, 2);
          assert.typeOf(result.r2, 'array');
          assert.lengthOf(result.r2, 1);
        });
      });
    });

    describe('index()', function() {
      let element;
      let requests;
      beforeEach(async () => {
        element = await basicFixture();
        requests = [{
          id: 'test-id-1',
          url: 'https://domain.com/Api/Path?p1=1&p2=2',
          type: 'saved'
        }, {
          id: 'test-id-2',
          url: 'https://domain.com/',
          type: 'saved'
        }];
      });

      afterEach(() => {
        return element.openSearchStore()
        .then((db) => clearAllIndexes(db));
      });

      it('Stores indexes in the data store', function() {
        return element.index(requests)
        .then(() => element.openSearchStore())
        .then((db) => allIndexes(db))
        .then((result) => {
          assert.typeOf(result, 'array');
          assert.lengthOf(result, 11);
        });
      });

      it('Do not insert repeated data', function() {
        return element.index(requests)
        .then(() => element.index(requests))
        .then(() => element.openSearchStore())
        .then((db) => allIndexes(db))
        .then((result) => {
          assert.typeOf(result, 'array');
          assert.lengthOf(result, 11);
        });
      });
    });

    const INDEX_STORE_NAME = 'request-index';
    const INDEX_STORE_VERSION = 1;
    /**
     * Reads all URL indexes datastore
     * @return {Promise}
     */
    function readAllIndexes() {
      return new Promise((resolve, reject) => {
        const request = window.indexedDB.open(INDEX_STORE_NAME, INDEX_STORE_VERSION);
        request.onsuccess = (e) => {
          const results = [];
          const db = e.target.result;
          const tx = db.transaction('urls', 'readonly');
          tx.onerror = () => {
            reject(new Error('Get all tx error'));
          };
          tx.oncomplete = () => {
            resolve(results);
          };
          const store = tx.objectStore('urls');
          const request = store.openCursor();
          request.onsuccess = function(e) {
            const cursor = e.target.result;
            if (cursor) {
              results[results.length] = cursor.value;
              cursor.continue();
            }
          };
        };
        request.onerror = function() {
          reject(new Error('Unable to open the store'));
        };
      });
    }
    /**
     * Finds an indexed item in the list of stored items.
     * @param {String} url The url to search for
     * @param {Array} indexed List of indexed items
     * @return {Object}
     */
    function getIndexItemByUrl(url, indexed) {
      return indexed.find((item) =>
        item.url.toLowerCase() === url.toLowerCase());
    }
    /**
     * Removes all indexes from the index data store.
     * @return {Promise}
     */
    function clearData() {
      return new Promise((resolve, reject) => {
        const request = window.indexedDB.open(INDEX_STORE_NAME, INDEX_STORE_VERSION);
        request.onsuccess = (e) => {
          const db = e.target.result;
          const tx = db.transaction('urls', 'readwrite');
          const store = tx.objectStore('urls');
          tx.onerror = () => {
            reject(new Error('Unable to clear the store'));
          };
          tx.oncomplete = () => {
            resolve();
          };
          store.clear();
        };
        request.onerror = function() {
          reject(new Error('Unable to open the store'));
        };
      });
    }

    describe('Basic indexing', function() {
      const FULL_URL = 'https://domain.com/api?a=b&c=d';
      const REQUEST_ID = 'test-id';
      const REQUEST_TYPE = 'saved';

      after(function() {
        return clearData();
      });

      let element;
      beforeEach(async () => {
        element = await basicFixture();
      });

      /**
       * Tests indexed item structure
       * @param {String} url
       * @param {String} name
       * @param {Array} indexed
       */
      function testIndexStructure(url, name, indexed) {
        const data = getIndexItemByUrl(url, indexed);
        assert.ok(data, name + ' URL exists');
        assert.equal(data.id.indexOf(url + '::saved::'), 0,
          name + ' url id is set');
        assert.equal(data.type, REQUEST_TYPE, name + ' type is stored');
        assert.equal(data.requestId, REQUEST_ID, name + ' request id is set');
      }

      it('Indexes single request', () => {
        return element.index([{
          url: FULL_URL,
          id: REQUEST_ID,
          type: REQUEST_TYPE
        }])
        .then(() => readAllIndexes())
        .then((data) => {
          assert.lengthOf(data, 8, 'Has 8 stored elements');

          testIndexStructure(FULL_URL, 'Full url', data);
          testIndexStructure('domain.com/api?a=b&c=d', 'Authority', data);
          testIndexStructure('/api?a=b&c=d', 'Path', data);
          testIndexStructure('a=b&c=d', 'Search', data);
          testIndexStructure('a=b', 'Param #1 string', data);
          testIndexStructure('c=d', 'Param #2 string', data);
          testIndexStructure('b', 'Param #1 value', data);
          testIndexStructure('d', 'Param #2 value', data);
        });
      });

      it('Re-Indexes existing request', () => {
        return element.index([{
          url: FULL_URL,
          id: REQUEST_ID,
          type: REQUEST_TYPE
        }])
        .then(() => readAllIndexes())
        .then((data) => {
          assert.lengthOf(data, 8, 'Has 8 stored elements');
        });
      });

      it('Creates new index for different request ID', () => {
        const OTHER_ID = 'abc';
        return element.index([{
          url: FULL_URL,
          id: OTHER_ID,
          type: REQUEST_TYPE
        }])
        .then(() => readAllIndexes())
        .then((data) => {
          assert.lengthOf(data, 16, 'Has 16 stored elements');
        });
      });

      it('Removes redundant parts of the index', function() {
        const FULL_URL = 'https://domain.com/api?a=b';
        return element.index([{
          url: FULL_URL,
          id: REQUEST_ID,
          type: REQUEST_TYPE
        }])
        .then(() => readAllIndexes())
        .then((data) => {
          assert.lengthOf(data, 14, 'Has 14 stored elements');
        });
      });
    });
  });
});
