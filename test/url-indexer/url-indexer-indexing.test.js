import { fixture, assert, aTimeout } from '@open-wc/testing';
import { DbHelper } from './db-helper.js';
import '../../url-indexer.js';
import {
  storeIndexes,
  getIndexedDataAll,
} from '../../src/UrlIndexer.js';
import { ArcModelEvents } from '../../src/events/ArcModelEvents.js';

/** @typedef {import('../../src/UrlIndexer').UrlIndexer} UrlIndexer */

describe('<url-indexer> - Indexing test', () => {
  /**
   * @return {Promise<UrlIndexer>}
   */
  async function basicFixture() {
    return fixture('<url-indexer></url-indexer>');
  }

  before(async () => {
    await DbHelper.destroy();
  });

  describe('Data indexing', () => {
    describe('[storeIndexes]()', () => {
      let element = /** @type UrlIndexer */ (null);
      let inserts;
      beforeEach(async () => {
        element = await basicFixture();
        inserts = [
          {
            id: 't1',
            url: 'u1',
            requestId: 'r1',
            type: 'saved',
          },
          {
            id: 't2',
            url: 'u2',
            requestId: 'r2',
            type: 'saved',
          },
        ];
      });

      afterEach(async () => {
        const db = await element.openSearchStore();
        db.close();
        await DbHelper.clearData();
      });

      it('Stores data into the data store', async () => {
        const db = await element.openSearchStore();
        await element[storeIndexes](db, inserts);
        const data = await DbHelper.readAllIndexes();
        assert.lengthOf(data, 2);
      });
    });

    describe('[getIndexedDataAll]()', () => {
      let element = /** @type UrlIndexer */ (null);
      let inserts;
      beforeEach(async () => {
        element = await basicFixture();
        inserts = [
          {
            id: 't1',
            url: 'u1',
            requestId: 'r1',
            type: 'saved',
          },
          {
            id: 't2',
            url: 'u2',
            requestId: 'r1',
            type: 'saved',
          },
          {
            id: 't3',
            url: 'u3',
            requestId: 'r2',
            type: 'saved',
          },
        ];
      });

      afterEach(async () => {
        const db = await element.openSearchStore();
        db.close();
        await DbHelper.clearData();
      });

      it('Results to empty array when no indexes found', async () => {
        const db = await element.openSearchStore();
        const result = await element[getIndexedDataAll](db, ['test']);
        assert.typeOf(result, 'object');
        assert.lengthOf(Object.keys(result), 0);
      });

      it('Returns requests for given ID', async () => {
        const db = await element.openSearchStore();
        await element[storeIndexes](db, inserts);
        const result = await element[getIndexedDataAll](db, ['r1']);
        assert.typeOf(result.r1, 'array');
        assert.lengthOf(result.r1, 2);
      });

      it('returns multiple requests', async () => {
        const db = await element.openSearchStore();
        await element[storeIndexes](db, inserts);
        const result = await element[getIndexedDataAll](db, ['r1', 'r2']);
        assert.typeOf(result.r1, 'array');
        assert.lengthOf(result.r1, 2);
        assert.typeOf(result.r2, 'array');
        assert.lengthOf(result.r2, 1);
      });
    });

    describe('index()', () => {
      let element = /** @type UrlIndexer */ (null);
      let requests;
      beforeEach(async () => {
        element = await basicFixture();
        requests = [
          {
            id: 'test-id-1',
            url: 'https://domain.com/Api/Path?p1=1&p2=2',
            type: 'saved',
          },
          {
            id: 'test-id-2',
            url: 'https://domain.com/',
            type: 'saved',
          },
        ];
      });

      afterEach(async () => {
        const db = await element.openSearchStore();
        db.close();
        await DbHelper.clearData();
      });

      it('Stores indexes in the data store', async () => {
        await element.index(requests);
        const result = await DbHelper.readAllIndexes();
        assert.typeOf(result, 'array');
        assert.lengthOf(result, 11);
      });

      it('does not insert repeated data', async () => {
        await element.index(requests);
        await element.index(requests);
        const result = await DbHelper.readAllIndexes();
        assert.typeOf(result, 'array');
        assert.lengthOf(result, 11);
      });

      it('Indexes via event', async () => {
        ArcModelEvents.UrlIndexer.update(document.body, requests);
        // should be enough?
        await aTimeout(200);
        const result = await DbHelper.readAllIndexes();
        assert.lengthOf(result, 11);
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
        const request = window.indexedDB.open(
          INDEX_STORE_NAME,
          INDEX_STORE_VERSION
        );
        request.onsuccess = (e) => {
          const results = [];
          // @ts-ignore
          const db = e.target.result;
          const tx = db.transaction('urls', 'readonly');
          tx.onerror = () => {
            reject(new Error('Get all tx error'));
          };
          tx.oncomplete = () => {
            resolve(results);
          };
          const store = tx.objectStore('urls');
          const rq = store.openCursor();
          rq.onsuccess = (ev) => {
            const cursor = ev.target.result;
            if (cursor) {
              results[results.length] = cursor.value;
              cursor.continue();
            }
          };
        };
        request.onerror = () => {
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
      return indexed.find(
        (item) => item.url.toLowerCase() === url.toLowerCase()
      );
    }

    describe('Basic indexing', () => {
      const FULL_URL = 'https://domain.com/api?a=b&c=d';
      const REQUEST_ID = 'test-id';
      const REQUEST_TYPE = 'saved';

      let element = /** @type UrlIndexer */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      afterEach(async () => {
        const db = await element.openSearchStore();
        db.close();
      });

      after(async () => {
        await DbHelper.clearData();
      });

      /**
       * Tests indexed item structure
       * @param {String} url
       * @param {String} name
       * @param {Array} indexed
       */
      function testIndexStructure(url, name, indexed) {
        const data = getIndexItemByUrl(url, indexed);
        assert.ok(data, `${name} URL exists`);
        assert.equal(
          data.id.indexOf(`${url}::saved::`),
          0,
          `${name} url id is set`
        );
        assert.equal(data.type, REQUEST_TYPE, ` ${name} type is stored`);
        assert.equal(data.requestId, REQUEST_ID, `${name} request id is set`);
      }

      it('Indexes single request', async () => {
        await element.index([
          {
            url: FULL_URL,
            id: REQUEST_ID,
            type: REQUEST_TYPE,
          },
        ]);
        const data = await readAllIndexes();
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

      it('Re-Indexes existing request', async () => {
        await element.index([
          {
            url: FULL_URL,
            id: REQUEST_ID,
            type: REQUEST_TYPE,
          },
        ]);
        const data = await readAllIndexes();
        assert.lengthOf(data, 8, 'Has 8 stored elements');
      });

      it('Creates new index for different request ID', async () => {
        const OTHER_ID = 'abc';
        await element.index([
          {
            url: FULL_URL,
            id: OTHER_ID,
            type: REQUEST_TYPE,
          },
        ]);
        const data = await readAllIndexes();
        assert.lengthOf(data, 16, 'Has 16 stored elements');
      });

      it('Removes redundant parts of the index', async () => {
        const url = 'https://domain.com/api?a=b';
        await element.index([
          {
            url,
            id: REQUEST_ID,
            type: REQUEST_TYPE,
          },
        ]);
        const data = await readAllIndexes();
        assert.lengthOf(data, 14, 'Has 14 stored elements');
      });
    });
  });

  describe('reindexSaved()', () => {
    const FULL_URL = 'https://domain.com/api?a=b&c=d';
    const REQUEST_ID = 'test-id';
    const REQUEST_TYPE = 'saved';

    before(async () => {
      /* global PouchDB */
      let db = new PouchDB('saved-requests');
      await db.destroy();
      db = new PouchDB('saved-requests');
      await db.put({
        _id: REQUEST_ID,
        url: FULL_URL,
        type: REQUEST_TYPE,
      });
    });

    let element = /** @type UrlIndexer */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    afterEach(async () => {
      const db = await element.openSearchStore();
      db.close();
      await DbHelper.clearData();
    });

    it('reindexes saved requests', async () => {
      await element.reindexSaved();
      const result = await DbHelper.readAllIndexes();
      assert.lengthOf(result, 8);
    });

    it('reindexes via reindex()', async () => {
      await element.reindex('saved');
      const result = await DbHelper.readAllIndexes();
      assert.lengthOf(result, 8);
    });
  });

  describe('reindexHistory()', () => {
    const FULL_URL = 'https://domain.com/api?a=b&c=d';
    const REQUEST_ID = 'test-id';
    const REQUEST_TYPE = 'history';

    before(async () => {
      let db = new PouchDB('history-requests');
      await db.destroy();
      db = new PouchDB('history-requests');
      await db.put({
        _id: REQUEST_ID,
        url: FULL_URL,
        type: REQUEST_TYPE,
      });
    });

    let element = /** @type UrlIndexer */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    afterEach(async () => {
      const db = await element.openSearchStore();
      db.close();
      await DbHelper.clearData();
    });

    it('reindexes history requests', async () => {
      await element.reindexHistory();
      const result = await DbHelper.readAllIndexes();
      assert.lengthOf(result, 8);
    });

    it('reindexes via reindex()', async () => {
      await element.reindex('history');
      const result = await DbHelper.readAllIndexes();
      assert.lengthOf(result, 8);
    });
  });

  describe('reindex()', () => {
    // this tests were performed above so this only tests for error
    let element = /** @type UrlIndexer */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    afterEach(async () => {
      const db = await element.openSearchStore();
      db.close();
      await DbHelper.clearData();
    });

    it('rejects when unknown type', async () => {
      let message;
      try {
        await element.reindex('other');
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'Unknown type');
    });
  });
});
