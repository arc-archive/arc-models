import { fixture, assert } from '@open-wc/testing';
import '../../url-indexer.js';

describe('<url-indexer>', function() {
  async function basicFixture() {
    return /** @type {UrlIndexer} */ (await fixture('<url-indexer></url-indexer>'));
  }

  describe('URL indexer', function() {
    function noop() {}
    const hasUrlSupport = typeof URL !== 'undefined';
    describe('UUID generation', () => {
      let element;

      before(async () => {
        element = await basicFixture();
      });

      it('Returns a reference to uuid-generator', () => {
        const result = element.uuid;
        assert.equal(result.nodeName, 'UUID-GENERATOR');
      });

      it('Returns the same element', () => {
        const result1 = element.uuid;
        const result2 = element.uuid;
        assert.isTrue(result1 === result2);
      });

      it('Generates UUID', () => {
        const result = element.uuid.generate();
        assert.typeOf(result, 'string');
      });
    });

    describe('_generateId()', () => {
      let element;
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

    describe('Getters', () => {
      let element;
      before(async () => {
        element = await basicFixture();
      });

      it('indexStoreName is string', () => {
        assert.typeOf(element.indexStoreName, 'string');
      });

      it('indexStoreName is store name', () => {
        assert.equal(element.indexStoreName, 'request-index');
      });

      it('indexStoreVersion is a number', () => {
        assert.typeOf(element.indexStoreVersion, 'number');
      });

      it('indexStoreVersion is version number', () => {
        assert.equal(element.indexStoreVersion, 1);
      });
    });

    describe('_indexDebounce()', () => {
      let element;
      const id = 'test-id';
      const url = 'test-url';
      const type = 'test-type';

      before(async () => {
        element = await basicFixture();
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

    describe('_prepareRequestIndexData()', function() {
      let element;
      let request;
      before(async () => {
        element = await basicFixture();
        request = {
          id: 'test-id',
          url: 'https://domain.com/Api/Path?p1=1&p2=2',
          type: 'saved'
        };
      });

      it('Always returns an array', function() {
        const result = element._prepareRequestIndexData(request, []);
        assert.typeOf(result, 'array');
      });

      it('Returns 8 items', function() {
        if (!hasUrlSupport) {
          return;
        }
        const result = element._prepareRequestIndexData(request, []);
        assert.lengthOf(result, 8);
      });

      it('Skips already indexed items', function() {
        if (!hasUrlSupport) {
          return;
        }
        const result = element._prepareRequestIndexData(request, [{
          url: 'p1=1&p2=2'
        }, {
          url: '/api/path?p1=1&p2=2'
        }, {
          url: '/notexist'
        }]);
        assert.lengthOf(result, 6);
      });

      it('Items has required structure', function() {
        if (!hasUrlSupport) {
          return;
        }
        const result = element._prepareRequestIndexData(request, []);
        for (let i = 0; i < result.length; i++) {
          const item = result[i];
          assert.equal(item.type, 'saved');
          assert.typeOf(item.url, 'string');
          assert.equal(item.id.indexOf(item.url.toLowerCase() + '::' + item.type), 0);
        }
      });

      it('Returns empty array for invalid URL', function() {
        const request = {
          id: 'test-id',
          url: 'Path?p1=1&p2=2',
          type: 'saved'
        };
        const result = element._prepareRequestIndexData(request, []);
        assert.typeOf(result, 'array');
        assert.lengthOf(result, 0);
      });
    });

    describe('_createIndexIfMissing()', () => {
      let element;
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
        indexed = [{
          url
        }];
        const result = element._createIndexIfMissing(url, id, type, indexed);
        assert.isUndefined(result);
      });
    });

    describe('_getUrlObject()', () => {
      let element;
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
          type
        };
      });

      it('Creates index entity when not indexed', () => {
        const result = element._getUrlObject(request, indexed);
        assert.typeOf(result, 'object');
      });

      it('Returns undefined if already indexed', () => {
        indexed = [{
          url
        }];
        const result = element._getUrlObject(request, indexed);
        assert.isUndefined(result);
      });
    });

    describe('_getAuthorityPath()', () => {
      let element;
      const id = 'test-id';
      const url = 'https://domain.com';
      const type = 'test-type';
      let indexed;
      let parser;
      before(async () => {
        element = await basicFixture();
        indexed = [];
        parser = new URL(url);
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
        const url = element._getAuthorityPath(parser, id, type, indexed).url;
        indexed = [{
          url
        }];
        const result = element._getAuthorityPath(parser, id, type, indexed);
        assert.isUndefined(result);
      });
    });

    describe('_getPathQuery()', () => {
      let element;
      const id = 'test-id';
      const url = 'https://domain.com?a=b';
      const type = 'test-type';
      let indexed;
      let parser;
      before(async () => {
        element = await basicFixture();
        indexed = [];
        parser = new URL(url);
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
        const url = element._getPathQuery(parser, id, type, indexed).url;
        indexed = [{
          url
        }];
        const result = element._getPathQuery(parser, id, type, indexed);
        assert.isUndefined(result);
      });
    });

    describe('_getQueryString()', () => {
      let element;
      const id = 'test-id';
      const url = 'https://domain.com?a=b';
      const type = 'test-type';
      let indexed;
      let parser;
      before(async () => {
        element = await basicFixture();
        indexed = [];
        parser = new URL(url);
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
        const url = element._getQueryString(parser, id, type, indexed).url;
        indexed = [{
          url
        }];
        const result = element._getQueryString(parser, id, type, indexed);
        assert.isUndefined(result);
      });
    });

    describe('_appendQueryParams()', () => {
      let element;
      const id = 'test-id';
      const url = 'https://domain.com?a=b';
      const type = 'test-type';
      let indexed;
      let parser;
      let target;
      before(async () => {
        element = await basicFixture();
        indexed = [];
        target = [];
        parser = new URL(url);
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
        indexed = [{
          url: target[0].url
        }, {
          url: target[1].url
        }];
        target = [];
        element._appendQueryParams(parser, id, type, indexed, target);
        assert.lengthOf(target, 0);
      });
    });

    describe('openSearchStore()', () => {
      let element;
      before(async () => {
        element = await basicFixture();
      });

      // after(() => DbHelper.clearData());

      // after((done) => {
      //   DbHelper.clearData()
      //   .then(() => {
      //     element.__db.close();
      //     const request = window.indexedDB.deleteDatabase('request-index');
      //     request.onerror = function() {
      //       done(new Error('Unable to delete database'));
      //     };
      //     request.onsuccess = function() {
      //       done();
      //     };
      //   });
      // });

      it('Eventually opens the data store', () => {
        return element.openSearchStore()
        .then((db) => {
          assert.isTrue(db instanceof window.IDBDatabase);
        });
      });

      it('Always returns the same database instance', () => {
        let db1;
        return element.openSearchStore()
        .then((db) => {
          db1 = db;
          return element.openSearchStore();
        })
        .then((db2) => {
          assert.isTrue(db1 === db2);
        });
      });
    });
  });

  describe('_normalizeType()', () => {
    let element;
    before(async () => {
      element = await basicFixture();
    });

    it('returns saved for saved-requests', () => {
      const result = element._normalizeType('saved-requests');
      assert.equal(result, 'saved');
    });

    it('returns history for history-requests', () => {
      const result = element._normalizeType('history-requests');
      assert.equal(result, 'history');
    });

    it('returns passed item', () => {
      const result = element._normalizeType('history');
      assert.equal(result, 'history');
    });
  });
});
