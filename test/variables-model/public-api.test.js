import { fixture, assert } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator/arc-data-generator.js';
import { DataHelper } from './data-helper.js';
import sinon from 'sinon/pkg/sinon-esm.js';
import '../../variables-model.js';

describe('<variables-model> - Public API', function() {
  async function basicFixture() {
    return /** @type {VariablesModel} */ (await fixture('<variables-model></variables-model>'));
  }

  describe('Public methods', function() {
    describe('deleteEnvironment()', function() {
      let databaseRecordId;
      let databaseRecordRev;
      let element;
      after(function() {
        return DataGenerator.destroyVariablesData();
      });

      beforeEach(async () => {
        element = await basicFixture();
        const result = await DataHelper.addEnv('test')
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

      it('Returns new _rev for deleted item', function() {
        return element.deleteEnvironment(databaseRecordId)
        .then(function(result) {
          assert.typeOf(result.rev, 'string');
          assert.notEqual(result.rev, databaseRecordRev);
        });
      });

      it('Returns _id for deleted item', function() {
        return element.deleteEnvironment(databaseRecordId)
        .then(function(result) {
          assert.equal(result.id, databaseRecordId);
        });
      });

      it('Dispatches environment-deleted custom event', function(done) {
        element.addEventListener('environment-deleted', function f(e) {
          element.removeEventListener('environment-deleted', f);
          assert.isFalse(e.cancelable);
        });
        element.deleteEnvironment(databaseRecordId)
        .then(function() {
          done();
        });
      });

      // Should be last, it leases an environment in the data store.
      it('Rejects promise without ID', function() {
        return element.deleteEnvironment()
        .then(function() {
          throw new Error('TEST');
        })
        .catch(function(cause) {
          if (cause.message === 'TEST') {
            throw new Error('Validation passed invalid input');
          }
        });
      });

      it('Removes variables added to the environment', () => {
        return element.deleteEnvironment(databaseRecordId)
        .then(() => {
          return DataGenerator.getDatastoreVariablesData();
        })
        .then((result) => {
          assert.lengthOf(result, 0);
        });
      });
    });

    describe('updateEnvironment()', function() {
      after(function() {
        return DataGenerator.destroyVariablesData();
      });

      let element;
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('Rejects promise without name property', function() {
        return element.updateEnvironment({})
        .then(function() {
          throw new Error('TEST');
        })
        .catch(function(cause) {
          if (cause.message === 'TEST') {
            throw new Error('Validation passed invalid input');
          }
        });
      });

      it('Creates new object in the data store', function() {
        return element.updateEnvironment({
          name: 'test'
        })
        .then((result) => {
          assert.typeOf(result._id, 'string');
          assert.typeOf(result._rev, 'string');
        });
      });

      it('Dispatches environment-updated custom event', function() {
        const spy = sinon.spy();
        element.addEventListener('environment-updated', spy);
        return element.updateEnvironment({
          name: 'test'
        })
        .then(function() {
          assert.isTrue(spy.called);
        });
      });

      it('The environment-updated custom event is not cancellable', function() {
        let cancelable;
        element.addEventListener('environment-updated', function(e) {
          cancelable = e.cancelable;
        });
        return element.updateEnvironment({
          name: 'test'
        })
        .then(function() {
          assert.isFalse(cancelable);
        });
      });

      it('Updates existing item', function() {
        let rev;
        return element.updateEnvironment({
          name: 'test'
        })
        .then((result) => {
          rev = result._rev;
          result.name = 'xxx';
          return element.updateEnvironment(result);
        })
        .then(function(result) {
          assert.notEqual(result._rev, rev);
        });
      });
    });

    describe('listEnvironments()', function() {
      after(function() {
        return DataGenerator.destroyVariablesData();
      });

      let element;
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('Returns empty array when no data', function() {
        return element.listEnvironments()
        .then((result) => {
          assert.typeOf(result, 'array');
          assert.lengthOf(result, 0);
        });
      });

      it('Returns existing environments', () => {
        return DataHelper.addEnv(['test', 'other'])
        .then(() => element.listEnvironments())
        .then((result) => {
          assert.lengthOf(result, 2);
        });
      });
    });


    describe('updateVariable()', function() {
      after(function() {
        return DataGenerator.destroyVariablesData();
      });

      let element;
      let varData;
      beforeEach(async () => {
        element = await basicFixture();
        varData = {
          name: 'test',
          variable: 'var-value',
          enabled: true
        };
      });

      it('Creates new variable', function() {
        return element.updateVariable(varData)
        .then((result) => {
          assert.equal(result.name, 'test');
          assert.typeOf(result._id, 'string');
          assert.typeOf(result._rev, 'string');
        });
      });

      it('Updates existing variable', () => {
        let id;
        let rev;
        return element.updateVariable(varData)
        .then((result) => {
          id = result._id;
          rev = result._rev;
          result.enabled = false;
          return element.updateVariable(varData);
        })
        .then((result) => {
          assert.isFalse(result.enabled);
          assert.equal(result._id, id);
          assert.notEqual(result._rev, rev);
        });
      });

      it('Dispatches variable-updated event', function() {
        element.addEventListener('variable-updated', function f(e) {
          element.removeEventListener('variable-updated', f);
          assert.isFalse(e.cancelable);
        });
        return element.updateVariable(varData);
      });
    });

    describe('deleteVariable()', function() {
      after(function() {
        return DataGenerator.destroyVariablesData();
      });

      let element;
      let varData;
      beforeEach(async () => {
        element = await basicFixture();
        varData = {
          name: 'test',
          variable: 'var-value',
          enabled: true
        };
      });

      it('Does nothing when var do not exists', function() {
        return element.deleteVariable('not-existing');
      });

      it('Deletes variables', () => {
        return element.updateVariable(varData)
        .then((result) => {
          return element.deleteVariable(result._id);
        })
        .then(() => DataGenerator.getDatastoreVariablesData())
        .then((result) => {
          assert.lengthOf(result, 0);
        });
      });
    });

    describe('listVariables()', function() {
      after(function() {
        return DataGenerator.destroyVariablesData();
      });

      before(async () => {
        await DataHelper.addVars([{
          name: 'test',
          variable: 'var-value',
          enabled: true,
          environment: 'default'
        }, {
          name: 'other',
          variable: 'var-value',
          enabled: true,
          environment: 'other'
        }]);
      });

      let element;
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('Returns data for default', function() {
        return element.listVariables('default')
        .then((result) => {
          assert.typeOf(result, 'array');
          assert.lengthOf(result, 1);
        });
      });

      it('Returns data for "other"', function() {
        return element.listVariables('other')
        .then((result) => {
          assert.typeOf(result, 'array');
          assert.lengthOf(result, 1);
        });
      });

      it('Returns empty list', function() {
        return element.listVariables('not-existing')
        .then((result) => {
          assert.typeOf(result, 'array');
          assert.lengthOf(result, 0);
        });
      });
    });
  });
});
