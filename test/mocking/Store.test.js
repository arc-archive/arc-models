import 'pouchdb/dist/pouchdb.js';
import { assert } from '@open-wc/testing';
import sinon from 'sinon';
import { Store } from '../../index.js';

/* global PouchDB */

describe('Store', () => {
  describe('insertSavedIfNotExists()', () => {
    /** @type Store */
    let store;

    before(() => { 
      store = new Store({ store: PouchDB }); 
    });

    beforeEach(async () => {
      await store.destroySaved();
    });

    it('inserts new saved request data', async () => {
      await store.insertSavedIfNotExists();
      const savedDb = new PouchDB('saved-requests');
      const docs = await savedDb.allDocs();
      assert.equal(docs.total_rows, 25);
    });

    it('inserts new projects data', async () => {
      await store.insertSavedIfNotExists();
      const savedDb = new PouchDB('legacy-projects');
      const docs = await savedDb.allDocs();
      assert.equal(docs.total_rows, 5);
    });

    it('returns generated data', async () => {
      const result = await store.insertSavedIfNotExists();
      assert.lengthOf(result.requests, 25, 'Has requests array');
      assert.lengthOf(result.projects, 5, 'Has projects array');

      assert.typeOf(result.requests[0]._id, 'string', 'Request has _id');
      assert.typeOf(result.requests[0]._rev, 'string', 'Request has _rev');

      assert.typeOf(result.projects[0]._id, 'string', 'Project has _id');
      assert.typeOf(result.projects[0]._rev, 'string', 'Project has _rev');
    });

    it('ignores insert of requests when exists', async () => {
      // More than 1 can cause order problems
      // Retrieved from the data store documents may be in different order
      // so it's safer to test single request to reduce tests logic
      const insert = await store.insertSaved(1);
      const result = await store.insertSavedIfNotExists();
      assert.deepEqual(result.requests, insert.requests);
    });

    it('ignores insert of projects when exists', async () => {
      const insert = await store.insertSaved(1, 1);
      const result = await store.insertSavedIfNotExists();
      assert.deepEqual(result.projects, insert.projects);
    });
  });

  describe('insertHistoryIfNotExists()', () => {
    /** @type Store */
    let store;

    before(() => { 
      store = new Store({ store: PouchDB }); 
    });

    beforeEach(async () => {
      await store.destroyHistory();
    });

    it('inserts new history request data', async () => {
      await store.insertHistoryIfNotExists();
      const savedDb = new PouchDB('history-requests');
      const docs = await savedDb.allDocs();
      assert.equal(docs.total_rows, 25);
    });

    it('returns generated data', async () => {
      const result = await store.insertHistoryIfNotExists();
      assert.lengthOf(result, 25, 'Has requests list');

      assert.typeOf(result[0]._id, 'string', 'Request has _id');
      assert.typeOf(result[0]._rev, 'string', 'Request has _rev');
    });

    it('ignores insert of requests when exists', async () => {
      // More than 1 can cause order problems
      // Retrieved from the data store documents may be in different order
      // so it's safer to test single request to reduce tests logic
      const insert = await store.insertHistory(1);

      const result = await store.insertHistoryIfNotExists();
      assert.deepEqual(result, insert);
    });
  });

  describe('insertSaved()', () => {
    /** @type Store */
    let store;

    before(() => { 
      store = new Store({ store: PouchDB }); 
    });

    beforeEach(async () => {
      await store.destroySaved();
    });

    it('returns generated data', async () => {
      const result = await store.insertSaved();

      assert.lengthOf(result.requests, 25, 'Has requests array');
      assert.lengthOf(result.projects, 5, 'Has projects array');
    });

    it('has updated _rev on the generated project', async () => {
      const result = await store.insertSaved(1, 1);
      assert.typeOf(result.projects[0]._id, 'string', 'Project has _id');
      assert.typeOf(result.projects[0]._rev, 'string', 'Project has _rev');
    });

    it('has updated _rev on generated request', async () => {
      const result = await store.insertSaved(1, 1);
      assert.typeOf(result.requests[0]._id, 'string', 'Request has _id');
      assert.typeOf(result.requests[0]._rev, 'string', 'Request has _rev');
    });

    it('calls savedData()', async () => {
      const spy = sinon.spy(store.http, 'savedData');
      await store.insertSaved(1, 1);
      assert.isTrue(spy.called);
    });
  });

  describe('insertHistory()', () => {
    /** @type Store */
    let store;

    before(() => { 
      store = new Store({ store: PouchDB }); 
    });

    beforeEach(async () => {
      await store.destroyHistory();
    });

    it('returns generated data', async () => {
      const result = await store.insertHistory();
      assert.lengthOf(result, 25);
    });

    it('has updated _rev on the generated request', async () => {
      const result = await store.insertHistory(1);

      assert.typeOf(result[0]._id, 'string', 'Request has _id');
      assert.typeOf(result[0]._rev, 'string', 'Request has _rev');
    });

    it('calls generateHistoryRequestsData()', async () => {
      const spy = sinon.spy(store.http, 'listHistory');
      await store.insertHistory(1);
      assert.isTrue(spy.called);
    });
  });

  describe('insertProjects()', () => {
    /** @type Store */
    let store;

    before(() => { 
      store = new Store({ store: PouchDB }); 
    });

    beforeEach(async () => {
      await store.clearLegacyProjects();
    });

    it('Returns generated data', async () => {
      const result = await store.insertProjects();
      assert.lengthOf(result, 5);
    });

    it('Object has updated _rev', async () => {
      const result = await store.insertProjects(1);

      assert.typeOf(result[0]._id, 'string', 'Object has _id');
      assert.typeOf(result[0]._rev, 'string', 'Object has _rev');
    });

    it('Calls generateProjects()', async () => {
      const spy = sinon.spy(store.http, 'listProjects');
      await store.insertProjects(1);
      assert.isTrue(spy.called);
    });
  });

  describe('destroySaved()', () => {
    /** @type Store */
    let store;

    before(() => { store = new Store({ store: PouchDB }) });

    beforeEach(async () => {
      await store.insertSaved();
    });

    it('clears saved-requests store', async () => {
      await store.destroySaved();
      const savedDb = new PouchDB('saved-requests');
      const docs = await savedDb.allDocs();
      assert.equal(docs.total_rows, 0);
    });
  });

  describe('destroyHistory()', () => {
    /** @type Store */
    let store;

    before(() => { store = new Store({ store: PouchDB }) });
    
    beforeEach(async () => {
      await store.insertHistory();
    });

    it('Clears history-requests store', async () => {
      await store.destroyHistory();
      const savedDb = new PouchDB('history-requests');
      const docs = await savedDb.allDocs();
      assert.equal(docs.total_rows, 0);
    });
  });

  describe('clearLegacyProjects()', () => {
    /** @type Store */
    let store;

    before(() => { store = new Store({ store: PouchDB }) });
    
    beforeEach(async () => {
      await store.insertProjects();
    });

    it('Clears legacy-projects store', async () => {
      await store.clearLegacyProjects();
      const savedDb = new PouchDB('legacy-projects');
      const docs = await savedDb.allDocs();
      assert.equal(docs.total_rows, 0);
    });
  });

  describe('insertWebsockets()', () => {
    /** @type Store */
    let store;

    before(() => { store = new Store({ store: PouchDB }) });

    beforeEach(async () => {
      await store.destroyWebsockets();
    });

    it('returns generated data', async () => {
      const result = await store.insertWebsockets();
      assert.lengthOf(result, 25);
    });

    it('has updated _rev', async () => {
      const result = await store.insertWebsockets(1);

      assert.typeOf(result[0]._id, 'string', 'Object has _id');
      assert.typeOf(result[0]._rev, 'string', 'Object has _rev');
    });

    it('calls urls.urls()', async () => {
      const spy = sinon.spy(store.urls, 'urls');
      await store.insertWebsockets(1);
      assert.isTrue(spy.called);
    });
  });

  describe('insertUrlHistory()', () => {
    /** @type Store */
    let store;

    before(() => { store = new Store({ store: PouchDB }) });

    beforeEach(async () => {
      await store.destroyUrlHistory();
    });

    it('returns generated data', async () => {
      const result = await store.insertUrlHistory();
      assert.lengthOf(result, 25);
    });

    it('has updated _rev', async () => {
      const result = await store.insertUrlHistory(1);

      assert.typeOf(result[0]._id, 'string', 'Object has _id');
      assert.typeOf(result[0]._rev, 'string', 'Object has _rev');
    });

    it('calls urls.urls()', async () => {
      const spy = sinon.spy(store.urls, 'urls');
      await store.insertUrlHistory(1);
      assert.isTrue(spy.called);
    });
  });

  describe('destroyWebsockets()', () => {
    /** @type Store */
    let store;

    before(() => { store = new Store({ store: PouchDB }) });
    
    beforeEach(async () => {
      await store.insertWebsockets();
    });

    it('Clears websocket-url-history store', async () => {
      await store.destroyWebsockets();
      const savedDb = new PouchDB('websocket-url-history');
      const docs = await savedDb.allDocs();
      assert.equal(docs.total_rows, 0);
    });
  });

  describe('destroyUrlHistory()', () => {
    /** @type Store */
    let store;

    before(() => { store = new Store({ store: PouchDB }) });
    
    beforeEach(async () => {
      await store.insertUrlHistory();
    });

    it('clears url-history store', async () => {
      await store.destroyUrlHistory();
      const savedDb = new PouchDB('url-history');
      const docs = await savedDb.allDocs();
      assert.equal(docs.total_rows, 0);
    });
  });

  describe('insertVariables()', () => {
    /** @type Store */
    let store;

    before(() => { store = new Store({ store: PouchDB }) });

    beforeEach(async () => {
      await store.destroyVariables();
    });

    it('returns generated data', async () => {
      const result = await store.insertVariables();
      assert.lengthOf(result, 25);
    });

    it('has updated _rev', async () => {
      const result = await store.insertVariables(1);

      assert.typeOf(result[0]._id, 'string', 'Object has _id');
      assert.typeOf(result[0]._rev, 'string', 'Object has _rev');
    });

    it('calls variables.listVariables()', async () => {
      const spy = sinon.spy(store.variables, 'listVariables');
      await store.insertVariables(1);
      assert.isTrue(spy.called);
    });
  });

  describe('insertVariablesAndEnvironments()', () => {
    /** @type Store */
    let store;

    before(() => { store = new Store({ store: PouchDB }) });

    beforeEach(async () => {
      await store.destroyVariables();
    });

    it('returns generated data', async () => {
      const result = await store.insertVariablesAndEnvironments();
      assert.lengthOf(result, 25);
    });

    it('inserts environments for variable\'s environment', async () => {
      const result = await store.insertVariablesAndEnvironments(10, {
        defaultEnv: false,
        randomEnv: true,
      });
      let count = 0;
      const names = [];
      result.forEach((variable) => {
        if (!names.includes(variable.environment)) {
          names.push(variable.environment)
          count += 1;
        }
      });
      const db = new PouchDB('variables-environments');
      const response = await db.allDocs({
        include_docs: true,
      });
      const inserted = response.rows.map(item => item.doc);
      assert.lengthOf(inserted, count);
    });
  });

  describe('destroyVariablesData()', () => {
    /** @type Store */
    let store;

    before(() => { store = new Store({ store: PouchDB }) });
    
    beforeEach(async () => {
      await store.insertVariables();
    });

    it('clears variables store', async () => {
      await store.destroyVariables();
      const savedDb = new PouchDB('variables');
      const docs = await savedDb.allDocs();
      assert.equal(docs.total_rows, 0);
    });

    it('clears variables-environments store', async () => {
      await store.destroyVariables();
      const savedDb = new PouchDB('variables-environments');
      const docs = await savedDb.allDocs();
      assert.equal(docs.total_rows, 0);
    });
  });

  describe('insertCookies()', () => {
    /** @type Store */
    let store;

    before(() => { store = new Store({ store: PouchDB }) });

    beforeEach(async () => {
      await store.destroyCookies();
    });

    it('returns generated data', async () => {
      const result = await store.insertCookies();
      assert.lengthOf(result, 25);
    });

    it('has updated _rev', async () => {
      const result = await store.insertCookies(1);

      assert.typeOf(result[0]._id, 'string', 'Object has _id');
      assert.typeOf(result[0]._rev, 'string', 'Object has _rev');
    });

    it('calls cookies.cookies()', async () => {
      const spy = sinon.spy(store.cookies, 'cookies');
      await store.insertCookies(1);
      assert.isTrue(spy.called);
    });
  });

  describe('destroyCookies()', () => {
    /** @type Store */
    let store;

    before(() => { store = new Store({ store: PouchDB }) });
    
    beforeEach(async () => {
      await store.insertCookies();
    });

    it('Clears cookies store', async () => {
      await store.destroyCookies();
      const savedDb = new PouchDB('cookies');
      const docs = await savedDb.allDocs();
      assert.equal(docs.total_rows, 0);
    });
  });

  describe('insertBasicAuth()', () => {
    /** @type Store */
    let store;

    before(() => { store = new Store({ store: PouchDB }) });

    beforeEach(async () => {
      await store.destroyBasicAuth();
    });

    it('returns generated data', async () => {
      const result = await store.insertBasicAuth();
      assert.lengthOf(result, 25);
    });

    it('has updated _rev', async () => {
      const result = await store.insertBasicAuth(1);

      assert.typeOf(result[0]._id, 'string', 'Object has _id');
      assert.typeOf(result[0]._rev, 'string', 'Object has _rev');
    });

    it('calls authorization.basicList()', async () => {
      const spy = sinon.spy(store.authorization, 'basicList');
      await store.insertBasicAuth(1);
      assert.isTrue(spy.called);
    });
  });

  describe('destroyBasicAuth()', () => {
    /** @type Store */
    let store;

    before(() => { store = new Store({ store: PouchDB }) });
    
    beforeEach(async () => {
      await store.insertBasicAuth();
    });

    it('clears auth-data store', async () => {
      await store.destroyBasicAuth();
      const savedDb = new PouchDB('auth-data');
      const docs = await savedDb.allDocs();
      assert.equal(docs.total_rows, 0);
    });
  });

  describe('insertHostRules()', () => {
    /** @type Store */
    let store;

    before(() => { store = new Store({ store: PouchDB }) });

    beforeEach(async () => {
      await store.destroyHostRules();
    });

    it('returns generated data', async () => {
      const result = await store.insertHostRules();
      assert.lengthOf(result, 25);
    });

    it('has updated _rev', async () => {
      const result = await store.insertHostRules(1);

      assert.typeOf(result[0]._id, 'string', 'Object has _id');
      assert.typeOf(result[0]._rev, 'string', 'Object has _rev');
    });

    it('calls hostRules.rules()', async () => {
      const spy = sinon.spy(store.hostRules, 'rules');
      await store.insertHostRules(1);
      assert.isTrue(spy.called);
    });
  });

  describe('destroyHostRules()', () => {
    /** @type Store */
    let store;

    before(() => { store = new Store({ store: PouchDB }) });
    
    beforeEach(async () => {
      await store.insertHostRules();
    });

    it('Clears host-rules store', async () => {
      await store.destroyHostRules();
      const savedDb = new PouchDB('host-rules');
      const docs = await savedDb.allDocs();
      assert.equal(docs.total_rows, 0);
    });
  });

  describe('insertApis()', () => {
    /** @type Store */
    let store;

    before(() => { store = new Store({ store: PouchDB }) });

    beforeEach(async () => {
      await store.destroyApisAll();
    });

    it('returns generated data', async () => {
      const result = await store.insertApis();
      assert.lengthOf(result[0], 25);
      assert.isAbove(result[1].length, 25);
    });

    it('has updated _rev', async () => {
      const result = await store.insertApis(1);
      assert.typeOf(result[0][0]._id, 'string', 'Object has _id');
      assert.typeOf(result[0][0]._rev, 'string', 'Object has _rev');
    });

    it('Calls restApi.apiIndexList()', async () => {
      const spy = sinon.spy(store.restApi, 'apiIndexList');
      await store.insertApis(1);
      assert.isTrue(spy.called);
    });

    it('Calls restApi.apiDataList()', async () => {
      const spy = sinon.spy(store.restApi, 'apiDataList');
      await store.insertApis(1);
      assert.isTrue(spy.called);
    });
  });

  describe('destroyApiIndexes()', () => {
    /** @type Store */
    let store;

    before(() => { store = new Store({ store: PouchDB }) });
    
    beforeEach(async () => {
      const db = new PouchDB('api-index');
      await db.put({ _id: `test-${Date.now()}` });
    });

    it('Clears api-index store', async () => {
      await store.destroyApiIndexes();
      const savedDb = new PouchDB('api-index');
      const docs = await savedDb.allDocs();
      assert.equal(docs.total_rows, 0);
    });
  });

  describe('destroyApiData()', () => {
    /** @type Store */
    let store;

    before(() => { store = new Store({ store: PouchDB }) });
    
    beforeEach(async () => {
      const db = new PouchDB('api-data');
      await db.put({ _id: `test-${Date.now()}` });
    });

    it('clears api-index store', async () => {
      await store.destroyApiData();
      const savedDb = new PouchDB('api-data');
      const docs = await savedDb.allDocs();
      assert.equal(docs.total_rows, 0);
    });
  });

  describe('insertCertificates()', () => {
    /** @type Store */
    let store;

    before(() => { store = new Store({ store: PouchDB }) });

    beforeEach(async () => {
      await store.destroyClientCertificates();
    });

    it('returns generated data', async () => {
      const result = await store.insertCertificates();
      assert.lengthOf(result, 15);
    });

    it('has updated _rev', async () => {
      const result = await store.insertCertificates(1);
      assert.typeOf(result[0]._id, 'string', 'Object has _id');
      assert.typeOf(result[0]._rev, 'string', 'Object has _rev');
    });

    it('calls certificates.clientCertificates()', async () => {
      const spy = sinon.spy(store.certificates, 'clientCertificates');
      await store.insertCertificates(1);
      assert.isTrue(spy.called);
    });
  });

  describe('destroyClientCertificates()', () => {
    /** @type Store */
    let store;

    before(() => { store = new Store({ store: PouchDB }) });
    
    beforeEach(async () => {
      const db = new PouchDB('client-certificates');
      await db.put({ _id: `test-${Date.now()}` });
    });

    it('Clears client-certificates store', async () => {
      await store.destroyClientCertificates();
      const savedDb = new PouchDB('client-certificates');
      const docs = await savedDb.allDocs();
      assert.equal(docs.total_rows, 0);
    });
  });

  describe('destroyAll()', () => {
    /** @type Store */
    let store;
    const spies = [];
    const fns = /** @type {(keyof Store)[]} */ ([
      'destroySaved',
      'destroyHistory',
      'destroyWebsockets',
      'destroyUrlHistory',
      'destroyVariables',
      'destroyCookies',
      'destroyBasicAuth',
      'destroyHostRules',
      'destroyApiIndexes',
      'destroyApiData',
      'destroyClientCertificates',
    ]);

    before(async () => {
      store = new Store({ store: PouchDB });
      fns.forEach((fn) => {
        const spy = sinon.spy(store, fn);
        spies.push(spy);
      });
      await store.destroyAll();
      fns.forEach((fn) => {
        // @ts-ignore
        store[fn].restore();
      });
    });

    fns.forEach((fn, index) => {
      it(`calls the ${fn}() method`, async () => {
        assert.isTrue(spies[index].called);
      });
    });
  });

  describe('clone()', () => {
    /** @type Store */
    let store;

    before(() => { store = new Store({ store: PouchDB }) });
    

    it('creates a copy', () => {
      const src = {
        a: 'true'
      };
      const result = store.clone(src);
      assert.deepEqual(result, src);
      assert.isFalse(result === src);
    });

    it('handles Date Object', () => {
      const d = new Date();
      const src = {
        a: d
      };
      const result = store.clone(src);
      assert.equal(result.a.getTime(), src.a.getTime());
      assert.isFalse(result.a === d);
    });

    it('handles Array', () => {
      const src = ['a', 'b', { inner: true }, ['inner']];
      const result = store.clone(src);
      assert.deepEqual(result, src);
      assert.isFalse(result === src);
    });
  });

  describe('Data getters', () => {
    /** @type Store */
    let store;

    before(async () => {
      store = new Store({ store: PouchDB });
      await store.destroyAll();
    });

    after(() => store.destroyAll());

    [
      ['getDatastoreRequestData', 'insertSaved', 25],
      ['getDatastoreProjectsData', 'insertProjects', 10],
      ['getDatastoreHistoryData', 'insertHistory', 25],
      ['getDatastoreVariablesData', 'insertVariables', 25],
      ['getDatastoreWebsocketsData', 'insertWebsockets', 25],
      ['getDatastoreUrlsData', 'insertUrlHistory', 25],
      ['getDatastoreAuthData', 'insertBasicAuth', 25],
      ['getDatastoreHostRulesData', 'insertHostRules', 25],
      ['getDatastoreCookiesData', 'insertCookies', 25],
      ['getDatastoreApiIndexData', 'insertApis', 25],
    ].forEach(([getFn, insertFn, size]) => {
      it(`${getFn}() returns the data`, async () => {
        await store[insertFn]();
        const data = await store[getFn]();
        assert.typeOf(data, 'array');
        assert.lengthOf(data, Number(size));
      });
    });

    it(`getDatastoreClientCertificates() returns the data`, async () => {
      await store.insertCertificates();
      const data = await store.getDatastoreClientCertificates();
      assert.typeOf(data, 'array');
      assert.lengthOf(data, 2, 'has both results');
      const [certs, cData] = data;
      assert.lengthOf(certs, 15, 'has certificates list');
      assert.lengthOf(cData, 15, 'has certificates data list');
    });

    it(`getDatastoreHostApiData() returns the data`, async () => {
      await store.destroyApiData();
      await store.insertApis(2, {
        versionSize: 2,
      });
      const data = await store.getDatastoreHostApiData();
      assert.typeOf(data, 'array');
      assert.lengthOf(data, 4, 'has both results');
    });
  });
});
