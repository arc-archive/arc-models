import { assert, fixture, html } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import * as sinon from 'sinon';
import '../../variables-model.js';
import { ArcModelEventTypes } from '../../src/events/ArcModelEventTypes.js';
import { ArcModelEvents } from '../../src/events/ArcModelEvents.js';

/** @typedef {import('../../src/VariablesModel').VariablesModel} VariablesModel */
/** @typedef {import('../../src/VariablesModel').ARCEnvironment} ARCEnvironment */
/** @typedef {import('../../src/VariablesModel').ARCVariable} ARCVariable */

describe('VariablesModel', () => {
  const generator = new DataGenerator();

  /**
   * @return {Promise<VariablesModel>}
   */
  async function basicFixture() {
    return fixture(html`<variables-model></variables-model>`);
  }

  describe('events API', () => {
    describe(`${ArcModelEventTypes.Environment.update} event`, () => {
      beforeEach(async () => {
        await basicFixture();
      });

      after(async () => {
        await generator.destroyVariablesData();
      });

      it('returns the changelog', async () => {
        const entity = {
          name: 'test1',
          created: 1234,
        };
        const result = await ArcModelEvents.Environment.update(document.body, entity);
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
        const result = await ArcModelEvents.Environment.update(document.body, entity);
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
        const r1 = await ArcModelEvents.Environment.update(document.body, entity);
        entity._id = r1.id;
        entity.name = 'other';
        const r2 = await ArcModelEvents.Environment.update(document.body, entity);
        assert.equal(r2.id, r1.id, 'has the id');
        assert.typeOf(r2.rev, 'string', 'has a new rev');
        assert.notEqual(r2.rev, r1.rev, 'has updated rev');
        assert.equal(r2.item.name, 'other', 'has updated name');
      });

      it('updates created entity with the revision', async () => {
        const entity = {
          name: 'test4',
        };
        const r1 = await ArcModelEvents.Environment.update(document.body, entity);
        entity._id = r1.id;
        entity._rev = r1.rev;
        entity.name = 'other';
        const r2 = await ArcModelEvents.Environment.update(document.body, entity);
        assert.equal(r2.id, r1.id, 'has the id');
        assert.typeOf(r2.rev, 'string', 'has a new rev');
        assert.notEqual(r2.rev, r1.rev, 'has updated rev');
        assert.equal(r2.item.name, 'other', 'has updated name');
      });

      it('throws when no name', async () => {
        let thrown = false;
        try {
          const entity = {
            created: 1234,
          };
          // @ts-ignore
          await ArcModelEvents.Environment.update(document.body, entity);
        } catch (e) {
          thrown = true;
        }
        assert.isTrue(thrown);
      });

      it('ignores cancelled events', async () => {
        document.body.addEventListener(ArcModelEventTypes.Environment.update, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.Environment.update, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.Environment.update, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: { result: undefined },
        });
        document.body.dispatchEvent(e);
        assert.isUndefined(e.detail.result);
      });
    });

    describe(`${ArcModelEventTypes.Environment.read} event`, () => {
      beforeEach(async () => {
        await basicFixture();
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
        const result = await ArcModelEvents.Environment.read(document.body, created.name);
        assert.typeOf(result, 'object');
        assert.equal(result.name, created.name);
      });

      it('returns undefined if the environment is unknown', async () => {
        const result = await ArcModelEvents.Environment.read(document.body, 'some random value');
        assert.isUndefined(result);
      });

      it('ignores cancelled events', async () => {
        document.body.addEventListener(ArcModelEventTypes.Environment.read, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.Environment.read, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.Environment.read, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: { result: undefined },
        });
        document.body.dispatchEvent(e);
        assert.isUndefined(e.detail.result);
      });
    });

    describe(`${ArcModelEventTypes.Environment.delete} event`, () => {
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
        await ArcModelEvents.Environment.delete(document.body, created._id);
        const result = await ArcModelEvents.Environment.read(document.body, created.name);
        assert.isUndefined(result);
      });

      it('returns a delete record', async () => {
        const result = await ArcModelEvents.Environment.delete(document.body, created._id);
        assert.equal(result.id, created._id, 'has the id');
        assert.typeOf(result.rev, 'string', 'has a rev');
        assert.notEqual(result.rev, created._rev, 'has updated rev');
      });

      it('dispatches the change event', async () => {
        const spy = sinon.spy();
        element.addEventListener(ArcModelEventTypes.Environment.State.delete, spy);
        await ArcModelEvents.Environment.delete(document.body, created._id);
        assert.isTrue(spy.called);
      });

      it('throws when no id', async () => {
        let thrown = false;
        try {
          await ArcModelEvents.Environment.delete(document.body, undefined);
        } catch (e) {
          thrown = true;
        }
        assert.isTrue(thrown);
      });

      it('removes envrionemt variables', async () => {
        const variable = /** @type ARCVariable */ (generator.generateVariableObject());
        variable.environment = created.name;
        const response1 = await element.variableDb.post(variable);
        await ArcModelEvents.Environment.delete(document.body, created._id);
        let thrown = false;
        try {
          await element.variableDb.get(response1.id)
        } catch (e) {
          thrown = true;
        }
        assert.isTrue(thrown);
      });

      it('ignores unknown environments', async () => {
        await ArcModelEvents.Environment.delete(document.body, 'other id');
      });

      it('ignores cancelled events', async () => {
        document.body.addEventListener(ArcModelEventTypes.Environment.delete, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.Environment.delete, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.Environment.delete, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: { result: undefined },
        });
        document.body.dispatchEvent(e);
        assert.isUndefined(e.detail.result);
      });
    });

    describe(`${ArcModelEventTypes.Environment.list} event`, () => {
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
        const result = await ArcModelEvents.Environment.list(document.body);
        assert.typeOf(result, 'object', 'result is an object');
        assert.typeOf(result.nextPageToken, 'string', 'has page token');
        assert.typeOf(result.items, 'array', 'has response items');
        assert.lengthOf(result.items, element.defaultQueryOptions.limit, 'has default limit of items');
      });

      it('respects "limit" parameter', async () => {
        const result = await ArcModelEvents.Environment.list(document.body, {
          limit: 5,
        });
        assert.lengthOf(result.items, 5);
      });

      it('respects "nextPageToken" parameter', async () => {
        const result1 = await ArcModelEvents.Environment.list(document.body, {
          limit: 10,
        });
        const result2 = await ArcModelEvents.Environment.list(document.body, {
          nextPageToken: result1.nextPageToken,
        });
        assert.lengthOf(result2.items, 20);
      });

      it('does not set "nextPageToken" when no more results', async () => {
        const result1 = await ArcModelEvents.Environment.list(document.body, {
          limit: 40,
        });
        const result2 = await ArcModelEvents.Environment.list(document.body, {
          nextPageToken: result1.nextPageToken,
        });
        assert.isUndefined(result2.nextPageToken);
      });

      it('returns all model list result', async () => {
        const result = await ArcModelEvents.Environment.list(document.body, {
          readall: true,
        });
        assert.typeOf(result, 'object', 'is an object');
        assert.typeOf(result.items, 'array', 'has items');
      });

      it('ignores cancelled events', async () => {
        document.body.addEventListener(ArcModelEventTypes.Environment.list, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.Environment.list, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.Environment.list, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: { result: undefined },
        });
        document.body.dispatchEvent(e);
        assert.isUndefined(e.detail.result);
      });
    });

    describe(`${ArcModelEventTypes.Variable.update} event`, () => {
      let element = /** @type VariablesModel */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      after(async () => {
        await generator.destroyVariablesData();
      });

      it('returns the changelog', async () => {
        const entity = /** @type ARCVariable */ (generator.generateVariableObject());
        const result = await ArcModelEvents.Variable.update(document.body, entity);
        assert.typeOf(result, 'object', 'returns an object');
        assert.typeOf(result.id, 'string', 'has an id');
        assert.typeOf(result.rev, 'string', 'has a rev');
        assert.typeOf(result.item, 'object', 'has created object');
        assert.isUndefined(result.oldRev, 'has no oldRev');
      });

      it('creates a new variable in the data store', async () => {
        const entity = /** @type ARCVariable */ (generator.generateVariableObject());
        const record = await ArcModelEvents.Variable.update(document.body, entity);
        const result = await element.variableDb.get(record.id);
        assert.typeOf(result, 'object');
        assert.equal(result.variable, entity.variable);
        assert.equal(result.value, entity.value);
        assert.equal(result.environment, entity.environment);
      });

      it('throws when no variable', async () => {
        const entity = /** @type ARCVariable */ (generator.generateVariableObject());
        delete entity.variable;
        let thrown = false;
        try {
          await ArcModelEvents.Variable.update(document.body, entity);
        } catch (e) {
          thrown = true;
        }
        assert.isTrue(thrown);
      });

      it('ignores unknown id', async () => {
        const entity = /** @type ARCVariable */ (generator.generateVariableObject());
        entity._id = 'some id';
        const result = await ArcModelEvents.Variable.update(document.body, entity);
        assert.typeOf(result, 'object', 'returns an object');
      });

      it('updated existing entity', async () => {
        const entity = /** @type ARCVariable */ (generator.generateVariableObject());
        const result1 = await ArcModelEvents.Variable.update(document.body, entity);
        entity._id = result1.id;
        entity._rev = result1.rev;
        entity.value = 'other value';
        const result2 = await ArcModelEvents.Variable.update(document.body, entity);
        assert.notEqual(result2.rev, result1.rev, 'has different rev');
        assert.equal(result2.id, result1.id, 'has the same id');
        assert.equal(result2.item.value, 'other value', 'has other name');
      });

      it('ignores cancelled events', async () => {
        document.body.addEventListener(ArcModelEventTypes.Variable.update, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.Variable.update, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.Variable.update, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: { result: undefined },
        });
        document.body.dispatchEvent(e);
        assert.isUndefined(e.detail.result);
      });
    });

    describe(`${ArcModelEventTypes.Variable.delete} event`, () => {
      let element = /** @type VariablesModel */ (null);
      let created = /** @type ARCVariable[] */ (null);
      beforeEach(async () => {
        element = await basicFixture();
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
          await ArcModelEvents.Variable.delete(document.body, undefined);
        } catch (e) {
          thrown = true;
        }
        assert.isTrue(thrown);
      });

      it('deletes a variable from the store', async () => {
        await ArcModelEvents.Variable.delete(document.body, created[0]._id);
        let thrown = false;
        try {
          await element.variableDb.get(created[0]._id);
        } catch (e) {
          thrown = true;
        }
        assert.isTrue(thrown);
      });

      it('returns delete record', async () => {
        const result = await ArcModelEvents.Variable.delete(document.body, created[0]._id);
        assert.equal(result.id, created[0]._id);
        assert.typeOf(result.rev, 'string');
      });

      it('dispatches the change event', async () => {
        const spy = sinon.spy();
        element.addEventListener(ArcModelEventTypes.Variable.State.delete, spy);
        await ArcModelEvents.Variable.delete(document.body, created[0]._id);
        assert.isTrue(spy.called);
      });

      it('ignores cancelled events', async () => {
        document.body.addEventListener(ArcModelEventTypes.Variable.delete, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.Variable.delete, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.Variable.delete, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: { result: undefined },
        });
        document.body.dispatchEvent(e);
        assert.isUndefined(e.detail.result);
      });
    });

    describe(`${ArcModelEventTypes.Variable.list} event`, () => {
      let created = /** @type ARCVariable[] */ (null);
      beforeEach(async () => {
        created = await generator.insertVariablesData({
          size: 32,
        });
        const entity = /** @type ARCVariable */ (generator.generateVariableObject());
        entity.environment = created[0].environment;
        await basicFixture();
        await ArcModelEvents.Variable.update(document.body, entity);
        await ArcModelEvents.Variable.update(document.body, {
          environment: '',
          variable: 'x',
          value: 'y',
          enabled: true,
        });
      });

      afterEach(async () => {
        await generator.destroyVariablesData();
      });

      it('returns a query result for default parameters', async () => {
        const result = await ArcModelEvents.Variable.list(document.body, created[0].environment);
        assert.typeOf(result, 'object', 'result is an object');
        assert.typeOf(result.nextPageToken, 'string', 'has page token');
        assert.typeOf(result.items, 'array', 'has response items');
        assert.isAbove(result.items.length, 1, 'has items');
      });

      it('respects "limit" parameter', async () => {
        const result = await ArcModelEvents.Variable.list(document.body, created[0].environment, {
          limit: 3,
        });
        assert.isAtLeast(result.items.length, 2);
      });

      it('respects "nextPageToken" parameter', async () => {
        const result1 = await ArcModelEvents.Variable.list(document.body, created[0].environment, {
          limit: 1,
        });
        const result2 = await ArcModelEvents.Variable.list(document.body, created[0].environment, {
          nextPageToken: result1.nextPageToken,
        });
        assert.isAtLeast(result2.items.length, 1);
      });

      it('returns no results for unknown environment', async () => {
        const result = await ArcModelEvents.Variable.list(document.body, 'some unknown environment');
        assert.lengthOf(result.items, 0);
      });

      it('returns all results for an environment (readall)', async () => {
        const result = await ArcModelEvents.Variable.list(document.body, created[0].environment, {
          readall: true,
        });
        assert.isAbove(result.items.length, 1);
      });

      it('is case insensitive (readall)', async () => {
        const result = await ArcModelEvents.Variable.list(document.body, created[0].environment.toUpperCase(), {
          readall: true,
        });
        assert.isAbove(result.items.length, 1);
      });

      it('ignores variables without environment (readall)', async () => {
        const result = await ArcModelEvents.Variable.list(document.body, '', {
          readall: true,
        });
        assert.lengthOf(result.items, 0);
      });

      it('ignores cancelled events', async () => {
        document.body.addEventListener(ArcModelEventTypes.Variable.list, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.Variable.list, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.Variable.list, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: { result: undefined },
        });
        document.body.dispatchEvent(e);
        assert.isUndefined(e.detail.result);
      });
    });

    describe(`${ArcModelEventTypes.destroy} event`, () => {
      let element = /** @type VariablesModel */ (null);
      beforeEach(async () => {
        await generator.insertVariablesData();
        element = await basicFixture();
      });

      afterEach(() => {
        return generator.destroyVariablesData();
      });

      it('clears the data', async () => {
        await ArcModelEvents.destroy(document.body, ['variables']);
        const result = await generator.getDatastoreVariablesData();
        assert.lengthOf(result, 0);
      });

      it('ignores other stores', async () => {
        await ArcModelEvents.destroy(document.body, ['test store']);
        const result = await generator.getDatastoreVariablesData();
        assert.lengthOf(result, 25);
      });

      it('ignores no stores', async () => {
        await ArcModelEvents.destroy(document.body, []);
        const result = await generator.getDatastoreVariablesData();
        assert.lengthOf(result, 25);
      });

      it('dispatches deleted state events', async () => {
        const spy = sinon.spy();
        element.addEventListener(ArcModelEventTypes.destroyed, spy);
        await ArcModelEvents.destroy(document.body, ['variables']);
        assert.equal(spy.callCount, 2);
      });
    });
  });
});
