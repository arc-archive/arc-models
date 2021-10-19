import { fixture, assert } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import { ArcModelEventTypes, ArcModelEvents } from '@advanced-rest-client/events';
import '../../host-rules-model.js';

/** @typedef {import('../../src/HostRulesModel').HostRulesModel} HostRulesModel */
/** @typedef {import('@advanced-rest-client/events').HostRule.ARCHostRule} ARCHostRule */

describe('<host-rules-model> - Events based', () => {
  const generator = new DataGenerator();
  /**
   * @return {Promise<HostRulesModel>}
   */
  async function basicFixture() {
    return fixture('<host-rules-model></host-rules-model>');
  }

  describe(`${ArcModelEventTypes.HostRules.update} event`, () => {
    beforeEach(async () => {
      await basicFixture();
    });

    afterEach(() => generator.destroyHostRulesData());

    it('ignores cancelled events', async () => {
      const hr = /** @type ARCHostRule */ (generator.generateHostRuleObject());
      document.body.addEventListener(ArcModelEventTypes.HostRules.update, function f(e) {
        e.preventDefault();
        document.body.removeEventListener(ArcModelEventTypes.HostRules.update, f);
      });
      const e = new CustomEvent(ArcModelEventTypes.HostRules.update, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: { result: undefined },
      });
      // @ts-ignore
      e.rule = hr;
      document.body.dispatchEvent(e);
      assert.isUndefined(e.detail.result);
    });

    it('returns a change record', async () => {
      const hr = /** @type ARCHostRule */ (generator.generateHostRuleObject());
      const result = await ArcModelEvents.HostRules.update(document.body, hr);
      assert.typeOf(result.rev, 'string', 'rev is set');
      assert.typeOf(result.id, 'string', 'id is set');
      assert.typeOf(result.item, 'object', 'item is set');
    });

    it('updates created object', async () => {
      const hr = /** @type ARCHostRule */ (generator.generateHostRuleObject());
      const result = await ArcModelEvents.HostRules.update(document.body, hr);
      const originalRev = result.rev;
      result.item.comment = 'test-2';
      const result2 = await ArcModelEvents.HostRules.update(document.body, result.item);
      assert.notEqual(result2.rev, originalRev, 'rev is regenerated');
      assert.equal(result2.id, hr._id, 'id is the same');
      assert.equal(result2.item.comment, 'test-2', 'comment is set');
      assert.equal(result2.item.from, hr.from, 'from is set');
    });

    it('updates an object without "_rev" property', async () => {
      const hr = /** @type ARCHostRule */ (generator.generateHostRuleObject());
      const result = await ArcModelEvents.HostRules.update(document.body, hr);
      const originalRev = result.rev;
      result.item.comment = 'test-2';
      delete result.item._rev;
      const result2 = await ArcModelEvents.HostRules.update(document.body, result.item);
      assert.notEqual(result2.rev, originalRev, 'rev is regenerated');
      assert.equal(result2.id, hr._id, 'id is the same');
      assert.typeOf(result2.item._rev, 'string', 'has new rev');
    });

    it('throws when no update object when constructing the event', async () => {
      let thrown = false;
      try {
        await ArcModelEvents.HostRules.update(document.body, undefined);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when no update object when handling the event ', async () => {
      let thrown = false;
      try {
        const e = new CustomEvent(ArcModelEventTypes.HostRules.update, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: { result: undefined },
        });
        document.body.dispatchEvent(e);
        await e.detail.result;
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });
  });

  describe(`${ArcModelEventTypes.HostRules.updateBulk} event`, () => {
    beforeEach(async () => {
      await basicFixture();
    });

    afterEach(() => generator.destroyHostRulesData());

    it('ignores cancelled events', async () => {
      const hrs = /** @type ARCHostRule[] */ (generator.generateHostRulesData());
      document.body.addEventListener(ArcModelEventTypes.HostRules.updateBulk, function f(e) {
        e.preventDefault();
        document.body.removeEventListener(ArcModelEventTypes.HostRules.updateBulk, f);
      });
      const e = new CustomEvent(ArcModelEventTypes.HostRules.updateBulk, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: { result: undefined },
      });
      // @ts-ignore
      e.rules = hrs;
      document.body.dispatchEvent(e);
      assert.isUndefined(e.detail.result);
    });

    it('returns a change record', async () => {
      const hrs = /** @type ARCHostRule[] */ (generator.generateHostRulesData());
      const result = await ArcModelEvents.HostRules.updateBulk(document.body, hrs);
      assert.typeOf(result, 'array');
      const [item] = result;
      assert.typeOf(item.rev, 'string', 'rev is set');
      assert.typeOf(item.id, 'string', 'id is set');
      assert.typeOf(item.item, 'object', 'item is set');
    });

    it('updates created object', async () => {
      const hrs = /** @type ARCHostRule[] */ (generator.generateHostRulesData());
      const result = await ArcModelEvents.HostRules.updateBulk(document.body, hrs);
      const originalRev = result[0].rev;
      result[0].item.comment = 'test-2';
      const result2 = await ArcModelEvents.HostRules.update(document.body, result[0].item);
      assert.notEqual(result2.rev, originalRev, 'rev is regenerated');
      assert.equal(result2.id, hrs[0]._id, 'id is the same');
      assert.equal(result2.item.comment, 'test-2', 'comment is set');
      assert.equal(result2.item.from, hrs[0].from, 'from is set');
    });

    it('throws when no rules when constructing the event ', async () => {
      let thrown = false;
      try {
        await ArcModelEvents.HostRules.updateBulk(document.body, undefined);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when no rules when handling the event ', async () => {
      let thrown = false;
      try {
        const e = new CustomEvent(ArcModelEventTypes.HostRules.updateBulk, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: { result: undefined },
        });
        document.body.dispatchEvent(e);
        await e.detail.result;
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });
  });

  describe(`${ArcModelEventTypes.HostRules.delete} event`, () => {
    let dataObj;
    beforeEach(async () => {
      const element = await basicFixture();
      const hr = /** @type ARCHostRule */ (generator.generateHostRuleObject());
      const record = await element.update(hr)
      dataObj = record.item;
    });

    afterEach(() => generator.destroyHostRulesData());

    it('ignores cancelled events', async () => {
      document.body.addEventListener(ArcModelEventTypes.HostRules.delete, function f(e) {
        e.preventDefault();
        document.body.removeEventListener(ArcModelEventTypes.HostRules.delete, f);
      });
      const e = new CustomEvent(ArcModelEventTypes.HostRules.delete, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: { result: undefined },
      });
      // @ts-ignore
      e.id = dataObj._id;
      document.body.dispatchEvent(e);
      assert.isUndefined(e.detail.result);
    });

    it('removes the entity from the datastore', async () => {
      await ArcModelEvents.HostRules.delete(document.body, dataObj._id, dataObj._rev);
      const result = await generator.getDatastoreHostRulesData();
      assert.deepEqual(result, []);
    });

    it('removes the entity without rev', async () => {
      await ArcModelEvents.HostRules.delete(document.body, dataObj._id);
      const result = await generator.getDatastoreHostRulesData();
      assert.deepEqual(result, []);
    });

    it('throws when no ID when constructing the event ', async () => {
      let thrown = false;
      try {
        await ArcModelEvents.HostRules.delete(document.body, undefined);
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });

    it('throws when no id when handling the event ', async () => {
      let thrown = false;
      try {
        const e = new CustomEvent(ArcModelEventTypes.HostRules.delete, {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: { result: undefined },
        });
        document.body.dispatchEvent(e);
        await e.detail.result;
      } catch (e) {
        thrown = true;
      }
      assert.isTrue(thrown);
    });
  });

  describe(`${ArcModelEventTypes.HostRules.list} event`, () => {
    beforeEach(async () => {
      await generator.insertHostRulesData();
      await basicFixture();
    });

    afterEach(() => generator.destroyHostRulesData());

    it('ignores cancelled events', async () => {
      document.body.addEventListener(ArcModelEventTypes.HostRules.list, function f(e) {
        e.preventDefault();
        document.body.removeEventListener(ArcModelEventTypes.HostRules.list, f);
      });
      const e = new CustomEvent(ArcModelEventTypes.HostRules.list, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: { result: undefined },
      });
      document.body.dispatchEvent(e);
      assert.isUndefined(e.detail.result);
    });

    it('returns a query result for default parameters', async () => {
      const result = await ArcModelEvents.HostRules.list(document.body);
      assert.typeOf(result, 'object', 'result is an object');
      assert.typeOf(result.nextPageToken, 'string', 'has page token');
      assert.typeOf(result.items, 'array', 'has response items');
      assert.lengthOf(result.items, 25, 'has default limit of items');
    });

    it('respects "limit" parameter', async () => {
      const result = await ArcModelEvents.HostRules.list(document.body, {
        limit: 5,
      });
      assert.lengthOf(result.items, 5);
    });

    it('respects "nextPageToken" parameter', async () => {
      const result1 = await ArcModelEvents.HostRules.list(document.body, {
        limit: 10,
      });
      const result2 = await ArcModelEvents.HostRules.list(document.body, {
        nextPageToken: result1.nextPageToken,
      });
      assert.lengthOf(result2.items, 15);
    });

    it('does not set "nextPageToken" when no more results', async () => {
      const result1 = await ArcModelEvents.HostRules.list(document.body, {
        limit: 40,
      });
      const result2 = await ArcModelEvents.HostRules.list(document.body, {
        nextPageToken: result1.nextPageToken,
      });
      assert.isUndefined(result2.nextPageToken);
    });
  });
});
