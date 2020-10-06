import { fixture, assert } from '@open-wc/testing';
import sinon from 'sinon';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import '../../host-rules-model.js';
import { ArcModelEventTypes } from '../../src/events/ArcModelEventTypes.js';

/** @typedef {import('../../src/HostRulesModel').HostRulesModel} HostRulesModel */
/** @typedef {import('@advanced-rest-client/arc-types').HostRule.ARCHostRule} ARCHostRule */
/* eslint-disable no-param-reassign */

describe('<host-rules-model>', () => {
  const generator = new DataGenerator();

  /**
   * @return {Promise<HostRulesModel>}
   */
  async function basicFixture() {
    return fixture('<host-rules-model></host-rules-model>');
  }

  describe('Static methods', () => {
    describe('update()', () => {
      afterEach(() => {
        return generator.destroyHostRulesData();
      });

      let element = /** @type {HostRulesModel} */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('returns a change record', async () => {
        const item = /** @type ARCHostRule */ (generator.generateHostRuleObject());
        const result = await element.update(item);
        assert.typeOf(result.rev, 'string', 'rev is set');
        assert.typeOf(result.id, 'string', 'id is set');
        assert.typeOf(result.item, 'object', 'item is set');
      });

      it('creates a new object in the datastore', async () => {
        const hr = /** @type ARCHostRule */ (generator.generateHostRuleObject());
        const result = await element.update(hr);
        const { item } = result;
        assert.typeOf(item._rev, 'string', '_rev is set');
        assert.equal(item._id, hr._id, '_id is set');
        assert.equal(item.from, hr.from, 'from is set');
      });

      it('updates created object', async () => {
        const hr = /** @type ARCHostRule */ (generator.generateHostRuleObject());
        const result = await element.update(hr);
        const originalRev = result.rev;
        result.item.comment = 'test-2';
        const result2 = await element.update(result.item);
        assert.notEqual(result2.rev, originalRev, 'rev is regenerated');
        assert.equal(result2.id, hr._id, 'id is the same');
        assert.equal(result2.item.comment, 'test-2', 'comment is set');
        assert.equal(result2.item.from, hr.from, 'from is set');
      });

      it('dispatches change event', async () => {
        const spy = sinon.spy();
        element.addEventListener(ArcModelEventTypes.HostRules.State.update, spy);
        const hr = /** @type ARCHostRule */ (generator.generateHostRuleObject());
        await element.update(hr);
        assert.isTrue(spy.calledOnce);
      });

      it('change event has a change record', async () => {
        const spy = sinon.spy();
        element.addEventListener(ArcModelEventTypes.HostRules.State.update, spy);
        const hr = /** @type ARCHostRule */ (generator.generateHostRuleObject());
        await element.update(hr);
        // @ts-ignore
        const { changeRecord } = spy.args[0][0];
        assert.typeOf(changeRecord.rev, 'string', 'rev is set');
        assert.typeOf(changeRecord.id, 'string', 'id is set');
        assert.typeOf(changeRecord.item, 'object', 'item is set');
      });
    });

    describe('read()', () => {
      afterEach(() => {
        return generator.destroyHostRulesData();
      });

      let element = /** @type {HostRulesModel} */ (null);
      let dataObj;
      beforeEach(async () => {
        element = await basicFixture();
        const hr = /** @type ARCHostRule */ (generator.generateHostRuleObject());
        const record = await element.update(hr);
        dataObj = record.item;
      });

      it('Reads project object by id only', async () => {
        const result = await element.read(dataObj._id);
        assert.equal(result._id, dataObj._id);
      });

      it('reads a revision', async () => {
        const hr1 = await element.read(dataObj._id);
        hr1.comment = 'test-2';
        const record = await element.update(hr1);
        const hr2 = await element.read(dataObj._id, hr1._rev);
        assert.equal(hr2.comment, dataObj.comment);
        assert.notEqual(hr1._rev, record.rev);
      });
    });

    describe('delete()', () => {
      afterEach(() => {
        return generator.destroyHostRulesData();
      });

      let element = /** @type {HostRulesModel} */ (null);
      let dataObj;
      beforeEach(async () => {
        element = await basicFixture();
        const hr = /** @type ARCHostRule */ (generator.generateHostRuleObject());
        const record = await element.update(hr);
        dataObj = record.item;
      });

      it('removes object from the datastore', async () => {
        await element.delete(dataObj._id, dataObj._rev);
        let thrown = false;
        try {
          await element.read(dataObj._id);
        } catch (e) {
          thrown = true;
        }
        assert.isTrue(thrown);
      });

      it('dispatches the state event', async () => {
        const spy = sinon.spy();
        element.addEventListener(ArcModelEventTypes.HostRules.State.delete, spy);
        await element.delete(dataObj._id, dataObj._rev);
        assert.isTrue(spy.calledOnce);
      });

      it('has change record on the state event', async () => {
        const spy = sinon.spy();
        element.addEventListener(ArcModelEventTypes.HostRules.State.delete, spy);
        await element.delete(dataObj._id, dataObj._rev);
        const { id, rev } = spy.args[0][0];

        assert.equal(id, dataObj._id);
        assert.typeOf(rev, 'string');
        assert.notEqual(rev, dataObj._rev);
      });
    });

    describe('list()', () => {
      afterEach(() => {
        return generator.destroyHostRulesData();
      });

      let element = /** @type {HostRulesModel} */ (null);
      beforeEach(async () => {
        element = await basicFixture();
        await generator.insertHostRulesData();
      });

      it('returns a query result for default parameters', async () => {
        const result = await element.list();
        assert.typeOf(result, 'object', 'result is an object');
        assert.typeOf(result.nextPageToken, 'string', 'has page token');
        assert.typeOf(result.items, 'array', 'has response items');
        assert.lengthOf(result.items, element.defaultQueryOptions.limit, 'has default limit of items');
      });

      it('respects "limit" parameter', async () => {
        const result = await element.list({
          limit: 5,
        });
        assert.lengthOf(result.items, 5);
      });

      it('respects "nextPageToken" parameter', async () => {
        const result1 = await element.list({
          limit: 10,
        });
        const result2 = await element.list({
          nextPageToken: result1.nextPageToken,
        });
        assert.lengthOf(result2.items, 15);
      });

      it('does not set "nextPageToken" when no more results', async () => {
        const result1 = await element.list({
          limit: 40,
        });
        const result2 = await element.list({
          nextPageToken: result1.nextPageToken,
        });
        assert.isUndefined(result2.nextPageToken);
      });
    });

    describe('updateBulk()', () => {
      afterEach(() => {
        return generator.destroyHostRulesData();
      });

      let element = /** @type {HostRulesModel} */ (null);
      let data;
      beforeEach(async () => {
        element = await basicFixture();
        data = /** @type ARCHostRule[] */ (generator.generateHostRulesData());
      });

      it('inserts data to the store', async () => {
        await element.updateBulk(data);
        const result = /** @type ARCHostRule[] */ (await generator.getDatastoreHostRulesData());
        assert.lengthOf(result, data.length);
      });

      it('returns change record for each item', async () => {
        const result = await element.updateBulk(data)
        assert.typeOf(result, 'array');
        assert.lengthOf(result, data.length);
        const [record] = result;
        assert.typeOf(record.rev, 'string', 'rev is set');
        assert.typeOf(record.id, 'string', 'id is set');
        assert.typeOf(record.item, 'object', 'item is set');
      });
    });
  });
});
