import { fixture, assert, oneEvent } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import sinon from 'sinon';
import { DataHelper } from './data-helper.js';
import '../../variables-model.js';

/** @typedef {import('../../src/VariablesModel').VariablesModel} VariablesModel */

describe('<variables-model> - Public API', () => {
  const generator = new DataGenerator();
  /**
   * @return {Promise<VariablesModel>}
   */
  async function basicFixture() {
    return fixture('<variables-model></variables-model>');
  }

  describe('Public methods', () => {
    describe('deleteEnvironment()', () => {
      let databaseRecordId;
      let databaseRecordRev;
      let element = /** @type VariablesModel */ (null);
      after(() => {
        return generator.destroyVariablesData();
      });

      beforeEach(async () => {
        element = await basicFixture();
        const result = /** @type PouchDB.Core.Response */ (await DataHelper.addEnv(
          'test'
        ));
        databaseRecordId = result.id;
        databaseRecordRev = result.rev;
        const vars = [
          {
            variable: 'test',
            value: 'some variable',
            environment: 'test',
          },
          {
            variable: 'test-2',
            value: 'some variable-2',
            environment: 'test',
          },
        ];
        await DataHelper.addVars(vars);
      });

      it('Returns new _rev for deleted item', async () => {
        const result = await element.deleteEnvironment(databaseRecordId);
        assert.typeOf(result.rev, 'string');
        assert.notEqual(result.rev, databaseRecordRev);
      });

      it('Returns _id for deleted item', async () => {
        const result = await element.deleteEnvironment(databaseRecordId);
        assert.equal(result.id, databaseRecordId);
      });

      it('Dispatches environment-deleted custom event', async () => {
        element.deleteEnvironment(databaseRecordId);
        const { cancelable } = await oneEvent(element, 'environment-deleted');
        assert.isFalse(cancelable);
      });

      // Should be last, it leases an environment in the data store.
      it('Rejects promise without ID', async () => {
        let thrown = false;
        try {
          // @ts-ignore
          await element.deleteEnvironment();
        } catch (e) {
          thrown = true;
        }
        assert.isTrue(thrown);
      });

      it('Removes variables added to the environment', async () => {
        await element.deleteEnvironment(databaseRecordId);
        const result = await generator.getDatastoreVariablesData();
        assert.lengthOf(result, 0);
      });
    });

    describe('updateEnvironment()', () => {
      after(() => {
        return generator.destroyVariablesData();
      });

      let element = /** @type VariablesModel */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('rejects promise without name property', async () => {
        let thrown = false;
        try {
          // @ts-ignore
          await element.updateEnvironment({});
        } catch (e) {
          thrown = true;
        }
        assert.isTrue(thrown);
      });

      it('Creates new object in the data store', async () => {
        const result = await element.updateEnvironment({
          name: 'test',
        });
        assert.typeOf(result._id, 'string');
        assert.typeOf(result._rev, 'string');
      });

      it('Dispatches environment-updated custom event', async () => {
        element.updateEnvironment({
          name: 'test',
        });
        await oneEvent(element, 'environment-updated');
      });

      it('The environment-updated custom event is not cancellable', async () => {
        element.updateEnvironment({
          name: 'test',
        });
        const { cancelable } = await oneEvent(element, 'environment-updated');
        assert.isFalse(cancelable);
      });

      it('Updates existing item', async () => {
        const result = await element.updateEnvironment({
          name: 'test',
        });
        const rev = result._rev;
        result.name = 'xxx';
        const updated = await element.updateEnvironment(result);
        assert.notEqual(updated._rev, rev);
      });

      it('Replaces Date to time', async () => {
        const result = await element.updateEnvironment({
          name: 'test-date',
          created: new Date(),
        });
        assert.typeOf(result.created, 'number');
      });
    });

    describe('listEnvironments()', () => {
      after(async () => generator.destroyVariablesData());

      let element = /** @type VariablesModel */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('Returns empty array when no data', async () => {
        const result = await element.listEnvironments();
        assert.typeOf(result, 'array');
        assert.lengthOf(result, 0);
      });

      it('Returns existing environments', async () => {
        await DataHelper.addEnv(['test', 'other']);
        const result = await element.listEnvironments();
        assert.lengthOf(result, 2);
      });
    });

    describe('updateVariable()', () => {
      after(() => {
        return generator.destroyVariablesData();
      });

      let element = /** @type VariablesModel */ (null);
      let varData;
      beforeEach(async () => {
        element = await basicFixture();
        varData = {
          value: 'test',
          variable: 'var-value',
          enabled: true,
        };
      });

      it('Creates new variable', async () => {
        const result = await element.updateVariable(varData);
        assert.equal(result.value, 'test');
        assert.typeOf(result._id, 'string');
        assert.typeOf(result._rev, 'string');
      });

      it('Updates existing variable', async () => {
        const result = await element.updateVariable(varData);
        const id = result._id;
        const rev = result._rev;
        result.enabled = false;
        const updated = await element.updateVariable(varData);
        assert.isFalse(updated.enabled);
        assert.equal(updated._id, id);
        assert.notEqual(updated._rev, rev);
      });

      it('Dispatches variable-updated event', async () => {
        element.updateVariable(varData);
        const { cancelable } = await oneEvent(element, 'variable-updated');
        assert.isFalse(cancelable);
      });
    });

    describe('deleteVariable()', () => {
      after(async () => generator.destroyVariablesData());

      let element = /** @type VariablesModel */ (null);
      let varData;
      beforeEach(async () => {
        element = await basicFixture();
        varData = {
          name: 'test',
          variable: 'var-value',
          enabled: true,
        };
      });

      it('does nothing when var do not exists', async () => {
        await element.deleteVariable('not-existing');
      });

      it('deletes variables', async () => {
        const result = await element.updateVariable(varData);
        await element.deleteVariable(result._id);
        const items = await generator.getDatastoreVariablesData();
        assert.lengthOf(items, 0);
      });
    });

    describe('listVariables()', () => {
      after(async () => generator.destroyVariablesData());

      before(async () => {
        await DataHelper.addVars([
          {
            value: 'test',
            variable: 'var-value',
            enabled: true,
            environment: 'default',
          },
          {
            value: 'other',
            variable: 'var-value',
            enabled: true,
            environment: 'other',
          },
        ]);
      });

      let element = /** @type VariablesModel */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('Returns data for default', async () => {
        const result = await element.listVariables('default');
        assert.typeOf(result, 'array');
        assert.lengthOf(result, 1);
      });

      it('Returns data for "other"', async () => {
        const result = await element.listVariables('other');
        assert.typeOf(result, 'array');
        assert.lengthOf(result, 1);
      });

      it('Returns empty list', async () => {
        const result = await element.listVariables('not-existing');
        assert.typeOf(result, 'array');
        assert.lengthOf(result, 0);
      });
    });

    describe('_updateEnvironmentName()', () => {
      let element = /** @type VariablesModel */ (null);
      after(async () => generator.destroyVariablesData());

      beforeEach(async () => {
        element = await basicFixture();
        await DataHelper.addEnv('test');
        const vars = [
          {
            variable: 'test',
            value: 'some variable',
            environment: 'test',
          },
          {
            variable: 'test-2',
            value: 'some variable-2',
            environment: 'test',
          },
        ];
        await DataHelper.addVars(vars);
      });

      it('Updates variables environment', async () => {
        await element._updateEnvironmentName('test', {
          name: 'new-env',
        });
        const vars = await generator.getDatastoreVariablesData();
        assert.lengthOf(vars, 2);
        assert.equal(vars[0].environment, 'new-env');
        assert.equal(vars[1].environment, 'new-env');
      });
    });

    describe('_deleteEnvironmentVariables()', () => {
      let element = /** @type VariablesModel */ (null);
      after(async () => generator.destroyVariablesData());

      beforeEach(async () => {
        element = await basicFixture();
      });

      it('does nothing when no argument', async () => {
        const spy = sinon.spy(element, 'listVariables');
        await element._deleteEnvironmentVariables(undefined);
        assert.isFalse(spy.called);
      });

      it('does nothing when argument equals Default', async () => {
        const spy = sinon.spy(element, 'listVariables');
        await element._deleteEnvironmentVariables('Default');
        assert.isFalse(spy.called);
      });

      it('Ignores when no variables in environment', async () => {
        await element._deleteEnvironmentVariables('test');
        // No error
      });

      it('Removes variables for environment', async () => {
        const vars = [
          {
            variable: 'test',
            value: 'some variable',
            environment: 'test',
          },
          {
            variable: 'test-2',
            value: 'some variable-2',
            environment: 'test',
          },
        ];
        await DataHelper.addVars(vars);
        await element._deleteEnvironmentVariables('test');
        const result = await generator.getDatastoreVariablesData();
        assert.lengthOf(result, 0);
      });
    });
  });
});
