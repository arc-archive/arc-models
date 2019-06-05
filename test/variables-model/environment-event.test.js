import { fixture, assert } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator/arc-data-generator.js';
import { DataHelper } from './data-helper.js';
import '../../variables-model.js';

describe('<variables-model> - Environment events API', function() {
  async function basicFixture() {
    return /** @type {VariablesModel} */ (await fixture('<variables-model></variables-model>'));
  }

  describe('environment-read event', () => {
    beforeEach(async () => {
      await basicFixture();
    });

    afterEach(function() {
      return DataGenerator.destroyVariablesData();
    });

    function fire(environment) {
      const e = new CustomEvent('environment-read', {
        detail: {
          environment
        },
        bubbles: true,
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
      assert.typeOf(e.detail.result, 'promise');
      return e.detail.result;
    });

    it('Resolves to endefined when not found', async () => {
      await DataHelper.addEnv(['test', 'other']);
      const e = fire('non-existing');
      const result = await e.detail.result;
      assert.isUndefined(result);
    });

    it('Resolves to undefined when no environments', async () => {
      const e = fire('test');
      const result = await e.detail.result;
      assert.isUndefined(result);
    });

    it('Resolves to the environment object', async () => {
      await DataHelper.addEnv(['test', 'other']);
      const e = fire('test');
      const result = await e.detail.result;
      assert.typeOf(result, 'object');
    });
  });

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

  describe('environment-list event', () => {
    beforeEach(async () => {
      await basicFixture();
    });

    afterEach(function() {
      return DataGenerator.destroyVariablesData();
    });

    function fire(environment) {
      const e = new CustomEvent('environment-list', {
        detail: {
          environment
        },
        bubbles: true,
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
      assert.typeOf(e.detail.result, 'promise');
      return e.detail.result;
    });

    it('Results to a list of environments', async () => {
      await DataHelper.addEnv(['test', 'other']);
      const e = fire('test');
      const result = await e.detail.result;
      assert.lengthOf(result, 2);
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
