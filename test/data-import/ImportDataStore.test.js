import { assert } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
// import { DataTestHelper } from './DataTestHelper.js';
import { ImportDataStore, transformKeys } from '../../src/lib/ImportDataStore.js';

/* global PouchDB */

/** @typedef {import('@advanced-rest-client/arc-models').ARCSavedRequest} ARCSavedRequest */
/** @typedef {import('@advanced-rest-client/arc-models').ARCHistoryRequest} ARCHistoryRequest */
/** @typedef {import('@advanced-rest-client/arc-models').ARCProject} ARCProject */
/** @typedef {import('@advanced-rest-client/arc-models').ARCWebsocketUrlHistory} ARCWebsocketUrlHistory */
/** @typedef {import('@advanced-rest-client/arc-models').ARCUrlHistory} ARCUrlHistory */
/** @typedef {import('@advanced-rest-client/arc-models').ARCAuthData} ARCAuthData */
/** @typedef {import('@advanced-rest-client/arc-models').ARCHostRule} ARCHostRule */
/** @typedef {import('@advanced-rest-client/arc-models').ARCVariable} ARCVariable */

describe('ImportDataStore', () => {
  const generator = new DataGenerator();

  describe('transformKeys()', () => {
    it('deletes "kind" property', () => {
      const item = {
        kind: 'test',
      };
      const result = transformKeys([item]);
      assert.isUndefined(result[0].kind);
    });

    it('generates "_id" property', () => {
      const item = {};
      const result = transformKeys([item]);
      assert.typeOf(result[0]._id, 'string');
    });

    it('coppies "key" property', () => {
      const item = {
        key: 'test-id'
      };
      const result = transformKeys([item]);
      assert.equal(result[0]._id, 'test-id', 'key is copied');
      assert.isUndefined(result[0].key);
    });
  });

  describe('#importRequests()', () => {
    afterEach(async () => {
      await generator.destroySavedRequestData();
    });

    function genExportItem() {
      const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
      const exportItem = { ...request, kind: 'ARC#RequestData', key: request._id };
      delete exportItem._id;
      return exportItem;
    }

    it('stores the requests data', async () => {
      const item = genExportItem();
      const store = new ImportDataStore();
      const result = await store.importRequests([item]);
      assert.isUndefined(result, 'Has no error messages');
      const stored = await generator.getDatastoreRequestData();
      assert.lengthOf(stored, 1, 'has the request in the store');
      assert.equal(stored[0]._id, item.key, 'request has the id');
    });

    it('sets "savedIndexes"', async () => {
      const item = genExportItem();
      const store = new ImportDataStore();
      await store.importRequests([item]);
      assert.lengthOf(store.savedIndexes, 1);
    });

    it('handles conflicts', async () => {
      const request = /** @type ARCSavedRequest */ (generator.generateSavedItem());
      const exportItem = { ...request, kind: 'ARC#RequestData', key: request._id };
      delete exportItem._id;
      const db = new PouchDB('saved-requests');
      const { rev } = await db.put(request);
      request.name = 'test-item';
      request._rev = rev;
      await db.put(request);

      const store = new ImportDataStore();
      await store.importRequests([exportItem]);
      const stored = await generator.getDatastoreRequestData();
      assert.notEqual(stored[0].name, 'test-item', 'has export request name');
    });
  });

  describe('#importHistory()', () => {
    afterEach(async () => {
      await generator.destroyHistoryData();
    });

    function genExportItem() {
      const request = /** @type ARCHistoryRequest */ (generator.generateHistoryObject());
      const exportItem = { ...request, kind: 'ARC#HistoryData', key: request._id };
      delete exportItem._id;
      return exportItem;
    }

    it('stores the requests data', async () => {
      const item = genExportItem();
      const store = new ImportDataStore();
      const result = await store.importHistory([item]);
      assert.isUndefined(result, 'Has no error messages');
      const stored = await generator.getDatastoreHistoryData();
      assert.lengthOf(stored, 1, 'has the request in the store');
      assert.equal(stored[0]._id, item.key, 'request has the id');
    });

    it('sets "historyIndexes"', async () => {
      const item = genExportItem();
      const store = new ImportDataStore();
      await store.importHistory([item]);
      assert.lengthOf(store.historyIndexes, 1);
    });

    it('handles conflicts', async () => {
      const request = /** @type ARCHistoryRequest */ (generator.generateHistoryObject());
      const exportItem = { ...request, kind: 'ARC#HistoryData', key: request._id };
      delete exportItem._id;
      const db = new PouchDB('history-requests');
      const { rev } = await db.put(request);
      request.url = 'test-item';
      request._rev = rev;
      await db.put(request);

      const store = new ImportDataStore();
      await store.importHistory([exportItem]);
      const stored = await generator.getDatastoreHistoryData();
      assert.notEqual(stored[0].url, 'test-item', 'has export value');
    });
  });

  describe('#importProjects()', () => {
    afterEach(async () => {
      await generator.destroySavedRequestData();
    });

    function genExportItem() {
      const item = /** @type ARCProject */ (generator.generateProjects()[0]);
      const exportItem = { ...item, kind: 'ARC#ProjectData', key: item._id };
      delete exportItem._id;
      return exportItem;
    }

    it('stores the data', async () => {
      const item = genExportItem();
      const store = new ImportDataStore();
      const result = await store.importProjects([item]);
      assert.isUndefined(result, 'Has no error messages');
      const stored = await generator.getDatastoreProjectsData();
      assert.lengthOf(stored, 1, 'has the data in the store');
      assert.equal(stored[0]._id, item.key, 'object has the id');
    });

    it('handles conflicts', async () => {
      const item = /** @type ARCProject */ (generator.generateProjects()[0]);
      const exportItem = { ...item, kind: 'ARC#ProjectData', key: item._id };
      delete exportItem._id;
      const db = new PouchDB('legacy-projects');
      const { rev } = await db.put(item);
      item.name = 'test-item';
      item._rev = rev;
      await db.put(item);

      const store = new ImportDataStore();
      await store.importProjects([exportItem]);
      const stored = await generator.getDatastoreProjectsData();
      assert.notEqual(stored[0].name, 'test-item', 'has export request name');
    });
  });

  describe('#importWebsocketUrls()', () => {
    afterEach(async () => {
      await generator.destroyWebsocketsData();
    });

    function genExportItem() {
      const item = /** @type ARCWebsocketUrlHistory */ (generator.generateUrlObject());
      const exportItem = { ...item, kind: 'ARC#WebsocketHistoryData', key: item._id };
      delete exportItem._id;
      return exportItem;
    }

    it('stores the data', async () => {
      const item = genExportItem();
      const store = new ImportDataStore();
      const result = await store.importWebsocketUrls([item]);
      assert.isUndefined(result, 'Has no error messages');
      const stored = await generator.getDatastoreWebsocketsData();
      assert.lengthOf(stored, 1, 'has the data in the store');
      assert.equal(stored[0]._id, item.key, 'object has the id');
    });

    it('handles conflicts', async () => {
      const item = /** @type ARCWebsocketUrlHistory */ (generator.generateUrlObject());
      const exportItem = { ...item, kind: 'ARC#WebsocketHistoryData', key: item._id };
      delete exportItem._id;
      const db = new PouchDB('websocket-url-history');
      const { rev } = await db.put(item);
      item.url = 'test-item';
      item._rev = rev;
      await db.put(item);

      const store = new ImportDataStore();
      await store.importWebsocketUrls([exportItem]);

      const stored = await generator.getDatastoreWebsocketsData();
      assert.notEqual(stored[0].url, 'test-item', 'has export request name');
    });
  });

  describe('#importUrls()', () => {
    afterEach(async () => {
      await generator.destroyUrlData();
    });

    function genExportItem() {
      const item = /** @type ARCUrlHistory */ (generator.generateUrlObject());
      const exportItem = { ...item, kind: 'ARC#UrlHistoryData', key: item._id };
      delete exportItem._id;
      return exportItem;
    }

    it('stores the data', async () => {
      const item = genExportItem();
      const store = new ImportDataStore();
      const result = await store.importUrls([item]);
      assert.isUndefined(result, 'Has no error messages');
      const stored = await generator.getDatastoreUrlsData();
      assert.lengthOf(stored, 1, 'has the data in the store');
      assert.equal(stored[0]._id, item.key, 'object has the id');
    });

    it('handles conflicts', async () => {
      const item = /** @type ARCUrlHistory */ (generator.generateUrlObject());
      const exportItem = { ...item, kind: 'ARC#UrlHistoryData', key: item._id };
      delete exportItem._id;
      const db = new PouchDB('url-history');
      const { rev } = await db.put(item);
      item.url = 'test-item';
      item._rev = rev;
      await db.put(item);

      const store = new ImportDataStore();
      await store.importUrls([exportItem]);

      const stored = await generator.getDatastoreUrlsData();
      assert.notEqual(stored[0].url, 'test-item', 'has export value');
    });
  });

  describe('#importAuthData()', () => {
    afterEach(async () => {
      await generator.destroyAuthData();
    });

    function genExportItem() {
      const item = /** @type ARCAuthData */ (generator.generateBasicAuthObject());
      const exportItem = { ...item, kind: 'ARC#AuthData', key: item._id };
      delete exportItem._id;
      return exportItem;
    }

    it('stores the data', async () => {
      const item = genExportItem();
      const store = new ImportDataStore();
      const result = await store.importAuthData([item]);
      assert.isUndefined(result, 'Has no error messages');
      const stored = await generator.getDatastoreAuthData();
      assert.lengthOf(stored, 1, 'has the data in the store');
      assert.equal(stored[0]._id, item.key, 'object has the id');
    });

    it('handles conflicts', async () => {
      const item = /** @type ARCAuthData */ (generator.generateBasicAuthObject());
      const exportItem = { ...item, kind: 'ARC#AuthData', key: item._id };
      delete exportItem._id;
      const db = new PouchDB('auth-data');
      const { rev } = await db.put(item);
      item.username = 'test-item';
      item._rev = rev;
      await db.put(item);

      const store = new ImportDataStore();
      await store.importAuthData([exportItem]);

      const stored = await generator.getDatastoreAuthData();
      assert.notEqual(stored[0].username, 'test-item', 'has export value');
    });
  });

  describe('#importHostRules()', () => {
    afterEach(async () => {
      await generator.destroyHostRulesData();
    });

    function genExportItem() {
      const item = /** @type ARCHostRule */ (generator.generateHostRuleObject());
      const exportItem = { ...item, kind: 'ARC#HostRule', key: item._id };
      delete exportItem._id;
      return exportItem;
    }

    it('stores the data', async () => {
      const item = genExportItem();
      const store = new ImportDataStore();
      const result = await store.importHostRules([item]);
      assert.isUndefined(result, 'Has no error messages');
      const stored = await generator.getDatastoreHostRulesData();
      assert.lengthOf(stored, 1, 'has the data in the store');
      assert.equal(stored[0]._id, item.key, 'object has the id');
    });

    it('handles conflicts', async () => {
      const item = /** @type ARCHostRule */ (generator.generateHostRuleObject());
      const exportItem = { ...item, kind: 'ARC#HostRule', key: item._id };
      delete exportItem._id;
      const db = new PouchDB('host-rules');
      const { rev } = await db.put(item);
      item.from = 'test-item';
      item._rev = rev;
      await db.put(item);

      const store = new ImportDataStore();
      await store.importHostRules([exportItem]);

      const stored = await generator.getDatastoreHostRulesData();
      assert.notEqual(stored[0].from, 'test-item', 'has export value');
    });
  });

  describe('#importVariables()', () => {
    afterEach(async () => {
      await generator.destroyVariablesData();
    });

    function genExportItem() {
      const item = /** @type ARCVariable */ (generator.generateVariableObject());
      const exportItem = { ...item, kind: 'ARC#Variable', key: item._id };
      delete exportItem._id;
      return exportItem;
    }

    it('stores the data', async () => {
      const item = genExportItem();
      const store = new ImportDataStore();
      const result = await store.importVariables([item]);
      assert.isUndefined(result, 'Has no error messages');
      const stored = await generator.getDatastoreVariablesData();
      assert.lengthOf(stored, 1, 'has the data in the store');
      assert.equal(stored[0]._id, item.key, 'object has the id');
    });

    it('handles conflicts', async () => {
      const item = /** @type ARCVariable */ (generator.generateVariableObject());
      const exportItem = { ...item, kind: 'ARC#Variable', key: item._id };
      delete exportItem._id;
      const db = new PouchDB('variables');
      const { rev } = await db.put(item);
      item.value = 'test-item';
      item._rev = rev;
      await db.put(item);

      const store = new ImportDataStore();
      await store.importVariables([exportItem]);

      const stored = await generator.getDatastoreVariablesData();
      assert.notEqual(stored[0].value, 'test-item', 'has export value');
    });
  });
});
