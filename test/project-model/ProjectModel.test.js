import { fixture, assert, oneEvent } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import * as sinon from 'sinon';
import '../../project-model.js';
import { ArcModelEventTypes } from '../../src/events/ArcModelEventTypes.js';
import { normalizeProjects } from '../../src/ProjectModel.js';

/** @typedef {import('../../src/ProjectModel').ProjectModel} ProjectModel */
/** @typedef {import('../../src/events/ProjectEvents').ARCProjectUpdatedEvent} ARCProjectUpdatedEvent */
/** @typedef {import('../../src/events/ProjectEvents').ARCProjectDeleteEvent} ARCProjectDeleteEvent */
/** @typedef {import('../../src/RequestTypes').ARCProject} ARCProject */
/** @typedef {import('../../src/types').ARCEntityChangeRecord} ARCEntityChangeRecord */

describe('ProjectModel', () => {
  /**
   * @return {Promise<ProjectModel>}
   */
  async function basicFixture() {
    return fixture('<project-model></project-model>');
  }

  const generator = new DataGenerator();

  describe('post()', () => {
    let element = /** @type ProjectModel */ (null);
    before(async () => {
      element = await basicFixture();
    });

    after(async () => {
      await generator.destroySavedRequestData();
    });

    it('returns an insert result', async () => {
      const project = /** @type ARCProject */ (generator.createProjectObject());
      const result = await element.post(project);
      assert.typeOf(result, 'object', 'returns an object');
      assert.typeOf(result.id, 'string', 'has an id');
      assert.typeOf(result.rev, 'string', 'has a rev');
      assert.typeOf(result.item, 'object', 'has created object');
      assert.isUndefined(result.oldRev, 'has no oldRev');
    });

    it('returns id and rev from created entity', async () => {
      const project = /** @type ARCProject */ (generator.createProjectObject());
      const result = await element.post(project);
      const { item, id, rev } = result;
      assert.equal(item._id, id, 'has item id');
      assert.equal(item._rev, rev, 'has item rev');
    });

    it('updates existing entity', async () => {
      const project = /** @type ARCProject */ (generator.createProjectObject());
      const result1 = await element.post(project);
      const { item: updated } = result1;
      updated.name = 'test';
      const result2 = await element.post(updated);
      assert.equal(result2.item.name, 'test', 'has updated name');
    });

    it('updates revision', async () => {
      const project = /** @type ARCProject */ (generator.createProjectObject());
      const result1 = await element.post(project);
      const { item: updated } = result1;
      updated.name = 'test';
      const result2 = await element.post(updated);
      assert.notEqual(result2.rev, result1.rev);
    });

    it('sets old revision when updating an entity', async () => {
      const project = /** @type ARCProject */ (generator.createProjectObject());
      const result1 = await element.post(project);
      const { item: updated, rev } = result1;
      updated.name = 'test';
      const result2 = await element.post(updated);
      assert.equal(result2.oldRev, rev);
    });

    it('dispatches project update event', async () => {
      const project = /** @type ARCProject */ (generator.createProjectObject());
      element.post(project);
      const { changeRecord } = /** @type ARCProjectUpdatedEvent */ (await oneEvent(element, ArcModelEventTypes.Project.State.update));
      assert.typeOf(changeRecord, 'object');
    });

    it('has change record values on the event', async () => {
      const project = /** @type ARCProject */ (generator.createProjectObject());
      element.post(project);
      const { changeRecord } = /** @type ARCProjectUpdatedEvent */ (await oneEvent(element, ArcModelEventTypes.Project.State.update));
      assert.typeOf(changeRecord.id, 'string', 'has an id');
      assert.typeOf(changeRecord.rev, 'string', 'has a rev');
      assert.typeOf(changeRecord.item, 'object', 'has created object');
      assert.isUndefined(changeRecord.oldRev, 'has no oldRev');
    });

    it('throws when no project', async () => {
      let thrown = false;
      try {
        await element.post(undefined);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when no project id', async () => {
      const project = /** @type ARCProject */ (generator.createProjectObject());
      delete project._id;
      let thrown = false;
      try {
        await element.post(project);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('updates already existing item with the rev value', async () => {
      const project = /** @type ARCProject */ (generator.createProjectObject());
      await element.post(project);
      project.name = 'test';
      delete project._rev;
      const result = await element.post(project);
      assert.equal(result.item.name, 'test');
    });
  });

  describe('postBulk()', () => {
    let element = /** @type ProjectModel */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    after(async () => {
      await generator.destroySavedRequestData();
    });

    it('returns a list of insert result', async () => {
      const projects = /** @type ARCProject[] */ (generator.generateProjects({ projectsSize: 2 }));
      const results = await element.postBulk(projects);
      assert.typeOf(results, 'array', 'returns an array');
      assert.lengthOf(results, 2, 'returns an array');
      const [result] = results;
      assert.typeOf(result.id, 'string', 'has an id');
      assert.typeOf(result.rev, 'string', 'has a rev');
      assert.typeOf(result.item, 'object', 'has created object');
      assert.isUndefined(result.oldRev, 'has no oldRev');
    });

    it('updates entities in bulk', async () => {
      const projects = /** @type ARCProject[] */ (generator.generateProjects({ projectsSize: 2 }));
      const results1 = await element.postBulk(projects);
      const updated = [ results1[0].item, results1[1].item ];
      const results2 = await element.postBulk(updated);
      assert.typeOf(results2, 'array', 'returns an array');
      assert.lengthOf(results2, 2, 'returns an array');
      assert.notEqual(results2[0].rev, results1[0].rev, 'revision #1 is different');
      assert.notEqual(results2[1].rev, results1[1].rev, 'revision #2 is different');
    });

    it('dispatches change event for each updated object', async () => {
      const projects = /** @type ARCProject[] */ (generator.generateProjects({ projectsSize: 2 }));
      const spy = sinon.spy();
      element.addEventListener(ArcModelEventTypes.Project.State.update, spy);
      await element.postBulk(projects);
      assert.equal(spy.callCount, 2);
    });

    it('throws when no projects', async () => {
      let thrown = false;
      try {
        await element.postBulk(undefined);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when empty projects', async () => {
      let thrown = false;
      try {
        await element.postBulk([]);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });
  });

  describe('get()', () => {
    let created = /** @type ARCProject[] */ (null);
    before(async () => {
      const model = await basicFixture();
      const projects = /** @type ARCProject[] */ (generator.generateProjects({ projectsSize: 2 }));
      const results = await model.postBulk(projects);
      created = results.map((item) => item.item);
    });

    let element = /** @type ProjectModel */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    after(async () => {
      await generator.destroySavedRequestData();
    });

    it('returns an item with the latest revision', async () => {
      const result = await element.get(created[0]._id);
      assert.deepEqual(result, created[0]);
    });

    it('returns an item with specified revision', async () => {
      const result = await element.get(created[0]._id, created[0]._rev);
      assert.deepEqual(result, created[0]);
    });

    it('returns an item with old revision', async () => {
      const { _rev, _id } = created[0];
      const update = await element.post(created[0]);
      created[0] = update.item;
      const result = await element.get(_id, _rev);
      assert.equal(result._rev, _rev);
    });
  });

  describe('list()', () => {
    before(async () => {
      const model = await basicFixture();
      const projects = /** @type ARCProject[] */ (generator.generateProjects({ projectsSize: 30 }));
      await model.postBulk(projects);
    });

    let element = /** @type ProjectModel */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    after(async () => {
      await generator.destroySavedRequestData();
    });

    it('returns a list result for default parameters', async () => {
      const result = await element.list();
      assert.typeOf(result, 'object', 'result is an object');
      assert.typeOf(result.nextPageToken, 'string', 'has page token');
      assert.typeOf(result.items, 'array', 'has response items');
      assert.lengthOf(result.items, element.defaultQueryOptions.limit, 'has default limit of items');
    });

    it('respects "limit" parameter', async () => {
      const result = await element.list({
        limit: 5,
      });
      assert.lengthOf(result.items, 5);
    });

    it('respects "nextPageToken" parameter', async () => {
      const result1 = await element.list({
        limit: 10,
      });
      const result2 = await element.list({
        nextPageToken: result1.nextPageToken,
      });
      assert.lengthOf(result2.items, 20);
    });

    it('does not set "nextPageToken" when no more results', async () => {
      const result1 = await element.list({
        limit: 40,
      });
      const result2 = await element.list({
        nextPageToken: result1.nextPageToken,
      });
      assert.isUndefined(result2.nextPageToken);
    });
  });

  describe('delete()', () => {
    let created = /** @type ARCEntityChangeRecord[] */ (null);
    before(async () => {
      const model = await basicFixture();
      const projects = /** @type ARCProject[] */ (generator.generateProjects({ projectsSize: 30 }));
      created = await model.postBulk(projects);
    });

    let model = /** @type ProjectModel */ (null);
    beforeEach(async () => {
      model = await basicFixture();
    });

    after(async () => {
      await generator.destroySavedRequestData();
    });

    it('deletes an entity', async () => {
      const [info] = created;
      const { id } = info;
      await model.delete(id);
      let thrown = false;
      try {
        await model.get(id);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown, 'Has no entity');
    });

    it('dispatches deleted events', async () => {
      const info = created[1];
      const { id } = info;
      model.delete(id);
      const { id: deleteId, rev } = /** @type ARCProjectDeleteEvent */ (await oneEvent(model, ArcModelEventTypes.Project.State.delete));
      assert.equal(deleteId, id);
      assert.typeOf(rev, 'string');
    });

    it('deletes an entity with revision', async () => {
      const info = created[2];
      const { id, rev } = info;
      await model.delete(id, rev);
      let thrown = false;
      try {
        await model.get(id);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown, 'Has no entity');
    });
  });

  describe('[normalizeProjects]()', () => {
    let model = /** @type ProjectModel */ (null);
    beforeEach(async () => {
      model = await basicFixture();
    });

    it('filters out invalid items', () => {
      const result = model[normalizeProjects](['test']);
      assert.deepEqual(result, []);
    });

    it('adds order property', () => {
      const project = /** @type ARCProject */ (generator.createProjectObject());
      delete project.order;
      const result = model[normalizeProjects]([project]);
      assert.equal(result[0].order, 0);
    });

    it('respects existing order property', () => {
      const project = /** @type ARCProject */ (generator.createProjectObject());
      project.order = 1;
      const result = model[normalizeProjects]([project]);
      assert.equal(result[0].order, 1);
    });

    it('adds requests property', () => {
      const project = /** @type ARCProject */ (generator.createProjectObject());
      delete project.requests;
      const result = model[normalizeProjects]([project]);
      assert.deepEqual(result[0].requests, []);
    });

    it('respects existing order property', () => {
      const project = /** @type ARCProject */ (generator.createProjectObject());
      project.requests = ['test'];
      const result = model[normalizeProjects]([project]);
      assert.deepEqual(result[0].requests, ['test']);
    });

    it('adds updated property', () => {
      const project = /** @type ARCProject */ (generator.createProjectObject());
      delete project.updated;
      const result = model[normalizeProjects]([project]);
      assert.typeOf(result[0].updated, 'number');
    });

    it('adds created property', () => {
      const project = /** @type ARCProject */ (generator.createProjectObject());
      delete project.created;
      const result = model[normalizeProjects]([project]);
      assert.typeOf(result[0].created, 'number');
      assert.equal(result[0].created, result[0].updated);
    });

    it('respects existing created property', () => {
      const project = /** @type ARCProject */ (generator.createProjectObject());
      project.created = 10;
      const result = model[normalizeProjects]([project]);
      assert.equal(result[0].created, 10);
    });
  });
});
