import { fixture, assert } from '@open-wc/testing';
import '../../url-indexer.js';
import {
  generateId,
  indexDebounce,
  indexDebounceValue,
  indexRequestQueueValue,
  deleteIndexDebounce,
  deleteIndexDebounceValue,
  deleteRequestQueueValue,
  prepareRequestIndexData,
  createIndexIfMissing,
  getUrlObject,
  getAuthorityPath,
  getPathQuery,
  getQueryString,
  appendQueryParams,
  STORE_NAME,
  STORE_VERSION,
} from '../../src/UrlIndexer.js';

/** @typedef {import('../../src/UrlIndexer').UrlIndexer} UrlIndexer */

describe('URL indexer', () => {
  /**
   * @return {Promise<UrlIndexer>}
   */
  async function basicFixture() {
    return fixture('<url-indexer></url-indexer>');
  }

  function noop() {}
  const hasUrlSupport = typeof URL !== 'undefined';

  describe('[generateId]()', () => {
    let element = /** @type UrlIndexer */ (null);
    const type = 'test-type';
    const url = 'test-url';

    before(async () => {
      element = await basicFixture();
    });

    it('Returns a string', () => {
      const result = element[generateId](url, type);
      assert.typeOf(result, 'string');
    });

    it('Contains URL', () => {
      const result = element[generateId](url, type);
      assert.equal(result.indexOf(url), 0);
    });

    it('Contains type', () => {
      const result = element[generateId](url, type);
      assert.isAbove(result.indexOf(type), 1);
    });

    it('Contains uuid', () => {
      const result = element[generateId](url, type);
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

  describe('[indexDebounce]()', () => {
    let element = /** @type UrlIndexer */ (null);
    const id = 'test-id';
    const url = 'test-url';
    const type = 'test-type';

    before(async () => {
      element = await basicFixture();
      // @ts-ignore
      element.index = noop;
    });

    it('sets [indexDebounceValue] property', () => {
      element[indexDebounce](id, url, type);
      assert.typeOf(element[indexDebounceValue], 'number');
      clearTimeout(element[indexDebounceValue]);
      element[indexRequestQueueValue] = [];
    });

    it('sets [indexRequestQueueValue] property', () => {
      element[indexDebounce](id, url, type);
      assert.typeOf(element[indexRequestQueueValue], 'array', 'Array is set');
      assert.lengthOf(element[indexRequestQueueValue], 1, 'Has single item');
      clearTimeout(element[indexDebounceValue]);
      element[indexRequestQueueValue] = [];
    });

    it('[indexRequestQueueValue] item has all properties', () => {
      element[indexDebounce](id, url, type);
      const item = element[indexRequestQueueValue][0];
      assert.equal(item.id, id);
      assert.equal(item.url, url);
      assert.equal(item.type, type);
      clearTimeout(element[indexDebounceValue]);
      element[indexRequestQueueValue] = [];
    });

    it('Updates URL if the same request is called before queue flush', (done) => {
      element[indexDebounce](id, url, type);
      setTimeout(() => {
        element[indexDebounce](id, 'url-2', 'type-2');
        const item = element[indexRequestQueueValue][0];
        assert.equal(item.url, 'url-2');
        clearTimeout(element[indexDebounceValue]);
        element[indexRequestQueueValue] = [];
        done();
      }, 1);
    });

    it('Updates type if the same request is called before flush', (done) => {
      element[indexDebounce](id, url, type);
      setTimeout(() => {
        element[indexDebounce](id, 'url-2', 'type-2');
        const item = element[indexRequestQueueValue][0];
        assert.equal(item.type, 'type-2');
        clearTimeout(element[indexDebounceValue]);
        element[indexRequestQueueValue] = [];
        done();
      }, 1);
    });

    it('Flushes the queue', (done) => {
      element[indexDebounce](id, url, type);
      element.index = () => {
        done();
        return Promise.resolve();
      };
    });

    it('Calls index with params', (done) => {
      element[indexDebounce](id, url, type);
      element.index = (data) => {
        assert.typeOf(data, 'array');
        assert.lengthOf(data, 1, 'Has single item');
        done();
        return Promise.resolve();
      };
    });

    it('Calls index with params', (done) => {
      element[indexDebounce](id, url, type);
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

    it('clears [indexDebounceValue]', (done) => {
      element[indexDebounce](id, url, type);
      element.index = () => {
        assert.isUndefined(element[indexDebounceValue]);
        done();
        return Promise.resolve();
      };
    });

    it('clears [indexRequestQueueValue]', (done) => {
      element[indexDebounce](id, url, type);
      element.index = () => {
        assert.deepEqual(element[indexRequestQueueValue], []);
        done();
        return Promise.resolve();
      };
    });
  });

  describe('[deleteIndexDebounce]()', () => {
    let element = /** @type UrlIndexer */ (null);
    const id = 'test-id';
    before(async () => {
      element = await basicFixture();
      // @ts-ignore
      element.deleteIndexedData = noop;
    });

    it('Sets [deleteIndexDebounceValue] property', () => {
      element[deleteIndexDebounce](id);
      assert.typeOf(element[deleteIndexDebounceValue], 'number');
      clearTimeout(element[deleteIndexDebounceValue]);
      element[deleteRequestQueueValue] = undefined;
    });

    it('Sets [deleteRequestQueueValue] property', () => {
      element[deleteIndexDebounce](id);
      assert.typeOf(element[deleteRequestQueueValue], 'array', 'Array is set');
      assert.lengthOf(element[deleteRequestQueueValue], 1, 'Has single item');
      clearTimeout(element[deleteIndexDebounceValue]);
      element[deleteRequestQueueValue] = undefined;
    });

    it('[deleteRequestQueueValue] item has the id', () => {
      element[deleteIndexDebounce](id);
      const result = element[deleteRequestQueueValue][0];
      assert.equal(result, id);
      clearTimeout(element[deleteIndexDebounceValue]);
      element[deleteRequestQueueValue] = undefined;
    });

    it('does nothing if repeates the call', (done) => {
      element[deleteIndexDebounce](id);
      setTimeout(() => {
        element[deleteIndexDebounce](id);
        assert.typeOf(element[deleteRequestQueueValue], 'array', 'Array is set');
        assert.lengthOf(element[deleteRequestQueueValue], 1, 'Has single item');
        const result = element[deleteRequestQueueValue][0];
        assert.equal(result, id);
        clearTimeout(element[deleteIndexDebounceValue]);
        element[deleteRequestQueueValue] = undefined;
        done();
      }, 1);
    });

    it('flushes the queue', (done) => {
      element[deleteIndexDebounce](id);
      element.deleteIndexedData = () => {
        done();
        return Promise.resolve();
      };
    });

    it('Calls deleteIndexedData with params', (done) => {
      element[deleteIndexDebounce](id);
      element.deleteIndexedData = (data) => {
        assert.typeOf(data, 'array');
        assert.lengthOf(data, 1, 'Has single item');
        done();
        return Promise.resolve();
      };
    });

    it('Calls index with params', (done) => {
      element[deleteIndexDebounce](id);
      element.deleteIndexedData = (data) => {
        assert.typeOf(data, 'array');
        assert.lengthOf(data, 1, 'Has single item');
        const result = data[0];
        assert.equal(result, id);
        done();
        return Promise.resolve();
      };
    });

    it('clears [deleteIndexDebounce]', (done) => {
      element[deleteIndexDebounce](id);
      element.deleteIndexedData = () => {
        assert.isUndefined(element[deleteIndexDebounceValue]);
        done();
        return Promise.resolve();
      };
    });

    it('slears [deleteRequestQueueValue]', (done) => {
      element[deleteIndexDebounce](id);
      element.deleteIndexedData = () => {
        assert.deepEqual(element[deleteRequestQueueValue], []);
        done();
        return Promise.resolve();
      };
    });
  });

  describe('[prepareRequestIndexData]()', () => {
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
      const result = element[prepareRequestIndexData](request, []);
      assert.typeOf(result, 'array');
    });

    it('Returns 8 items', () => {
      if (!hasUrlSupport) {
        return;
      }
      const result = element[prepareRequestIndexData](request, []);
      assert.lengthOf(result, 8);
    });

    it('Skips already indexed items', () => {
      if (!hasUrlSupport) {
        return;
      }
      const result = element[prepareRequestIndexData](request, [
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
      const result = element[prepareRequestIndexData](request, []);
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
      const result = element[prepareRequestIndexData](rq, []);
      assert.typeOf(result, 'array');
      assert.lengthOf(result, 0);
    });
  });

  describe('[createIndexIfMissing]()', () => {
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
      const result = element[createIndexIfMissing](url, id, type, indexed);
      assert.typeOf(result, 'object');
    });

    it('Datastore entry has id', () => {
      const result = element[createIndexIfMissing](url, id, type, indexed);
      assert.typeOf(result.id, 'string');
    });

    it('Datastore entry has url', () => {
      const result = element[createIndexIfMissing](url, id, type, indexed);
      assert.equal(result.url, url);
    });

    it('Datastore entry has requestId', () => {
      const result = element[createIndexIfMissing](url, id, type, indexed);
      assert.equal(result.requestId, id);
    });

    it('Datastore entry has type', () => {
      const result = element[createIndexIfMissing](url, id, type, indexed);
      assert.equal(result.type, type);
    });

    it('Datastore entry has fullUrl', () => {
      const result = element[createIndexIfMissing](url, id, type, indexed);
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
      const result = element[createIndexIfMissing](url, id, type, indexed);
      assert.isUndefined(result);
    });
  });

  describe('[getUrlObject]()', () => {
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

    it('creates index entity when not indexed', () => {
      const result = element[getUrlObject](request, indexed);
      assert.typeOf(result, 'object');
    });

    it('returns undefined if already indexed', () => {
      indexed = [
        {
          url,
          fullUrl: 0,
          requestId: 'test',
          id: 'test',
          type: 'saved',
        },
      ];
      const result = element[getUrlObject](request, indexed);
      assert.isUndefined(result);
    });
  });

  describe('[getAuthorityPath]()', () => {
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
      const result = element[getAuthorityPath](parser, id, type, indexed);
      assert.typeOf(result, 'object');
    });

    it('Returns undefined if already indexed', () => {
      if (!hasUrlSupport) {
        return;
      }
      const { url } = element[getAuthorityPath](parser, id, type, indexed);
      indexed = [
        {
          url,
          fullUrl: 0,
          requestId: 'test',
          id: 'test',
          type: 'saved',
        },
      ];
      const result = element[getAuthorityPath](parser, id, type, indexed);
      assert.isUndefined(result);
    });
  });

  describe('[getPathQuery]()', () => {
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
      const result = element[getPathQuery](parser, id, type, indexed);
      assert.typeOf(result, 'object');
    });

    it('Returns undefined if already indexed', () => {
      if (!hasUrlSupport) {
        return;
      }
      const { url } = element[getPathQuery](parser, id, type, indexed);
      indexed = [
        {
          url,
          fullUrl: 0,
          requestId: 'test',
          id: 'test',
          type: 'saved',
        },
      ];
      const result = element[getPathQuery](parser, id, type, indexed);
      assert.isUndefined(result);
    });
  });

  describe('[getQueryString]()', () => {
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
      const result = element[getQueryString](parser, id, type, indexed);
      assert.typeOf(result, 'object');
    });

    it('Returns undefined if already indexed', () => {
      if (!hasUrlSupport) {
        return;
      }
      const { url } = element[getQueryString](parser, id, type, indexed);
      indexed = [
        {
          url,
          fullUrl: 0,
          requestId: 'test',
          id: 'test',
          type: 'saved',
        },
      ];
      const result = element[getQueryString](parser, id, type, indexed);
      assert.isUndefined(result);
    });
  });

  describe('[appendQueryParams]()', () => {
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
      element[appendQueryParams](parser, id, type, indexed, target);
      assert.lengthOf(target, 2);
    });

    it('Returns undefined if already indexed', () => {
      if (!hasUrlSupport) {
        return;
      }
      element[appendQueryParams](parser, id, type, indexed, target);
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
      element[appendQueryParams](parser, id, type, indexed, target);
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
