import { assert, fixture, html } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import sinon from 'sinon';
import { ArcModelEventTypes } from '@advanced-rest-client/arc-events';
import '../../url-history-model.js';
import { sortFunction } from '../../src/UrlHistoryModel.js';

/** @typedef {import('../../src/UrlHistoryModel').UrlHistoryModel} UrlHistoryModel */
/** @typedef {import('@advanced-rest-client/arc-types').UrlHistory.ARCUrlHistory} ARCUrlHistory */

describe('UrlHistoryModel', () => {
  /**
   * @return {Promise<UrlHistoryModel>}
   */
  async function basicFixture() {
    return fixture(html`<url-history-model></url-history-model>`);
  }

  const generator = new DataGenerator();

  describe('sortFunction()', () => {
    it('Returns 1 when a "time" is bigger', () => {
      const result = sortFunction(
        {
          midnight: 1,
          cnt: 0,
          time: 0,
          url: '/',
        },
        {
          midnight: 0,
          cnt: 0,
          time: 0,
          url: '/',
        }
      );
      assert.equal(result, 1);
    });

    it('Returns 1 when a "cnt" is bigger', () => {
      const result = sortFunction(
        {
          midnight: 0,
          cnt: 1,
          time: 0,
          url: '/',
        },
        {
          midnight: 0,
          cnt: 0,
          time: 0,
          url: '/',
        }
      );
      assert.equal(result, 1);
    });

    it('Returns -1 when a "time" is smaller', () => {
      const result = sortFunction(
        {
          midnight: 0,
          cnt: 0,
          time: 0,
          url: '/',
        },
        {
          midnight: 1,
          cnt: 0,
          time: 0,
          url: '/',
        }
      );
      assert.equal(result, -1);
    });

    it('Returns -1 when a "cnt" is smaller', () => {
      const result = sortFunction(
        {
          midnight: 0,
          cnt: 0,
          time: 0,
          url: '/',
        },
        {
          midnight: 0,
          cnt: 1,
          time: 0,
          url: '/',
        }
      );
      assert.equal(result, -1);
    });

    it('Returns 0 when "time" and "cnt" equals', () => {
      const result = sortFunction(
        {
          midnight: 0,
          cnt: 0,
          time: 0,
          url: '/',
        },
        {
          midnight: 0,
          cnt: 0,
          time: 0,
          url: '/',
        }
      );
      assert.equal(result, 0);
    });
  });

  describe('list()', () => {
    before(async () => {
      const model = await basicFixture();
      const projects = /** @type ARCUrlHistory[] */ (generator.generateUrlsData({ size: 30 }));
      await model.db.bulkDocs(projects);
    });

    let element = /** @type UrlHistoryModel */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    after(async () => {
      await generator.destroyUrlData();
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
      assert.lengthOf(result2.items, 20);
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

    it('adds midnight to an item when not there', async () => {
      const entity = /** @type ARCUrlHistory */ (generator.generateUrlObject());
      entity._id = 'arc://custom-no-midnight/value';
      delete entity.midnight;
      await element.update(entity);
      const result = await element.list({
        limit: 31,
      });
      const item = result.items.find((i) => i._id === entity._id);
      assert.typeOf(item.midnight, 'number');
    });

    it('uses existing "midnight" value when set', async () => {
      const entity = /** @type ARCUrlHistory */ (generator.generateUrlObject());
      entity._id = 'arc://custom-with-midnight/value';
      entity.midnight = 100;
      await element.update(entity);
      const result = await element.list({
        limit: 32,
      });
      const item = result.items.find((i) => i._id === entity._id);
      assert.equal(item.midnight, 100);
    });
  });

  describe('addUrl()', () => {
    let element = /** @type UrlHistoryModel */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    afterEach(async () => {
      await generator.destroyUrlData();
    });

    it('returns the changelog', async () => {
      const entity = /** @type ARCUrlHistory */ (generator.generateUrlObject());
      const result = await element.addUrl(entity._id);
      assert.typeOf(result, 'object', 'returns an object');
      assert.typeOf(result.id, 'string', 'has an id');
      assert.typeOf(result.rev, 'string', 'has a rev');
      assert.typeOf(result.item, 'object', 'has created object');
      assert.isUndefined(result.oldRev, 'has no oldRev');
    });

    it('creates an item in the data store', async () => {
      const entity = /** @type ARCUrlHistory */ (generator.generateUrlObject());
      await element.addUrl(entity._id);
      const result = /** @type ARCUrlHistory */ (await element.db.get(entity._id));
      assert.typeOf(result, 'object', 'returns an object');
      assert.equal(result._id, entity._id, 'has the id');
      assert.typeOf(result._rev, 'string', 'has a rev');
      assert.equal(result.cnt, 1, 'has default cnt property');
      assert.typeOf(result.time, 'number', 'has time property');
      assert.typeOf(result.url, 'string', 'has url property');
    });

    it('updates the counter on the same item', async () => {
      const entity = /** @type ARCUrlHistory */ (generator.generateUrlObject());
      await element.addUrl(entity._id);
      await element.addUrl(entity._id);
      const result = /** @type ARCUrlHistory */ (await element.db.get(entity._id));
      assert.equal(result.cnt, 2, 'has default cnt property');
    });

    it('dispatches change event', async () => {
      const entity = /** @type ARCUrlHistory */ (generator.generateUrlObject());
      const spy = sinon.spy();
      element.addEventListener(ArcModelEventTypes.UrlHistory.State.update, spy);
      await element.addUrl(entity._id);
      assert.isTrue(spy.calledOnce);
    });

    it('adds midnight value', async () => {
      const entity = /** @type ARCUrlHistory */ (generator.generateUrlObject());
      delete entity.midnight;
      const result = await element.addUrl(entity._id);
      assert.typeOf(result.item.midnight, 'number');
    });

    it('adds url value', async () => {
      const entity = /** @type ARCUrlHistory */ (generator.generateUrlObject());
      delete entity.url;
      const result = await element.addUrl(entity._id);
      assert.typeOf(result.item.url, 'string');
    });

    it('lower-cases the _id', async () => {
      const url = 'https://API.domain.com';
      const result = await element.addUrl(url);
      assert.equal(result.id, url.toLowerCase());
    });
  });

  describe('update()', () => {
    let element = /** @type UrlHistoryModel */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    afterEach(async () => {
      await generator.destroyUrlData();
    });

    it('returns the changelog', async () => {
      const entity = /** @type ARCUrlHistory */ (generator.generateUrlObject());
      const result = await element.update(entity);
      assert.typeOf(result, 'object', 'returns an object');
      assert.typeOf(result.id, 'string', 'has an id');
      assert.typeOf(result.rev, 'string', 'has a rev');
      assert.typeOf(result.item, 'object', 'has created object');
      assert.isUndefined(result.oldRev, 'has no oldRev');
    });

    it('creates an item in the data store', async () => {
      const entity = /** @type ARCUrlHistory */ (generator.generateUrlObject());
      await element.update(entity);
      const result = /** @type ARCUrlHistory */ (await element.db.get(entity._id));
      assert.typeOf(result, 'object', 'returns an object');
      assert.equal(result._id, entity._id, 'has the id');
      assert.typeOf(result._rev, 'string', 'has a rev');
    });

    it('dispatches change event', async () => {
      const entity = /** @type ARCUrlHistory */ (generator.generateUrlObject());
      const spy = sinon.spy();
      element.addEventListener(ArcModelEventTypes.UrlHistory.State.update, spy);
      await element.update(entity);
      assert.isTrue(spy.calledOnce);
    });
  });

  describe('query()', () => {
    let created = /** @type ARCUrlHistory[] */ (null)
    before(async () => {
      const model = await basicFixture();
      created = /** @type ARCUrlHistory[] */ (generator.generateUrlsData({ size: 30 }));
      await model.db.bulkDocs(created);
    });

    let element = /** @type UrlHistoryModel */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    after(async () => {
      await generator.destroyUrlData();
    });

    it('returns a list of matched results', async () => {
      const result = await element.query('http://');
      assert.typeOf(result, 'array', 'result is an array');
      assert.lengthOf(result, 30, 'has all results');
    });

    it('matches the URL', async () => {
      const result = await element.query(created[0]._id);
      assert.lengthOf(result, 1);
    });

    it('returns empty array when not found', async () => {
      const result = await element.query('this will not exist');
      assert.lengthOf(result, 0);
    });

    it('adds midnight to an item when not there', async () => {
      const entity = /** @type ARCUrlHistory */ (generator.generateUrlObject());
      entity._id = 'arc://custom-no-midnight/value';
      delete entity.midnight;
      await element.update(entity);
      const result = await element.query(entity._id);
      const [item] = result;
      assert.typeOf(item.midnight, 'number');
    });

    it('uses existing "midnight" value when set', async () => {
      const entity = /** @type ARCUrlHistory */ (generator.generateUrlObject());
      entity._id = 'arc://custom-with-midnight/value';
      entity.midnight = 100;
      await element.update(entity);
      const result = await element.query(entity._id);
      const [item] = result;
      assert.equal(item.midnight, 100);
    });

    it('adds url to an item when not there', async () => {
      const entity = /** @type ARCUrlHistory */ (generator.generateUrlObject());
      entity._id = 'arc://custom-no-url/value';
      delete entity.url;
      await element.update(entity);
      const result = await element.query(entity._id);
      const [item] = result;
      assert.typeOf(item.url, 'string');
    });

    it('uses existing "url" value when set', async () => {
      const entity = /** @type ARCUrlHistory */ (generator.generateUrlObject());
      entity._id = 'arc://custom-with-url/value';
      entity.url = 'https://API.domain.com';
      await element.update(entity);
      const result = await element.query(entity._id);
      const [item] = result;
      assert.equal(item.url, 'https://API.domain.com');
    });

    it('queries using lowercase keys', async () => {
      await element.addUrl('https://API.domain.com');
      const result = await element.query('https://api.DomaIN.com');
      const [item] = result;
      assert.equal(item.url, 'https://API.domain.com');
    });
  });

  describe('delete()', () => {
    afterEach(() => generator.destroyUrlData());

    /** @type {UrlHistoryModel} */
    let element;
    /** @type ARCUrlHistory */
    let dataObj;
    beforeEach(async () => {
      element = await basicFixture();
      const doc = /** @type ARCUrlHistory */ (generator.generateUrlObject());
      const record = await element.update(doc);
      dataObj = record.item;
    });

    it('removes the object from the datastore', async () => {
      await element.delete(dataObj._id);
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
      element.addEventListener(ArcModelEventTypes.UrlHistory.State.delete, spy);
      await element.delete(dataObj._id);
      assert.isTrue(spy.calledOnce);
    });

    it('has change record on the state event', async () => {
      const spy = sinon.spy();
      element.addEventListener(ArcModelEventTypes.UrlHistory.State.delete, spy);
      await element.delete(dataObj._id);
      const { id, rev } = spy.args[0][0];

      assert.equal(id, dataObj._id);
      assert.typeOf(rev, 'string');
      assert.notEqual(rev, dataObj._rev);
    });
  });
});
