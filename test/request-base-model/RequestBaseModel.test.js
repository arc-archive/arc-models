import { fixture, assert } from '@open-wc/testing';
import sinon from 'sinon';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import { RequestBaseModel } from '../../src/RequestBaseModel.js';
import { ArcModelEventTypes } from '../../src/events/ArcModelEventTypes.js';

/** @typedef {import('../../src/RequestTypes').ARCProject} ARCProject */
/** @typedef {import('../../src/types').ARCEntityChangeRecord} ARCEntityChangeRecord */

class RequestTestModel extends RequestBaseModel {
  static get is() {
    return 'request-test-model';
  }

  constructor() {
    super('legacy-projects');
  }
}
window.customElements.define(RequestTestModel.is, RequestTestModel);

describe('RequestBaseModel', () => {
  const generator = new DataGenerator();
  /**
   * @return {Promise<RequestTestModel>}
   */
  async function basicFixture() {
    return fixture('<request-test-model></request-test-model>');
  }

  describe('get savedDb()', () => {
    let element = /** @type {RequestTestModel} */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Returns instance of PouchDB', () => {
      const result = element.savedDb;
      assert.equal(result.constructor.name, 'PouchDB');
    });

    it('Instance has name set to saved-requests', () => {
      const result = element.savedDb;
      assert.equal(result.name, 'saved-requests');
    });
  });

  describe('get historyDb()', () => {
    let element = /** @type {RequestTestModel} */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Returns instance of PouchDB', () => {
      const result = element.historyDb;
      assert.equal(result.constructor.name, 'PouchDB');
    });

    it('Instance has name set to history-requests', () => {
      const result = element.historyDb;
      assert.equal(result.name, 'history-requests');
    });
  });

  describe('get projectDb()', () => {
    let element = /** @type {RequestTestModel} */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Returns instance of PouchDB', () => {
      const result = element.projectDb;
      assert.equal(result.constructor.name, 'PouchDB');
    });

    it('Instance has name set to history-requests', () => {
      const result = element.projectDb;
      assert.equal(result.name, 'legacy-projects');
    });
  });

  describe('getDatabase()', () => {
    let element = /** @type {RequestTestModel} */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    [
      ['saved-requests', 'saved-requests'],
      ['saved', 'saved-requests'],
      ['history-requests', 'history-requests'],
      ['history', 'history-requests'],
      ['legacy-projects', 'legacy-projects'],
      ['projects', 'legacy-projects']
    ].forEach((item) => {
      it(`Returns store handler for "${item[0]}"`, () => {
        const result = element.getDatabase(item[0]);
        assert.equal(result.constructor.name, 'PouchDB');
        assert.equal(result.name, item[1]);
      });
    });

    it('Throws error for unknown store', () => {
      assert.throws(() => {
        element.getDatabase('unknown');
      });
    });
  });

  describe('deleteModel()', () => {
    let element = /** @type {RequestTestModel} */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('deletes the model', async () => {
      await element.deleteModel('saved');
    });

    it('rejects when error', async () => {
      let thrown = false;
      try {
        await element.deleteModel('unknown');
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('dispatches the state event', async () => {
      const spy = sinon.spy();
      element.addEventListener(ArcModelEventTypes.destroyed, spy);
      await element.deleteModel('saved');
      const e = spy.args[0][0];
      assert.equal(e.store, 'saved');
    });
  });

  describe('updateProject()', () => {
    afterEach(() => {
      return generator.clearLegacyProjects();
    });

    let element = /** @type {RequestTestModel} */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('returns the change record', async () => {
      const project = /** @type ARCProject */ (generator.createProjectObject());
      const result = await element.updateProject(project);
      assert.typeOf(result, 'object', 'returns an object');
      assert.typeOf(result.id, 'string', 'has an id');
      assert.typeOf(result.rev, 'string', 'has a rev');
      assert.typeOf(result.item, 'object', 'has created object');
      assert.isUndefined(result.oldRev, 'has no oldRev');
    });

    it('creates an entity in the store', async () => {
      const project = /** @type ARCProject */ (generator.createProjectObject());
      const result = await element.updateProject(project);
      const doc = element.projectDb.get(result.id);
      assert.ok(doc);
    });

    it('updates existing entity', async () => {
      const project = /** @type ARCProject */ (generator.createProjectObject());
      const result1 = await element.updateProject(project);
      result1.item.name = 'test-other';
      const result2 = await element.updateProject(result1.item);
      assert.notEqual(result2.rev, result1.rev, '_rev is regenerated');
      assert.equal(result2.id, project._id, '_id is the same');
      assert.equal(result2.item.name, 'test-other', 'the name is set');
    });

    it('dispatches change event', async () => {
      const project = /** @type ARCProject */ (generator.createProjectObject());
      const spy = sinon.spy();
      element.addEventListener(ArcModelEventTypes.Project.State.update, spy);
      await element.updateProject(project);
      assert.isTrue(spy.calledOnce);
    });

    it('has change record on the event', async () => {
      const project = /** @type ARCProject */ (generator.createProjectObject());
      const spy = sinon.spy();
      element.addEventListener(ArcModelEventTypes.Project.State.update, spy);
      await element.updateProject(project);
      const { changeRecord } = spy.args[0][0];
      assert.isUndefined(changeRecord.oldRev);
      assert.typeOf(changeRecord.item, 'object');
    });
  });

  describe('readProject()', () => {
    afterEach(() => {
      return generator.clearLegacyProjects();
    });

    let element = /** @type {RequestTestModel} */ (null);
    let record = /** @type {ARCEntityChangeRecord} */ (null);
    beforeEach(async () => {
      element = await basicFixture();
      const project = /** @type ARCProject */ (generator.createProjectObject());
      record = await element.updateProject(project);
    });

    it('reads project entity by the id only', async () => {
      const result = await element.readProject(record.id)
      assert.equal(result._id, record.id);
    });

    it('reads project entity with a revision', async () => {
      record.item.name = 'test-updated';
      await element.updateProject(record.item);
      const result = await element.readProject(record.id, record.rev);
      assert.notEqual(result.name, 'test-updated');
    });

    it('throws when no id', async () => {
      let thrown = false;
      try {
        await element.readProject(undefined);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });
  });

  describe('removeProject()', () => {
    afterEach(() => {
      return generator.clearLegacyProjects();
    });

    let element = /** @type {RequestTestModel} */ (null);
    let record = /** @type {ARCEntityChangeRecord} */ (null);
    beforeEach(async () => {
      element = await basicFixture();
      const project = /** @type ARCProject */ (generator.createProjectObject());
      record = await element.updateProject(project);
    });

    it('removes object from the datastore with id only', async () => {
      await element.removeProject(record.id);
      const list = await generator.getDatastoreProjectsData();
      assert.deepEqual(list, []);
    });

    it('removes object from the datastore with revision', async () => {
      await element.removeProject(record.id, record.rev);
      const list = await generator.getDatastoreProjectsData();
      assert.deepEqual(list, []);
    });

    it('dispatches the state event', async () => {
      const spy = sinon.spy();
      element.addEventListener(ArcModelEventTypes.Project.State.delete, spy);
      await element.removeProject(record.id);
      assert.isTrue(spy.calledOnce);
    });

    it('has change record on the event', async () => {
      const spy = sinon.spy();
      element.addEventListener(ArcModelEventTypes.Project.State.delete, spy);
      await element.removeProject(record.id);
      const { id, rev } = spy.args[0][0];
      assert.equal(id, record.id, 'has the id');
      assert.notEqual(rev, record.rev, 'has different revision');
      assert.typeOf(rev, 'string', 'has the revision');
    });

    it('throws when no id', async () => {
      let thrown = false;
      try {
        await element.removeProject(undefined);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });
  });
});
