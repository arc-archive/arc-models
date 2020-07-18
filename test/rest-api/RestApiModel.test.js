import { fixture, assert } from '@open-wc/testing';
import sinon from 'sinon';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import 'chance/dist/chance.min.js';
import '../../rest-api-model.js';
import { ArcModelEventTypes } from '../../src/events/ArcModelEventTypes.js';

/* eslint-disable prefer-destructuring */

/** @typedef {import('../../src/RestApiModel').RestApiModel} RestApiModel */
/** @typedef {import('../../src/RestApiModel').ARCRestApiIndex} ARCRestApiIndex */
/** @typedef {import('../../src/RestApiModel').ARCRestApi} ARCRestApi */

describe('RestApiModel', () => {
  const generator = new DataGenerator();
  /**
   * @return {Promise<RestApiModel>}
   */
  async function basicFixture() {
    return fixture('<rest-api-model></rest-api-model>');
  }

  describe('Direct API', () => {
    describe('readIndex()', () => {
      let element = /** @type RestApiModel */ (null);
      let created;

      before(async () => {
        element = await basicFixture();
        const entity = /** @type ARCRestApiIndex */ (generator.generateApiIndex());
        created = await element.indexDb.put(entity);
      });

      after(async () => generator.destroyAllApiData());

      it('returns index data with the id', async () => {
        const doc = await element.readIndex(created.id);
        assert.equal(doc._id, created.id);
      });

      it('returns index data with the rev', async () => {
        const doc = await element.readIndex(created.id, created.rev);
        assert.equal(doc._id, created.id);
        assert.equal(doc._rev, created.rev);
      });
    });

    describe('updateIndex()', () => {
      after(() => {
        return generator.destroyAllApiData();
      });

      let element = /** @type RestApiModel */ (null);
      let entity = /** @type ARCRestApiIndex */ (null);
      beforeEach(async () => {
        element = await basicFixture();
        entity = /** @type ARCRestApiIndex */ (generator.generateApiIndex());
      });

      it('returns the changelog', async () => {
        const result = await element.updateIndex(entity);
        assert.typeOf(result, 'object', 'returns an object');
        assert.typeOf(result.id, 'string', 'has an id');
        assert.typeOf(result.rev, 'string', 'has a rev');
        assert.typeOf(result.item, 'object', 'has created object');
        assert.isUndefined(result.oldRev, 'has no oldRev');
      });

      it('creates new object in the data store', async () => {
        const record = await element.updateIndex(entity);
        const result = await element.indexDb.get(record.id);
        assert.typeOf(result, 'object');
      });

      it('returns the created entity', async () => {
        const record = await element.updateIndex(entity);
        const { item } = record;
        assert.typeOf(item, 'object', 'is an object');
        assert.typeOf(item._id, 'string', 'has an id');
        assert.typeOf(item._rev, 'string', 'has a rev');
        assert.equal(item.title, entity.title, 'has the title');
      });

      it('dispatches change event', async () => {
        const spy = sinon.spy();
        element.addEventListener(ArcModelEventTypes.RestApi.State.update, spy);
        await element.updateIndex(entity);
        assert.isTrue(spy.calledOnce);
      });
    });

    describe('updateData()', () => {
      after(() => {
        return generator.destroyAllApiData();
      });

      let element = /** @type RestApiModel */ (null);
      let entity = /** @type ARCRestApi */ (null);;
      beforeEach(async () => {
        element = await basicFixture();
        const index = /** @type ARCRestApiIndex */ (generator.generateApiIndex());
        entity = /** @type ARCRestApi */ (generator.generateApiData(index));
      });

      it('returns the changelog', async () => {
        const result = await element.updateData(entity);
        assert.typeOf(result, 'object', 'returns an object');
        assert.typeOf(result.id, 'string', 'has an id');
        assert.typeOf(result.rev, 'string', 'has a rev');
        assert.typeOf(result.item, 'object', 'has created object');
        assert.isUndefined(result.oldRev, 'has no oldRev');
      });

      it('creates new object in the data store', async () => {
        const record = await element.updateData(entity);
        const result = await element.dataDb.get(record.id);
        assert.typeOf(result, 'object');
      });

      it('returns the created entity', async () => {
        const record = await element.updateData(entity);
        const { item } = record;
        assert.typeOf(item, 'object', 'is an object');
        assert.typeOf(item._id, 'string', 'has an id');
        assert.typeOf(item._rev, 'string', 'has a rev');
        assert.equal(item.version, entity.version, 'has the version');
      });

      it('dispatches change event', async () => {
        const spy = sinon.spy();
        element.addEventListener(ArcModelEventTypes.RestApi.State.dataUpdate, spy);
        await element.updateData(entity);
        assert.isTrue(spy.calledOnce);
      });
    });

    describe('readData()', () => {
      let element = /** @type RestApiModel */ (null);
      let dataEntities = /** @type ARCRestApi[] */ (null);

      before(async () => {
        element = await basicFixture();
        // @ts-ignore
        const result = await generator.insertApiData({
          size: 1,
        });
        dataEntities = /** @type ARCRestApi[] */ (result[1]);
      });

      after(() => {
        return generator.destroyAllApiData();
      });

      it('reads the entity', async () => {
        const doc = await element.readData(dataEntities[0]._id);
        assert.typeOf(doc, 'object');
      });

      it('returns the entity with the rev', async () => {
        const doc = await element.readData(dataEntities[0]._id, dataEntities[0]._rev);
        assert.equal(doc._id, dataEntities[0]._id);
        assert.equal(doc._rev, dataEntities[0]._rev);
      });
    });

    describe('updateIndexBatch()', () => {
      let element = /** @type RestApiModel */ (null);
      let items = /** @type ARCRestApiIndex[] */ (null);

      beforeEach(async () => {
        element = await basicFixture();
        // @ts-ignore
        items = /** @type ARCRestApiIndex[] */ (generator.generateApiIndexList({
          size: 10,
        }));
      });

      after(() => {
        return generator.destroyAllApiData();
      });

      it('returns the changelog for each item', async () => {
        const records = await element.updateIndexBatch(items);
        assert.typeOf(records, 'array', 'returns an array');
        assert.lengthOf(records, items.length, 'has the same number of items');
        const [result] = records;
        assert.typeOf(result, 'object', 'returns an object');
        assert.typeOf(result.id, 'string', 'has an id');
        assert.typeOf(result.rev, 'string', 'has a rev');
        assert.typeOf(result.item, 'object', 'has created object');
        assert.isUndefined(result.oldRev, 'has no oldRev');
      });

      it('dispatches change event', async () => {
        const spy = sinon.spy();
        element.addEventListener(ArcModelEventTypes.RestApi.State.update, spy);
        await element.updateIndexBatch(items);
        assert.equal(spy.callCount, items.length);
      });
    });

    describe('removeVersion()', () => {
      let element = /** @type RestApiModel */ (null);
      let indexEntity = /** @type ARCRestApiIndex */ (null);
      let dataEntity = /** @type ARCRestApi */ (null);

      beforeEach(async () => {
        const result = await generator.insertApiData({
          size: 1,
          versionSize: 5,
          order: 1,
        });
        indexEntity = /** @type ARCRestApiIndex */ (result[0][0]);
        dataEntity = /** @type ARCRestApi */ (result[1][0]);
        element = await basicFixture();
      });

      afterEach(() => {
        return generator.destroyAllApiData();
      });

      it('removes a version from the index', async () => {
        await element.removeVersion(indexEntity._id, dataEntity.version);
        const doc = await element.indexDb.get(indexEntity._id);
        assert.notInclude(doc.versions, dataEntity.version);
      });

      it('removes the version entity', async () => {
        await element.removeVersion(indexEntity._id, dataEntity.version);
        let thrown = false;
        try {
          await element.dataDb.get(`${indexEntity._id}|${dataEntity.version}`);
        } catch (e) {
          thrown = true;
        }
        assert.isTrue(thrown);
      });

      it('removes the index if has no more versions', async () => {
        const doc = await element.indexDb.get(indexEntity._id);
        doc.versions = [dataEntity.version];
        await element.indexDb.put(doc);
        await element.removeVersion(indexEntity._id, dataEntity.version);
        let thrown = false;
        try {
          await element.indexDb.get(indexEntity._id);
        } catch (e) {
          thrown = true;
        }
        assert.isTrue(thrown);
      });

      it('dispatches index change event', async () => {
        const spy = sinon.spy();
        element.addEventListener(ArcModelEventTypes.RestApi.State.update, spy);
        await element.removeVersion(indexEntity._id, dataEntity.version);
        assert.isTrue(spy.calledOnce);
      });

      it('ignores when no versions', async () => {
        const doc = await element.indexDb.get(indexEntity._id);
        delete doc.versions;
        await element.indexDb.put(doc);
        await element.removeVersion(indexEntity._id, dataEntity.version);
        const result = await element.dataDb.get(`${indexEntity._id}|${dataEntity.version}`);
        assert.ok(result);
      });

      it('ignores when versions does not exists', async () => {
        const doc = await element.indexDb.get(indexEntity._id);
        doc.versions = ['hello'];
        await element.indexDb.put(doc);
        await element.removeVersion(indexEntity._id, dataEntity.version);
        const result = await element.dataDb.get(`${indexEntity._id}|${dataEntity.version}`);
        assert.ok(result);
      });

      it('updates "latest" property when removing latest version', async () => {
        const doc = await element.indexDb.get(indexEntity._id);
        const { latest, versions } = doc;
        await element.removeVersion(indexEntity._id, latest);
        const index = await element.indexDb.get(indexEntity._id);
        assert.notEqual(index.latest, latest, 'lastest is updated');
        assert.include(versions, index.latest, 'lastest is one of the versions');
      });
    });

    describe('delete()', () => {
      let element = /** @type RestApiModel */ (null);
      let indexEntity = /** @type ARCRestApiIndex */ (null);

      beforeEach(async () => {
        const result = await generator.insertApiData({
          size: 1,
          versionSize: 5,
          order: 1,
        });
        indexEntity = /** @type ARCRestApiIndex */ (result[0][0]);
        element = await basicFixture();
      });

      afterEach(() => {
        return generator.destroyAllApiData();
      });

      it('removes index entity from the store', async () => {
        await element.delete(indexEntity._id);
        const indexes = await generator.getDatastoreApiIndexData();
        assert.lengthOf(indexes, 0);
      });

      it('removes data entities from the store', async () => {
        await element.delete(indexEntity._id);
        const indexes = await generator.getDatastoreHostApiData();
        assert.lengthOf(indexes, 0);
      });

      it('returns delete record', async () => {
        const result = await element.delete(indexEntity._id);
        assert.equal(result.id, indexEntity._id);
        assert.typeOf(result.rev, 'string');
        assert.notEqual(result.rev, indexEntity._rev);
      });

      it('dispatches index change event', async () => {
        const spy = sinon.spy();
        element.addEventListener(ArcModelEventTypes.RestApi.State.delete, spy);
        await element.delete(indexEntity._id);
        assert.isTrue(spy.calledOnce);
      });
    });

    describe('listIndex()', () => {
      let element = /** @type RestApiModel */ (null);

      beforeEach(async () => {
        // @ts-ignore
        await generator.insertApiData({
          size: 30,
          versionSize: 1,
        });
        element = await basicFixture();
      });

      afterEach(() => {
        return generator.destroyAllApiData();
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
    });
  });
});
