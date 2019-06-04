import { fixture, assert } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator/arc-data-generator.js';
import sinon from 'sinon/pkg/sinon-esm.js';
import '../../request-model.js';
import '../../url-indexer.js';
import {DbHelper} from '../url-indexer/db-helper.js';

describe('<request-model> - Event based', () => {
  async function basicFixture() {
    return /** @type {RequestModel} */ (await fixture('<request-model></request-model>'));
  }

  async function indexerFixture() {
    return /** @type {RequestModel} */ (await fixture(`<request-model></request-model>
      <url-indexer></url-indexer>`));
  }

  describe('Events API for requests', function() {
    const databaseType = 'saved';
    // See https://gist.github.com/haroldtreen/5f1055eee5fcf01da3e0e15b8ec86bf6
    function isError(e) {
      if (typeof e === 'string') {
        return Promise.reject(new Error(e));
      }
      return Promise.resolve(e);
    }

    describe('request-object-changed', function() {
      after(function() {
        return DataGenerator.destroySavedRequestData();
      });

      // let element;
      let dataObj;
      beforeEach(async () => {
        await basicFixture();
        dataObj = {
          name: 'test-' + Date.now(),
          url: 'http://domain.com',
          method: 'GET',
        };
      });

      function fire(request) {
        const e = new CustomEvent('request-object-changed', {
          detail: {
            request: request,
            type: databaseType
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
          assert.typeOf(result._id, 'string', '_id is set');
          assert.equal(result.name, dataObj.name, 'Name is set');
          assert.equal(result.method, dataObj.method, 'method is set');
          assert.equal(result.url, dataObj.url, 'url is set');
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
          assert.equal(result.name, 'test-2', 'Name is set');
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
          assert.equal(result.name, 'test-2', 'Name is set');
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
    });

    describe('request-object-read', function() {
      after(function() {
        return DataGenerator.destroySavedRequestData();
      });

      let element;
      let dataObj;
      beforeEach(async () => {
        element = await basicFixture();
        dataObj = {
          name: 'test-' + Date.now(),
          url: 'http://domain.com',
          method: 'GET',
        };
        return element.update(databaseType, dataObj)
        .then((result) => dataObj = result);
      });

      function fire(id, rev) {
        const e = new CustomEvent('request-object-read', {
          detail: {
            id: id,
            rev: rev,
            type: databaseType
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

      it('Reads request object by id only', function() {
        const e = fire(dataObj._id);
        return e.detail.result
        .then((result) => {
          assert.equal(result._id, dataObj._id);
        });
      });

      it('Reads a revision', function() {
        let originalRev;
        let updatedRev;
        const e = fire(dataObj._id);
        return e.detail.result
        .then((result) => {
          originalRev = result._rev;
          result.name = 'test-2';
          return element.update(databaseType, result);
        })
        .then((result) => {
          updatedRev = result._rev;
          const e = fire(dataObj._id, originalRev);
          return e.detail.result;
        })
        .then((result) => {
          assert.equal(result.name, dataObj.name);
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
    });

    describe('project-object-deleted', function() {
      after(function() {
        return DataGenerator.destroySavedRequestData();
      });

      let element;
      let dataObj;
      beforeEach(async () => {
        element = await basicFixture();
        dataObj = {
          name: 'test-' + Date.now(),
          url: 'http://domain.com',
          method: 'GET',
        };
        return element.update(databaseType, dataObj)
        .then((result) => dataObj = result);
      });

      function fire(id, rev) {
        const e = new CustomEvent('request-object-deleted', {
          detail: {
            id: id,
            rev: rev,
            type: databaseType
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
        const e = fire(dataObj._id, dataObj._rev);
        return e.detail.result
        .then(() => {
          return element.read(databaseType, dataObj._id);
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
    });

    describe('request-objects-deleted', function() {
      after(function() {
        return DataGenerator.destroySavedRequestData();
      });

      let element;
      let dataObj;
      beforeEach(async () => {
        element = await basicFixture();
        dataObj = {
          name: 'test-' + Date.now(),
          url: 'http://domain.com',
          method: 'GET',
        };
        return element.update(databaseType, dataObj)
        .then((result) => dataObj = result);
      });

      function fire(id) {
        const e = new CustomEvent('request-objects-deleted', {
          detail: {
            items: [id],
            type: databaseType
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
        const e = fire(dataObj._id);
        return e.detail.result
        .then(() => {
          return element.read(databaseType, dataObj._id);
        })
        .then(() => {
          throw new Error('TEST');
        })
        .catch((cause) => {
          assert.equal(cause.status, 404);
        });
      });
    });

    describe('request-query', function() {
      afterEach(() => {
        return DataGenerator.destroySavedRequestData()
        .then(() => DbHelper.clearData());
      });

      let element;
      let dataList;
      beforeEach((done) => {
        dataList = [{
          name: 'test-1-' + Date.now(),
          url: 'http://domain.com/abc',
          method: 'GET',
          type: 'saved'
        }, {
          name: 'test-2' + Date.now(),
          url: 'http://other.domain.com',
          method: 'POST',
          type: 'saved'
        }];
        indexerFixture()
        .then((node) => {
          element = node;
          element.nextElementSibling.addEventListener('request-indexing-finished', function f() {
            element.removeEventListener('request-indexing-finished', f);
            done();
          });
        })
        .then(() => element.updateBulk(databaseType, dataList))
        .then((result) => {
          result.forEach((r) => {
            assert.isUndefined(r.error);
          });
        });
      });

      function fire(q) {
        const e = new CustomEvent('request-query', {
          detail: {
            q,
            type: databaseType
          },
          bubbles: true,
          composed: true,
          cancelable: true
        });
        document.body.dispatchEvent(e);
        return e;
      }

      it('Event is canceled', function() {
        const e = fire('test');
        assert.isTrue(e.defaultPrevented);
        return e.detail.result;
      });

      it('Event detail contains "result" as promise', function() {
        const e = fire('test');
        assert.typeOf(e.detail.result.then, 'function');
        return e.detail.result;
      });

      it('Reads by name (all)', function() {
        const e = fire('test');
        return e.detail.result
        .then((requests) => {
          assert.lengthOf(requests, 2);
        });
      });

      it('Reads by name (single)', function() {
        const e = fire(dataList[0].name);
        return e.detail.result
        .then((requests) => {
          assert.lengthOf(requests, 1);
        });
      });

      it('Reads by partial URL', function() {
        const e = fire('domain.com');
        return e.detail.result
        .then((requests) => {
          assert.lengthOf(requests, 2);
        });
      });

      it('Reads by full URL', function() {
        const e = fire('http://other.domain.com');
        return e.detail.result
        .then((requests) => {
          assert.lengthOf(requests, 1);
        });
      });
    });

    describe('request-list', () => {
      before(() => {
        return DataGenerator.destroyHistoryData()
        .then(() => DataGenerator.insertHistoryRequestData({
          requestsSize: 150
        }));
      });

      after(function() {
        return DataGenerator.destroyHistoryData();
      });

      beforeEach(async () => {
        await basicFixture();
      });

      function fire(type, queryOptions, cancelable) {
        if (typeof cancelable === 'undefined') {
          cancelable = true;
        }
        const e = new CustomEvent('request-list', {
          detail: {
            queryOptions,
            type
          },
          bubbles: true,
          composed: true,
          cancelable
        });
        document.body.dispatchEvent(e);
        return e;
      }

      it('Event is canceled', function() {
        const e = fire('history', {});
        assert.isTrue(e.defaultPrevented);
        return e.detail.result;
      });

      it('Promise rejects for no type', (done) => {
        const e = fire(undefined, {});
        e.detail.result
        .then(() => {
          done(new Error('Query is resolved'));
        })
        .catch(() => done());
      });

      it('Promise rejects for no query options', (done) => {
        const e = fire('history');
        e.detail.result
        .then(() => {
          done(new Error('Query is resolved'));
        })
        .catch(() => done());
      });

      it('Event is ignored when not cancelable', function() {
        const e = fire('history', {}, false);
        assert.isUndefined(e.detail.result);
      });

      it('Returnes all results without limit options', () => {
        const e = fire('history', {});
        return e.detail.result
        .then((result) => {
          assert.typeOf(result, 'object');
          assert.typeOf(result.rows, 'array');
          assert.lengthOf(result.rows, 150);
        });
      });

      it('Limits number of results when set', () => {
        const e = fire('history', {
          limit: 50
        });
        return e.detail.result
        .then((result) => {
          assert.typeOf(result, 'object');
          assert.typeOf(result.rows, 'array');
          assert.lengthOf(result.rows, 50);
        });
      });

      it('Respects pagination', () => {
        let firstKey;
        const e = fire('history', {
          limit: 50
        });
        return e.detail.result
        .then((result) => {
          firstKey = result.rows[0].key;
          const e = fire('history', {
            limit: 50,
            startkey: result.rows[result.rows.length - 1].key,
            skip: 1
          });
          return e.detail.result;
        })
        .then((result) => {
          assert.typeOf(result, 'object');
          assert.typeOf(result.rows, 'array');
          assert.lengthOf(result.rows, 50);
          assert.notEqual(firstKey, result.rows[0].key);
        });
      });
    });
  });

  describe('request-project-list', function() {
    let project;
    before(() => {
      return DataGenerator.insertSavedRequestData()
      .then((data) => {
        project = data.projects.find((item) => !!(item.requests && item.requests.length));
        if (!project) {
          throw new Error('Data generator did not produced project with requests');
        }
      });
    });

    after(function() {
      return DataGenerator.destroySavedRequestData();
    });

    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    function fire(id, cancelable) {
      if (typeof cancelable === 'undefined') {
        cancelable = true;
      }
      const e = new CustomEvent('request-project-list', {
        detail: {
          id,
          opts: {test: true}
        },
        bubbles: true,
        composed: true,
        cancelable
      });
      document.body.dispatchEvent(e);
      return e;
    }

    it('Event is canceled', function() {
      const e = fire(project._id);
      assert.isTrue(e.defaultPrevented);
      return e.detail.result;
    });

    it('Rejects when no ID', function() {
      const e = fire();
      return e.detail.result
      .then(() => {
        throw new Error('Should not resolve');
      })
      .catch((cause) => {
        assert.equal(cause.message, 'Project id is not set.');
      });
    });

    it('Calls readProjectRequests()', () => {
      const spy = sinon.spy(element, 'readProjectRequests');
      const e = fire(project._id);
      return e.detail.result
      .then(() => {
        assert.equal(spy.args[0][0], project._id, 'Project id is set');
        assert.deepEqual(spy.args[0][1], {test: true}, 'Options are set');
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

    it('Deletes saved model', async () => {
      await basicFixture();
      const e = fire('saved-requests');
      assert.typeOf(e.detail.result, 'array');
      assert.lengthOf(e.detail.result, 1);
      await Promise.all(e.detail.result);
    });

    it('Deletes history model', async () => {
      await basicFixture();
      const e = fire('history-requests');
      assert.typeOf(e.detail.result, 'array');
      assert.lengthOf(e.detail.result, 1);
      await Promise.all(e.detail.result);
    });
  });
});
