import { assert, fixture, html } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import * as sinon from 'sinon';
import '../../variables-model.js';
// import { sortFunction } from '../../src/VariablesModel.js';
import { ArcModelEventTypes } from '../../src/events/ArcModelEventTypes.js';

/** @typedef {import('../../src/VariablesModel').VariablesModel} VariablesModel */
/** @typedef {import('@advanced-rest-client/arc-types').Variable.ARCVariable} ARCVariable */
/** @typedef {import('@advanced-rest-client/arc-types').Variable.ARCEnvironment} ARCEnvironment */

describe('VariablesModel', () => {
  const generator = new DataGenerator();

  /**
   * @return {Promise<VariablesModel>}
   */
  async function basicFixture() {
    return fixture(html`<variables-model></variables-model>`);
  }

  describe('direct API', () => {
    describe('#environmentDb', () => {
      let element = /** @type VariablesModel */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('returns the handler to the data store', () => {
        assert.equal(element.environmentDb.name, 'variables-environments');
      });
    });

    describe('#variableDb', () => {
      let element = /** @type VariablesModel */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('returns the handler to the data store', () => {
        assert.equal(element.variableDb.name, 'variables');
      });
    });

    describe('constructor()', () => {
      let element = /** @type VariablesModel */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('does not set the name', () => {
        assert.isUndefined(element.name);
      });
    });

    describe('updateEnvironment()', () => {
      let element = /** @type VariablesModel */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      after(async () => {
        await generator.destroyVariablesData();
      });

      it('returns the changelog', async () => {
        const entity = {
          name: 'test1',
          created: 1234,
        };
        const result = await element.updateEnvironment(entity);
        assert.typeOf(result, 'object', 'returns an object');
        assert.typeOf(result.id, 'string', 'has an id');
        assert.typeOf(result.rev, 'string', 'has a rev');
        assert.typeOf(result.item, 'object', 'has created object');
        assert.isUndefined(result.oldRev, 'has no oldRev');
      });

      it('returns the created entity', async () => {
        const entity = {
          name: 'test2',
          created: 1234,
        };
        const result = await element.updateEnvironment(entity);
        const { item } = result;
        assert.typeOf(item, 'object', 'is an object');
        assert.typeOf(item._id, 'string', 'has an id');
        assert.typeOf(item._rev, 'string', 'has a rev');
        assert.equal(item.name, 'test2', 'has the name');
        assert.equal(item.created, 1234, 'has the created');
      });

      it('updates created entity without the revision', async () => {
        const entity = {
          name: 'test3',
        };
        const r1 = await element.updateEnvironment(entity);
        entity._id = r1.id;
        entity.name = 'other';
        const r2 = await element.updateEnvironment(entity);
        assert.equal(r2.id, r1.id, 'has the id');
        assert.typeOf(r2.rev, 'string', 'has a new rev');
        assert.notEqual(r2.rev, r1.rev, 'has updated rev');
        assert.equal(r2.item.name, 'other', 'has updated name');
      });

      it('updates created entity with the revision', async () => {
        const entity = {
          name: 'test4',
        };
        const r1 = await element.updateEnvironment(entity);
        entity._id = r1.id;
        entity._rev = r1.rev;
        entity.name = 'other';
        const r2 = await element.updateEnvironment(entity);
        assert.equal(r2.id, r1.id, 'has the id');
        assert.typeOf(r2.rev, 'string', 'has a new rev');
        assert.notEqual(r2.rev, r1.rev, 'has updated rev');
        assert.equal(r2.item.name, 'other', 'has updated name');
      });

      it('dispatches change event', async () => {
        const entity = {
          name: 'test5',
        };
        const spy = sinon.spy();
        element.addEventListener(ArcModelEventTypes.Environment.State.update, spy);
        await element.updateEnvironment(entity);
        assert.isTrue(spy.calledOnce);
      });

      it('changes the name on related variables', async () => {
        const entity = {
          name: 'test6',
        };
        const spy = sinon.spy();
        element.addEventListener(ArcModelEventTypes.Environment.State.update, spy);
        const record1 = await element.updateEnvironment(entity);
        const variable = /** @type ARCVariable */ (generator.generateVariableObject());
        variable.environment = entity.name;
        const response1 = await element.variableDb.post(variable);
        entity._id = record1.id;
        entity.name = 'other name';
        await element.updateEnvironment(entity);
        const doc = /** @type ARCVariable */ (await element.variableDb.get(response1.id));
        assert.equal(doc.environment, 'other name');
      });

      it('ignores related variables name change when no name change', async () => {
        const entity = {
          name: 'test7',
        };
        const spy = sinon.spy();
        element.addEventListener(ArcModelEventTypes.Environment.State.update, spy);
        const record1 = await element.updateEnvironment(entity);
        const variable = /** @type ARCVariable */ (generator.generateVariableObject());
        variable.environment = entity.name;
        const response1 = await element.variableDb.post(variable);
        entity._id = record1.id;
        entity.created = 1234;
        await element.updateEnvironment(entity);
        const doc = /** @type ARCVariable */ (await element.variableDb.get(response1.id));
        assert.equal(doc.environment, 'test7');
      });

      it('throws when no name', async () => {
        let thrown = false;
        try {
          const entity = {
            created: 1234,
          };
          // @ts-ignore
          await element.updateEnvironment(entity);
        } catch (e) {
          thrown = true;
        }
        assert.isTrue(thrown);
      });

      it('removes unknown id from the entity', async () => {
        const entity = {
          name: 'test2',
          created: 1234,
          _id: 'unknown'
        };
        const result = await element.updateEnvironment(entity);
        assert.notEqual(result.id, 'unknown');
      });
    });

    describe('readEnvironment()', () => {
      let element = /** @type VariablesModel */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      let created = /** @type ARCEnvironment */ (null);
      before(async () => {
        const vars = /** @type ARCVariable[] */ (await generator.insertVariablesData({
          size: 1,
        }));
        const entity = {
          name: vars[0].environment,
        };
        const model = await basicFixture();
        const record = await model.updateEnvironment(entity);
        created = record.item;
      });

      after(async () => {
        await generator.destroyVariablesData();
      });

      it('reads existing environment by its name', async () => {
        const result = await element.readEnvironment(created.name);
        assert.typeOf(result, 'object');
        assert.equal(result.name, created.name);
      });

      it('returns undefined if the environment is unknown', async () => {
        const result = await element.readEnvironment('some random value');
        assert.isUndefined(result);
      });
    });

    describe('deleteEnvironment()', () => {
      let element = /** @type VariablesModel */ (null);
      let created = /** @type ARCEnvironment */ (null);
      beforeEach(async () => {
        const vars = /** @type ARCVariable[] */ (await generator.insertVariablesData({
          size: 1,
          randomEnv: true,
        }));
        const entity = {
          name: vars[0].environment,
        };
        element = await basicFixture();
        const model = await basicFixture();
        const record = await model.updateEnvironment(entity);
        created = record.item;
      });

      afterEach(async () => {
        await generator.destroyVariablesData();
      });

      it('removes an entity from the data store', async () => {
        await element.deleteEnvironment(created._id);
        const result = await element.readEnvironment(created.name);
        assert.isUndefined(result);
      });

      it('returns a delete record', async () => {
        const result = await element.deleteEnvironment(created._id);
        assert.equal(result.id, created._id, 'has the id');
        assert.typeOf(result.rev, 'string', 'has a rev');
        assert.notEqual(result.rev, created._rev, 'has updated rev');
      });

      it('dispatches the change event', async () => {
        const spy = sinon.spy();
        element.addEventListener(ArcModelEventTypes.Environment.State.delete, spy);
        await element.deleteEnvironment(created._id);
        assert.isTrue(spy.called);
      });

      it('throws when no id', async () => {
        let thrown = false;
        try {
          await element.deleteEnvironment(undefined);
        } catch (e) {
          thrown = true;
        }
        assert.isTrue(thrown);
      });

      it('removes environment variables', async () => {
        const variable = /** @type ARCVariable */ (generator.generateVariableObject());
        variable.environment = created.name;
        const response1 = await element.variableDb.post(variable);
        await element.deleteEnvironment(created._id);
        let thrown = false;
        try {
          await element.variableDb.get(response1.id)
        } catch (e) {
          thrown = true;
        }
        assert.isTrue(thrown);
      });

      it('ignores unknown environments', async () => {
        await element.deleteEnvironment('other id');
      });
    });

    describe('listEnvironments()', () => {
      before(async () => {
        const model = await basicFixture();
        const items = Array(30).fill(0).map(() => {
          return {
            name: 'a name',
          }
        });
        await model.environmentDb.bulkDocs(items);
      });

      let element = /** @type VariablesModel */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      after(async () => {
        await generator.destroyVariablesData();
      });

      it('returns a query result for default parameters', async () => {
        const result = await element.listEnvironments();
        assert.typeOf(result, 'object', 'result is an object');
        assert.typeOf(result.nextPageToken, 'string', 'has page token');
        assert.typeOf(result.items, 'array', 'has response items');
        assert.lengthOf(result.items, element.defaultQueryOptions.limit, 'has default limit of items');
      });

      it('respects "limit" parameter', async () => {
        const result = await element.listEnvironments({
          limit: 5,
        });
        assert.lengthOf(result.items, 5);
      });

      it('respects "nextPageToken" parameter', async () => {
        const result1 = await element.listEnvironments({
          limit: 10,
        });
        const result2 = await element.listEnvironments({
          nextPageToken: result1.nextPageToken,
        });
        assert.lengthOf(result2.items, 20);
      });

      it('does not set "nextPageToken" when no more results', async () => {
        const result1 = await element.listEnvironments({
          limit: 40,
        });
        const result2 = await element.listEnvironments({
          nextPageToken: result1.nextPageToken,
        });
        assert.isUndefined(result2.nextPageToken);
      });
    });

    describe('listAllEnvironments()', () => {
      before(async () => {
        const model = await basicFixture();
        const items = Array(32).fill(0).map(() => {
          return {
            name: 'a name',
          }
        });
        await model.environmentDb.bulkDocs(items);
      });

      let element = /** @type VariablesModel */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      after(async () => {
        await generator.destroyVariablesData();
      });

      it('returns model list result', async () => {
        const result = await element.listAllEnvironments();
        assert.typeOf(result, 'object', 'is an object');
        assert.typeOf(result.items, 'array', 'has items');
      });

      it('returns all items from the data store', async () => {
        const result = await element.listAllEnvironments();
        assert.lengthOf(result.items, 32, 'has all results');
      });
    });

    describe('updateVariable()', () => {
      let element = /** @type VariablesModel */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      after(async () => {
        await generator.destroyVariablesData();
      });

      it('returns the changelog', async () => {
        const entity = /** @type ARCVariable */ (generator.generateVariableObject());
        const result = await element.updateVariable(entity);
        assert.typeOf(result, 'object', 'returns an object');
        assert.typeOf(result.id, 'string', 'has an id');
        assert.typeOf(result.rev, 'string', 'has a rev');
        assert.typeOf(result.item, 'object', 'has created object');
        assert.isUndefined(result.oldRev, 'has no oldRev');
      });

      it('creates a new variable in the data store', async () => {
        const entity = /** @type ARCVariable */ (generator.generateVariableObject());
        const record = await element.updateVariable(entity);
        const result = await element.variableDb.get(record.id);
        assert.typeOf(result, 'object');
        assert.equal(result.name, entity.name);
        assert.equal(result.value, entity.value);
        assert.equal(result.environment, entity.environment);
      });

      it('throws when no variable', async () => {
        const entity = /** @type ARCVariable */ (generator.generateVariableObject());
        delete entity.name;
        let thrown = false;
        try {
          await element.updateVariable(entity);
        } catch (e) {
          thrown = true;
        }
        assert.isTrue(thrown);
      });

      it('ignores unknown id', async () => {
        const entity = /** @type ARCVariable */ (generator.generateVariableObject());
        entity._id = 'some id';
        const result = await element.updateVariable(entity);
        assert.typeOf(result, 'object', 'returns an object');
      });

      it('updated existing entity', async () => {
        const entity = /** @type ARCVariable */ (generator.generateVariableObject());
        const result1 = await element.updateVariable(entity);
        entity._id = result1.id;
        entity._rev = result1.rev;
        entity.value = 'other value';
        const result2 = await element.updateVariable(entity);
        assert.notEqual(result2.rev, result1.rev, 'has different rev');
        assert.equal(result2.id, result1.id, 'has the same id');
        assert.equal(result2.item.value, 'other value', 'has other name');
      });
    });

    describe('deleteVariable()', () => {
      let element = /** @type VariablesModel */ (null);
      let created = /** @type ARCVariable[] */ (null);
      beforeEach(async () => {
        element = await basicFixture();
        // @ts-ignore
        created = await generator.insertVariablesData({
          size: 1,
        });
      });

      afterEach(async () => {
        await generator.destroyVariablesData();
      });

      it('throws when no id', async () => {
        let thrown = false;
        try {
          await element.deleteVariable(undefined);
        } catch (e) {
          thrown = true;
        }
        assert.isTrue(thrown);
      });

      it('deletes a variable from the store', async () => {
        await element.deleteVariable(created[0]._id);
        let thrown = false;
        try {
          await element.variableDb.get(created[0]._id);
        } catch (e) {
          thrown = true;
        }
        assert.isTrue(thrown);
      });

      it('returns delete record', async () => {
        const result = await element.deleteVariable(created[0]._id);
        assert.equal(result.id, created[0]._id);
        assert.typeOf(result.rev, 'string');
      });

      it('dispatches the change event', async () => {
        const spy = sinon.spy();
        element.addEventListener(ArcModelEventTypes.Variable.State.delete, spy);
        await element.deleteVariable(created[0]._id);
        assert.isTrue(spy.called);
      });
    });

    describe('listAllVariables()', () => {
      let element = /** @type VariablesModel */ (null);
      let created = /** @type ARCVariable[] */ (null);
      beforeEach(async () => {
        // @ts-ignore
        created = await generator.insertVariablesData({
          size: 32,
        });
        const entity = /** @type ARCVariable */ (generator.generateVariableObject());
        entity.environment = created[0].environment;
        element = await basicFixture();
        await element.updateVariable(entity);
        await element.updateVariable({
          environment: '',
          name: 'x',
          value: 'y',
          enabled: true,
        });
      });

      afterEach(async () => {
        await generator.destroyVariablesData();
      });

      it('returns no results for unknown environment', async () => {
        const result = await element.listAllVariables('some unknown environment');
        assert.lengthOf(result.items, 0);
      });

      it('returns all results for an environment', async () => {
        const result = await element.listAllVariables(created[0].environment);
        assert.isAbove(result.items.length, 1);
      });

      it('is case insensitive', async () => {
        const result = await element.listAllVariables(created[0].environment.toUpperCase());
        assert.isAbove(result.items.length, 1);
      });

      it('ignores variables without environment', async () => {
        const result = await element.listAllVariables('');
        assert.lengthOf(result.items, 0);
      });
    });

    describe('listVariables()', () => {
      let element = /** @type VariablesModel */ (null);
      let created = /** @type ARCVariable[] */ (null);
      beforeEach(async () => {
        // @ts-ignore
        created = await generator.insertVariablesData({
          size: 32,
        });
        const entity = /** @type ARCVariable */ (generator.generateVariableObject());
        entity.environment = created[0].environment;
        element = await basicFixture();
        await element.updateVariable(entity);
      });

      afterEach(async () => {
        await generator.destroyVariablesData();
      });

      it('returns a query result for default parameters', async () => {
        const result = await element.listVariables(created[0].environment);
        assert.typeOf(result, 'object', 'result is an object');
        assert.typeOf(result.nextPageToken, 'string', 'has page token');
        assert.typeOf(result.items, 'array', 'has response items');
        assert.isAbove(result.items.length, 1, 'has items');
      });

      it('respects "limit" parameter', async () => {
        const result = await element.listVariables(created[0].environment, {
          limit: 3,
        });
        assert.isAtLeast(result.items.length, 2);
      });

      it('respects "nextPageToken" parameter', async () => {
        const result1 = await element.listVariables(created[0].environment, {
          limit: 1,
        });
        const result2 = await element.listVariables(created[0].environment, {
          nextPageToken: result1.nextPageToken,
        });
        assert.isAtLeast(result2.items.length, 1);
      });
    });
  });
});
