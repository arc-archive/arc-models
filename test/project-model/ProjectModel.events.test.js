import { fixture, assert } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import * as sinon from 'sinon';
import '../../project-model.js';
import { ArcModelEventTypes } from '../../src/events/ArcModelEventTypes.js';
import { ArcModelEvents } from '../../src/events/ArcModelEvents.js';

/** @typedef {import('../../src/ProjectModel').ProjectModel} ProjectModel */
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

  describe('Events API', () => {
    describe(ArcModelEventTypes.Project.update, () => {
      let element = /** @type ProjectModel */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      after(async () => {
        await generator.destroySavedRequestData();
      });

      it('returns an insert result', async () => {
        const project = /** @type ARCProject */ (generator.createProjectObject());
        const result = await ArcModelEvents.Project.update(document.body, project);
        assert.typeOf(result, 'object', 'returns an object');
        assert.typeOf(result.id, 'string', 'has an id');
        assert.typeOf(result.rev, 'string', 'has a rev');
        assert.typeOf(result.item, 'object', 'has created object');
        assert.isUndefined(result.oldRev, 'has no oldRev');
      });

      it('calls post() function', async () => {
        const spy = sinon.spy(element, 'post');
        const project = /** @type ARCProject */ (generator.createProjectObject());
        await ArcModelEvents.Project.update(document.body, project);
        assert.isTrue(spy.called);
      });

      it('ignores the event when cancelled', async () => {
        document.body.addEventListener(ArcModelEventTypes.Project.update, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.Project.update, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.Project.update, {
          bubbles: true,
          cancelable: true,
          detail: { result: undefined },
        });
        document.body.dispatchEvent(e);
        assert.isUndefined(e.detail.result);
      });
    });

    describe(ArcModelEventTypes.Project.updateBulk, () => {
      let element = /** @type ProjectModel */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      after(async () => {
        await generator.destroySavedRequestData();
      });

      it('returns a list of insert result', async () => {
        const projects = /** @type ARCProject[] */ (generator.generateProjects({ projectsSize: 2 }));
        const results = await ArcModelEvents.Project.updateBulk(document.body, projects);
        assert.typeOf(results, 'array', 'returns an array');
        assert.lengthOf(results, 2, 'returns an array');
        const [result] = results;
        assert.typeOf(result.id, 'string', 'has an id');
        assert.typeOf(result.rev, 'string', 'has a rev');
        assert.typeOf(result.item, 'object', 'has created object');
        assert.isUndefined(result.oldRev, 'has no oldRev');
      });

      it('calls postBulk() function', async () => {
        const spy = sinon.spy(element, 'postBulk');
        const projects = /** @type ARCProject[] */ (generator.generateProjects({ projectsSize: 2 }));
        await ArcModelEvents.Project.updateBulk(document.body, projects);
        assert.isTrue(spy.called);
      });

      it('ignores the event when cancelled', async () => {
        document.body.addEventListener(ArcModelEventTypes.Project.updateBulk, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.Project.updateBulk, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.Project.updateBulk, {
          bubbles: true,
          cancelable: true,
          detail: { result: undefined },
        });
        document.body.dispatchEvent(e);
        assert.isUndefined(e.detail.result);
      });
    });

    describe(ArcModelEventTypes.Project.read, () => {
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
        const result = await ArcModelEvents.Project.read(document.body, created[0]._id);
        assert.deepEqual(result, created[0]);
      });

      it('calls readProject() function', async () => {
        const spy = sinon.spy(element, 'readProject');
        await ArcModelEvents.Project.read(document.body, created[0]._id);
        assert.isTrue(spy.called);
      });

      it('ignores the event when cancelled', async () => {
        document.body.addEventListener(ArcModelEventTypes.Project.read, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.Project.read, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.Project.read, {
          bubbles: true,
          cancelable: true,
          detail: { result: undefined },
        });
        document.body.dispatchEvent(e);
        assert.isUndefined(e.detail.result);
      });
    });

    describe(ArcModelEventTypes.Project.query, () => {
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

      it('returns a query result for default parameters', async () => {
        const result = await ArcModelEvents.Project.query(document.body);
        assert.typeOf(result, 'object', 'result is an object');
        assert.typeOf(result.nextPageToken, 'string', 'has page token');
        assert.typeOf(result.items, 'array', 'has response items');
        assert.lengthOf(result.items, element.defaultQueryOptions.limit, 'has default limit of items');
      });

      it('calls list() function', async () => {
        const spy = sinon.spy(element, 'list');
        await ArcModelEvents.Project.query(document.body);
        assert.isTrue(spy.called);
      });

      it('ignores the event when cancelled', async () => {
        document.body.addEventListener(ArcModelEventTypes.Project.query, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.Project.query, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.Project.query, {
          bubbles: true,
          cancelable: true,
          detail: { result: undefined },
        });
        document.body.dispatchEvent(e);
        assert.isUndefined(e.detail.result);
      });
    });

    describe(ArcModelEventTypes.Project.delete, () => {
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
        const info = created[0];
        const { id } = info;
        await ArcModelEvents.Project.delete(document.body, id);
        let thrown = false;
        try {
          await model.get(id);
        } catch (e) {
          thrown = true;
        }
        assert.isTrue(thrown, 'Has no entity');
      });

      it('calls removeProject() function', async () => {
        const info = created[1];
        const { id } = info;
        const spy = sinon.spy(model, 'removeProject');
        await ArcModelEvents.Project.delete(document.body, id);
        assert.isTrue(spy.called);
      });

      it('ignores the event when cancelled', async () => {
        document.body.addEventListener(ArcModelEventTypes.Project.delete, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.Project.delete, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.Project.delete, {
          bubbles: true,
          cancelable: true,
          detail: { result: undefined },
        });
        document.body.dispatchEvent(e);
        assert.isUndefined(e.detail.result);
      });
    });
  });
});
