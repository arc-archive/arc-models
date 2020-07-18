import { fixture, assert } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import '../../project-model.js';

/** @typedef {import('../../src/ProjectModel').ProjectModel} ProjectModel */

/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-vars */

describe('<project-model> - Events based', () => {
  const generator = new DataGenerator();

  describe('Events API for projects', () => {
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

    describe('project-object-changed', () => {
      afterEach(() => {
        return generator.clearLegacyProjects();
      });
      let dataObj;
      let element;
      beforeEach(async () => {
        element = /** @type {ProjectModel} */ (await fixture(
          '<project-model></project-model>'
        ));
        dataObj = {
          _id: 'test-id-1',
          name: 'test-1',
          order: 1,
        };
      });
      /**
       * Dispatches `project-object-changed` event
       * @param {Object=} project
       * @return {CustomEvent}
       */
      function fire(project) {
        const e = new CustomEvent('project-object-changed', {
          detail: {
            project,
            result: undefined,
          },
          bubbles: true,
          composed: true,
          cancelable: true,
        });
        document.body.dispatchEvent(e);
        return e;
      }

      it('Event is canceled', () => {
        const e = fire(dataObj);
        assert.isTrue(e.defaultPrevented);
        return e.detail.result;
      });

      it('Event detail contains "result" as promise', () => {
        const e = fire(dataObj);
        assert.typeOf(e.detail.result, 'promise');
        return e.detail.result;
      });

      it('Creates a new object in the datastore', () => {
        const e = fire(dataObj);
        return e.detail.result.then((result) => {
          assert.typeOf(result._rev, 'string', '_rev is set');
          assert.equal(result._id, 'test-id-1', '_id is set');
          assert.equal(result.name, 'test-1', 'Name is set');
          assert.equal(result.order, 1, 'order is set');
        });
      });

      it('Updates created object', () => {
        let originalRev;
        const e = fire(dataObj);
        return e.detail.result
          .then((result) => {
            originalRev = result._rev;
            result.name = 'test-2';
            const ev = fire(result);
            return ev.detail.result;
          })
          .then((result) => {
            assert.notEqual(result._rev, originalRev, '_rev is regenerated');
            assert.equal(result._id, 'test-id-1', '_id is the same');
            assert.equal(result.name, 'test-2', 'Name is set');
            assert.equal(result.order, 1, 'order is set');
          });
      });

      it('Updates created object without "_rev" property', () => {
        let originalRev;
        const e = fire(dataObj);
        return e.detail.result
          .then((result) => {
            originalRev = result._rev;
            result.name = 'test-2';
            delete result._rev;
            const ev = fire(result);
            return ev.detail.result;
          })
          .then((result) => {
            assert.notEqual(result._rev, originalRev, '_rev is regenerated');
            assert.equal(result._id, 'test-id-1', '_id is the same');
            assert.equal(result.name, 'test-2', 'Name is set');
            assert.equal(result.order, 1, 'order is set');
          });
      });

      it('Rejects promise when save object is not set', () => {
        const e = fire();
        return e.detail.result
          .then(() => {
            return Promise.reject(new Error('Expected method to reject.'));
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

    describe('"project-read" event', () => {
      afterEach(() => {
        return generator.clearLegacyProjects();
      });

      let element;
      let created;
      beforeEach(async () => {
        element = /** @type {ProjectModel} */ (await fixture(
          '<project-model></project-model>'
        ));
        created = await generator.insertProjectsData({ projectsSize: 1 });
      });
      /**
       * Dispatches `project-read` event
       * @param {string=} id
       * @param {string=} rev
       * @param {boolean=} cancelable
       * @return {CustomEvent}
       */
      function fire(id, rev, cancelable) {
        if (cancelable === undefined) {
          cancelable = true;
        }
        const e = new CustomEvent('project-read', {
          detail: {
            id,
            rev,
          },
          bubbles: true,
          composed: true,
          cancelable,
        });
        document.body.dispatchEvent(e);
        return e;
      }

      it('Event is canceled', () => {
        const e = fire(created[0]._id);
        assert.isTrue(e.defaultPrevented);
        return e.detail.result;
      });

      it('Non cancellable event is ignored', () => {
        const e = fire(created[0]._id, undefined, false);
        assert.isUndefined(e.detail.result);
      });

      it('Event detail contains "result" as promise', () => {
        const e = fire(created[0]._id);
        assert.typeOf(e.detail.result, 'promise');
        return e.detail.result;
      });

      it('Reads project object by id only', () => {
        const e = fire(created[0]._id);
        return e.detail.result.then((result) => {
          assert.equal(result._id, created[0]._id);
        });
      });

      it('Reads a revision', () => {
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
            const ev = fire(created[0]._id, originalRev);
            return ev.detail.result;
          })
          .then((result) => {
            assert.equal(result.name, created[0].name);
            assert.notEqual(originalRev, updatedRev);
          });
      });

      it('Rejects promise when no ID', () => {
        const e = fire();
        return e.detail.result
          .then(() => {
            return Promise.reject(new Error('Expected method to reject.'));
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

    describe('project-object-deleted', () => {
      afterEach(() => {
        return generator.clearLegacyProjects();
      });

      let element;
      let dataObj;
      beforeEach(async () => {
        element = /** @type {ProjectModel} */ (await fixture(
          '<project-model></project-model>'
        ));
        dataObj = {
          _id: 'test-id-1',
          name: 'test-1',
          order: 1,
        };
        dataObj = await element.updateProject(dataObj);
      });
      /**
       * Dispates custom event
       * @param {string=} id Project id
       * @param {string=} rev Project rev
       * @return {CustomEvent}
       */
      function fire(id, rev) {
        const e = new CustomEvent('project-object-deleted', {
          detail: {
            id,
            rev,
          },
          bubbles: true,
          composed: true,
          cancelable: true,
        });
        document.body.dispatchEvent(e);
        return e;
      }

      it('Event is canceled', () => {
        const e = fire(dataObj._id);
        assert.isTrue(e.defaultPrevented);
        return e.detail.result;
      });

      it('Event detail contains "result" as promise', () => {
        const e = fire(dataObj._id);
        assert.typeOf(e.detail.result, 'promise');
        return e.detail.result;
      });

      it('Removes object from the datastore', () => {
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

      it('Rejects promise when no ID', () => {
        const e = fire();
        return e.detail.result
          .then(() => {
            return Promise.reject(new Error('Expected method to reject.'));
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

    describe('project-model-query', () => {
      afterEach(() => {
        return generator.clearLegacyProjects();
      });

      let element;
      let dataObj;
      beforeEach(async () => {
        element = /** @type {ProjectModel} */ (await fixture(
          '<project-model></project-model>'
        ));
        dataObj = {
          _id: 'test-id-1',
          name: 'test-1',
          order: 1,
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
          cancelable,
        });
        document.body.dispatchEvent(e);
        return e;
      }

      it('Non cancellable event is ignored', () => {
        const e = fire({}, false);
        assert.isUndefined(e.detail.result);
      });

      it('Event is canceled', () => {
        const e = fire({});
        assert.isTrue(e.defaultPrevented);
        return e.detail.result;
      });

      it('Event detail contains "result" as promise', () => {
        const e = fire({});
        assert.typeOf(e.detail.result, 'promise');
      });

      it('Lists saved projects', () => {
        const e = fire({});
        return e.detail.result.then((result) => {
          assert.typeOf(result, 'array');
          assert.lengthOf(result, 1);
        });
      });

      it('Throws without "detail" object', () => {
        assert.throws(() => {
          element._queryHandler({
            cancelable: true,
            composedPath: () => [],
          });
        });
      });
    });

    describe('"project-update-bulk" event', () => {
      let element = /** @type {ProjectModel} */ (null);
      beforeEach(async () => {
        element = /** @type {ProjectModel} */ (await fixture(
          '<project-model></project-model>'
        ));
      });

      afterEach(() => {
        return generator.clearLegacyProjects();
      });

      function fire(projects, cancelable = true) {
        const e = new CustomEvent('project-update-bulk', {
          detail: {
            projects,
            result: undefined,
          },
          bubbles: true,
          cancelable,
        });
        document.body.dispatchEvent(e);
        return e;
      }

      it('Non cancellable event is ignored', () => {
        const projects = generator.generateProjects();
        const e = fire(projects, false);
        assert.isUndefined(e.detail.result);
      });

      it('Event is canceled', () => {
        const projects = generator.generateProjects();
        const e = fire(projects);
        assert.isTrue(e.defaultPrevented);
        return e.detail.result;
      });

      it('Rejects when projects is not set', (done) => {
        const e = fire();
        e.detail.result.catch(() => {
          done();
        });
      });

      it('Rejects when projects is empty', (done) => {
        const e = fire([]);
        e.detail.result.catch(() => {
          done();
        });
      });

      it('Inserts projects into the store', () => {
        const projects = generator.generateProjects();
        const e = fire(projects);
        return e.detail.result.then((result) => {
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
          models,
          result: undefined,
        },
        bubbles: true,
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
