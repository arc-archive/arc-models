import { fixture, assert } from '@open-wc/testing';
import sinon from 'sinon';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import 'chance/dist/chance.min.js';
import '../../rest-api-model.js';
/* global Chance, PouchDB */

/** @typedef {import('../../src/RestApiModel').RestApiModel} RestApiModel */

describe('<rest-api-model>', () => {
  const generator = new DataGenerator();
  /**
   * @return {Promise<RestApiModel>}
   */
  async function basicFixture() {
    return fixture('<rest-api-model></rest-api-model>');
  }

  // @ts-ignore
  const chance = new Chance();
  function indexDb() {
    return new PouchDB('api-index');
  }

  function dataDb() {
    return new PouchDB('api-data');
  }

  async function clearRestAPi() {
    await generator.destroyApiIndexData();
    await generator.destroyApiData();
  }

  describe('Basic API', () => {
    describe('updateIndex()', () => {
      before(() => {
        return clearRestAPi();
      });

      after(() => {
        return clearRestAPi();
      });

      let element = /** @type RestApiModel */ (null);
      let obj;
      beforeEach(async () => {
        element = await basicFixture();
        obj = {
          _id: 'test-index-id',
        };
      });

      it('Creates new object', async () => {
        const result = await element.updateIndex(obj);
        assert.typeOf(result._rev, 'string');
      });

      it('Index datastore contains one object', async () => {
        const result = await indexDb().allDocs({
          include_docs: true,
        });
        assert.lengthOf(result.rows, 1);
      });

      it('Dispatches api-index-changed event', async () => {
        obj._id = 'other-id';
        let eventData = {};
        element.addEventListener('api-index-changed', function f(e) {
          element.removeEventListener('api-index-changed', f);
          if (e.cancelable) {
            return;
          }
          // @ts-ignore
          eventData = e.detail;
        });
        await element.updateIndex(obj);
        assert.typeOf(eventData.apiInfo, 'object', 'Contains apiInfo property');
        assert.typeOf(eventData.apiInfo._rev, 'string', 'The _rev is set');
      });
    });

    describe('updateData()', () => {
      after(() => {
        return clearRestAPi();
      });

      let element = /** @type RestApiModel */ (null);
      const indexId = 'test-index-id';
      const version = 'v1';
      const data = {};
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('Creates new object', async () => {
        const result = await element.updateData(indexId, version, data);
        assert.typeOf(result, 'object', 'Returns an object');
        assert.typeOf(result._rev, 'string', 'The _rew is set');
        assert.equal(result._id, `${indexId}|${version}`);
      });

      it('Index datastore contains one object', async () => {
        const result = await dataDb().allDocs({
          include_docs: true,
        });
        assert.lengthOf(result.rows, 1);
      });
    });

    describe('readIndex()', () => {
      let element = /** @type RestApiModel */ (null);
      let created;

      before(async () => {
        element = await basicFixture();
        const obj = {
          _id: 'test-index-id',
          title: 'test',
          type: 'RAML 1.0',
          order: 0,
          versions: ['abc'],
          latest: 'abc',
        };
        created = await element.updateIndex(obj);
      });

      after(async () => clearRestAPi());

      it('Reads index data', async () => {
        const doc = await element.readIndex(created._id);
        assert.deepEqual(doc, created);
      });
    });

    describe('readData()', () => {
      let element = /** @type RestApiModel */ (null);
      let created;

      const indexId = 'test-index-id';
      const version = 'v1';
      const data = {};

      before(async () => {
        element = await basicFixture();
        return element.updateData(indexId, version, data).then((doc) => {
          created = doc;
        });
      });

      after(() => {
        return clearRestAPi();
      });

      it('Reads index data', async () => {
        const doc = await element.readData(`${indexId}|${version}`);
        assert.deepEqual(doc, created);
      });
    });

    describe('updateIndexBatch()', () => {
      let element = /** @type RestApiModel */ (null);
      let items = [
        {
          _id: 'test-index-id',
          title: 'test2',
          type: 'RAML 1.0',
          order: 0,
          versions: ['abc'],
          latest: 'abc',
        },
        {
          _id: 'test-index-other',
          title: 'test2',
          type: 'RAML 1.0',
          order: 0,
          versions: ['abc'],
          latest: 'abc',
        },
      ];

      before(async () => {
        element = await basicFixture();
      });

      after(() => {
        return clearRestAPi();
      });

      it('Creates index data', async () => {
        const result = await element.updateIndexBatch(items);
        assert.typeOf(result, 'array');
        assert.lengthOf(result, 2);
        assert.typeOf(result[0]._rev, 'string');
        assert.typeOf(result[1]._rev, 'string');
        // @ts-ignore
        items = result;
      });

      it('Dispatches api-index-changed event', async () => {
        const eventData = [];
        function clb(e) {
          if (e.cancelable) {
            return;
          }
          eventData[eventData.length] = e.detail;
        }
        element.addEventListener('api-index-changed', clb);
        await element.updateIndexBatch(items);
        element.removeEventListener('api-index-changed', clb);
        assert.lengthOf(eventData, 2, 'Event dispatched 2 times');
        assert.typeOf(
          eventData[0].apiInfo,
          'object',
          'Contains apiInfo property'
        );
        assert.typeOf(eventData[0].apiInfo._rev, 'string', 'The _rev is set');
        assert.typeOf(
          eventData[1].apiInfo,
          'object',
          'Contains apiInfo property'
        );
        assert.typeOf(eventData[1].apiInfo._rev, 'string', 'The _rev is set');
      });
    });

    describe('removeVersion()', () => {
      let element = /** @type RestApiModel */ (null);
      let id;
      const version = 'v1';
      before(async () => {
        element = await basicFixture();
      });

      afterEach(() => {
        return clearRestAPi();
      });

      beforeEach(async () => {
        id = `test-index-id${chance.word()}`;
        await element.updateIndex({
          _id: id,
          versions: [version, 'v2'],
          latest: version,
          title: 'test',
          order: 0,
          type: 'RAML 1.0',
        });
        await element.updateData(id, version, {});
      });

      it('Removes version from datastore', async () => {
        await element.removeVersion(id, version);
        const docs = await dataDb().allDocs({
          include_docs: true,
        });
        assert.lengthOf(docs.rows, 0);
      });

      it('Keeps index object when it has a version', async () => {
        await element.removeVersion(id, version);
        const docs = await indexDb().allDocs({
          include_docs: true,
        });
        assert.lengthOf(docs.rows, 1);
      });

      it('Version is removed from index', async () => {
        await element.removeVersion(id, version);
        const docs = await indexDb().allDocs({
          include_docs: true,
        });
        assert.equal(docs.rows[0].doc.versions[0], 'v2');
      });

      it('Latest version is not removed version', async () => {
        await element.removeVersion(id, version);
        const docs = await indexDb().allDocs({
          include_docs: true,
        });
        assert.equal(docs.rows[0].doc.latest, 'v2');
      });
    });

    describe('delete()', () => {
      let element = /** @type RestApiModel */ (null);
      let createdIndex;
      before(async () => {
        element = await basicFixture();
      });

      afterEach(() => {
        return clearRestAPi();
      });

      beforeEach(async () => {
        const obj = {
          _id: `test-index-id${chance.word()}`,
          versions: ['v1'],
          latest: 'v1',
          title: 'test',
          order: 0,
          type: 'RAML 1.0',
        };
        createdIndex = await element.updateIndex(obj);
        await element.updateData(createdIndex._id, 'v1', {});
      });

      it('Removes index object', async () => {
        await element.delete(createdIndex._id);
        const docs = await indexDb().allDocs({
          include_docs: true,
        });
        assert.lengthOf(docs.rows, 0);
      });

      it('Removes data object', async () => {
        await element.delete(createdIndex._id);
        const docs = await dataDb().allDocs({
          include_docs: true,
        });
        assert.lengthOf(docs.rows, 0);
      });

      it('Fires api-deleted event', async () => {
        let eventData = {};
        element.addEventListener('api-deleted', function clb(e) {
          element.removeEventListener('api-deleted', clb);
          // @ts-ignore
          eventData = e.detail;
        });
        await element.delete(createdIndex._id);
        assert.equal(
          eventData.id,
          createdIndex._id,
          'Event detail contains id'
        );
      });
    });

    describe('listIndex()', () => {
      let element = /** @type RestApiModel */ (null);

      const docs = [
        {
          _id: 'test-1',
          versions: ['v1'],
          latest: 'v1',
          title: 'test',
          order: 0,
          type: 'RAML 1.0',
        },
        {
          _id: 'test-2',
          versions: ['v1'],
          latest: 'v1',
          title: 'test2',
          order: 0,
          type: 'RAML 1.0',
        },
      ];

      beforeEach(async () => {
        await clearRestAPi();
        element = await basicFixture();
        delete docs[0]._rev;
        delete docs[1]._rev;
        await element.updateIndexBatch(docs);
      });

      it('Lists index data', async () => {
        const result = await element.listIndex();
        assert.typeOf(result, 'object', 'returns an object');
        assert.typeOf(result.nextPageToken, 'string', 'nextPageToken is set');
        assert.typeOf(result.items, 'array', 'items is a list');
        assert.lengthOf(result.items, 2, 'There are two items on the list');
      });

      it('_cachedQueryOptions contains query options for token', async () => {
        const result = await element.listIndex();
        const pageData = element._cachedQueryOptions[result.nextPageToken];
        assert.typeOf(pageData, 'object');
        assert.equal(
          pageData.startkey,
          result.items[result.items.length - 1]._id
        );
        assert.equal(pageData.skip, 1);
      });

      it('Call with nextPageToken returns empty result', async () => {
        const first = await element.listIndex();
        const { nextPageToken } = first;
        const second = await element.listIndex({
          nextPageToken,
        });
        assert.equal(
          second.nextPageToken,
          nextPageToken,
          'nextPageToken is the same'
        );
        assert.lengthOf(second.items, 0, 'There is no items on list');
      });
    });
  });

  describe('"destroy-model" event', () => {
    function fire(models) {
      const e = new CustomEvent('destroy-model', {
        detail: {
          models,
          result: undefined,
        },
        bubbles: true,
      });
      document.body.dispatchEvent(e);
      return e;
    }

    it('Deletes saved model', async () => {
      await basicFixture();
      const e = fire(['rest-apis']);
      assert.typeOf(e.detail.result, 'array');
      assert.lengthOf(e.detail.result, 1);
      return Promise.all(e.detail.result);
    });

    it('Calls delete functions', async () => {
      const element = await basicFixture();
      const spy1 = sinon.spy(element, '_delIndexModel');
      const spy2 = sinon.spy(element, '_delDataModel');
      const e = fire(['rest-apis']);
      assert.isTrue(spy1.called);
      assert.isTrue(spy2.called);
      return Promise.all(e.detail.result);
    });

    it('Calls _notifyModelDestroyed() function', async () => {
      const element = await basicFixture();
      const spy = sinon.spy(element, '_notifyModelDestroyed');
      const e = fire(['rest-apis']);
      return Promise.all(e.detail.result).then(() => {
        assert.equal(spy.callCount, 3);
      });
    });
  });
});
