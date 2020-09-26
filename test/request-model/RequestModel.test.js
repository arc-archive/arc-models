import { fixture, assert, oneEvent } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import * as sinon from 'sinon';
import { PayloadProcessor } from '@advanced-rest-client/arc-electron-payload-processor/payload-processor-esm.js';
import { ArcModelEventTypes } from '../../src/events/ArcModelEventTypes.js';
import '../../request-model.js';
import { sortRequestProjectOrder, queryStore } from '../../src/RequestModel.js';
import { UrlIndexer } from '../../index.js';

/* eslint-disable prefer-destructuring */

/** @typedef {import('../../index').RequestModel} RequestModel */
/** @typedef {import('../../src/RequestTypes').ARCHistoryRequest} ARCHistoryRequest */
/** @typedef {import('../../src/RequestTypes').ARCSavedRequest} ARCSavedRequest */
/** @typedef {import('../../src/RequestTypes').ARCProject} ARCProject */
/** @typedef {import('@advanced-rest-client/arc-data-generator').InsertSavedResult} InsertSavedResult */

describe('RequestModel', () => {
  /**
   * @return {Promise<RequestModel>}
   */
  async function basicFixture() {
    return fixture('<request-model></request-model>');
  }

  const generator = new DataGenerator();

  describe('get()', () => {
    describe('saved requests', () => {
      const type = 'saved';
      let requests = /** @type ARCSavedRequest[] */ (null);
      before(async () => {
        const data = await generator.insertSavedRequestData();
        requests = data.requests;
      });

      after(async () => {
        await generator.destroySavedRequestData();
        await generator.destroyHistoryData();
      });

      let model = /** @type RequestModel */ (null);
      beforeEach(async () => {
        model = await basicFixture();
      });

      it('reads request entity with the latest revision', async () => {
        const result = await model.get(type, requests[0]._id);
        assert.typeOf(result, 'object', 'returns an object')
      });

      it('returns an item with specified revision', async () => {
        const result = await model.get(type, requests[0]._id, requests[0]._rev);
        assert.deepEqual(result, requests[0]);
      });

      it('adds computed midnight value', async () => {
        const result = await model.get(type, requests[0]._id, requests[0]._rev);
        assert.typeOf(result.midnight, 'number');
      });

      it('respects existing midnight value', async () => {
        const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
        request.midnight = 12345;
        const record = await model.savedDb.post(request);
        const result = await model.get(type, record.id);
        assert.equal(result.midnight, 12345);
      });

      it('returns an item with old revision', async () => {
        const { _rev, _id } = requests[0];
        const update = await model.post(type, requests[0]);
        requests[0] = /** @type ARCSavedRequest */ (update.item);
        const result = await model.get(type, _id, _rev);
        assert.equal(result._rev, _rev);
      });

      it('restores payload data', async () => {
        const spy = sinon.spy(PayloadProcessor, 'restorePayload');
        await model.get(type, requests[0]._id, null, {
          restorePayload: true,
        });
        // @ts-ignore
        PayloadProcessor.restorePayload.restore();
        assert.isTrue(spy.called);
      });
    });

    describe('history requests', () => {
      const type = 'history';
      let requests = /** @type ARCHistoryRequest[] */ (null);
      before(async () => {
        requests = await generator.insertHistoryRequestData();
      });

      after(async () => {
        await generator.destroySavedRequestData();
        await generator.destroyHistoryData();
      });

      let model = /** @type RequestModel */ (null);
      beforeEach(async () => {
        model = await basicFixture();
      });

      it('reads request entity with the latest revision', async () => {
        const result = await model.get(type, requests[0]._id);
        assert.typeOf(result, 'object', 'returns an object')
      });

      it('returns an item with specified revision', async () => {
        const result = await model.get(type, requests[0]._id, requests[0]._rev);
        assert.deepEqual(result, requests[0]);
      });

      it('adds computed midnight value', async () => {
        const result = await model.get(type, requests[0]._id);
        assert.typeOf(result.midnight, 'number');
      });

      it('returns an item with old revision', async () => {
        const { _rev, _id } = requests[0];
        const update = await model.post(type, requests[0]);
        requests[0] = /** @type ARCHistoryRequest */ (update.item);
        const result = await model.get(type, _id, _rev);
        assert.equal(result._rev, _rev);
      });
    });
  });

  describe('getBulk()', () => {
    const type = 'history';
    let requests = /** @type ARCHistoryRequest[] */ (null);
    before(async () => {
      requests = await generator.insertHistoryRequestData();
    });

    after(async () => {
      await generator.destroySavedRequestData();
      await generator.destroyHistoryData();
    });

    let model = /** @type RequestModel */ (null);
    beforeEach(async () => {
      model = await basicFixture();
    });

    it('reads multiple requests in bulk', async () => {
      const ids = requests.slice(0, 5).map((item) => item._id);
      const result = await model.getBulk(type, ids);
      assert.lengthOf(result, 5);
    });

    it('ignores unknown requests', async () => {
      const ids = requests.slice(0, 5).map((item) => item._id);
      ids.push('unknown');
      const result = await model.getBulk(type, ids);
      assert.lengthOf(result, 5);
    });

    it('restores payload on each request', async () => {
      const ids = requests.slice(0, 5).map((item) => item._id);
      const spy = sinon.spy(PayloadProcessor, 'restorePayload');
      await model.getBulk(type, ids, {
        restorePayload: true,
      });
      // @ts-ignore
      PayloadProcessor.restorePayload.restore();
      assert.equal(spy.callCount, 5);
    });

    it('normalizes the requests', async () => {
      const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
      delete request.updated;
      delete request.created;
      delete request.midnight;
      const record = await model.historyDb.post(request);
      const result = await model.getBulk(type, [record.id]);
      assert.typeOf(result[0].updated, 'number');
      assert.typeOf(result[0].created, 'number');
      assert.typeOf(result[0].midnight, 'number');
    });
  });

  describe('post()', () => {
    after(async () => {
      await generator.destroySavedRequestData();
      await generator.destroyHistoryData();
    });

    let model = /** @type RequestModel */ (null);
    beforeEach(async () => {
      model = await basicFixture();
    });

    it('returns a change record', async () => {
      const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
      const result = await model.post('saved', request);
      assert.typeOf(result, 'object', 'result is an object');
      assert.typeOf(result.id, 'string', 'has created ID');
      assert.typeOf(result.rev, 'string', 'has created rev');
      assert.typeOf(result.item, 'object', 'has updated object');
      assert.equal(result.item._id, result.id, 'the id of the change record and the entity match');
      assert.equal(result.item._rev, result.rev, 'the revision of the change record and the entity match');
    });

    it('creates an ID if needed', async () => {
      const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
      delete request._id;
      const result = await model.post('saved', request);
      assert.typeOf(result.id, 'string');
    });

    it('respects passed ID', async () => {
      const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
      request._id = 'very-unique-id';
      const result = await model.post('saved', request);
      assert.equal(result.id, request._id);
    });

    it('reads existing item revision before storing', async () => {
      const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
      await model.post('saved', request);
      request.name = 'test';
      delete request._rev;
      const result = await model.post('saved', request);
      assert.typeOf(result.item._rev, 'string');
    });

    it('adds "updated" property', async () => {
      const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
      const result = await model.post('saved', request);
      assert.typeOf(result.item.updated, 'number');
    });

    it('adds "created" property', async () => {
      const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
      delete request.created;
      const result = await model.post('saved', request);
      assert.typeOf(result.item.created, 'number');
    });

    it('transforms "legacyProject" into "projects"', async () => {
      const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
      // @ts-ignore
      request.legacyProject = 'test-123';
      const result = await model.post('saved', request);
      const updated = /** @type ARCSavedRequest */ (result.item);
      assert.equal(updated.projects[0], 'test-123', 'has an item on the project');
      // @ts-ignore
      assert.isUndefined(updated.legacyProject, 'legacyProject is removed');
    });

    it('removes all non-datastore relevant keys staring with an underscore', async () => {
      const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
      // @ts-ignore
      request._test = true;
      const result = await model.post('saved', request);
      const updated = /** @type ARCSavedRequest */ (result.item);
      // @ts-ignore
      assert.isUndefined(updated._test);
    });

    it('dispatches update event', async () => {
      const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
      model.post('saved', request);
      // @ts-ignore
      const { changeRecord, requestType } = await oneEvent(model, ArcModelEventTypes.Request.State.update);
      assert.typeOf(changeRecord, 'object');
      assert.equal(requestType, 'saved');
    });

    it('updates existing request', async () => {
      const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
      const result = await model.post('saved', request);
      const updated = /** @type ARCSavedRequest */ (result.item);
      updated.name = 'xyz';
      const result2 = await model.post('saved', updated);
      assert.notEqual(result2.rev, result.rev, 'has different revisions');
      assert.equal(result2.id, result.id, 'has the same ids');
      const updated2 = /** @type ARCSavedRequest */ (result2.item);
      assert.equal(updated2.name, 'xyz', 'has updated name');
    });

    it('saves history item', async () => {
      const request = /** @type ARCHistoryRequest */ (generator.generateHistoryObject());
      const result = await model.post('history', request);
      assert.equal(result.item.type, 'history');
    });

    it('adds updated value', async () => {
      const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
      delete request.updated;
      const result = await model.post('saved', request);
      assert.typeOf(result.item.updated, 'number');
    });

    it('adds midnight value', async () => {
      const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
      const result = await model.post('saved', request);
      assert.typeOf(result.item.midnight, 'number');
      assert.isBelow(result.item.midnight, result.item.updated);
    });
  });

  describe('postBulk()', () => {
    after(async () => {
      await generator.destroySavedRequestData();
      await generator.destroyHistoryData();
    });

    let model = /** @type RequestModel */ (null);
    beforeEach(async () => {
      model = await basicFixture();
    });

    it('returns a change record', async () => {
      const insert = /** @type InsertSavedResult */ (generator.generateSavedRequestData());
      const requests = /** @type ARCSavedRequest[] */ (insert.requests);
      const result = await model.postBulk('saved', requests);
      assert.typeOf(result, 'array', 'result is an array');
      const [change] = result;
      assert.typeOf(change.id, 'string', 'has created ID');
      assert.typeOf(change.rev, 'string', 'has created rev');
      assert.typeOf(change.item, 'object', 'has updated object');
      assert.equal(change.item._id, change.id, 'the id of the change record and the entity match');
      assert.equal(change.item._rev, change.rev, 'the revision of the change record and the entity match');
    });

    it('creates an ID if needed', async () => {
      const insert = /** @type InsertSavedResult */ (generator.generateSavedRequestData());
      const requests = /** @type ARCSavedRequest[] */ (insert.requests);
      delete requests[0]._id;
      const result = await model.postBulk('saved', requests);
      assert.typeOf(result[0].id, 'string');
    });

    it('respects passed ID', async () => {
      const insert = /** @type InsertSavedResult */ (generator.generateSavedRequestData());
      const requests = /** @type ARCSavedRequest[] */ (insert.requests);
      requests[0]._id = 'very-unique-id';
      const result = await model.postBulk('saved', requests);
      assert.equal(result[0].id, requests[0]._id);
    });

    it('adds "updated" property', async () => {
      const insert = /** @type InsertSavedResult */ (generator.generateSavedRequestData());
      const requests = /** @type ARCSavedRequest[] */ (insert.requests);
      const result = await model.postBulk('saved', requests);
      assert.typeOf(result[0].item.updated, 'number');
    });

    it('adds "created" property', async () => {
      const insert = /** @type InsertSavedResult */ (generator.generateSavedRequestData());
      const requests = /** @type ARCSavedRequest[] */ (insert.requests);
      delete requests[0].created;
      const result = await model.postBulk('saved', requests);
      assert.typeOf(result[0].item.created, 'number');
    });

    it('transforms "legacyProject" into "projects"', async () => {
      const insert = /** @type InsertSavedResult */ (generator.generateSavedRequestData());
      const requests = /** @type ARCSavedRequest[] */ (insert.requests);
      // @ts-ignore
      requests[0].legacyProject = 'test-123';
      delete requests[0].projects;
      const result = await model.postBulk('saved', requests);
      const updated = /** @type ARCSavedRequest */ (result[0].item);
      assert.equal(updated.projects[0], 'test-123', 'has an item on the project');
      // @ts-ignore
      assert.isUndefined(updated.legacyProject, 'legacyProject is removed');
    });

    it('removes all non-datastore relevant keys staring with an underscore', async () => {
      const insert = /** @type InsertSavedResult */ (generator.generateSavedRequestData());
      const requests = /** @type ARCSavedRequest[] */ (insert.requests);
      // @ts-ignore
      requests[0]._test = true;
      const result = await model.postBulk('saved', requests);
      const updated = /** @type ARCSavedRequest */ (result[0].item);
      // @ts-ignore
      assert.isUndefined(updated._test);
    });

    it('dispatches update event', async () => {
      const insert = /** @type InsertSavedResult */ (generator.generateSavedRequestData());
      const requests = /** @type ARCSavedRequest[] */ (insert.requests);
      const spy = sinon.spy();
      model.addEventListener(ArcModelEventTypes.Request.State.update, spy);
      await model.postBulk('saved', requests);
      assert.equal(spy.callCount, requests.length);
    });

    it('updates existing request', async () => {
      const insert = /** @type InsertSavedResult */ (generator.generateSavedRequestData());
      const requests = /** @type ARCSavedRequest[] */ (insert.requests);
      const result = await model.postBulk('saved', requests);
      const updated = /** @type ARCSavedRequest */ (result[0].item);
      updated.name = 'xyz';
      const result2 = await model.postBulk('saved', [updated]);
      assert.notEqual(result2[0].rev, result[0].rev, 'has different revisions');
      assert.equal(result2[0].id, result[0].id, 'has the same ids');
      const updated2 = /** @type ARCSavedRequest */ (result2[0].item);
      assert.equal(updated2.name, 'xyz', 'has updated name');
    });

    it('saves history item', async () => {
      const requests = /** @type ARCHistoryRequest[] */ (generator.generateHistoryRequestsData());
      const result = await model.postBulk('history', requests);
      assert.equal(result[0].item.type, 'history');
    });

    it('adds updated value', async () => {
      const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
      delete request.updated;
      const result = await model.postBulk('saved', [request]);
      assert.typeOf(result[0].item.updated, 'number');
    });

    it('adds midnight value', async () => {
      const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
      const result = await model.postBulk('saved', [request]);
      assert.typeOf(result[0].item.midnight, 'number');
      assert.isBelow(result[0].item.midnight, result[0].item.updated);
    });
  });

  describe('delete()', () => {
    const type = 'saved';
    let requests = /** @type ARCSavedRequest[] */ (null);
    before(async () => {
      const data = await generator.insertSavedRequestData({
        forceProject: true,
      });
      requests = data.requests;
    });

    after(async () => {
      await generator.destroySavedRequestData();
      await generator.destroyHistoryData();
    });

    let model = /** @type RequestModel */ (null);
    beforeEach(async () => {
      model = await basicFixture();
    });

    it('removes an item from the data store', async () => {
      const request = requests[0];
      await model.delete(type, request._id);
      let thrown = false;
      try {
        await model.get(type, request._id);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('uses specific revision', async () => {
      const request = requests[1];
      await model.delete(type, request._id, request._rev);
      let thrown = false;
      try {
        await model.get(type, request._id);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('dispatches deleted state event', async () => {
      const request = requests[2];
      model.delete(type, request._id, request._rev);
      // @ts-ignore
      const { id, rev } = await oneEvent(model, ArcModelEventTypes.Request.State.delete);
      assert.equal(id, request._id, 'has the ID');
      assert.typeOf(rev, 'string', 'has the revision');
      assert.notEqual(rev, request._rev, 'has updated revision');
    });

    it('removes a request from a project', async () => {
      const request = requests[3];
      const { projects } = request;
      assert.isAbove(projects.length, 0, 'request has project');
      await model.delete(type, request._id);
      const [projectId] = projects;
      const project = await model.readProject(projectId);
      assert.notInclude(project.requests, projectId);
    });

    it('dispatches updated state event on project', async () => {
      const request = requests[4];
      const { projects } = request;
      assert.isAbove(projects.length, 0, 'request has project');
      model.delete(type, request._id);
      // @ts-ignore
      const { changeRecord } = await oneEvent(model, ArcModelEventTypes.Project.State.update);
      assert.equal(changeRecord.id, projects[0], 'has the ID');
      assert.typeOf(changeRecord.rev, 'string', 'has the revision');
    });

    it('returns delete record', async () => {
      const request = requests[5];
      const result = await model.delete(type, request._id);
      assert.typeOf(result, 'object', 'has the delete record');
      assert.notEqual(result.rev, request._rev, 'has updated revision');
      assert.equal(result.id, request._id, 'has the id');
    });
  });

  describe('deleteBulk()', () => {
    const type = 'saved';
    let requests = /** @type ARCSavedRequest[] */ (null);
    before(async () => {
      const data = await generator.insertSavedRequestData({
        forceProject: true,
      });
      requests = data.requests;
    });

    after(async () => {
      await generator.destroySavedRequestData();
      await generator.destroyHistoryData();
    });

    let model = /** @type RequestModel */ (null);
    beforeEach(async () => {
      model = await basicFixture();
    });

    it('removes requests from the store', async () => {
      const items = requests.splice(0, 2).map((item) => item._id);
      await model.deleteBulk(type, items);
      const response = await model.savedDb.allDocs({
        keys: items,
      });
      response.rows.forEach((item) => {
        assert.isTrue(item.value.deleted);
      });
    });

    it('ignores unknown items', async () => {
      const items = requests.splice(2, 2).map((item) => item._id);
      items.push('unknown');
      const result = await model.deleteBulk(type, items);
      assert.lengthOf(result, 2);
    });

    it('removes requests from corresponding projects', async () => {
      const items = requests.splice(4, 2).map((item) => item._id);
      await model.deleteBulk(type, items);
      const [projectId] = requests[5].projects;
      const project = await model.readProject(projectId);
      assert.notInclude(project.requests, projectId);
    });

    it('dispatches deleted event for each deleted entity', async () => {
      const items = requests.splice(6, 2).map((item) => item._id);
      const spy = sinon.spy();
      model.addEventListener(ArcModelEventTypes.Request.State.delete, spy);
      await model.deleteBulk(type, items);
      assert.equal(spy.callCount, 2);
    });

    it('throws when no type', async () => {
      const items = requests.splice(8, 2).map((item) => item._id);
      let thrown = false;
      try {
        await model.deleteBulk(undefined, items);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when no items', async () => {
      let thrown = false;
      try {
        await model.deleteBulk('saved', undefined);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('ignores removing projects when no projects on a request', async () => {
      const beforeProjects = await generator.getDatastoreProjectsData();
      const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
      const record = await model.post('saved', request);
      await model.deleteBulk('saved', [record.id]);
      const afterProjects = await generator.getDatastoreProjectsData();
      assert.equal(beforeProjects.length, afterProjects.length);
    });
  });

  describe('revertRemove()', () => {
    const type = 'saved';
    let doc = /** @type ARCSavedRequest */ (null);

    after(async () => {
      await generator.destroySavedRequestData();
      await generator.destroyHistoryData();
    });

    function deleted(d) {
      return {
        id: d._id,
        rev: d._rev,
      }
    }

    let model = /** @type RequestModel */ (null);
    beforeEach(async () => {
      model = await basicFixture();
      const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
      const record = await model.post(type, request);
      doc = /** @type ARCSavedRequest */ (record.item);
      const result = await model.delete(type, doc._id, doc._rev);
      doc._rev = result.rev;
    });

    it('restores deleted items', async () => {
      const result = await model.revertRemove('saved', [deleted(doc)]);
      const updatedRev = result[0].item._rev;
      assert.equal(updatedRev.indexOf('3-'), 0, 'The rev property is updated.');
      const data = await generator.getDatastoreRequestData();
      const [item] = data;
      assert.equal(item._id, doc._id, 'is the same item');
      assert.equal(item._rev, updatedRev, 'has new revision');
    });

    it('dispatches change event', async () => {
      const spy = sinon.spy();
      model.addEventListener(ArcModelEventTypes.Request.State.update, spy);
      await model.revertRemove('saved', [deleted(doc)]);
      assert.isTrue(spy.calledOnce, 'event is dispatched');
      const { changeRecord } = spy.args[0][0];
      assert.equal(changeRecord.id, doc._id, 'record has the ID');
      assert.include(changeRecord.rev, '3-', 'record has updated revision');
      assert.equal(changeRecord.rev, changeRecord.item._rev, 'record has the same revision as the item');
      assert.include(changeRecord.oldRev, '2-', 'record has old revision');
    });

    it('throws when no type', async () => {
      let thrown = false;
      try {
        await model.revertRemove(undefined, [deleted(doc)]);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when no items', async () => {
      let thrown = false;
      try {
        await model.revertRemove('saved', undefined);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });
  });

  describe('[sortRequestProjectOrder]()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Returns 1 when a.order > b.order', () => {
      const result = element[sortRequestProjectOrder](
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
      const result = element[sortRequestProjectOrder](
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
      const result = element[sortRequestProjectOrder](
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
      const result = element[sortRequestProjectOrder](
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
      const result = element[sortRequestProjectOrder](
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
      return element.postBulk('saved', requests);
    });

    after(async () => {
      await generator.destroySavedRequestData();
      await generator.destroyHistoryData();
    });

    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Reads requests by their ID', async () => {
      const result = await element.readProjectRequestsLegacy('1234-project');
      assert.lengthOf(result, 2);
    });

    it('Calls sorting function', async () => {
      const spy = sinon.spy(element, sortRequestProjectOrder);
      await element.readProjectRequestsLegacy('1234-project');
      assert.isTrue(spy.called);
    });
  });

  describe('readProjectRequests()', () => {
    let project;
    let projects = /** @type ARCProject[] */ (null);
    before(async () => {
      const data = await generator.insertSavedRequestData({
        forceProject: true,
      });
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

    after(async () => {
      await generator.destroySavedRequestData();
      await generator.destroyHistoryData();
    });

    let model = /** @type RequestModel */ (null);
    beforeEach(async () => {
      model = await basicFixture();
    });

    it('Calls getBulk() with arguments', async () => {
      const spy = sinon.spy(model, 'getBulk');
      const opts = { restorePayload: true };
      await model.readProjectRequests(project._id, opts);
      assert.isTrue(spy.called);
      assert.equal(spy.args[0][0], 'saved');
      assert.deepEqual(spy.args[0][1], project.requests);
      assert.deepEqual(spy.args[0][2], opts);
    });

    it('Returns project requests', async () => {
      const result = await model.readProjectRequests(project._id);
      assert.typeOf(result, 'array');
      assert.lengthOf(result, project.requests.length);
    });

    it('Calls readProjectRequestsLegacy() when project do not have requests', async () => {
      const [localProject] = projects;
      delete localProject.requests;
      await model.updateProject(localProject);
      const spy = sinon.spy(model, 'readProjectRequestsLegacy');
      await model.readProjectRequests(localProject._id);
      assert.isTrue(spy.called);
      assert.equal(spy.args[0][0], localProject._id);
    });

    it('throws when no type', async () => {
      let thrown = false;
      try {
        await model.readProjectRequests(undefined);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });
  });

  describe('queryPouchDb()', () => {
    let model = /** @type RequestModel */ (null);
    beforeEach(async () => {
      model = await basicFixture();
    });

    it('Rejects when no query', async () => {
      let thrown = false;
      let cause = {};
      try {
        await model.queryPouchDb(undefined);
      } catch (e) {
        thrown = true;
        cause = e;
      }
      assert.isTrue(thrown, 'exception is raised');
      assert.typeOf(cause.message, 'string');
      assert.equal(cause.message, 'The "q" parameter is required.');
    });

    it('Calls queryHistory() only', async () => {
      const spy1 = sinon.spy(model, 'queryHistory');
      const spy2 = sinon.spy(model, 'querySaved');
      await model.queryPouchDb('test', 'history', ['id']);
      assert.isTrue(spy1.called);
      assert.equal(spy1.args[0][0], 'test');
      assert.deepEqual(spy1.args[0][1], ['id']);
      assert.isFalse(spy2.called);
    });

    it('Calls querySaved() only', async () => {
      const spy1 = sinon.spy(model, 'queryHistory');
      const spy2 = sinon.spy(model, 'querySaved');
      await model.queryPouchDb('test', 'saved', ['id']);
      assert.isTrue(spy2.called);
      assert.equal(spy2.args[0][0], 'test');
      assert.deepEqual(spy2.args[0][1], ['id']);
      assert.isFalse(spy1.called);
    });

    it('Calls both querySaved() and queryHistory()', async () => {
      const spy1 = sinon.spy(model, 'queryHistory');
      const spy2 = sinon.spy(model, 'querySaved');
      await model.queryPouchDb('test', 'all', ['id']);
      assert.isTrue(spy1.called);
      assert.equal(spy1.args[0][0], 'test');
      assert.deepEqual(spy1.args[0][1], ['id']);
      assert.isTrue(spy2.called);
      assert.equal(spy2.args[0][0], 'test');
      assert.deepEqual(spy2.args[0][1], ['id']);
    });
  });

  describe('queryHistory()', () => {
    let model = /** @type RequestModel */ (null);
    beforeEach(async () => {
      model = await basicFixture();
    });

    it('Calls [queryStore] with arguments', async () => {
      // @ts-ignore
      const spy = sinon.spy(model, queryStore);
      await model.queryHistory('test', ['id']);
      assert.isTrue(spy.called);
      assert.equal(spy.args[0][0], 'test');
      assert.deepEqual(spy.args[0][1], ['id']);
      assert.typeOf(spy.args[0][2], 'object');
      assert.deepEqual(spy.args[0][3], model.historyIndexes);
    });
  });

  describe('querySaved()', () => {
    let model = /** @type RequestModel */ (null);
    beforeEach(async () => {
      model = await basicFixture();
    });

    it('Calls [queryStore] with arguments', async () => {
      // @ts-ignore
      const spy = sinon.spy(model, queryStore);
      await model.querySaved('test', ['id']);
      assert.isTrue(spy.called);
      assert.equal(spy.args[0][0], 'test');
      assert.deepEqual(spy.args[0][1], ['id']);
      assert.typeOf(spy.args[0][2], 'object');
      assert.deepEqual(spy.args[0][3], model.savedIndexes);
    });
  });

  describe('[queryStore]()', () => {
    let requests;
    before(async () => {
      requests = await generator.insertHistoryRequestData({
        requestsSize: 10,
      });
    });

    after(async () => {
      await generator.destroySavedRequestData();
      await generator.destroyHistoryData();
    });

    let model = /** @type RequestModel */ (null);
    beforeEach(async () => {
      model = await basicFixture();
    });

    it('Rejects when no query', async () => {
      let thrown = false;
      let cause = {};
      try {
        await model[queryStore]();
      } catch (e) {
        thrown = true;
        cause = e;
      }
      assert.isTrue(thrown, 'exception is raised');
      assert.typeOf(cause.message, 'string');
      assert.equal(cause.message, 'The "q" argument is required.');
    });

    it('Rejects when ignored is not an array', async () => {
      let thrown = false;
      let cause = {};
      try {
        await model[queryStore]('test', 'not-an-array');
      } catch (e) {
        thrown = true;
        cause = e;
      }
      assert.isTrue(thrown, 'exception is raised');
      assert.typeOf(cause.message, 'string');
      assert.equal(cause.message, 'The "ignore" argument is not an array.');
    });

    it('Queries the data store', async () => {
      const db = model.historyDb;
      const indexes = model.historyIndexes;
      const ignore = [];
      // @ts-ignore
      const spy = sinon.spy(db, 'search');
      await model[queryStore]('test', ignore, db, indexes);
      // @ts-ignore
      db.search.restore();
      assert.isTrue(spy.called, 'Search function is called');
      const data = spy.args[0][0];
      assert.equal(data.query, 'test', 'Query is set');
      assert.deepEqual(data.fields, indexes, 'Fields is set');
      assert.isTrue(data.include_docs, 'include_docs is set');
      assert.equal(data.mm, 100, 'mm is set');
    });

    it('Returns the results', async () => {
      const db = model.historyDb;
      const indexes = model.historyIndexes;
      const ignore = [];
      const results = await model[queryStore](requests[0].method, ignore, db, indexes);
      assert.typeOf(results, 'array');
    });

    it('Removes ignored requests', async () => {
      const db = model.historyDb;
      const indexes = model.historyIndexes;
      const ignore = [requests[0]._id];
      const results = await model[queryStore](requests[0].method, ignore, db, indexes);
      const index = results.findIndex(
        (item) => item._id === requests[0]._id
      );
      assert.equal(index, -1);
    });
  });

  describe('indexData()', () => {
    before(() => {
      return generator.insertHistoryRequestData({
        requestsSize: 1,
      });
    });

    after(async () => {
      await generator.destroySavedRequestData();
      await generator.destroyHistoryData();
    });

    let model = /** @type RequestModel */ (null);
    beforeEach(async () => {
      model = await basicFixture();
    });

    it('Indexes history data', async () => {
      await model.indexData('history');
    });

    it('Indexes saved data', async () => {
      await model.indexData('saved');
    });
  });

  describe('deleteDataModel()', () => {
    let model = /** @type RequestModel */ (null);
    beforeEach(async () => {
      model = await basicFixture();
    });

    it('Returns single promise for saved-requests', () => {
      const result = model.deleteDataModel('saved-requests');
      assert.lengthOf(result, 1);
      return Promise.all(result);
    });

    it('Returns single promise for saved', () => {
      const result = model.deleteDataModel('saved');
      assert.lengthOf(result, 1);
      return Promise.all(result);
    });

    it('Returns single promise for history-requests', () => {
      const result = model.deleteDataModel('history-requests');
      assert.lengthOf(result, 1);
      return Promise.all(result);
    });

    it('Returns single promise for history', () => {
      const result = model.deleteDataModel('history');
      assert.lengthOf(result, 1);
      return Promise.all(result);
    });

    it('Returns 2 promises for "all"', () => {
      const result = model.deleteDataModel('all');
      assert.lengthOf(result, 2);
      return Promise.all(result);
    });

    it('Returns 2 promises for "saved" and "history"', () => {
      const result = model.deleteDataModel(['saved', 'history']);
      assert.lengthOf(result, 2);
      return Promise.all(result);
    });
  });

  describe('list()', () => {
    const type = 'history';
    before(async () => {
      await generator.insertHistoryRequestData({
        requestsSize: 30,
      });
    });

    let model = /** @type RequestModel */ (null);
    beforeEach(async () => {
      model = await basicFixture();
    });

    after(async () => {
      await generator.destroySavedRequestData();
      await generator.destroyHistoryData();
    });

    it('returns a query result for default parameters', async () => {
      const result = await model.list(type);
      assert.typeOf(result, 'object', 'result is an object');
      assert.typeOf(result.nextPageToken, 'string', 'has page token');
      assert.typeOf(result.items, 'array', 'has response items');
      assert.lengthOf(result.items, model.defaultQueryOptions.limit, 'has default limit of items');
    });

    it('respects "limit" parameter', async () => {
      const result = await model.list(type, {
        limit: 5,
      });
      assert.lengthOf(result.items, 5);
    });

    it('respects "nextPageToken" parameter', async () => {
      const result1 = await model.list(type, {
        limit: 10,
      });
      const result2 = await model.list(type, {
        nextPageToken: result1.nextPageToken,
      });
      assert.lengthOf(result2.items, 20);
    });

    it('does not set "nextPageToken" when no more results', async () => {
      const result1 = await model.list(type, {
        limit: 40,
      });
      const result2 = await model.list(type, {
        nextPageToken: result1.nextPageToken,
      });
      assert.isUndefined(result2.nextPageToken);
    });

    it('throws when no type', async () => {
      let thrown = false;
      try {
        await model.list(undefined);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });
  });

  describe('removeRequestsFromProject()', () => {
    let projects = /** @type ARCProject[] */ (null);
    before(async () => {
      const data = await generator.insertSavedRequestData({
        forceProject: true,
      });
      projects = data.projects;
    });

    after(async () => {
      await generator.destroySavedRequestData();
      await generator.destroyHistoryData();
    });

    let model = /** @type RequestModel */ (null);
    beforeEach(async () => {
      model = await basicFixture();
    });

    it('ignores when a project has no requests', async () => {
      const [pr] = projects;
      const [req] = pr.requests;
      delete pr.requests;
      await model.removeRequestsFromProject(pr, [req]);
      const project = await model.readProject(pr._id);
      assert.include(project.requests, req);
    });

    it('removes a request', async () => {
      const item = projects[1];
      const [req] = item.requests;
      await model.removeRequestsFromProject(item, [req]);
      const project = await model.readProject(item._id);
      assert.notInclude(project.requests, req);
    });

    it('removes all request', async () => {
      const item = projects[2];
      await model.removeRequestsFromProject(item, item.requests);
      const project = await model.readProject(item._id);
      assert.isEmpty(project.requests);
    });
  });

  describe('saveRequestProject()', () => {
    after(async () => {
      await generator.destroySavedRequestData();
      await generator.destroyHistoryData();
    });

    let model = /** @type RequestModel */ (null);
    beforeEach(async () => {
      model = await basicFixture();
    });

    it('returns a change record', async () => {
      const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
      const result = await model.saveRequestProject(request);
      assert.typeOf(result, 'object', 'result is an object');
      assert.typeOf(result.id, 'string', 'has created ID');
      assert.typeOf(result.rev, 'string', 'has created rev');
      assert.typeOf(result.item, 'object', 'has updated object');
      assert.equal(result.item._id, result.id, 'the id of the change record and the entity match');
      assert.equal(result.item._rev, result.rev, 'the revision of the change record and the entity match');
    });

    it('generates an id when missing', async () => {
      const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
      delete request._id;
      const result = await model.saveRequestProject(request);
      assert.typeOf(result.id, 'string', 'has created ID');
    });

    it('creates new projects and associate them with the request', async () => {
      const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
      const result = await model.saveRequestProject(request, ['a', 'b', 'c']);
      const { id, item } = result;
      const projects = await generator.getDatastoreProjectsData();
      assert.lengthOf(projects, 3, 'creates the projects');
      assert.deepEqual(projects[0].requests, [id], 'project #0 has request id');
      assert.deepEqual(projects[1].requests, [id], 'project #1 has request id');
      assert.deepEqual(projects[2].requests, [id], 'project #2 has request id');
      // @ts-ignore
      assert.include(item.projects, projects[0]._id, 'request has project #0 id');
      // @ts-ignore
      assert.include(item.projects, projects[1]._id, 'request has project #1 id');
      // @ts-ignore
      assert.include(item.projects, projects[2]._id, 'request has project #2 id');
    });

    it('adds a project to the list of existing projects', async () => {
      const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
      request.projects = ['123-test'];
      const result = await model.saveRequestProject(request, ['test']);
      // @ts-ignore
      const {projects} = result.item;
      assert.include(projects, '123-test', 'has old project');
      assert.lengthOf(projects, 2, 'has new project');
    });

    it('moves "legacyProject" to the projects list', async () => {
      const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
      // @ts-ignore
      request.legacyProject = '123-test';
      const result = await model.saveRequestProject(request);
      // @ts-ignore
      const {projects} = result.item;
      assert.deepEqual(projects, ['123-test'], 'moves legacyProject to projects');
      // @ts-ignore
      assert.isUndefined(result.item.legacyProject, 'removes legacyProject');
    });

    it('does not duplicate project when moving from legacy', async () => {
      const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
      // @ts-ignore
      request.legacyProject = '123-test';
      request.projects = ['123-test'];
      const result = await model.saveRequestProject(request);
      // @ts-ignore
      const {projects} = result.item;
      assert.deepEqual(projects, ['123-test'], 'moves legacyProject to projects');
      // @ts-ignore
      assert.isUndefined(result.item.legacyProject, 'removes legacyProject');
    });

    it('sets type to saved', async () => {
      const request = /** @type ARCHistoryRequest */ (generator.generateHistoryObject());
      const result = await model.saveRequestProject(request);
      assert.equal(result.item.type, 'saved');
    });

    it('operates on a copy', async () => {
      const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
      delete request._id;
      await model.saveRequestProject(request);
      assert.isUndefined(request._id);
    });
  });

  describe('query()', () => {
    let history = /** @type ARCHistoryRequest[] */ (null);
    let saved = /** @type ARCSavedRequest[] */ (null);
    before(async () => {
      const data = await generator.insertSavedRequestData();
      saved = data.requests;
      history = await generator.insertHistoryRequestData();
      const indexer = new UrlIndexer();
      await indexer.reindexSaved();
      await indexer.reindexHistory();
    });

    after(async () => {
      await generator.destroySavedRequestData();
      await generator.destroyHistoryData();
    });

    let model = /** @type RequestModel */ (null);
    beforeEach(async () => {
      model = await basicFixture();
    });

    it('throws when no q argument', async () => {
      let thrown = false;
      try {
        await model.query(undefined);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('returns a query result for an url data (saved)', async () => {
      const result = await model.query(saved[0].url);
      assert.typeOf(result, 'array');
      assert.isAbove(result.length, 0);
    });

    it('returns a query result for an partial url data (saved)', async () => {
      const url = new URL(saved[0].url);
      const result = await model.query(url.pathname);
      assert.typeOf(result, 'array');
      assert.isAbove(result.length, 0);
    });

    it('returns a query result for an url data (history)', async () => {
      const result = await model.query(history[0].url);
      assert.typeOf(result, 'array');
      assert.isAbove(result.length, 0);
    });

    it('returns a query result for an partial url data (history)', async () => {
      const url = new URL(history[0].url);
      const result = await model.query(url.pathname);
      assert.typeOf(result, 'array');
      assert.isAbove(result.length, 0);
    });

    it('returns a query result for a name', async () => {
      const result = await model.query(saved[0].name);
      assert.typeOf(result, 'array');
      assert.isAbove(result.length, 0);
    });

    it('filters results to saved only', async () => {
      const result = await model.query(history[0].url, 'saved');
      assert.typeOf(result, 'array');
      assert.lengthOf(result, 0);
    });

    it('filters results to history only', async () => {
      const result = await model.query(saved[0].url, 'history');
      assert.typeOf(result, 'array');
      assert.lengthOf(result, 0);
    });

    it('returns a result for text search in the description', async () => {
      saved[0].description = 'this is a test';
      const record = await model.post('saved', saved[0]);
      saved[0]._rev = record.rev;
      const result = await model.query('test');
      assert.equal(result[0]._id, saved[0]._id);
    });
  });
});
