import { fixture, assert } from '@open-wc/testing';
import sinon from 'sinon';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import 'chance/dist/chance.min.js';
import '../../rest-api-model.js';
import { ArcModelEventTypes } from '../../src/events/ArcModelEventTypes.js';
import { ArcModelEvents } from '../../src/events/ArcModelEvents.js';

/* eslint-disable prefer-destructuring */

/** @typedef {import('../../src/RestApiModel').RestApiModel} RestApiModel */
/** @typedef {import('@advanced-rest-client/arc-types').RestApi.ARCRestApiIndex} ARCRestApiIndex */
/** @typedef {import('@advanced-rest-client/arc-types').RestApi.ARCRestApi} ARCRestApi */

describe('RestApiModel', () => {
  const generator = new DataGenerator();
  /**
   * @return {Promise<RestApiModel>}
   */
  async function basicFixture() {
    return fixture('<rest-api-model></rest-api-model>');
  }

  describe('Events API', () => {
    describe(`${ArcModelEventTypes.RestApi.read} event`, () => {
      let created;
      let element = /** @type RestApiModel */ (null);
      beforeEach(async () => {
        element = await basicFixture();
        const entity = /** @type ARCRestApiIndex */ (generator.generateApiIndex());
        created = await element.indexDb.put(entity);
      });

      afterEach(async () => generator.destroyAllApiData());

      it('returns index data with the id', async () => {
        const doc = await ArcModelEvents.RestApi.read(document.body, created.id);
        assert.equal(doc._id, created.id);
      });

      it('returns index data with the rev', async () => {
        const doc = await ArcModelEvents.RestApi.read(document.body, created.id, created.rev);
        assert.equal(doc._id, created.id);
        assert.equal(doc._rev, created.rev);
      });

      it('ignores the event when cancelled', async () => {
        document.body.addEventListener(ArcModelEventTypes.RestApi.read, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.RestApi.read, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.RestApi.read, {
          bubbles: true,
          cancelable: true,
          detail: { result: undefined },
        });
        document.body.dispatchEvent(e);
        assert.isUndefined(e.detail.result);
      });
    });

    describe(`${ArcModelEventTypes.RestApi.update} event`, () => {
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
        const result = await ArcModelEvents.RestApi.update(document.body, entity);
        assert.typeOf(result, 'object', 'returns an object');
        assert.typeOf(result.id, 'string', 'has an id');
        assert.typeOf(result.rev, 'string', 'has a rev');
        assert.typeOf(result.item, 'object', 'has created object');
        assert.isUndefined(result.oldRev, 'has no oldRev');
      });

      it('creates new object in the data store', async () => {
        const record = await ArcModelEvents.RestApi.update(document.body, entity);
        const result = await element.indexDb.get(record.id);
        assert.typeOf(result, 'object');
      });

      it('returns the created entity', async () => {
        const record = await ArcModelEvents.RestApi.update(document.body, entity);
        const { item } = record;
        assert.typeOf(item, 'object', 'is an object');
        assert.typeOf(item._id, 'string', 'has an id');
        assert.typeOf(item._rev, 'string', 'has a rev');
        assert.equal(item.title, entity.title, 'has the title');
      });

      it('dispatches change event', async () => {
        const spy = sinon.spy();
        element.addEventListener(ArcModelEventTypes.RestApi.State.update, spy);
        await ArcModelEvents.RestApi.update(document.body, entity);
        assert.isTrue(spy.calledOnce);
      });

      it('ignores the event when cancelled', async () => {
        document.body.addEventListener(ArcModelEventTypes.RestApi.update, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.RestApi.update, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.RestApi.update, {
          bubbles: true,
          cancelable: true,
          detail: { result: undefined },
        });
        document.body.dispatchEvent(e);
        assert.isUndefined(e.detail.result);
      });
    });

    describe(`${ArcModelEventTypes.RestApi.dataUpdate} event`, () => {
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
        const result = await ArcModelEvents.RestApi.dataUpdate(document.body, entity);
        assert.typeOf(result, 'object', 'returns an object');
        assert.typeOf(result.id, 'string', 'has an id');
        assert.typeOf(result.rev, 'string', 'has a rev');
        assert.typeOf(result.item, 'object', 'has created object');
        assert.isUndefined(result.oldRev, 'has no oldRev');
      });

      it('creates new object in the data store', async () => {
        const record = await ArcModelEvents.RestApi.dataUpdate(document.body, entity);
        const result = await element.dataDb.get(record.id);
        assert.typeOf(result, 'object');
      });

      it('returns the created entity', async () => {
        const record = await ArcModelEvents.RestApi.dataUpdate(document.body, entity);
        const { item } = record;
        assert.typeOf(item, 'object', 'is an object');
        assert.typeOf(item._id, 'string', 'has an id');
        assert.typeOf(item._rev, 'string', 'has a rev');
        assert.equal(item.version, entity.version, 'has the version');
      });

      it('dispatches change event', async () => {
        const spy = sinon.spy();
        element.addEventListener(ArcModelEventTypes.RestApi.State.dataUpdate, spy);
        await ArcModelEvents.RestApi.dataUpdate(document.body, entity);
        assert.isTrue(spy.calledOnce);
      });

      it('ignores the event when cancelled', async () => {
        document.body.addEventListener(ArcModelEventTypes.RestApi.dataUpdate, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.RestApi.dataUpdate, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.RestApi.dataUpdate, {
          bubbles: true,
          cancelable: true,
          detail: { result: undefined },
        });
        document.body.dispatchEvent(e);
        assert.isUndefined(e.detail.result);
      });
    });

    describe(`${ArcModelEventTypes.RestApi.dataRead} event`, () => {
      let dataEntities = /** @type ARCRestApi[] */ (null);

      beforeEach(async () => {
        await basicFixture();
        // @ts-ignore
        const result = await generator.insertApiData({
          size: 1,
        });
        dataEntities = /** @type ARCRestApi[] */ (result[1]);
      });

      afterEach(() => {
        return generator.destroyAllApiData();
      });

      it('reads the entity', async () => {
        const doc = await ArcModelEvents.RestApi.dataRead(document.body, dataEntities[0]._id);
        assert.typeOf(doc, 'object');
      });

      it('returns the entity with the rev', async () => {
        const doc = await ArcModelEvents.RestApi.dataRead(document.body, dataEntities[0]._id, dataEntities[0]._rev);
        assert.equal(doc._id, dataEntities[0]._id);
        assert.equal(doc._rev, dataEntities[0]._rev);
      });

      it('ignores the event when cancelled', async () => {
        document.body.addEventListener(ArcModelEventTypes.RestApi.dataRead, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.RestApi.dataRead, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.RestApi.dataRead, {
          bubbles: true,
          cancelable: true,
          detail: { result: undefined },
        });
        document.body.dispatchEvent(e);
        assert.isUndefined(e.detail.result);
      });
    });

    describe(`${ArcModelEventTypes.RestApi.updateBulk} event`, () => {
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
        const records = await ArcModelEvents.RestApi.updateBulk(document.body, items);
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
        await ArcModelEvents.RestApi.updateBulk(document.body, items);
        assert.equal(spy.callCount, items.length);
      });

      it('ignores the event when cancelled', async () => {
        document.body.addEventListener(ArcModelEventTypes.RestApi.update, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.RestApi.update, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.RestApi.update, {
          bubbles: true,
          cancelable: true,
          detail: { result: undefined },
        });
        document.body.dispatchEvent(e);
        assert.isUndefined(e.detail.result);
      });
    });

    describe(`${ArcModelEventTypes.RestApi.versionDelete} event`, () => {
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
        await ArcModelEvents.RestApi.versionDelete(document.body, indexEntity._id, dataEntity.version);
        const doc = await element.indexDb.get(indexEntity._id);
        assert.notInclude(doc.versions, dataEntity.version);
      });

      it('removes the version entity', async () => {
        await ArcModelEvents.RestApi.versionDelete(document.body, indexEntity._id, dataEntity.version);
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
        await ArcModelEvents.RestApi.versionDelete(document.body, indexEntity._id, dataEntity.version);
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
        await ArcModelEvents.RestApi.versionDelete(document.body, indexEntity._id, dataEntity.version);
        assert.isTrue(spy.calledOnce);
      });

      it('ignores when no versions', async () => {
        const doc = await element.indexDb.get(indexEntity._id);
        delete doc.versions;
        await element.indexDb.put(doc);
        await ArcModelEvents.RestApi.versionDelete(document.body, indexEntity._id, dataEntity.version);
        const result = await element.dataDb.get(`${indexEntity._id}|${dataEntity.version}`);
        assert.ok(result);
      });

      it('ignores when versions does not exists', async () => {
        const doc = await element.indexDb.get(indexEntity._id);
        doc.versions = ['hello'];
        await element.indexDb.put(doc);
        await ArcModelEvents.RestApi.versionDelete(document.body, indexEntity._id, dataEntity.version);
        const result = await element.dataDb.get(`${indexEntity._id}|${dataEntity.version}`);
        assert.ok(result);
      });

      it('updates "latest" property when removing latest version', async () => {
        const doc = await element.indexDb.get(indexEntity._id);
        const { latest, versions } = doc;
        await ArcModelEvents.RestApi.versionDelete(document.body, indexEntity._id, latest);
        const index = await element.indexDb.get(indexEntity._id);
        assert.notEqual(index.latest, latest, 'latest is updated');
        assert.include(versions, index.latest, 'latest is one of the versions');
      });

      it('ignores the event when cancelled', async () => {
        document.body.addEventListener(ArcModelEventTypes.RestApi.versionDelete, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.RestApi.versionDelete, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.RestApi.versionDelete, {
          bubbles: true,
          cancelable: true,
          detail: { result: undefined },
        });
        document.body.dispatchEvent(e);
        assert.isUndefined(e.detail.result);
      });
    });

    describe(`${ArcModelEventTypes.RestApi.delete} event`, () => {
      let indexEntity = /** @type ARCRestApiIndex */ (null);

      beforeEach(async () => {
        const result = await generator.insertApiData({
          size: 1,
          versionSize: 5,
          order: 1,
        });
        indexEntity = /** @type ARCRestApiIndex */ (result[0][0]);
        await basicFixture();
      });

      afterEach(() => {
        return generator.destroyAllApiData();
      });

      it('removes index entity from the store', async () => {
        await ArcModelEvents.RestApi.delete(document.body, indexEntity._id);
        const indexes = await generator.getDatastoreApiIndexData();
        assert.lengthOf(indexes, 0);
      });

      it('returns delete record', async () => {
        const result = await ArcModelEvents.RestApi.delete(document.body, indexEntity._id);
        assert.equal(result.id, indexEntity._id);
        assert.typeOf(result.rev, 'string');
        assert.notEqual(result.rev, indexEntity._rev);
      });

      it('ignores the event when cancelled', async () => {
        document.body.addEventListener(ArcModelEventTypes.RestApi.delete, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.RestApi.delete, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.RestApi.delete, {
          bubbles: true,
          cancelable: true,
          detail: { result: undefined },
        });
        document.body.dispatchEvent(e);
        assert.isUndefined(e.detail.result);
      });
    });

    describe(`${ArcModelEventTypes.RestApi.list} event`, () => {
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
        const result = await ArcModelEvents.RestApi.list(document.body);
        assert.typeOf(result, 'object', 'result is an object');
        assert.typeOf(result.nextPageToken, 'string', 'has page token');
        assert.typeOf(result.items, 'array', 'has response items');
        assert.lengthOf(result.items, element.defaultQueryOptions.limit, 'has default limit of items');
      });

      it('respects "limit" parameter', async () => {
        const result = await ArcModelEvents.RestApi.list(document.body, {
          limit: 5,
        });
        assert.lengthOf(result.items, 5);
      });

      it('respects "nextPageToken" parameter', async () => {
        const result1 = await ArcModelEvents.RestApi.list(document.body, {
          limit: 10,
        });
        const result2 = await ArcModelEvents.RestApi.list(document.body, {
          nextPageToken: result1.nextPageToken,
        });
        assert.lengthOf(result2.items, 20);
      });

      it('does not set "nextPageToken" when no more results', async () => {
        const result1 = await ArcModelEvents.RestApi.list(document.body, {
          limit: 40,
        });
        const result2 = await ArcModelEvents.RestApi.list(document.body, {
          nextPageToken: result1.nextPageToken,
        });
        assert.isUndefined(result2.nextPageToken);
      });

      it('ignores the event when cancelled', async () => {
        document.body.addEventListener(ArcModelEventTypes.RestApi.list, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.RestApi.list, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.RestApi.list, {
          bubbles: true,
          cancelable: true,
          detail: { result: undefined },
        });
        document.body.dispatchEvent(e);
        assert.isUndefined(e.detail.result);
      });
    });

    describe(`${ArcModelEventTypes.destroy} event`, () => {
      let element = /** @type RestApiModel */ (null);
      beforeEach(async () => {
        // @ts-ignore
        await generator.insertApiData({
          size: 10,
          versionSize: 1,
        });
        element = await basicFixture();
      });

      afterEach(() => {
        return generator.destroyAllApiData();
      });

      it('clears index data', async () => {
        const indexBefore = await generator.getDatastoreApiIndexData();
        assert.lengthOf(indexBefore, 10, 'has index data');
        await ArcModelEvents.destroy(document.body, ['rest-apis']);
        const index = await generator.getDatastoreApiIndexData();
        assert.lengthOf(index, 0, 'index is cleared');
      });

      it('clears api data store', async () => {
        const indexBefore = await generator.getDatastoreHostApiData();
        assert.lengthOf(indexBefore, 10, 'has api data');
        await ArcModelEvents.destroy(document.body, ['rest-apis']);
        const index = await generator.getDatastoreHostApiData();
        assert.lengthOf(index, 0, 'api is cleared');
      });

      it('clears on "all" store', async () => {
        const indexBefore = await generator.getDatastoreHostApiData();
        assert.lengthOf(indexBefore, 10, 'has api data');
        await ArcModelEvents.destroy(document.body, ['all']);
        const index = await generator.getDatastoreHostApiData();
        assert.lengthOf(index, 0, 'api is cleared');
      });

      it('dispatches store clear events', async () => {
        const spy = sinon.spy();
        element.addEventListener(ArcModelEventTypes.destroyed, spy);
        await ArcModelEvents.destroy(document.body, ['rest-apis']);
        assert.equal(spy.callCount, 2);
      });

      it('ignores the event when cancelled', async () => {
        document.body.addEventListener(ArcModelEventTypes.destroyed, function f(e) {
          e.preventDefault();
          document.body.removeEventListener(ArcModelEventTypes.destroyed, f);
        });
        const e = new CustomEvent(ArcModelEventTypes.destroyed, {
          bubbles: true,
          cancelable: true,
          detail: { result: undefined },
        });
        document.body.dispatchEvent(e);
        assert.isUndefined(e.detail.result);
      });
    });
  });
});
