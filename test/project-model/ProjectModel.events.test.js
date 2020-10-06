import { fixture, assert } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import * as sinon from 'sinon';
import { v4 } from '@advanced-rest-client/uuid-generator';
import '../../project-model.js';
import '../../request-model.js';
import { ArcModelEventTypes } from '../../src/events/ArcModelEventTypes.js';
import { ArcModelEvents } from '../../src/events/ArcModelEvents.js';

/** @typedef {import('../../index').ProjectModel} ProjectModel */
/** @typedef {import('../../index').RequestModel} RequestModel */
/** @typedef {import('@advanced-rest-client/arc-types').Project.ARCProject} ARCProject */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ARCSavedRequest} ARCSavedRequest */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ARCHistoryRequest} ARCHistoryRequest */
/** @typedef {import('../../src/types').ARCEntityChangeRecord} ARCEntityChangeRecord */

describe('ProjectModel', () => {
  /**
   * @return {Promise<ProjectModel>}
   */
  async function basicFixture() {
    return fixture('<project-model></project-model>');
  }

  /**
   * @return {Promise<RequestModel>}
   */
  async function requestFixture() {
    return fixture('<request-model></request-model>');
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

    describe(ArcModelEventTypes.Project.list, () => {
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
        const result = await ArcModelEvents.Project.list(document.body);
        assert.typeOf(result, 'object', 'result is an object');
        assert.typeOf(result.nextPageToken, 'string', 'has page token');
        assert.typeOf(result.items, 'array', 'has response items');
        assert.lengthOf(result.items, element.defaultQueryOptions.limit, 'has default limit of items');
      });

      it('calls list() function', async () => {
        const spy = sinon.spy(element, 'list');
        await ArcModelEvents.Project.list(document.body);
        assert.isTrue(spy.called);
      });

      it('ignores the event when cancelled', async () => {
        document.body.addEventListener(ArcModelEventTypes.Project.list, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.Project.list, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.Project.list, {
          bubbles: true,
          cancelable: true,
          detail: { result: undefined },
        });
        document.body.dispatchEvent(e);
        assert.isUndefined(e.detail.result);
      });
    });

    describe(`${ArcModelEventTypes.Project.listAll} event`, () => {
      let created;
      before(async () => {
        const model = await basicFixture();
        const projects = /** @type ARCProject[] */ (generator.generateProjects({ projectsSize: 30 }));
        created = await model.postBulk(projects);
      });

      beforeEach(async () => {
        await basicFixture();
      });

      after(async () => {
        await generator.destroySavedRequestData();
      });

      it('returns all projects', async () => {
        const result = await ArcModelEvents.Project.listAll(document.body);
        assert.typeOf(result, 'array', 'result is an array');
        assert.lengthOf(result, 30, 'has all results');
      });

      it('returns only projects defined in keys', async () => {
        const result = await ArcModelEvents.Project.listAll(document.body, [created[0].id, created[1].id]);
        assert.typeOf(result, 'array', 'result is an array');
        assert.lengthOf(result, 2, 'has all results');
      });

      it('returns all when keys is empty', async () => {
        const result = await ArcModelEvents.Project.listAll(document.body, []);
        assert.typeOf(result, 'array', 'result is an array');
        assert.lengthOf(result, 30, 'has all results');
      });

      it('returns empty array when empty', async () => {
        await generator.destroySavedRequestData();
        const result = await ArcModelEvents.Project.listAll(document.body);
        assert.typeOf(result, 'array', 'result is an array');
        assert.lengthOf(result, 0, 'has no results');
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
  
    describe(`${ArcModelEventTypes.Project.addTo} event`, () => {
      let projectModel = /** @type ProjectModel */ (null);
      let requestModel = /** @type RequestModel */ (null);
      beforeEach(async () => {
        projectModel = await basicFixture();
        requestModel = await requestFixture();
      });

      after(async () => {
        await generator.destroySavedRequestData();
      });

      it('adds request to a project', async () => {
        const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
        const project = /** @type ARCProject */ (generator.createProjectObject());
        const pRecord = await projectModel.updateProject(project);
        const rRecord = await requestModel.post('saved', request);

        await ArcModelEvents.Project.addTo(document.body, pRecord.id, rRecord.id, 'saved');

        const dbRequest = /** @type ARCSavedRequest */ (await requestModel.get('saved', rRecord.id));
        const { projects } = dbRequest;
        assert.deepEqual(projects, [pRecord.id]);
      });
  
      it('adds project to the request', async () => {
        const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
        const project = /** @type ARCProject */ (generator.createProjectObject());
        const pRecord = await projectModel.updateProject(project);
        const rRecord = await requestModel.post('saved', request);
        
        await ArcModelEvents.Project.addTo(document.body, pRecord.id, rRecord.id, 'saved');

        const dbProject = await projectModel.get(pRecord.id);
        const { requests } = dbProject;
        assert.deepEqual(requests, [rRecord.id]);
      });

      it('adds request to a project at specified position', async () => {
        const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
        request._id = v4();
        const project = /** @type ARCProject */ (generator.createProjectObject());
        project._id = v4();
        project.requests = ['a', 'b', 'c', 'd', 'e'];
        await projectModel.updateProject(project);
        await requestModel.post('saved', request);
        
        await ArcModelEvents.Project.addTo(document.body, project._id, request._id, 'saved', 2);

        const dbProject = await projectModel.get(project._id);
        const { requests } = dbProject;
        assert.deepEqual(requests, ['a', 'b', request._id, 'c', 'd', 'e']);
      });
    });

    describe(`${ArcModelEventTypes.Project.moveTo} event`, () => {
      let projectModel = /** @type ProjectModel */ (null);
      let requestModel = /** @type RequestModel */ (null);
      beforeEach(async () => {
        projectModel = await basicFixture();
        requestModel = await requestFixture();
      });

      after(async () => {
        await generator.destroySavedRequestData();
      });

      it('removes the request from an existing projects', async () => {
        const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
        request._id = v4();
        const sourceProject = /** @type ARCProject */ (generator.createProjectObject());
        sourceProject._id = v4();
        const targetProject = /** @type ARCProject */ (generator.createProjectObject());
        targetProject._id = v4();
        sourceProject.requests = [request._id];
        request.projects = [sourceProject._id];
        await projectModel.updateProject(sourceProject);
        await projectModel.updateProject(targetProject);
        await requestModel.post('saved', request);

        await ArcModelEvents.Project.moveTo(document.body, targetProject._id, request._id, 'saved');

        const project = await projectModel.get(sourceProject._id);
        assert.deepEqual(project.requests, []);
      });
  
      it('adds the request to another project', async () => {
        const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
        request._id = v4();
        const sourceProject = /** @type ARCProject */ (generator.createProjectObject());
        sourceProject._id = v4();
        const targetProject = /** @type ARCProject */ (generator.createProjectObject());
        targetProject._id = v4();
        sourceProject.requests = [request._id];
        request.projects = [sourceProject._id];
        await projectModel.updateProject(sourceProject);
        await projectModel.updateProject(targetProject);
        await requestModel.post('saved', request);
        
        await ArcModelEvents.Project.moveTo(document.body, targetProject._id, request._id, 'saved');

        const project = await projectModel.get(targetProject._id);
        assert.deepEqual(project.requests, [request._id]);
      });
  
      it('replaces projects in the request', async () => {
        const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
        request._id = v4();
        const sourceProject = /** @type ARCProject */ (generator.createProjectObject());
        sourceProject._id = v4();
        const targetProject = /** @type ARCProject */ (generator.createProjectObject());
        targetProject._id = v4();
        sourceProject.requests = [request._id];
        request.projects = [sourceProject._id];
        await projectModel.updateProject(sourceProject);
        await projectModel.updateProject(targetProject);
        await requestModel.post('saved', request);
        
        await ArcModelEvents.Project.moveTo(document.body, targetProject._id, request._id, 'saved');

        const dbRequest = /** @type ARCSavedRequest */ (await requestModel.get('saved', request._id));
        assert.deepEqual(dbRequest.projects, [targetProject._id]);
      });

      it('adds the request at specific position', async () => {
        const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
        request._id = v4();
        const sourceProject = /** @type ARCProject */ (generator.createProjectObject());
        sourceProject._id = v4();
        const targetProject = /** @type ARCProject */ (generator.createProjectObject());
        targetProject._id = v4();
        sourceProject.requests = [request._id];
        targetProject.requests = ['a', 'b', 'c', 'd', 'e'];
        request.projects = [sourceProject._id];
        await projectModel.updateProject(sourceProject);
        await projectModel.updateProject(targetProject);
        await requestModel.post('saved', request);
  
        await ArcModelEvents.Project.moveTo(document.body, targetProject._id, request._id, 'saved', 3);
        
        const project = await projectModel.get(targetProject._id);
        assert.deepEqual(project.requests, ['a', 'b', 'c', request._id, 'd', 'e']);
      });
    });
  
    describe(`${ArcModelEventTypes.Project.removeFrom} event`, () => {
      let projectModel = /** @type ProjectModel */ (null);
      let requestModel = /** @type RequestModel */ (null);
      beforeEach(async () => {
        projectModel = await basicFixture();
        requestModel = await requestFixture();
      });

      after(async () => {
        await generator.destroySavedRequestData();
      });

      it('removes the request from a projects', async () => {
        const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
        request._id = v4();
        const sourceProject = /** @type ARCProject */ (generator.createProjectObject());
        sourceProject._id = v4();
        sourceProject.requests = [request._id];
        request.projects = [sourceProject._id];
        await projectModel.updateProject(sourceProject);
        await requestModel.post('saved', request);

        await ArcModelEvents.Project.removeFrom(document.body, sourceProject._id, request._id);

        const project = await projectModel.get(sourceProject._id);
        assert.deepEqual(project.requests, []);
      });
  
      it('removes the project from the request', async () => {
        const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
        request._id = v4();
        const sourceProject = /** @type ARCProject */ (generator.createProjectObject());
        sourceProject._id = v4();
        sourceProject.requests = [request._id];
        request.projects = [sourceProject._id];
        await projectModel.updateProject(sourceProject);
        await requestModel.post('saved', request);
        
        await ArcModelEvents.Project.removeFrom(document.body, sourceProject._id, request._id);

        const dbRequest = /** @type ARCSavedRequest */ (await requestModel.get('saved', request._id));
        assert.deepEqual(dbRequest.projects, []);
      });
    });
  });
});
