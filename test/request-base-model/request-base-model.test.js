import { fixture, assert } from '@open-wc/testing';
import sinon from 'sinon/pkg/sinon-esm.js';
import {DataGenerator} from '@advanced-rest-client/arc-data-generator/arc-data-generator.js';
import {RequestBaseModel} from '../../request-base-model.js';

/**
 * @polymer
 * @customElement
 * @memberof LogicElements
 */
class RequestTestModel extends RequestBaseModel {
  static get is() {
    return 'request-test-model';
  }

  constructor() {
    super('legacy-projects');
  }
}
window.customElements.define(RequestTestModel.is, RequestTestModel);

describe('RequestBaseModel', function() {
  describe('get savedDb()', function() {
    let element;
    beforeEach(async () => {
      element = /** @type {TestModel} */ (await fixture('<request-test-model></request-test-model>'));
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

  describe('get historyDb()', function() {
    let element;
    beforeEach(async () => {
      element = /** @type {TestModel} */ (await fixture('<request-test-model></request-test-model>'));
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

  describe('get projectDb()', function() {
    let element;
    beforeEach(async () => {
      element = /** @type {TestModel} */ (await fixture('<request-test-model></request-test-model>'));
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
    let element;
    beforeEach(async () => {
      element = /** @type {TestModel} */ (await fixture('<request-test-model></request-test-model>'));
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
    let element;
    beforeEach(async () => {
      element = /** @type {TestModel} */ (await fixture('<request-test-model></request-test-model>'));
    });

    it('Deletes model', () => {
      return element.deleteModel('saved')
      .then(() => {});
    });

    it('Rejects when error', (done) => {
      element.deleteModel('unknown')
      .catch(() => done());
    });

    it('Dispatches datastore-destroyed event', () => {
      let detail;
      element.addEventListener('datastore-destroyed', function f(e) {
        element.removeEventListener('datastore-destroyed', f);
        detail = e.detail;
      });
      return element.deleteModel('saved')
      .then(() => {
        assert.equal(detail.datastore, 'saved');
      });
    });
  });

  describe('updateProject()', function() {
    afterEach(function() {
      return DataGenerator.clearLegacyProjects();
    });

    let element;
    let dataObj;
    beforeEach(async () => {
      element = /** @type {TestModel} */ (await fixture('<request-test-model></request-test-model>'));
      dataObj = {
        _id: 'test-id-1',
        name: 'test-1',
        order: 1
      };
    });

    it('Creates a new object in the datastore', function() {
      return element.updateProject(dataObj)
      .then((result) => {
        assert.typeOf(result._rev, 'string', '_rev is set');
        assert.equal(result._id, 'test-id-1', '_id is set');
        assert.equal(result.name, 'test-1', 'Name is set');
        assert.equal(result.order, 1, 'order is set');
      });
    });

    it('Updates created object', function() {
      let originalRev;
      return element.updateProject(dataObj)
      .then((result) => {
        originalRev = result._rev;
        result.name = 'test-2';
        return element.updateProject(result);
      })
      .then((result) => {
        assert.notEqual(result._rev, originalRev, '_rev is regenerated');
        assert.equal(result._id, 'test-id-1', '_id is the same');
        assert.equal(result.name, 'test-2', 'Name is set');
        assert.equal(result.order, 1, 'order is set');
      });
    });

    it('Fires project-object-changed custom event', function() {
      const spy = sinon.spy();
      element.addEventListener('project-object-changed', spy);
      return element.updateProject(dataObj)
      .then(() => {
        assert.isTrue(spy.calledOnce);
      });
    });

    it('The project-object-changed event has new properties ', function() {
      let eventData;
      element.addEventListener('project-object-changed', function(e) {
        eventData = e.detail;
      });
      return element.updateProject(dataObj)
      .then((result) => {
        assert.isUndefined(eventData.oldRev);
        assert.isUndefined(result.oldRev);
        assert.typeOf(eventData.project, 'object');
      });
    });

    it('The project-object-changed event has properties of updated object',
    function() {
      let eventData;
      let originalRev;
      return element.updateProject(dataObj)
      .then((result) => {
        element.addEventListener('project-object-changed', function(e) {
          eventData = e.detail;
        });
        originalRev = result._rev;
        result.name = 'test-2';
        return element.updateProject(result);
      })
      .then(() => {
        assert.equal(eventData.oldRev, originalRev);
        assert.typeOf(eventData.project, 'object');
        assert.notEqual(eventData.project._rev, originalRev);
      });
    });
  });

  describe('readProject()', function() {
    afterEach(function() {
      return DataGenerator.clearLegacyProjects();
    });

    let element;
    let dataObj;
    beforeEach(async () => {
      element = /** @type {TestModel} */ (await fixture('<request-test-model></request-test-model>'));
      dataObj = {
        _id: 'test-id-1',
        name: 'test-1',
        order: 1
      };
      await element.updateProject(dataObj);
    });

    it('Reads project object by id only', function() {
      return element.readProject(dataObj._id)
      .then((result) => {
        assert.equal(result._id, dataObj._id);
      });
    });

    it('Reads a revision', function() {
      let originalRev;
      let updatedRev;
      return element.readProject(dataObj._id)
      .then((result) => {
        originalRev = result._rev;
        result.name = 'test-2';
        return element.updateProject(result);
      })
      .then((result) => {
        updatedRev = result._rev;
        return element.readProject(dataObj._id, originalRev);
      })
      .then((result) => {
        assert.equal(result.name, dataObj.name);
        assert.notEqual(originalRev, updatedRev);
      });
    });
  });

  describe('remove()', function() {
    afterEach(function() {
      return DataGenerator.clearLegacyProjects();
    });

    let element;
    let dataObj;
    beforeEach(async () => {
      element = /** @type {TestModel} */ (await fixture('<request-test-model></request-test-model>'));
      dataObj = {
        _id: 'test-id-1',
        name: 'test-1',
        order: 1
      };
      dataObj = await element.updateProject(dataObj);
    });

    it('Removes object from the datastore', function() {
      return element.removeProject(dataObj._id, dataObj._rev)
      .then(() => {
        return element.readProject(dataObj._id);
      })
      .then(() => {
        throw new Error('TEST');
      })
      .catch((cause) => {
        assert.equal(cause.status, 404);
      });
    });

    it('Removes object WITHOUT "REV"', function() {
      return element.removeProject(dataObj._id)
      .then(() => {
        return element.readProject(dataObj._id);
      })
      .then(() => {
        throw new Error('TEST');
      })
      .catch((cause) => {
        assert.equal(cause.status, 404);
      });
    });

    it('Fires project-object-deleted custom event', async () => {
      const spy = sinon.spy();
      element.addEventListener('project-object-deleted', spy);
      await element.removeProject(dataObj._id, dataObj._rev);
      assert.isTrue(spy.calledOnce);
    });

    it('project-object-deleted event contains project data', async () => {
      let eventData;
      element.addEventListener('project-object-deleted', function(e) {
        eventData = e.detail;
      });
      await element.removeProject(dataObj._id, dataObj._rev);
      assert.equal(eventData.id, dataObj._id);
      assert.equal(eventData.oldRev, dataObj._rev);
      assert.typeOf(eventData.rev, 'string');
      assert.notEqual(eventData.rev, dataObj._rev);
    });
  });
});
