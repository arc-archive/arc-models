import { fixture, assert } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator/arc-data-generator.js';
import '../../project-model.js';

describe('<project-model> - Events based', () => {
  describe('Events API for projects', function() {
    /**
     * See https://gist.github.com/haroldtreen/5f1055eee5fcf01da3e0e15b8ec86bf6
     * @param {any} e
     * @return {Promise}
     */
    function isError(e) {
      if (typeof e === 'string') {
        return Promise.reject(new Error(e));
      }
      return Promise.resolve(e);
    }

    describe('project-object-changed', function() {
      afterEach(function() {
        return DataGenerator.clearLegacyProjects();
      });
      let dataObj;
      let element;
      beforeEach(async () => {
        element = /** @type {ProjectModel} */ (await fixture('<project-model></project-model>'));
        dataObj = {
          _id: 'test-id-1',
          name: 'test-1',
          order: 1
        };
      });
      /**
       * Dispatches `project-object-changed` event
       * @param {Object} project
       * @return {CustomEvent}
       */
      function fire(project) {
        const e = new CustomEvent('project-object-changed', {
          detail: {
            project: project
          },
          bubbles: true,
          composed: true,
          cancelable: true
        });
        document.body.dispatchEvent(e);
        return e;
      }

      it('Event is canceled', function() {
        const e = fire(dataObj);
        assert.isTrue(e.defaultPrevented);
        return e.detail.result;
      });

      it('Event detail contains "result" as promise', function() {
        const e = fire(dataObj);
        assert.typeOf(e.detail.result, 'promise');
        return e.detail.result;
      });

      it('Creates a new object in the datastore', function() {
        const e = fire(dataObj);
        return e.detail.result
        .then((result) => {
          assert.typeOf(result._rev, 'string', '_rev is set');
          assert.equal(result._id, 'test-id-1', '_id is set');
          assert.equal(result.name, 'test-1', 'Name is set');
          assert.equal(result.order, 1, 'order is set');
        });
      });

      it('Updates created object', function() {
        let originalRev;
        const e = fire(dataObj);
        return e.detail.result
        .then((result) => {
          originalRev = result._rev;
          result.name = 'test-2';
          const e = fire(result);
          return e.detail.result;
        })
        .then((result) => {
          assert.notEqual(result._rev, originalRev, '_rev is regenerated');
          assert.equal(result._id, 'test-id-1', '_id is the same');
          assert.equal(result.name, 'test-2', 'Name is set');
          assert.equal(result.order, 1, 'order is set');
        });
      });

      it('Updates created object without "_rev" property', function() {
        let originalRev;
        const e = fire(dataObj);
        return e.detail.result
        .then((result) => {
          originalRev = result._rev;
          result.name = 'test-2';
          delete result._rev;
          const e = fire(result);
          return e.detail.result;
        })
        .then((result) => {
          assert.notEqual(result._rev, originalRev, '_rev is regenerated');
          assert.equal(result._id, 'test-id-1', '_id is the same');
          assert.equal(result.name, 'test-2', 'Name is set');
          assert.equal(result.order, 1, 'order is set');
        });
      });

      it('Rejects promise when save object is not set', function() {
        const e = fire();
        return e.detail.result
        .then(() => {
          return Promise.reject('Expected method to reject.');
        })
        .catch(isError)
        .then((err) => {
          assert.isDefined(err);
        });
      });

      it('Handles exceptions', () => {
        let called = false;
        element.updateProject = () => {
          return Promise.reject(new Error('test'));
        };
        const e = fire(dataObj);
        return e.detail.result
        .catch((cause) => {
          if (cause.message === 'test') {
            called = true;
          }
        })
        .then(() => {
          assert.isTrue(called);
        });
      });
    });

    describe('"project-read" event', function() {
      afterEach(function() {
        return DataGenerator.clearLegacyProjects();
      });

      let element;
      let created;
      beforeEach(async () => {
        element = /** @type {ProjectModel} */ (await fixture('<project-model></project-model>'));
        created = await DataGenerator.insertProjectsData({projectsSize: 1})
      });
      /**
       * Dispatches `project-read` event
       * @param {String} id
       * @param {?String} rev
       * @param {?Boolean} cancelable
       * @return {CustomEvent}
       */
      function fire(id, rev, cancelable) {
        if (cancelable === undefined) {
          cancelable = true;
        }
        const e = new CustomEvent('project-read', {
          detail: {
            id: id,
            rev: rev
          },
          bubbles: true,
          composed: true,
          cancelable
        });
        document.body.dispatchEvent(e);
        return e;
      }

      it('Event is canceled', function() {
        const e = fire(created[0]._id);
        assert.isTrue(e.defaultPrevented);
        return e.detail.result;
      });

      it('Non cancellable event is ignored', function() {
        const e = fire(created[0]._id, undefined, false);
        assert.isUndefined(e.detail.result);
      });

      it('Event detail contains "result" as promise', function() {
        const e = fire(created[0]._id);
        assert.typeOf(e.detail.result, 'promise');
        return e.detail.result;
      });

      it('Reads project object by id only', function() {
        const e = fire(created[0]._id);
        return e.detail.result
        .then((result) => {
          assert.equal(result._id, created[0]._id);
        });
      });

      it('Reads a revision', function() {
        let originalRev;
        let updatedRev;
        const e = fire(created[0]._id);
        return e.detail.result
        .then((result) => {
          originalRev = result._rev;
          result.name = 'test-2';
          return element.updateProject(result);
        })
        .then((result) => {
          updatedRev = result._rev;
          const e = fire(created[0]._id, originalRev);
          return e.detail.result;
        })
        .then((result) => {
          assert.equal(result.name, created[0].name);
          assert.notEqual(originalRev, updatedRev);
        });
      });

      it('Rejects promise when no ID', function() {
        const e = fire();
        return e.detail.result
        .then(() => {
          return Promise.reject('Expected method to reject.');
        })
        .catch(isError)
        .then((err) => {
          assert.isDefined(err);
        });
      });

      it('Handles exceptions', () => {
        let called = false;
        element.readProject = () => {
          return Promise.reject(new Error('test'));
        };
        const e = fire(created[0]._id);
        return e.detail.result
        .catch((cause) => {
          if (cause.message === 'test') {
            called = true;
          }
        })
        .then(() => {
          assert.isTrue(called);
        });
      });
    });

    describe('project-object-deleted', function() {
      afterEach(function() {
        return DataGenerator.clearLegacyProjects();
      });

      let element;
      let dataObj;
      beforeEach(async () => {
        element = /** @type {ProjectModel} */ (await fixture('<project-model></project-model>'));
        dataObj = {
          _id: 'test-id-1',
          name: 'test-1',
          order: 1
        };
        dataObj = await element.updateProject(dataObj)
      });
      /**
       * Dispates custom event
       * @param {String} id Project id
       * @param {String} rev Project rev
       * @return {CustomEvent}
       */
      function fire(id, rev) {
        const e = new CustomEvent('project-object-deleted', {
          detail: {
            id: id,
            rev: rev
          },
          bubbles: true,
          composed: true,
          cancelable: true
        });
        document.body.dispatchEvent(e);
        return e;
      }

      it('Event is canceled', function() {
        const e = fire(dataObj._id);
        assert.isTrue(e.defaultPrevented);
        return e.detail.result;
      });

      it('Event detail contains "result" as promise', function() {
        const e = fire(dataObj._id);
        assert.typeOf(e.detail.result, 'promise');
        return e.detail.result;
      });

      it('Removes object from the datastore', function() {
        const event = fire(dataObj._id, dataObj._rev);
        return event.detail.result
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

      it('Rejects promise when no ID', function() {
        const e = fire();
        return e.detail.result
        .then(() => {
          return Promise.reject('Expected method to reject.');
        })
        .catch(isError)
        .then((err) => {
          assert.isDefined(err);
        });
      });

      it('Handles exceptions', () => {
        let called = false;
        element.removeProject = () => {
          return Promise.reject(new Error('test'));
        };
        const e = fire(dataObj._id);
        return e.detail.result
        .catch((cause) => {
          if (cause.message === 'test') {
            called = true;
          }
        })
        .then(() => {
          assert.isTrue(called);
        });
      });
    });

    describe('project-model-query', function() {
      afterEach(function() {
        return DataGenerator.clearLegacyProjects();
      });

      let element;
      let dataObj;
      beforeEach(async () => {
        element = /** @type {ProjectModel} */ (await fixture('<project-model></project-model>'));
        dataObj = {
          _id: 'test-id-1',
          name: 'test-1',
          order: 1
        };
        dataObj = await element.updateProject(dataObj);
      });

      function fire(detail, cancelable) {
        if (cancelable === undefined) {
          cancelable = true;
        }
        const e = new CustomEvent('project-model-query', {
          bubbles: true,
          detail,
          cancelable
        });
        document.body.dispatchEvent(e);
        return e;
      }

      it('Non cancellable event is ignored', function() {
        const e = fire({}, false);
        assert.isUndefined(e.detail.result);
      });

      it('Event is canceled', function() {
        const e = fire({});
        assert.isTrue(e.defaultPrevented);
        return e.detail.result;
      });

      it('Event detail contains "result" as promise', function() {
        const e = fire({});
        assert.typeOf(e.detail.result, 'promise');
      });

      it('Lists saved projects', function() {
        const e = fire({});
        return e.detail.result
        .then((result) => {
          assert.typeOf(result, 'array');
          assert.lengthOf(result, 1);
        });
      });

      it('Throws without "detail" object', () => {
        assert.throws(() => {
          element._queryHandler({
            cancelable: true,
            composedPath: () => []
          });
        });
      });
    });

    describe('"project-update-bulk" event', () => {
      let element;
      beforeEach(async () => {
        element = /** @type {ProjectModel} */ (await fixture('<project-model></project-model>'));
      });

      afterEach(function() {
        return DataGenerator.clearLegacyProjects();
      });

      function fire(projects, cancelable) {
        if (cancelable === undefined) {
          cancelable = true;
        }
        const e = new CustomEvent('project-update-bulk', {
          detail: {
            projects
          },
          bubbles: true,
          cancelable
        });
        document.body.dispatchEvent(e);
        return e;
      }

      it('Non cancellable event is ignored', function() {
        const projects = DataGenerator.generateProjects();
        const e = fire(projects, false);
        assert.isUndefined(e.detail.result);
      });

      it('Event is canceled', function() {
        const projects = DataGenerator.generateProjects();
        const e = fire(projects);
        assert.isTrue(e.defaultPrevented);
        return e.detail.result;
      });

      it('Rejects when projects is not set', function(done) {
        const e = fire();
        e.detail.result
        .catch(() => {
          done();
        });
      });

      it('Rejects when projects is empty', function(done) {
        const e = fire([]);
        e.detail.result
        .catch(() => {
          done();
        });
      });

      it('Inserts projects into the store', function() {
        const projects = DataGenerator.generateProjects();
        const e = fire(projects);
        return e.detail.result
        .then((result) => {
          assert.typeOf(result, 'array');
          assert.lengthOf(result, projects.length);
          for (let i = 0; i < result.length; i++) {
            assert.isUndefined(result[i].error);
          }
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

    it('Deletes the model', async () => {
      await fixture('<project-model></project-model>');
      const e = fire('legacy-projects');
      assert.typeOf(e.detail.result, 'array');
      assert.lengthOf(e.detail.result, 1);
      return Promise.all(e.detail.result);
    });
  });
});
