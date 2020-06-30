import { fixture, assert } from '@open-wc/testing';
import '../../url-indexer.js';
import {
  normalizeType,
  STORE_NAME,
  STORE_VERSION,
} from '../../src/UrlIndexer.js';

/** @typedef {import('../../src/UrlIndexer').UrlIndexer} UrlIndexer */

describe('<url-indexer>', () => {
  /**
   * @return {Promise<UrlIndexer>}
   */
  async function basicFixture() {
    return fixture('<url-indexer></url-indexer>');
  }

  describe('URL indexer', () => {
    function noop() {}
    const hasUrlSupport = typeof URL !== 'undefined';

    describe('_generateId()', () => {
      let element = /** @type UrlIndexer */ (null);
      const type = 'test-type';
      const url = 'test-url';

      before(async () => {
        element = await basicFixture();
      });

      it('Returns a string', () => {
        const result = element._generateId(url, type);
        assert.typeOf(result, 'string');
      });

      it('Contains URL', () => {
        const result = element._generateId(url, type);
        assert.equal(result.indexOf(url), 0);
      });

      it('Contains type', () => {
        const result = element._generateId(url, type);
        assert.isAbove(result.indexOf(type), 1);
      });

      it('Contains uuid', () => {
        const result = element._generateId(url, type);
        const parts = result.split('::');
        assert.typeOf(parts[2], 'string');
      });
    });

    describe('Consts', () => {
      it('indexStoreName is string', () => {
        assert.typeOf(STORE_NAME, 'string');
      });

      it('indexStoreName is store name', () => {
        assert.equal(STORE_NAME, 'request-index');
      });

      it('indexStoreVersion is a number', () => {
        assert.typeOf(STORE_VERSION, 'number');
      });

      it('indexStoreVersion is version number', () => {
        assert.equal(STORE_VERSION, 1);
      });
    });

    describe('_indexDebounce()', () => {
      let element;
      const id = 'test-id';
      const url = 'test-url';
      const type = 'test-type';

      before(async () => {
        element = await basicFixture();
        // @ts-ignore
        element.index = noop;
      });

      it('Sets __indexDebounce property', () => {
        element._indexDebounce(id, url, type);
        assert.typeOf(element.__indexDebounce, 'number');
        clearTimeout(element.__indexDebounce);
        element.__indexRequestQueue = undefined;
      });

      it('Sets __indexRequestQueue property', () => {
        element._indexDebounce(id, url, type);
        assert.typeOf(element.__indexRequestQueue, 'array', 'Array is set');
        assert.lengthOf(element.__indexRequestQueue, 1, 'Has single item');
        clearTimeout(element.__indexDebounce);
        element.__indexRequestQueue = undefined;
      });

      it('__indexRequestQueue item has all properties', () => {
        element._indexDebounce(id, url, type);
        const item = element.__indexRequestQueue[0];
        assert.equal(item.id, id);
        assert.equal(item.url, url);
        assert.equal(item.type, type);
        clearTimeout(element.__indexDebounce);
        element.__indexRequestQueue = undefined;
      });

      it('Updates URL if the same request is called before flush', (done) => {
        element._indexDebounce(id, url, type);
        setTimeout(() => {
          element._indexDebounce(id, 'url-2', 'type-2');
          const item = element.__indexRequestQueue[0];
          assert.equal(item.url, 'url-2');
          clearTimeout(element.__indexDebounce);
          element.__indexRequestQueue = undefined;
          done();
        }, 1);
      });

      it('Updates type if the same request is called before flush', (done) => {
        element._indexDebounce(id, url, type);
        setTimeout(() => {
          element._indexDebounce(id, 'url-2', 'type-2');
          const item = element.__indexRequestQueue[0];
          assert.equal(item.type, 'type-2');
          clearTimeout(element.__indexDebounce);
          element.__indexRequestQueue = undefined;
          done();
        }, 1);
      });

      it('Flushes the queue', (done) => {
        element._indexDebounce(id, url, type);
        element.index = () => {
          done();
          return Promise.resolve();
        };
      });

      it('Calls index with params', (done) => {
        element._indexDebounce(id, url, type);
        element.index = (data) => {
          assert.typeOf(data, 'array');
          assert.lengthOf(data, 1, 'Has single item');
          done();
          return Promise.resolve();
        };
      });

      it('Calls index with params', (done) => {
        element._indexDebounce(id, url, type);
        element.index = (data) => {
          assert.typeOf(data, 'array');
          assert.lengthOf(data, 1, 'Has single item');
          const item = data[0];
          assert.equal(item.id, id);
          assert.equal(item.url, url);
          assert.equal(item.type, type);
          done();
          return Promise.resolve();
        };
      });

      it('Clears __indexDebounce', (done) => {
        element._indexDebounce(id, url, type);
        element.index = () => {
          assert.isUndefined(element.__indexDebounce);
          done();
          return Promise.resolve();
        };
      });

      it('Clears __indexRequestQueue', (done) => {
        element._indexDebounce(id, url, type);
        element.index = () => {
          assert.isUndefined(element.__indexRequestQueue);
          done();
          return Promise.resolve();
        };
      });
    });

    describe('_deleteIndexDebounce()', () => {
      let element;
      const id = 'test-id';
      before(async () => {
        element = await basicFixture();
        // @ts-ignore
        element.deleteIndexedData = noop;
      });

      it('Sets __deleteIndexDebounce property', () => {
        element._deleteIndexDebounce(id);
        assert.typeOf(element.__deleteIndexDebounce, 'number');
        clearTimeout(element.__deleteIndexDebounce);
        element.__deleteRequestQueue = undefined;
      });

      it('Sets __deleteRequestQueue property', () => {
        element._deleteIndexDebounce(id);
        assert.typeOf(element.__deleteRequestQueue, 'array', 'Array is set');
        assert.lengthOf(element.__deleteRequestQueue, 1, 'Has single item');
        clearTimeout(element.__deleteIndexDebounce);
        element.__deleteRequestQueue = undefined;
      });

      it('__deleteRequestQueue item has the id', () => {
        element._deleteIndexDebounce(id);
        const result = element.__deleteRequestQueue[0];
        assert.equal(result, id);
        clearTimeout(element.__deleteIndexDebounce);
        element.__deleteRequestQueue = undefined;
      });

      it('Does nothing if repeates the call', (done) => {
        element._deleteIndexDebounce(id);
        setTimeout(() => {
          element._deleteIndexDebounce(id);
          assert.typeOf(element.__deleteRequestQueue, 'array', 'Array is set');
          assert.lengthOf(element.__deleteRequestQueue, 1, 'Has single item');
          const result = element.__deleteRequestQueue[0];
          assert.equal(result, id);
          clearTimeout(element.__deleteIndexDebounce);
          element.__deleteRequestQueue = undefined;
          done();
        }, 1);
      });

      it('Flushes the queue', (done) => {
        element._deleteIndexDebounce(id);
        element.deleteIndexedData = () => {
          done();
          return Promise.resolve();
        };
      });

      it('Calls deleteIndexedData with params', (done) => {
        element._deleteIndexDebounce(id);
        element.deleteIndexedData = (data) => {
          assert.typeOf(data, 'array');
          assert.lengthOf(data, 1, 'Has single item');
          done();
          return Promise.resolve();
        };
      });

      it('Calls index with params', (done) => {
        element._deleteIndexDebounce(id);
        element.deleteIndexedData = (data) => {
          assert.typeOf(data, 'array');
          assert.lengthOf(data, 1, 'Has single item');
          const result = data[0];
          assert.equal(result, id);
          done();
          return Promise.resolve();
        };
      });

      it('Clears __indexDebounce', (done) => {
        element._deleteIndexDebounce(id);
        element.deleteIndexedData = () => {
          assert.isUndefined(element.__deleteIndexDebounce);
          done();
          return Promise.resolve();
        };
      });

      it('Clears __deleteRequestQueue', (done) => {
        element._deleteIndexDebounce(id);
        element.deleteIndexedData = () => {
          assert.isUndefined(element.__deleteRequestQueue);
          done();
          return Promise.resolve();
        };
      });
    });

    describe('_prepareRequestIndexData()', () => {
      let element = /** @type UrlIndexer */ (null);
      let request;
      before(async () => {
        element = await basicFixture();
        request = {
          id: 'test-id',
          url: 'https://domain.com/Api/Path?p1=1&p2=2',
          type: 'saved',
        };
      });

      it('Always returns an array', () => {
        const result = element._prepareRequestIndexData(request, []);
        assert.typeOf(result, 'array');
      });

      it('Returns 8 items', () => {
        if (!hasUrlSupport) {
          return;
        }
        const result = element._prepareRequestIndexData(request, []);
        assert.lengthOf(result, 8);
      });

      it('Skips already indexed items', () => {
        if (!hasUrlSupport) {
          return;
        }
        const result = element._prepareRequestIndexData(request, [
          {
            url: 'p1=1&p2=2',
            fullUrl: 0,
            requestId: 'test',
            id: 'test',
            type: 'saved',
          },
          {
            url: '/api/path?p1=1&p2=2',
            fullUrl: 0,
            requestId: 'test',
            id: 'test',
            type: 'saved',
          },
          {
            url: '/notexist',
            fullUrl: 0,
            requestId: 'test',
            id: 'test',
            type: 'saved',
          },
        ]);
        assert.lengthOf(result, 6);
      });

      it('Items has required structure', () => {
        if (!hasUrlSupport) {
          return;
        }
        const result = element._prepareRequestIndexData(request, []);
        for (let i = 0; i < result.length; i++) {
          const item = result[i];
          assert.equal(item.type, 'saved');
          assert.typeOf(item.url, 'string');
          assert.equal(
            item.id.indexOf(`${item.url.toLowerCase()}::${item.type}`),
            0
          );
        }
      });

      it('Returns empty array for invalid URL', () => {
        const rq = {
          id: 'test-id',
          url: 'Path?p1=1&p2=2',
          type: 'saved',
        };
        const result = element._prepareRequestIndexData(rq, []);
        assert.typeOf(result, 'array');
        assert.lengthOf(result, 0);
      });
    });

    describe('_createIndexIfMissing()', () => {
      let element = /** @type UrlIndexer */ (null);
      const id = 'test-id';
      const url = 'test-url';
      const type = 'test-type';
      let indexed;
      before(async () => {
        element = await basicFixture();
        indexed = [];
      });

      it('Creates datastore entry if not exists', () => {
        const result = element._createIndexIfMissing(url, id, type, indexed);
        assert.typeOf(result, 'object');
      });

      it('Datastore entry has id', () => {
        const result = element._createIndexIfMissing(url, id, type, indexed);
        assert.typeOf(result.id, 'string');
      });

      it('Datastore entry has url', () => {
        const result = element._createIndexIfMissing(url, id, type, indexed);
        assert.equal(result.url, url);
      });

      it('Datastore entry has requestId', () => {
        const result = element._createIndexIfMissing(url, id, type, indexed);
        assert.equal(result.requestId, id);
      });

      it('Datastore entry has type', () => {
        const result = element._createIndexIfMissing(url, id, type, indexed);
        assert.equal(result.type, type);
      });

      it('Datastore entry has fullUrl', () => {
        const result = element._createIndexIfMissing(url, id, type, indexed);
        assert.strictEqual(result.fullUrl, 0);
      });

      it('Returns undefined if the item is already indexed', () => {
        indexed = [
          {
            url,
            fullUrl: 0,
            requestId: 'test',
            id: 'test',
            type: 'saved',
          },
        ];
        const result = element._createIndexIfMissing(url, id, type, indexed);
        assert.isUndefined(result);
      });
    });

    describe('_getUrlObject()', () => {
      let element = /** @type UrlIndexer */ (null);
      const id = 'test-id';
      const url = 'test-url';
      const type = 'test-type';
      let indexed;
      let request;
      before(async () => {
        element = await basicFixture();
        indexed = [];
        request = {
          id,
          url,
          type,
        };
      });

      it('Creates index entity when not indexed', () => {
        const result = element._getUrlObject(request, indexed);
        assert.typeOf(result, 'object');
      });

      it('Returns undefined if already indexed', () => {
        indexed = [
          {
            url,
            fullUrl: 0,
            requestId: 'test',
            id: 'test',
            type: 'saved',
          },
        ];
        const result = element._getUrlObject(request, indexed);
        assert.isUndefined(result);
      });
    });

    describe('_getAuthorityPath()', () => {
      let element = /** @type UrlIndexer */ (null);
      const id = 'test-id';
      const requestUrl = 'https://domain.com';
      const type = 'test-type';
      let indexed;
      let parser;
      before(async () => {
        element = await basicFixture();
        indexed = [];
        parser = new URL(requestUrl);
      });

      it('Creates index entity when not indexed', () => {
        if (!hasUrlSupport) {
          return;
        }
        const result = element._getAuthorityPath(parser, id, type, indexed);
        assert.typeOf(result, 'object');
      });

      it('Returns undefined if already indexed', () => {
        if (!hasUrlSupport) {
          return;
        }
        const { url } = element._getAuthorityPath(parser, id, type, indexed);
        indexed = [
          {
            url,
            fullUrl: 0,
            requestId: 'test',
            id: 'test',
            type: 'saved',
          },
        ];
        const result = element._getAuthorityPath(parser, id, type, indexed);
        assert.isUndefined(result);
      });
    });

    describe('_getPathQuery()', () => {
      let element = /** @type UrlIndexer */ (null);
      const id = 'test-id';
      const requestUrl = 'https://domain.com?a=b';
      const type = 'test-type';
      let indexed;
      let parser;
      before(async () => {
        element = await basicFixture();
        indexed = [];
        parser = new URL(requestUrl);
      });

      it('Creates index entity when not indexed', () => {
        if (!hasUrlSupport) {
          return;
        }
        const result = element._getPathQuery(parser, id, type, indexed);
        assert.typeOf(result, 'object');
      });

      it('Returns undefined if already indexed', () => {
        if (!hasUrlSupport) {
          return;
        }
        const { url } = element._getPathQuery(parser, id, type, indexed);
        indexed = [
          {
            url,
            fullUrl: 0,
            requestId: 'test',
            id: 'test',
            type: 'saved',
          },
        ];
        const result = element._getPathQuery(parser, id, type, indexed);
        assert.isUndefined(result);
      });
    });

    describe('_getQueryString()', () => {
      let element = /** @type UrlIndexer */ (null);
      const id = 'test-id';
      const requestUrl = 'https://domain.com?a=b';
      const type = 'test-type';
      let indexed;
      let parser;
      before(async () => {
        element = await basicFixture();
        indexed = [];
        parser = new URL(requestUrl);
      });

      it('Creates index entity when not indexed', () => {
        if (!hasUrlSupport) {
          return;
        }
        const result = element._getQueryString(parser, id, type, indexed);
        assert.typeOf(result, 'object');
      });

      it('Returns undefined if already indexed', () => {
        if (!hasUrlSupport) {
          return;
        }
        const { url } = element._getQueryString(parser, id, type, indexed);
        indexed = [
          {
            url,
            fullUrl: 0,
            requestId: 'test',
            id: 'test',
            type: 'saved',
          },
        ];
        const result = element._getQueryString(parser, id, type, indexed);
        assert.isUndefined(result);
      });
    });

    describe('_appendQueryParams()', () => {
      let element = /** @type UrlIndexer */ (null);
      const id = 'test-id';
      const requestUrl = 'https://domain.com?a=b';
      const type = 'test-type';
      let indexed;
      let parser;
      let target;
      before(async () => {
        element = await basicFixture();
        indexed = [];
        target = [];
        parser = new URL(requestUrl);
      });

      it('Adds index entity when not indexed', () => {
        if (!hasUrlSupport) {
          return;
        }
        element._appendQueryParams(parser, id, type, indexed, target);
        assert.lengthOf(target, 2);
      });

      it('Returns undefined if already indexed', () => {
        if (!hasUrlSupport) {
          return;
        }
        element._appendQueryParams(parser, id, type, indexed, target);
        indexed = [
          {
            url: target[0].url,
            fullUrl: 0,
            requestId: 'test',
            id: 'test',
            type: 'saved',
          },
          {
            url: target[1].url,
            fullUrl: 0,
            requestId: 'test',
            id: 'test',
            type: 'saved',
          },
        ];
        target = [];
        element._appendQueryParams(parser, id, type, indexed, target);
        assert.lengthOf(target, 0);
      });
    });

    describe('openSearchStore()', () => {
      let element = /** @type UrlIndexer */ (null);
      before(async () => {
        element = await basicFixture();
      });

      // after(() => DbHelper.clearData());

      // after((done) => {
      //   DbHelper.clearData()
      //   .then(() => {
      //     element.__db.close();
      //     const request = window.indexedDB.deleteDatabase('request-index');
      //     request.onerror = () => {
      //       done(new Error('Unable to delete database'));
      //     };
      //     request.onsuccess = () => {
      //       done();
      //     };
      //   });
      // });

      it('eventually opens the data store', async () => {
        const result = await element.openSearchStore();
        // @ts-ignore
        assert.isTrue(result instanceof window.IDBDatabase);
      });

      it('always returns the same database instance', async () => {
        const db1 = await element.openSearchStore();
        const db2 = await element.openSearchStore();
        assert.isTrue(db1 === db2);
      });
    });
  });

  describe('normalizeType()', () => {
    it('returns saved for saved-requests', () => {
      const result = normalizeType('saved-requests');
      assert.equal(result, 'saved');
    });

    it('returns history for history-requests', () => {
      const result = normalizeType('history-requests');
      assert.equal(result, 'history');
    });

    it('returns passed item', () => {
      const result = normalizeType('history');
      assert.equal(result, 'history');
    });
  });
});
