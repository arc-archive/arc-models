import { fixture, assert } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator/arc-data-generator.js';
import '../../project-model.js';

describe('<project-model>', () => {
  describe('Public methods', function() {
    describe('list()', function() {
      afterEach(function() {
        return DataGenerator.clearLegacyProjects();
      });

      let element;
      let created;
      beforeEach(async () => {
        element = /** @type {ProjectModel} */ (await fixture('<project-model></project-model>'));
        return DataGenerator.insertProjectsData()
        .then((result) => created = result);
      });

      it('Lists saved projects', function() {
        return element.listProjects()
        .then((result) => {
          assert.typeOf(result, 'array');
          assert.lengthOf(result, 5);
        });
      });

      it('Lists projects by ID', () => {
        const ids = [created[0]._id, created[4]._id];
        return element.listProjects(ids)
        .then((result) => {
          assert.typeOf(result, 'array');
          assert.lengthOf(result, 2);
          assert.deepEqual(result[0], created[0]);
          assert.deepEqual(result[1], created[4]);
        });
      });
    });

    describe('_normalizeProjects()', () => {
      let element;
      beforeEach(async () => {
        element = /** @type {ProjectModel} */ (await fixture('<project-model></project-model>'));
      });

      it('Returns an array', () => {
        const result = element._normalizeProjects([]);
        assert.typeOf(result, 'array');
      });

      it('Removes empty items', () => {
        const result = element._normalizeProjects([undefined, {
          name: 'test'
        }]);
        assert.lengthOf(result, 1);
      });

      it('Adds missing "order" property', () => {
        const result = element._normalizeProjects([{
          name: 'test'
        }]);
        assert.equal(result[0].order, 0);
      });

      it('Adds missing "requests" property', () => {
        const result = element._normalizeProjects([{
          name: 'test'
        }]);
        assert.deepEqual(result[0].requests, []);
      });

      it('Adds missing "created" property', () => {
        const result = element._normalizeProjects([{
          name: 'test'
        }]);
        assert.typeOf(result[0].created, 'number');
      });

      it('Adds "updated" property', () => {
        const result = element._normalizeProjects([{
          name: 'test'
        }]);
        assert.typeOf(result[0].updated, 'number');
      });

      it('Respects existing "requests" property', () => {
        const result = element._normalizeProjects([{
          name: 'test',
          requests: ['test']
        }]);
        assert.deepEqual(result[0].requests, ['test']);
      });

      it('Respects existing "order" property', () => {
        const result = element._normalizeProjects([{
          name: 'test',
          order: 10
        }]);
        assert.equal(result[0].order, 10);
      });

      it('Respects existing "name" property', () => {
        const result = element._normalizeProjects([{
          name: 'test-name'
        }]);
        assert.equal(result[0].name, 'test-name');
      });
    });

    describe('updateBulk()', () => {
      let element;
      beforeEach(async () => {
        element = /** @type {ProjectModel} */ (await fixture('<project-model></project-model>'));
      });

      afterEach(function() {
        return DataGenerator.clearLegacyProjects();
      });

      it('Returns a promise', () => {
        const projects = [DataGenerator.createProjectObject()];
        const result = element.updateBulk(projects);
        assert.typeOf(result.then, 'function');
        return result;
      });

      it('Resolved promise contains created object', () => {
        const projects = [DataGenerator.createProjectObject()];
        return element.updateBulk(projects)
        .then((result) => {
          assert.typeOf(result, 'array');
          assert.lengthOf(result, 1);
        });
      });

      it('Created object contains _id and _review', () => {
        const projects = [DataGenerator.createProjectObject()];
        return element.updateBulk(projects)
        .then((result) => {
          const item = result[0];
          assert.typeOf(item._id, 'string');
          assert.typeOf(item._rev, 'string');
        });
      });

      it('Created object contains default (and missing) properties', () => {
        const r = DataGenerator.createProjectObject();
        delete r.created;
        delete r.updated;
        delete r.requests;
        return element.updateBulk([r])
        .then((result) => {
          const item = result[0];
          assert.typeOf(item.created, 'number');
          assert.typeOf(item.updated, 'number');
          assert.typeOf(item.requests, 'array');
        });
      });
    });

    describe('_processUpdateBulkResponse()', () => {
      let element;
      beforeEach(async () => {
        element = /** @type {ProjectModel} */ (await fixture('<project-model></project-model>'));
      });

      it('Dispatches "project-object-changed" custom event', () => {
        let eventData;
        element.addEventListener('project-object-changed', function f(e) {
          element.removeEventListener('project-object-changed', f);
          eventData = e.detail;
        });
        const project = DataGenerator.createProjectObject();
        project._rev = 'old-rev';
        element._processUpdateBulkResponse([project], [{
          rev: 'new-rev'
        }]);
        assert.typeOf(eventData, 'object', 'Event was fired');
        assert.typeOf(eventData.project, 'object', 'Detail has "project"');
        assert.equal(eventData.oldRev, 'old-rev', 'Detail has "oldRev"');
        assert.equal(eventData.project._rev, 'new-rev', '_rev is updated');
      });

      it('Returns array of projects', () => {
        const projects = [DataGenerator.createProjectObject()];
        const result = element._processUpdateBulkResponse(projects, [{
          rev: 'new-rev'
        }]);
        assert.typeOf(result, 'array');
        assert.lengthOf(result, 1);
      });

      it('Sets "error" on errored project', () => {
        const projects = [DataGenerator.createProjectObject()];
        const result = element._processUpdateBulkResponse(projects, [{
          error: true
        }]);
        const item = result[0];
        assert.isTrue(item.error);
      });

      it('Sets project ID on nevely created project', () => {
        const projects = [DataGenerator.createProjectObject()];
        delete projects[0]._id;
        const result = element._processUpdateBulkResponse(projects, [{
          rev: 'new-rev',
          id: 'new-id'
        }]);
        const item = result[0];
        assert.equal(item._id, 'new-id');
      });
    });
  });
});
