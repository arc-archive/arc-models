import { fixture, assert } from '@open-wc/testing';
import sinon from 'sinon/pkg/sinon-esm.js';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator/arc-data-generator.js';
import 'chance/dist/chance.min.js';
import '../../rest-api-model.js';
/* global Chance, PouchDB */
describe('<rest-api-model>', () => {
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

  describe('Basic API', function() {
    describe('updateIndex()', function() {
      before(function() {
        return clearRestAPi();
      });

      after(function() {
        return clearRestAPi();
      });

      let element;
      let obj;
      beforeEach(async () => {
        element = await basicFixture();
        obj = {
          _id: 'test-index-id'
        };
      });

      it('Creates new object', function() {
        return element.updateIndex(obj)
        .then((result) => {
          assert.typeOf(result._rev, 'string');
        });
      });

      it('Index datastore contains one object', function() {
        return indexDb().allDocs({
          // jscs:disable
          include_docs: true
          // jscs:enable
        }).then((result) => {
          assert.lengthOf(result.rows, 1);
        });
      });

      it('Dispatches api-index-changed event', function() {
        obj._id = 'other-id';
        let eventData;
        element.addEventListener('api-index-changed', function f(e) {
          element.removeEventListener('api-index-changed', f);
          if (e.cancelable) {
            return;
          }
          eventData = e.detail;
        });
        return element.updateIndex(obj)
        .then(() => {
          assert.typeOf(eventData, 'object', 'Event was dispatched');
          assert.typeOf(eventData.apiInfo, 'object', 'Contains apiInfo property');
          assert.typeOf(eventData.apiInfo._rev, 'string', 'The _rev is set');
        });
      });
    });

    describe('updateData()', function() {
      after(function() {
        return clearRestAPi();
      });

      let element;
      const indexId = 'test-index-id';
      const version = 'v1';
      const data = {};
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('Creates new object', function() {
        return element.updateData(indexId, version, data)
        .then((result) => {
          assert.typeOf(result, 'object', 'Returns an object');
          assert.typeOf(result._rev, 'string', 'The _rew is set');
          assert.equal(result._id, indexId + '|' + version);
        });
      });

      it('Index datastore contains one object', function() {
        return dataDb().allDocs({
          // jscs:disable
          include_docs: true
          // jscs:enable
        }).then((result) => {
          assert.lengthOf(result.rows, 1);
        });
      });
    });

    describe('readIndex()', function() {
      let element;
      let created;

      before(async () => {
        element = await basicFixture();
        let obj = {
          _id: 'test-index-id'
        };
        return element.updateIndex(obj)
        .then((doc) => {
          created = doc;
        });
      });

      after(function() {
        return clearRestAPi();
      });

      it('Reads index data', function() {
        return element.readIndex(created._id)
        .then((doc) => {
          assert.deepEqual(doc, created);
        });
      });
    });

    describe('readData()', function() {
      let element;
      let created;

      const indexId = 'test-index-id';
      const version = 'v1';
      const data = {};

      before(async () => {
        element = await basicFixture();
        return element.updateData(indexId, version, data)
        .then((doc) => {
          created = doc;
        });
      });

      after(function() {
        return clearRestAPi();
      });

      it('Reads index data', function() {
        return element.readData(indexId + '|' + version)
        .then((doc) => {
          assert.deepEqual(doc, created);
        });
      });
    });

    describe('updateIndexBatch()', () => {
      let element;
      let items = [{
        _id: 'test-index-id'
      }, {
        _id: 'test-index-other'
      }];

      before(async () => {
        element = await basicFixture();
      });

      after(function() {
        return clearRestAPi();
      });

      it('Creates index data', () => {
        return element.updateIndexBatch(items)
        .then((result) => {
          assert.typeOf(result, 'array');
          assert.lengthOf(result, 2);
          assert.typeOf(result[0]._rev, 'string');
          assert.typeOf(result[1]._rev, 'string');
          items = result;
        });
      });

      it('Dispatches api-index-changed event', function() {
        const eventData = [];
        function clb(e) {
          if (e.cancelable) {
            return;
          }
          eventData[eventData.length] = e.detail;
        }
        element.addEventListener('api-index-changed', clb);
        return element.updateIndexBatch(items)
        .then(() => {
          element.removeEventListener('api-index-changed', clb);
          assert.lengthOf(eventData, 2, 'Event dispatched 2 times');
          assert.typeOf(eventData[0].apiInfo, 'object', 'Contains apiInfo property');
          assert.typeOf(eventData[0].apiInfo._rev, 'string', 'The _rev is set');
          assert.typeOf(eventData[1].apiInfo, 'object', 'Contains apiInfo property');
          assert.typeOf(eventData[1].apiInfo._rev, 'string', 'The _rev is set');
        });
      });
    });

    describe('removeVersion()', () => {
      let element;
      let id;
      const version = 'v1';
      before(async () => {
        element = await basicFixture();
      });

      afterEach(function() {
        return clearRestAPi();
      });

      beforeEach(() => {
        id = 'test-index-id' + chance.word();
        return element.updateIndex({
          _id: id,
          versions: [version, 'v2'],
          latest: version
        })
        .then(() => {
          return element.updateData(id, version, {});
        });
      });

      it('Removes version from datastore', () => {
        return element.removeVersion(id, version)
        .then(() => {
          return dataDb().allDocs({
            // jscs:disable
            include_docs: true
            // jscs:enable
          });
        })
        .then((docs) => {
          assert.lengthOf(docs.rows, 0);
        });
      });

      it('Keeps index object when it has a version', () => {
        return element.removeVersion(id, version)
        .then(() => {
          return indexDb().allDocs({
            // jscs:disable
            include_docs: true
            // jscs:enable
          });
        })
        .then((docs) => {
          assert.lengthOf(docs.rows, 1);
        });
      });

      it('Version is removed from index', () => {
        return element.removeVersion(id, version)
        .then(() => {
          return indexDb().allDocs({
            // jscs:disable
            include_docs: true
            // jscs:enable
          });
        })
        .then((docs) => {
          assert.equal(docs.rows[0].doc.versions[0], 'v2');
        });
      });

      it('Latest version is not removed version', () => {
        return element.removeVersion(id, version)
        .then(() => {
          return indexDb().allDocs({
            // jscs:disable
            include_docs: true
            // jscs:enable
          });
        })
        .then((docs) => {
          assert.equal(docs.rows[0].doc.latest, 'v2');
        });
      });
    });

    describe('remove()', () => {
      let element;
      let createdIndex;
      before(async () => {
        element = await basicFixture();
      });

      afterEach(function() {
        return clearRestAPi();
      });

      beforeEach(() => {
        const obj = {
          _id: 'test-index-id' + chance.word(),
          versions: ['v1'],
          latest: 'v1'
        };
        return element.updateIndex(obj)
        .then((doc) => {
          createdIndex = doc;
          return element.updateData(doc._id, 'v1', {});
        });
      });

      it('Removes index object', () => {
        return element.remove(createdIndex._id)
        .then(() => {
          return indexDb().allDocs({
            // jscs:disable
            include_docs: true
            // jscs:enable
          });
        })
        .then((docs) => {
          assert.lengthOf(docs.rows, 0);
        });
      });

      it('Removes data object', () => {
        return element.remove(createdIndex._id)
        .then(() => {
          return dataDb().allDocs({
            // jscs:disable
            include_docs: true
            // jscs:enable
          });
        })
        .then((docs) => {
          assert.lengthOf(docs.rows, 0);
        });
      });

      it('Fires api-deleted event', function() {
        let eventData;
        element.addEventListener('api-deleted', function clb(e) {
          element.removeEventListener('api-deleted', clb);
          eventData = e.detail;
        });
        return element.remove(createdIndex._id)
        .then(() => {
          assert.typeOf(eventData, 'object', 'Event was fired');
          assert.equal(eventData.id, createdIndex._id, 'Event detail contains id');
        });
      });
    });

    describe('listIndex()', function() {
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

      it('Lists index data', function() {
        return element.listIndex()
        .then((result) => {
          assert.typeOf(result, 'object', 'returns an object');
          assert.typeOf(result.nextPageToken, 'string', 'nextPageToken is set');
          assert.typeOf(result.items, 'array', 'items is a list');
          assert.lengthOf(result.items, 2, 'There are two items on the list');
        });
      });

      it('_cachedQueryOptions contains query options for token', function() {
        return element.listIndex()
        .then((result) => {
          const pageData = element._cachedQueryOptions[result.nextPageToken];
          assert.typeOf(pageData, 'object');
          assert.equal(pageData.startkey, result.items[result.items.length - 1]._id);
          assert.equal(pageData.skip, 1);
        });
      });

      it('Call with nextPageToken returns empty result', function() {
        let nextPageToken;
        return element.listIndex()
        .then((result) => {
          nextPageToken = result.nextPageToken;
          return element.listIndex({
            nextPageToken: result.nextPageToken
          });
        })
        .then((result) => {
          assert.equal(result.nextPageToken, nextPageToken, 'nextPageToken is the same');
          assert.lengthOf(result.items, 0, 'There is no items on list');
        });
      });
    });
  });

  describe('"destroy-model" event', () => {
    function fire(models) {
      const e = new CustomEvent('destroy-model', {
        detail: {
          models
        },
        bubbles: true
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
      return Promise.all(e.detail.result)
      .then(() => {
        assert.equal(spy.callCount, 3);
      });
    });
  });
});
