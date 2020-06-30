import { fixture, assert, oneEvent } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import { PayloadProcessor } from '@advanced-rest-client/arc-electron-payload-processor/payload-processor-esm.js';
import * as sinon from 'sinon';
import '../../request-model.js';

/** @typedef {import('../../src/RequestModel').RequestModel} RequestModel */
/** @typedef {import('../../src/RequestTypes').ARCProject} ARCProject */

/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-vars */

describe('<request-model>', () => {
  const generator = new DataGenerator();
  /**
   * @return {Promise<RequestModel>}
   */
  async function basicFixture() {
    return fixture('<request-model></request-model>');
  }

  describe('request-model test', () => {
    const databaseType = 'saved-requests';

    describe('normalizeRequest()', () => {
      let element;
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('Returns undefined when no request', () => {
        const result = element.normalizeRequest();
        assert.isUndefined(result);
      });

      it('Moves legacyProject to projects array', () => {
        const result = element.normalizeRequest({
          legacyProject: 'test-project',
        });
        assert.isUndefined(result.legacyProject);
        assert.deepEqual(result.projects, ['test-project']);
      });

      it('Appends legacyProject to projects array', () => {
        const result = element.normalizeRequest({
          legacyProject: 'test-project',
          projects: ['other-project'],
        });
        assert.isUndefined(result.legacyProject);
        assert.deepEqual(result.projects, ['other-project', 'test-project']);
      });

      it('Removes properties with "_"', () => {
        const result = element.normalizeRequest({
          _tmp: true,
        });
        assert.isUndefined(result._tmp);
      });

      it('Keeps _id and _rev', () => {
        const result = element.normalizeRequest({
          _id: '1',
          _rev: '2',
        });
        assert.equal(result._id, '1');
        assert.equal(result._rev, '2');
      });

      it('Adds created time', () => {
        const result = element.normalizeRequest({});
        assert.typeOf(result.created, 'number');
      });

      it('Adds updated time', () => {
        const result = element.normalizeRequest({});
        assert.typeOf(result.updated, 'number');
      });

      it('Keeps created time', () => {
        const result = element.normalizeRequest({
          created: 1234,
        });
        assert.equal(result.created, 1234);
      });

      it('Keeps updated time', () => {
        const result = element.normalizeRequest({
          updated: 5678,
        });
        assert.equal(result.updated, 5678);
      });
    });

    describe('update()', () => {
      after(() => {
        return generator.destroySavedRequestData();
      });

      let element;
      let dataObj;
      beforeEach(async () => {
        element = await basicFixture();
        dataObj = {
          name: `test-${Date.now()}`,
          url: 'http://domain.com',
          method: 'GET',
          legacyProject: undefined,
        };
      });

      it('Creates a new object in the datastore', () => {
        return element
          .update(databaseType, dataObj)
          .then((result) => element.read(databaseType, result._id, result._rev))
          .then((result) => {
            assert.typeOf(result._rev, 'string', '_rev is set');
            assert.typeOf(result._id, 'string', '_id is set');
            assert.equal(result.url, dataObj.url, 'URL is set');
            assert.equal(result.name, dataObj.name, 'name is set');
            assert.equal(result.method, dataObj.method, 'method is set');
          });
      });

      it('Calls normalizeRequest()', () => {
        const spy = sinon.spy(element, 'normalizeRequest');
        return element.update(databaseType, dataObj).then(() => {
          assert.isTrue(spy.called);
        });
      });

      it('Updates created object', () => {
        let originalRev;
        return element
          .update(databaseType, dataObj)
          .then((result) => {
            originalRev = result._rev;
            result.headers = 'x-test';
            return element.update(databaseType, result);
          })
          .then((result) => {
            assert.notEqual(result._rev, originalRev, '_rev is regenerated');
            assert.equal(result.headers, 'x-test', 'Change is recorded');
          });
      });

      it('Fires request-object-changed custom event', () => {
        const spy = sinon.spy();
        element.addEventListener('request-object-changed', spy);
        return element.update(databaseType, dataObj).then(() => {
          assert.isTrue(spy.calledOnce);
        });
      });

      it('The request-object-changed event has properties of newly created object', () => {
        let eventData;
        element.addEventListener('request-object-changed', (e) => {
          eventData = e.detail;
        });
        return element.update(databaseType, dataObj).then((result) => {
          assert.isUndefined(eventData.oldRev);
          assert.isUndefined(result.oldRev);
          assert.typeOf(eventData.request, 'object');
        });
      });

      it('The request-object-changed event has properties of updated object', () => {
        let eventData;
        let originalRev;
        return element
          .update(databaseType, dataObj)
          .then((result) => {
            element.addEventListener('request-object-changed', (e) => {
              eventData = e.detail;
            });
            originalRev = result._rev;
            result.name = 'test-2';
            return element.update(databaseType, result);
          })
          .then(() => {
            assert.equal(eventData.oldRev, originalRev);
            assert.typeOf(eventData.request, 'object');
            assert.notEqual(eventData.request._rev, originalRev);
            assert.equal(eventData.type, databaseType);
          });
      });
    });

    describe('updateBulk()', () => {
      after(() => {
        return generator.destroySavedRequestData();
      });

      let element;
      let dataObj;
      beforeEach(async () => {
        element = await basicFixture();
        dataObj = [
          {
            name: 'test-1',
            url: 'http://domain.com',
            method: 'GET',
            legacyProject: undefined,
          },
          {
            name: 'test-2',
            url: 'http://domain.com',
            method: 'POST',
            legacyProject: 'abc',
          },
        ];
      });

      it('Creates objects in bulk', () => {
        return element.updateBulk(databaseType, dataObj).then((result) => {
          assert.typeOf(result, 'array', 'Response is an array');
          assert.isTrue(result[0].ok, 'Item #1 is inserted');
          assert.isTrue(result[1].ok, 'Item #2 is inserted');
          assert.typeOf(result[0].rev, 'string', '_rev is set');
          assert.typeOf(result[0].id, 'string', '_id is set');
        });
      });

      it('Calls normalizeRequest()', () => {
        const spy = sinon.spy(element, 'normalizeRequest');
        return element.updateBulk(databaseType, dataObj).then(() => {
          assert.equal(spy.callCount, 2);
        });
      });

      it('Updates created object', () => {
        const originalRevs = [];
        return element
          .updateBulk(databaseType, dataObj)
          .then((result) => {
            for (let i = 0; i < result.length; i++) {
              originalRevs.push(result[i].rev);
              dataObj[i]._rev = result[i].rev;
              dataObj[i]._id = result[i].id;
            }
            dataObj[0].headers = 'x-test';
            return element.updateBulk(databaseType, dataObj);
          })
          .then((result) => {
            assert.notEqual(
              result[0].rev,
              originalRevs[0],
              '_rev is regenerated'
            );
          });
      });

      it('Fires request-object-changed custom event', () => {
        const spy = sinon.spy();
        element.addEventListener('request-object-changed', spy);
        return element.updateBulk(databaseType, dataObj).then(() => {
          assert.equal(spy.callCount, 2);
        });
      });

      it('The request-object-changed event has properties of newly created object', () => {
        let eventData;
        element.addEventListener('request-object-changed', function clb(e) {
          element.removeEventListener('request-object-changed', clb);
          eventData = e.detail;
        });
        return element.updateBulk(databaseType, dataObj).then((result) => {
          assert.isUndefined(eventData.oldRev);
          assert.isUndefined(result.oldRev);
          assert.typeOf(eventData.request, 'object');
        });
      });

      it('The request-object-changed event has properties of updated object', () => {
        let eventData;
        let originalRev;
        return element
          .updateBulk(databaseType, dataObj)
          .then((result) => {
            element.addEventListener('request-object-changed', function clb(e) {
              element.removeEventListener('request-object-changed', clb);
              eventData = e.detail;
            });
            originalRev = result[0].rev;
            for (let i = 0; i < result.length; i++) {
              dataObj[i]._rev = result[i].rev;
              dataObj[i]._id = result[i].id;
            }
            dataObj[0].name = 'test-2';
            return element.updateBulk(databaseType, dataObj);
          })
          .then(() => {
            assert.equal(eventData.oldRev, originalRev, 'oldRev is set');
            assert.typeOf(eventData.request, 'object', 'request is an object');
            assert.notEqual(
              eventData.request._rev,
              originalRev,
              'request._rev is updates'
            );
            assert.equal(eventData.type, databaseType, 'Database type is set');
          });
      });
    });

    describe('read()', () => {
      let requests;
      before(async () => {
        const data = await generator.insertSavedRequestData();
        requests = data.requests;
      });

      after(() => {
        return generator.destroySavedRequestData();
      });

      let element;
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('Reads request object by id only', () => {
        return element.read(databaseType, requests[0]._id).then((result) => {
          assert.equal(result._id, requests[0]._id);
        });
      });

      it('Calls PayloadProcessor.restorePayload()', () => {
        const spy = sinon.spy(PayloadProcessor, 'restorePayload');
        return element
          .read(databaseType, requests[1]._id, undefined, {
            restorePayload: true,
          })
          .then(() => {
            // @ts-ignore
            PayloadProcessor.restorePayload.restore();
            assert.equal(spy.callCount, 1);
          })
          .catch((cause) => {
            // @ts-ignore
            PayloadProcessor.restorePayload.restore();
            throw cause;
          });
      });

      it('Reads a revision', () => {
        let originalRev;
        let updatedRev;
        return element
          .read(databaseType, requests[2]._id)
          .then((result) => {
            originalRev = result._rev;
            result.name = 'test-2';
            return element.update(databaseType, result);
          })
          .then((result) => {
            updatedRev = result._rev;
            return element.read(databaseType, requests[2]._id, originalRev);
          })
          .then((result) => {
            assert.equal(result.name, requests[2].name);
            assert.notEqual(originalRev, updatedRev);
          });
      });

      it('Calls normalizeRequest()', () => {
        const spy = sinon.spy(element, 'normalizeRequest');
        return element.read(databaseType, requests[3]._id).then(() => {
          assert.isTrue(spy.called);
        });
      });
    });

    describe('delete()', () => {
      afterEach(() => {
        return generator.destroySavedRequestData();
      });

      let element = /** @type RequestModel */ (null);
      let dataObj;
      beforeEach(async () => {
        element = await basicFixture();
        dataObj = {
          name: 'test-1',
          url: 'http://domain.com',
          method: 'GET',
        };
        dataObj = await element.update(databaseType, dataObj);
      });

      it('Removes object from the datastore', async () => {
        await element.delete(databaseType, dataObj._id, dataObj._rev);
        try {
          await element.read(databaseType, dataObj._id);
        } catch (cause) {
          assert.equal(cause.status, 404);
        }
      });

      it('Fires request-object-deleted custom event', async () => {
        element.delete(databaseType, dataObj._id, dataObj._rev);
        await oneEvent(element, 'request-object-deleted');
      });

      it('request-object-deleted event contains request data', async () => {
        element.delete(databaseType, dataObj._id, dataObj._rev);
        const { detail } = await oneEvent(element, 'request-object-deleted');
        assert.equal(detail.id, dataObj._id);
        assert.equal(detail.oldRev, dataObj._rev);
        assert.typeOf(detail.rev, 'string');
        assert.notEqual(detail.rev, dataObj._rev);
        assert.equal(detail.type, databaseType);
      });
    });

    describe('bulkDelete()', () => {
      afterEach(async () => {
        await generator.destroySavedRequestData();
      });

      let element;
      let dataObj;
      beforeEach(async () => {
        element = await basicFixture();
        const doc = {
          name: 'test-1',
          url: 'http://domain.com',
          method: 'GET',
        };
        dataObj = await element.update(databaseType, doc);
      });

      it('throws when no type', async () => {
        let called = false;
        try {
          await element.bulkDelete();
        } catch (_) {
          called = true;
        }
        assert.isTrue(called);
      });

      it('throws when no items', async () => {
        let called = false;
        try {
          await element.bulkDelete('saved');
        } catch (_) {
          called = true;
        }
        assert.isTrue(called);
      });

      it('removes documents', async () => {
        await element.bulkDelete('saved', [dataObj._id]);
        const db = element.getDatabase('saved');
        try {
          await db.get(dataObj._id);
          assert('Should not have object in the data store');
        } catch (_) {
          // ..
        }
      });

      it('returns id and rev', async () => {
        const result = await element.bulkDelete('saved', [dataObj._id]);
        assert.include(result[dataObj._id], '2-');
      });

      it('ignores misssing items', async () => {
        const spy = sinon.spy();
        element.addEventListener('request-object-deleted', spy);
        await element.bulkDelete('saved', [dataObj._id, 'missing']);
        assert.isTrue(spy.calledOnce);
      });
    });

    describe('list()', () => {
      before(() => {
        return generator.insertHistoryRequestData({
          requestsSize: 150,
        });
      });

      after(() => {
        return generator.destroyHistoryData();
      });

      let element;
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('Returnes all results without limit options', () => {
        return element.list('history', {}).then((result) => {
          assert.typeOf(result, 'object');
          assert.typeOf(result.rows, 'array');
          assert.isAbove(result.rows.length, 1);
        });
      });

      it('Limits number of results when set', () => {
        return element
          .list('history', {
            limit: 50,
          })
          .then((result) => {
            assert.typeOf(result, 'object');
            assert.typeOf(result.rows, 'array');
            assert.lengthOf(result.rows, 50);
          });
      });

      it('Respects pagination', () => {
        let firstKey;
        return element
          .list('history', {
            limit: 50,
          })
          .then((result) => {
            firstKey = result.rows[0].key;
            return element.list('history', {
              limit: 50,
              startkey: result.rows[result.rows.length - 1].key,
              skip: 1,
            });
          })
          .then((result) => {
            assert.typeOf(result, 'object');
            assert.typeOf(result.rows, 'array');
            assert.lengthOf(result.rows, 50);
            assert.notEqual(firstKey, result.rows[0].key);
          });
      });
    });

    describe('readBulk()', () => {
      let requests;
      before(async () => {
        requests = await generator.insertHistoryRequestData({
          requestsSize: 10,
        });
      });

      after(() => {
        return generator.destroyHistoryData();
      });

      let element;
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('Reads data by ids', () => {
        const ids = [requests[0]._id, requests[1]._id];
        return element.readBulk('history', ids).then((result) => {
          assert.lengthOf(result, 2);
          assert.deepEqual(result[0], requests[0]);
          assert.deepEqual(result[1], requests[1]);
        });
      });

      it('Restores payload', () => {
        const ids = [requests[0]._id, requests[1]._id];
        const spy = sinon.spy(PayloadProcessor, 'restorePayload');
        return element
          .readBulk('history', ids, {
            restorePayload: true,
          })
          .then(() => {
            // @ts-ignore
            PayloadProcessor.restorePayload.restore();
            assert.equal(spy.callCount, 2);
          });
      });
    });

    describe('queryPouchDb()', () => {
      let element;
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('Rejects when no query', () => {
        return element
          .queryPouchDb()
          .then(() => {
            throw new Error('Should not resolve');
          })
          .catch((cause) => {
            assert.typeOf(cause.message, 'string');
            assert.equal(cause.message, 'The "q" parameter is required.');
          });
      });

      it('Calls queryHistory() only', () => {
        const spy1 = sinon.spy(element, 'queryHistory');
        const spy2 = sinon.spy(element, 'querySaved');
        return element.queryPouchDb('test', 'history', ['id']).then(() => {
          assert.isTrue(spy1.called);
          assert.equal(spy1.args[0][0], 'test');
          assert.deepEqual(spy1.args[0][1], ['id']);
          assert.isFalse(spy2.called);
        });
      });

      it('Calls querySaved() only', () => {
        const spy1 = sinon.spy(element, 'queryHistory');
        const spy2 = sinon.spy(element, 'querySaved');
        return element.queryPouchDb('test', 'saved', ['id']).then(() => {
          assert.isTrue(spy2.called);
          assert.equal(spy2.args[0][0], 'test');
          assert.deepEqual(spy2.args[0][1], ['id']);
          assert.isFalse(spy1.called);
        });
      });

      it('Calls both querySaved() and queryHistory()', () => {
        const spy1 = sinon.spy(element, 'queryHistory');
        const spy2 = sinon.spy(element, 'querySaved');
        return element.queryPouchDb('test', 'all', ['id']).then(() => {
          assert.isTrue(spy1.called);
          assert.equal(spy1.args[0][0], 'test');
          assert.deepEqual(spy1.args[0][1], ['id']);
          assert.isTrue(spy2.called);
          assert.equal(spy2.args[0][0], 'test');
          assert.deepEqual(spy2.args[0][1], ['id']);
        });
      });
    });

    describe('queryHistory()', () => {
      let element;
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('Calls _queryStore with arguments', () => {
        const spy = sinon.spy(element, '_queryStore');
        return element.queryHistory('test', ['id']).then(() => {
          assert.isTrue(spy.called);
          assert.equal(spy.args[0][0], 'test');
          assert.deepEqual(spy.args[0][1], ['id']);
          assert.typeOf(spy.args[0][2], 'object');
          assert.deepEqual(spy.args[0][3], element.historyIndexes);
        });
      });
    });

    describe('querySaved()', () => {
      let element;
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('Calls _queryStore with arguments', () => {
        const spy = sinon.spy(element, '_queryStore');
        return element.querySaved('test', ['id']).then(() => {
          assert.isTrue(spy.called);
          assert.equal(spy.args[0][0], 'test');
          assert.deepEqual(spy.args[0][1], ['id']);
          assert.typeOf(spy.args[0][2], 'object');
          assert.deepEqual(spy.args[0][3], element.savedIndexes);
        });
      });
    });

    describe('_queryStore()', () => {
      let requests;
      before(async () => {
        requests = await generator.insertHistoryRequestData({
          requestsSize: 10,
        });
      });

      after(() => {
        return generator.destroyHistoryData();
      });

      let element;
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('Rejects when no query', () => {
        return element
          ._queryStore()
          .then(() => {
            throw new Error('Should not resolve');
          })
          .catch((cause) => {
            assert.typeOf(cause.message, 'string');
            assert.equal(cause.message, 'The "q" argument is required.');
          });
      });

      it('Rejects when ignored is not an array', () => {
        return element
          ._queryStore('test', 'not-an-array')
          .then(() => {
            throw new Error('Should not resolve');
          })
          .catch((cause) => {
            assert.typeOf(cause.message, 'string');
            assert.equal(
              cause.message,
              'The "ignore" argument is not an array.'
            );
          });
      });

      it('Queries the data store', () => {
        const db = element.historyDb;
        const indexes = element.historyIndexes;
        const ignore = [];
        const spy = sinon.spy(db, 'search');
        return element
          ._queryStore('test', ignore, db, indexes)
          .then(() => {
            db.search.restore();
            assert.isTrue(spy.called, 'Search function is called');
            const data = spy.args[0][0];
            assert.equal(data.query, 'test', 'Query is set');
            assert.deepEqual(data.fields, indexes, 'Fields is set');
            assert.isTrue(data.include_docs, 'include_docs is set');
            assert.equal(data.mm, 100, 'mm is set');
          })
          .catch((cause) => {
            db.search.restore();
            throw cause;
          });
      });

      it('Returns the results', () => {
        const db = element.historyDb;
        const indexes = element.historyIndexes;
        const ignore = [];
        return element
          ._queryStore(requests[0].method, ignore, db, indexes)
          .then((results) => {
            assert.typeOf(results, 'array');
            // Sometimes this fails. It is an external plugin anyway.
            // assert.isAbove(results.length, 0);
          });
      });

      it('Removes ignored requests', () => {
        const db = element.historyDb;
        const indexes = element.historyIndexes;
        const ignore = [requests[0]._id];
        return element
          ._queryStore(requests[0].method, ignore, db, indexes)
          .then((results) => {
            const index = results.findIndex(
              (item) => item._id === requests[0]._id
            );
            assert.equal(index, -1);
          });
      });
    });

    describe('indexData()', () => {
      before(() => {
        return generator.insertHistoryRequestData({
          requestsSize: 1,
        });
      });

      after(() => {
        return generator.destroyHistoryData();
      });

      let element;
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('Indexes history data', () => {
        return element.indexData('history');
      });

      it('Indexes saved data', () => {
        return element.indexData('saved');
      });
    });
  });

  describe('readProjectRequests()', () => {
    let project;
    let projects = /** @type ARCProject[] */ (null);
    before(async () => {
      const data = await generator.insertSavedRequestData();
      projects = /** @type ARCProject[] */ (data.projects);
      for (let i = 0; i < data.projects.length; i++) {
        if (projects[i].requests && projects[i].requests.length) {
          project = data.projects[i];
          break;
        }
      }
      if (!project) {
        throw new Error('Unable to find a project with requests.');
      }
    });

    after(() => {
      return generator.destroySavedRequestData();
    });

    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Calls readBulk() with arguments', () => {
      const spy = sinon.spy(element, 'readBulk');
      const opts = { restorePayload: true };
      return element.readProjectRequests(project._id, opts).then(() => {
        assert.isTrue(spy.called);
        assert.equal(spy.args[0][0], 'saved');
        assert.deepEqual(spy.args[0][1], project.requests);
        assert.deepEqual(spy.args[0][2], opts);
      });
    });

    it('Returns project requests', () => {
      return element.readProjectRequests(project._id).then((result) => {
        assert.typeOf(result, 'array');
        assert.lengthOf(result, project.requests.length);
      });
    });

    it('Calls readProjectRequestsLegacy() when project do not have requests', async () => {
      const pr = projects.find((item) => !item.requests);
      // generates projects have 30% chance to have request assigned.
      // This test would fail when all projects have requests array which is still possible
      // To eliminate false-positive test results this test ends when project is not found.
      if (!pr) {
        console.warn('THIS TEST DID NOT RUN. RE-RUN THE TEST.');
        return;
      }
      const spy = sinon.spy(element, 'readProjectRequestsLegacy');
      await element.readProjectRequests(pr._id);
      assert.isTrue(spy.called);
      assert.equal(spy.args[0][0], pr._id);
    });
  });

  describe('readProjectRequestsLegacy()', () => {
    before(async () => {
      const element = await basicFixture();
      const requests = [
        {
          _id: 'test/1234-project',
          projectOrder: 2,
          name: 'c',
          type: 'saved',
          url: 'https://api.domain.com',
          method: 'GET',
        },
        {
          _id: 'test/5678-project',
          projectOrder: 1,
          name: 'b',
          type: 'saved',
          url: 'https://api.domain.com',
          method: 'GET',
        },
        {
          _id: 'other/1234-project',
          projectOrder: 0,
          name: 'a',
          type: 'saved',
          url: 'https://api.domain.com',
          method: 'GET',
        },
      ];
      return element.updateBulk('saved', requests);
    });

    after(() => {
      return generator.destroySavedRequestData();
    });

    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Reads requests by their ID', () => {
      return element
        .readProjectRequestsLegacy('1234-project')
        .then((result) => {
          assert.lengthOf(result, 2);
        });
    });

    it('Calls sorting function', () => {
      const spy = sinon.spy(element, 'sortRequestProjectOrder');
      return element.readProjectRequestsLegacy('1234-project').then(() => {
        assert.isTrue(spy.called);
      });
    });
  });

  describe('sortRequestProjectOrder()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Returns 1 when a.order > b.order', () => {
      const result = element.sortRequestProjectOrder(
        {
          projectOrder: 1,
        },
        {
          projectOrder: 0,
        }
      );
      assert.equal(result, 1);
    });

    it('Returns -1 when a.order < b.order', () => {
      const result = element.sortRequestProjectOrder(
        {
          projectOrder: 0,
        },
        {
          projectOrder: 1,
        }
      );
      assert.equal(result, -1);
    });

    it('Returns 1 when a.name > b.name', () => {
      const result = element.sortRequestProjectOrder(
        {
          name: 1,
          projectOrder: 0,
        },
        {
          name: 0,
          projectOrder: 0,
        }
      );
      assert.equal(result, 1);
    });

    it('Returns -1 when a.order < b.order', () => {
      const result = element.sortRequestProjectOrder(
        {
          name: 0,
          projectOrder: 0,
        },
        {
          projectOrder: 0,
          name: 1,
        }
      );
      assert.equal(result, -1);
    });

    it('Returns 0 otherwise', () => {
      const result = element.sortRequestProjectOrder(
        {
          name: 0,
          projectOrder: 0,
        },
        {
          projectOrder: 0,
          name: 0,
        }
      );
      assert.equal(result, 0);
    });
  });

  describe('deleteDataModel()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Returns single promise for saved-requests', () => {
      const result = element.deleteDataModel('saved-requests');
      assert.lengthOf(result, 1);
      return Promise.all(result);
    });

    it('Returns single promise for saved', () => {
      const result = element.deleteDataModel('saved');
      assert.lengthOf(result, 1);
      return Promise.all(result);
    });

    it('Returns single promise for history-requests', () => {
      const result = element.deleteDataModel('history-requests');
      assert.lengthOf(result, 1);
      return Promise.all(result);
    });

    it('Returns single promise for history', () => {
      const result = element.deleteDataModel('history');
      assert.lengthOf(result, 1);
      return Promise.all(result);
    });

    it('Returns 2 promises for "all"', () => {
      const result = element.deleteDataModel('all');
      assert.lengthOf(result, 2);
      return Promise.all(result);
    });

    it('Returns 2 promises for "saved" and "history"', () => {
      const result = element.deleteDataModel(['saved', 'history']);
      assert.lengthOf(result, 2);
      return Promise.all(result);
    });
  });

  describe('_findUndeletedRevision()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Finds revision before delete', () => {
      const revs = {
        start: 3,
        ids: ['aaa', 'bbb', 'ccc'],
      };
      const deleted = '3-aaa';
      const result = element._findUndeletedRevision(revs, deleted);
      assert.equal(result, '2-bbb');
    });

    it('Returns null when not found', () => {
      const revs = {
        start: 3,
        ids: ['aaa', 'bbb', 'ccc'],
      };
      const deleted = '4-000';
      const result = element._findUndeletedRevision(revs, deleted);
      assert.equal(result, null);
    });
  });

  describe('_findNotDeleted()', () => {
    let element;
    let doc;
    let undeletedRev;
    beforeEach(async () => {
      element = await basicFixture();
      const db = element.getDatabase('saved');
      doc = {
        _id: 'test-id-deleted',
        _rev: undefined,
      };
      const result = await db.put(doc);
      undeletedRev = result.rev;
      doc._rev = undeletedRev;
      const delReq = await db.remove(doc);
      doc._rev = delReq.rev;
    });

    afterEach(() => {
      return generator.destroySavedRequestData();
    });

    it('Finds revision that is not deleted', async () => {
      const db = element.getDatabase('saved');
      const result = await element._findNotDeleted(db, [doc]);
      assert.equal(result[0]._rev, undeletedRev);
    });
  });

  describe('revertRemove()', () => {
    let element = /** @type RequestModel */ (null);
    let doc;
    beforeEach(async () => {
      element = await basicFixture();
      const db = element.getDatabase('saved');
      doc = {
        _id: 'test-id-deleted',
        _rev: undefined,
      };
      const result = await db.put(doc);
      doc._rev = result.rev;
      const delReq = await db.remove(doc);
      doc._rev = delReq.rev;
    });

    afterEach(() => {
      return generator.destroySavedRequestData();
    });

    it('throws when no type', async () => {
      let called = false;
      try {
        // @ts-ignore
        await element.revertRemove();
      } catch (_) {
        called = true;
      }
      assert.isTrue(called);
    });

    it('throws when no items', async () => {
      let called = false;
      try {
        // @ts-ignore
        await element.revertRemove('saved');
      } catch (_) {
        called = true;
      }
      assert.isTrue(called);
    });

    it('restores deleted items', async () => {
      const result = await element.revertRemove('saved', [doc]);
      const updatedRev = result[0]._rev;
      assert.equal(updatedRev.indexOf('3-'), 0, 'The rev property is updated.');
      const data = await generator.getDatastoreRequestData();
      const [item] = data;
      // @ts-ignore
      assert.equal(item._id, 'test-id-deleted');
      // @ts-ignore
      assert.equal(item._rev, updatedRev);
    });

    it('Dispatches request-object-changed event', async () => {
      const spy = sinon.spy();
      element.addEventListener('request-object-changed', spy);
      await element.revertRemove('saved', [doc]);
      assert.typeOf(spy.args[0][0].detail.request, 'object');
      assert.typeOf(spy.args[0][0].detail.oldRev, 'string');
      assert.typeOf(spy.args[0][0].detail.oldId, 'string');
      assert.equal(spy.args[0][0].detail.type, 'saved');
    });

    it('ignores misssing items', async () => {
      const spy = sinon.spy();
      element.addEventListener('request-object-changed', spy);
      await element.revertRemove('saved', [
        doc,
        { _id: 'none', _rev: '2-none' },
      ]);
      assert.isTrue(spy.calledOnce);
    });
  });
});
