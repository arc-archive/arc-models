import { fixture, assert } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator/arc-data-generator.js';
import { DataHelper } from './data-helper.js';
import '../../variables-model.js';

describe('<variables-model> - Environment events API', function() {
  async function basicFixture() {
    return /** @type {VariablesModel} */ (await fixture('<variables-model></variables-model>'));
  }
  describe('environment event tests', function() {
    describe('environment-deleted event', function() {
      let databaseRecordId;
      let databaseRecordRev;
      let element;
      after(function() {
        return DataGenerator.destroyVariablesData();
      });

      beforeEach(async () => {
        element = await basicFixture('basic');
        const result = await DataHelper.addEnv('test');
        databaseRecordId = result.id;
        databaseRecordRev = result.rev;
        const vars = [{
          variable: 'test',
          value: 'some variable',
          environment: 'test'
        }, {
          variable: 'test-2',
          value: 'some variable-2',
          environment: 'test'
        }];
        await DataHelper.addVars(vars);
      });

      it('Cancels the event', function() {
        const e = new CustomEvent('environment-deleted', {
          bubbles: true,
          cancelable: true,
          detail: {
            id: databaseRecordId
          }
        });
        document.body.dispatchEvent(e);
        assert.isTrue(e.defaultPrevented);
        return e.detail.result.then(() => {});
      });

      it('Event promise has result data', function() {
        const e = new CustomEvent('environment-deleted', {
          bubbles: true,
          cancelable: true,
          detail: {
            id: databaseRecordId
          }
        });
        document.body.dispatchEvent(e);
        return e.detail.result
        .then((result) => {
          assert.equal(result.id, databaseRecordId, 'Has env ID');
          assert.notEqual(result.rev, databaseRecordRev, 'Has new rev');
        });
      });

      it('Dispatches environment-deleted', function(done) {
        const e = new CustomEvent('environment-deleted', {
          bubbles: true,
          cancelable: true,
          detail: {
            id: databaseRecordId
          }
        });
        document.body.dispatchEvent(e);
        element.addEventListener('environment-deleted', function(e) {
          assert.isFalse(e.cancelable);
          done();
        });
      });
    });

    describe('environment-list-variables event', function() {
      after(function() {
        return DataGenerator.destroyVariablesData();
      });

      beforeEach(async () => {
        await basicFixture('basic');
      });

      it('Cancels the event', function() {
        const e = new CustomEvent('environment-list-variables', {
          bubbles: true,
          cancelable: true,
          detail: {
            environment: 'test'
          }
        });
        document.body.dispatchEvent(e);
        assert.isTrue(e.defaultPrevented);
        return e.detail.result.then(() => {});
      });

      it('Event promise has result data', function() {
        const e = new CustomEvent('environment-list-variables', {
          bubbles: true,
          cancelable: true,
          detail: {
            environment: 'test'
          }
        });
        document.body.dispatchEvent(e);
        return e.detail.result
        .then((result) => {
          assert.typeOf(result, 'array');
        });
      });
    });

    describe('environment-updated event', function() {
      after(function() {
        return DataGenerator.destroyVariablesData();
      });

      let element;
      let env;
      beforeEach(async () => {
        element = await basicFixture('basic');
        env = {
          name: 'test'
        };
      });

      it('Cancels the event', function() {
        const e = new CustomEvent('environment-updated', {
          bubbles: true,
          cancelable: true,
          detail: {
            value: env
          }
        });
        document.body.dispatchEvent(e);
        assert.isTrue(e.defaultPrevented);
        return e.detail.result.then(() => {});
      });

      it('Event promise has result data', function() {
        const e = new CustomEvent('environment-updated', {
          bubbles: true,
          cancelable: true,
          detail: {
            value: env
          }
        });
        document.body.dispatchEvent(e);
        return e.detail.result
        .then((result) => {
          assert.typeOf(result._id, 'string');
          assert.typeOf(result._rev, 'string');
        });
      });

      it('Dispatches environment-updated', function(done) {
        const e = new CustomEvent('environment-updated', {
          bubbles: true,
          cancelable: true,
          detail: {
            value: env
          }
        });
        document.body.dispatchEvent(e);
        element.addEventListener('environment-updated', function f(e) {
          element.removeEventListener('environment-updated', f);
          assert.isFalse(e.cancelable);
          done();
        });
      });
    });
  });
});
