import { fixture, assert } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator/arc-data-generator.js';
import 'chance/dist/chance.min.js';
import '../../rest-api-model.js';
/* global Chance, PouchDB */
describe('<rest-api-model> - Events API', () => {
  async function basicFixture() {
    return /** @type {RestApiModel} */ (await fixture('<rest-api-model></rest-api-model>'));
  }

  const chance = new Chance();
  function indexDb() {
    return new PouchDB('api-index');
  }

  function dataDb() {
    return new PouchDB('api-data');
  }

  async function clearRestAPi() {
    await DataGenerator.destroyApiIndexData();
    await DataGenerator.destroyApiData();
  }

  describe('api-index-list event', function() {
    let element;

    const docs = [{
      _id: 'test-1',
      versions: ['v1'],
      latest: 'v1'
    }, {
      _id: 'test-2',
      versions: ['v1'],
      latest: 'v1'
    }];

    beforeEach(async () => {
      await clearRestAPi();
      element = await basicFixture();
      delete docs[0]._rev;
      delete docs[1]._rev;
      await element.updateIndexBatch(docs);
    });

    after(() => clearRestAPi());

    function fire() {
      const e = new CustomEvent('api-index-list', {
        detail: {},
        bubbles: true,
        composed: true,
        cancelable: true
      });
      document.body.dispatchEvent(e);
      return e;
    }

    it('Handles the event', async () => {
      const e = fire();
      assert.typeOf(e.detail.result, 'promise');
      await e.detail.result;
    });

    it('Cancels the event', async () => {
      const e = fire();
      await e.detail.result;
      assert.isTrue(e.defaultPrevented);
    });

    it('Promise resolves to a list of index data', async () => {
      const e = fire();
      const result = await e.detail.result;
      assert.typeOf(result, 'object', 'returns an object');
      assert.typeOf(result.nextPageToken, 'string', 'nextPageToken is set');
      assert.typeOf(result.items, 'array', 'items is a list');
      assert.lengthOf(result.items, 2, 'There are two items on the list');
    });
  });

  describe('api-index-read event', () => {
    let created;

    before(async () => {
      let obj = {
        _id: 'test-index-id'
      };
      const element = await basicFixture();
      created = await element.updateIndex(obj);
    });

    after(function() {
      return clearRestAPi();
    });

    beforeEach(async () => {
      await basicFixture();
    });

    function fire(baseUri) {
      const e = new CustomEvent('api-index-read', {
        detail: {
          baseUri
        },
        bubbles: true,
        composed: true,
        cancelable: true
      });
      document.body.dispatchEvent(e);
      return e;
    }

    it('Handles the event', async () => {
      const e = fire(created._id);
      assert.typeOf(e.detail.result, 'promise');
      await e.detail.result;
    });

    it('Cancels the event', async () => {
      const e = fire(created._id);
      assert.isTrue(e.defaultPrevented);
      await e.detail.result;
    });

    it('Reads the data', async () => {
      const e = fire(created._id);
      const doc = await e.detail.result;
      assert.deepEqual(doc, created);
    });

    it('Returns undefined when not found', async () => {
      const e = fire('some-base-uri');
      const doc = await e.detail.result;
      assert.isUndefined(doc);
    });

    it('Rejects when no "baseUri"', async () => {
      const e = fire();
      let called = false;
      try {
        await e.detail.result;
      } catch (_) {
        called = true;
      }
      assert.isTrue(called);
    });
  });

  describe('api-data-read event', () => {
    let created;

    const indexId = 'test-index-id';
    const version = 'v1';
    const data = {};

    before(async () => {
      const element = await basicFixture();
      created = await element.updateData(indexId, version, data);
    });

    after(function() {
      return clearRestAPi();
    });

    beforeEach(async () => {
      await basicFixture();
    });

    function fire(id) {
      const e = new CustomEvent('api-data-read', {
        detail: {
          id
        },
        bubbles: true,
        composed: true,
        cancelable: true
      });
      document.body.dispatchEvent(e);
      return e;
    }

    it('Handles the event', async () => {
      const e = fire(indexId + '|' + version);
      assert.typeOf(e.detail.result, 'promise');
      await e.detail.result;
    });

    it('Cancels the event', async () => {
      const e = fire(indexId + '|' + version);
      assert.isTrue(e.defaultPrevented);
      await e.detail.result;
    });

    it('Reads the data', async () => {
      const e = fire(indexId + '|' + version);
      const doc = await e.detail.result;
      assert.deepEqual(doc, created);
    });

    it('Rejects when no "id"', async () => {
      const e = fire();
      let called = false;
      try {
        await e.detail.result;
      } catch (_) {
        called = true;
      }
      assert.isTrue(called);
    });
  });

  describe('api-index-changed event', () => {
    before(function() {
      return clearRestAPi();
    });

    afterEach(function() {
      return clearRestAPi();
    });

    let obj;
    beforeEach(async () => {
      await basicFixture();
      obj = {
        _id: 'test-index-id'
      };
    });

    function fire(apiInfo) {
      const e = new CustomEvent('api-index-changed', {
        detail: {
          apiInfo
        },
        bubbles: true,
        composed: true,
        cancelable: true
      });
      document.body.dispatchEvent(e);
      return e;
    }

    it('Handles the event', async () => {
      const e = fire(obj);
      assert.typeOf(e.detail.result, 'promise');
      await e.detail.result;
    });

    it('Cancels the event', async () => {
      const e = fire(obj);
      assert.isTrue(e.defaultPrevented);
      await e.detail.result;
    });

    it('Rejects when no "apiInfo"', async () => {
      const e = fire();
      let called = false;
      try {
        await e.detail.result;
      } catch (_) {
        called = true;
      }
      assert.isTrue(called);
    });

    it('Creates new object', async () => {
      const e = fire(obj);
      const result = await e.detail.result;
      assert.typeOf(result._rev, 'string');
    });
  });

  describe('api-index-changed-batch event', () => {
    let items = [{
      _id: 'test-index-id'
    }, {
      _id: 'test-index-other'
    }];

    beforeEach(async () => {
      await basicFixture();
    });

    afterEach(function() {
      return clearRestAPi();
    });

    function fire(items) {
      const e = new CustomEvent('api-index-changed-batch', {
        detail: {
          items
        },
        bubbles: true,
        composed: true,
        cancelable: true
      });
      document.body.dispatchEvent(e);
      return e;
    }

    it('Handles the event', async () => {
      const e = fire(items);
      assert.typeOf(e.detail.result, 'promise');
      await e.detail.result;
    });

    it('Cancels the event', async () => {
      const e = fire(items);
      assert.isTrue(e.defaultPrevented);
      await e.detail.result;
    });

    it('Rejects when no "items"', async () => {
      const e = fire();
      let called = false;
      try {
        await e.detail.result;
      } catch (_) {
        called = true;
      }
      assert.isTrue(called);
    });

    it('Creates index data', async () => {
      const e = fire(items);
      const result = await e.detail.result;
      assert.typeOf(result, 'array');
      assert.lengthOf(result, 2);
      assert.typeOf(result[0]._rev, 'string');
      assert.typeOf(result[1]._rev, 'string');
    });
  });

  describe('api-data-changed event', () => {
    const indexId = 'test-index-id';
    const version = 'v1';
    const data = {};
    beforeEach(async () => {
      await basicFixture();
    });

    afterEach(function() {
      return clearRestAPi();
    });

    function fire(data, indexId, version) {
      const e = new CustomEvent('api-data-changed', {
        detail: {
          data, indexId, version
        },
        bubbles: true,
        composed: true,
        cancelable: true
      });
      document.body.dispatchEvent(e);
      return e;
    }

    it('Handles the event', async () => {
      const e = fire(data, indexId, version);
      assert.typeOf(e.detail.result, 'promise');
      await e.detail.result;
    });

    it('Cancels the event', async () => {
      const e = fire(data, indexId, version);
      assert.isTrue(e.defaultPrevented);
      await e.detail.result;
    });

    it('Rejects when no "indexId"', async () => {
      const e = fire(data, undefined, version);
      let called = false;
      try {
        await e.detail.result;
      } catch (_) {
        called = true;
      }
      assert.isTrue(called);
    });

    it('Rejects when no "version"', async () => {
      const e = fire(data, indexId, undefined);
      let called = false;
      try {
        await e.detail.result;
      } catch (_) {
        called = true;
      }
      assert.isTrue(called);
    });

    it('Rejects when no "data"', async () => {
      const e = fire(undefined, indexId, version);
      let called = false;
      try {
        await e.detail.result;
      } catch (_) {
        called = true;
      }
      assert.isTrue(called);
    });

    it('Updates the data', async () => {
      const e = fire(data, indexId, version);
      const result = await e.detail.result;
      assert.typeOf(result, 'object', 'Returns an object');
      assert.typeOf(result._rev, 'string', 'The _rew is set');
      assert.equal(result._id, indexId + '|' + version);
    });
  });

  describe('api-deleted event', () => {
    let element;
    let createdIndex;

    afterEach(function() {
      return clearRestAPi();
    });

    beforeEach(async () => {
      element = await basicFixture();
      const obj = {
        _id: 'test-index-id' + chance.word(),
        versions: ['v1'],
        latest: 'v1'
      };
      const doc = await element.updateIndex(obj);
      createdIndex = doc;
      await element.updateData(doc._id, 'v1', {});
    });

    function fire(id) {
      const e = new CustomEvent('api-deleted', {
        detail: {
          id
        },
        bubbles: true,
        composed: true,
        cancelable: true
      });
      document.body.dispatchEvent(e);
      return e;
    }

    it('Handles the event', async () => {
      const e = fire(createdIndex._id);
      assert.typeOf(e.detail.result, 'promise');
      await e.detail.result;
    });

    it('Cancels the event', async () => {
      const e = fire(createdIndex._id);
      assert.isTrue(e.defaultPrevented);
      await e.detail.result;
    });

    it('Rejects when no "id"', async () => {
      const e = fire();
      let called = false;
      try {
        await e.detail.result;
      } catch (_) {
        called = true;
      }
      assert.isTrue(called);
    });

    it('Removes the data', async () => {
      const e = fire(createdIndex._id);
      await e.detail.result;
      const response = await indexDb().allDocs();
      assert.equal(response.total_rows, 0);
    });
  });

  describe('api-version-deleted event', () => {
    let element;
    let id;
    const version = 'v1';

    afterEach(function() {
      return clearRestAPi();
    });

    beforeEach(async () => {
      id = 'test-index-id' + chance.word();
      element = await basicFixture();
      await element.updateIndex({
        _id: id,
        versions: [version, 'v2'],
        latest: version
      });
      await element.updateData(id, version, {});
    });

    function fire(id, version) {
      const e = new CustomEvent('api-version-deleted', {
        detail: {
          id, version
        },
        bubbles: true,
        composed: true,
        cancelable: true
      });
      document.body.dispatchEvent(e);
      return e;
    }

    it('Handles the event', async () => {
      const e = fire(id, version);
      assert.typeOf(e.detail.result, 'promise');
      await e.detail.result;
    });

    it('Cancels the event', async () => {
      const e = fire(id, version);
      assert.isTrue(e.defaultPrevented);
      await e.detail.result;
    });

    it('Rejects when no "id"', async () => {
      const e = fire(undefined, version);
      let called = false;
      try {
        await e.detail.result;
      } catch (_) {
        called = true;
      }
      assert.isTrue(called);
    });

    it('Rejects when no "version"', async () => {
      const e = fire(id, undefined);
      let called = false;
      try {
        await e.detail.result;
      } catch (_) {
        called = true;
      }
      assert.isTrue(called);
    });

    it('Removes version from datastore', async () => {
      const e = fire(id, version);
      await e.detail.result;
      const response = await dataDb().allDocs();
      assert.equal(response.total_rows, 0);
    });
  });
});
