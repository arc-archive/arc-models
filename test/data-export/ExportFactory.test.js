import { assert } from '@open-wc/testing';
import 'chance/dist/chance.min.js';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import { ExportFactory } from '../../src/lib/ExportFactory.js';

describe('ExportFactory', () => {
  const generator = new DataGenerator();

  describe('getExportData()', () => {
    function getData(result, dataName) {
      const item = result.find(({ key }) => key === dataName);
      return item ? item.data : null;
    }

    describe('Request data', () => {
      before(async () => {
        await generator.insertSavedRequestData({
          requestsSize: 100,
          projectsSize: 50,
          forceProject: true,
        });
      });

      after(async () => {
        await generator.destroySavedRequestData();
      });

      let factory = /** @type ExportFactory */ (null);
      beforeEach(() => {
        factory = new ExportFactory();
      });

      it('has "requests" object in the response', async () => {
        const result = await factory.getExportData({
          saved: true,
        });
        const saved = getData(result, 'saved');
        assert.typeOf(saved, 'array', 'has array of requests');
        assert.lengthOf(saved, 100, 'has all requests');
      });

      it('adds "projects" automatically', async () => {
        const result = await factory.getExportData({
          saved: true,
        });
        const projects = getData(result, 'projects');
        assert.typeOf(projects, 'array', 'has array of requests');
        assert.lengthOf(projects, 50, 'has all projects');
      });

      it('has ARCRequest properties on a request entity', async () => {
        const result = await factory.getExportData({
          saved: true,
        });
        const saved = getData(result, 'saved');
        const [request] = saved;
        assert.typeOf(request._id, 'string', 'has the _id');
        assert.typeOf(request._rev, 'string', 'has the _rev');
        assert.typeOf(request.name, 'string', 'has the name');
        assert.typeOf(request.url, 'string', 'has the url');
      });

      it('has ARCProject properties on a request entity', async () => {
        const result = await factory.getExportData({
          saved: true,
        });
        const projects = getData(result, 'projects');
        const [project] = projects;
        assert.typeOf(project._id, 'string', 'has the _id');
        assert.typeOf(project._rev, 'string', 'has the _rev');
        assert.typeOf(project.name, 'string', 'has the name');
      });

      it('gets large amount of data', async () => {
        await generator.insertSavedRequestData({
          requestsSize: 4000,
          projectsSize: 1,
        });
        const result = await factory.getExportData({
          saved: true,
        });
        const saved = getData(result, 'saved');
        assert.lengthOf(saved, 4100, 'has all requests');
      });
    });

    describe('Projects data', () => {
      before(async () => {
        await generator.insertProjectsData({
          projectsSize: 100,
        });
      });

      after(async () => {
        await generator.clearLegacyProjects();
      });

      let factory = /** @type ExportFactory */ (null);
      beforeEach(() => {
        factory = new ExportFactory();
      });

      it('has "projects" object in the response', async () => {
        const result = await factory.getExportData({
          projects: true,
        });
        const projects = getData(result, 'projects');
        assert.typeOf(projects, 'array', 'has array of projects');
        assert.lengthOf(projects, 100, 'has all requests');
      });

      it('has ARCProject properties on a request entity', async () => {
        const result = await factory.getExportData({
          projects: true,
        });
        const projects = getData(result, 'projects');
        const [project] = projects;
        assert.typeOf(project._id, 'string', 'has the _id');
        assert.typeOf(project._rev, 'string', 'has the _rev');
        assert.typeOf(project.name, 'string', 'has the name');
      });

      it('gets large amount of data', async () => {
        await generator.insertProjectsData({
          projectsSize: 2000,
        });
        const result = await factory.getExportData({
          projects: true,
        });
        const projects = getData(result, 'projects');
        assert.lengthOf(projects, 2100, 'has all requests');
      });
    });

    describe('History data', () => {
      before(async () => {
        await generator.insertHistoryRequestData({
          requestsSize: 100,
        });
      });

      after(async () => {
        await generator.destroyHistoryData();
      });

      let factory = /** @type ExportFactory */ (null);
      beforeEach(() => {
        factory = new ExportFactory();
      });

      it('has "history" object in the response', async () => {
        const result = await factory.getExportData({
          history: true,
        });
        const history = getData(result, 'history');
        assert.typeOf(history, 'array', 'has an array');
        assert.lengthOf(history, 100, 'has all history');
      });

      it('has ARCHistoryRequest properties on a request entity', async () => {
        const result = await factory.getExportData({
          history: true,
        });
        const history = getData(result, 'history');
        const [item] = history;
        assert.typeOf(item._id, 'string', 'has the _id');
        assert.typeOf(item._rev, 'string', 'has the _rev');
        assert.isUndefined(item.name, 'has no name');
      });

      it('gets large amount of data', async () => {
        await generator.insertHistoryRequestData({
          requestsSize: 2000,
        });
        const result = await factory.getExportData({
          history: true,
        });
        const projects = getData(result, 'history');
        assert.lengthOf(projects, 2100, 'has all requests');
      });
    });

    describe('Auth data', () => {
      before(async () => {
        await generator.insertBasicAuthData({
          size: 100,
        });
      });

      after(async () => {
        await generator.destroyAuthData();
      });

      let factory = /** @type ExportFactory */ (null);
      beforeEach(() => {
        factory = new ExportFactory();
      });

      it('has "authdata" object in the response', async () => {
        const result = await factory.getExportData({
          authdata: true,
        });
        const authdata = getData(result, 'authdata');
        assert.typeOf(authdata, 'array', 'has an array');
        assert.lengthOf(authdata, 100, 'has all items');
      });

      it('has ARCAuthData properties', async () => {
        const result = await factory.getExportData({
          authdata: true,
        });
        const authdata = getData(result, 'authdata');
        const [item] = authdata;
        assert.typeOf(item._id, 'string', 'has the _id');
        assert.typeOf(item._rev, 'string', 'has the _rev');
        assert.equal(item.type, 'basic', 'has type property');
      });

      it('gets large amount of data', async () => {
        await generator.insertBasicAuthData({
          size: 2000,
        });
        const result = await factory.getExportData({
          authdata: true,
        });
        const authdata = getData(result, 'authdata');
        assert.lengthOf(authdata, 2100, 'has all items');
      });
    });

    describe('Websocket history data', () => {
      before(async () => {
        await generator.insertWebsocketData({
          size: 100,
        });
      });

      after(async () => {
        await generator.destroyWebsocketsData();
      });

      let factory = /** @type ExportFactory */ (null);
      beforeEach(() => {
        factory = new ExportFactory();
      });

      it('has "websocketurlhistory" object in the response', async () => {
        const result = await factory.getExportData({
          websocketurlhistory: true,
        });
        const data = getData(result, 'websocketurlhistory');
        assert.typeOf(data, 'array', 'has an array');
        assert.lengthOf(data, 100, 'has all items');
      });

      it('has entity properties', async () => {
        const result = await factory.getExportData({
          websocketurlhistory: true,
        });
        const authdata = getData(result, 'websocketurlhistory');
        const [item] = authdata;
        assert.typeOf(item._id, 'string', 'has the _id');
        assert.typeOf(item._rev, 'string', 'has the _rev');
        assert.typeOf(item.cnt, 'number', 'has cnt property');
      });

      it('gets large amount of data', async () => {
        await generator.insertWebsocketData({
          size: 2000,
        });
        const result = await factory.getExportData({
          websocketurlhistory: true,
        });
        const data = getData(result, 'websocketurlhistory');
        assert.lengthOf(data, 2100);
      });
    });

    describe('URL history data', () => {
      before(async () => {
        await generator.insertUrlHistoryData({
          size: 100,
        });
      });

      after(async () => {
        await generator.destroyUrlData();
      });

      let factory = /** @type ExportFactory */ (null);
      beforeEach(() => {
        factory = new ExportFactory();
      });

      it('has "urlhistory" object in the response', async () => {
        const result = await factory.getExportData({
          urlhistory: true,
        });
        const data = getData(result, 'urlhistory');
        assert.typeOf(data, 'array', 'has an array');
        assert.lengthOf(data, 100, 'has all items');
      });

      it('has entity properties', async () => {
        const result = await factory.getExportData({
          urlhistory: true,
        });
        const authdata = getData(result, 'urlhistory');
        const [item] = authdata;
        assert.typeOf(item._id, 'string', 'has the _id');
        assert.typeOf(item._rev, 'string', 'has the _rev');
        assert.typeOf(item.cnt, 'number', 'has cnt property');
      });

      it('gets large amount of data', async () => {
        await generator.insertUrlHistoryData({
          size: 2000,
        });
        const result = await factory.getExportData({
          urlhistory: true,
        });
        const data = getData(result, 'urlhistory');
        assert.lengthOf(data, 2100);
      });
    });

    describe('Client certificates data', () => {
      before(async () => {
        await generator.insertCertificatesData({
          size: 100,
        });
      });

      after(async () => {
        await generator.destroyClientCertificates();
      });

      let factory = /** @type ExportFactory */ (null);
      beforeEach(() => {
        factory = new ExportFactory();
      });

      it('has "clientcertificates" object in the response', async () => {
        const result = await factory.getExportData({
          clientcertificates: true,
        });
        const data = getData(result, 'clientcertificates');
        assert.typeOf(data, 'array', 'has an array');
        assert.lengthOf(data, 100, 'has all items');
      });

      it('has entity properties', async () => {
        const result = await factory.getExportData({
          clientcertificates: true,
        });
        const data = getData(result, 'clientcertificates');
        const { item, data: certData } = data[0];
        assert.typeOf(item, 'object', 'has the index object');
        assert.typeOf(certData, 'object', 'has the data object');
        assert.typeOf(item._id, 'string', 'has the _id');
        assert.typeOf(item._rev, 'string', 'has the _rev');
        assert.typeOf(item.dataKey, 'string', 'has cnt property');
        assert.typeOf(certData.cert, 'object', 'has cert property');
      });

      it('gets large amount of data', async () => {
        await generator.insertCertificatesData({
          size: 200,
        });
        const result = await factory.getExportData({
          clientcertificates: true,
        });
        const data = getData(result, 'clientcertificates');
        assert.lengthOf(data, 300);
      });
    });

    describe('Host rules data', () => {
      before(async () => {
        await generator.insertHostRulesData({
          size: 100,
        });
      });

      after(async () => {
        await generator.destroyHostRulesData();
      });

      let factory = /** @type ExportFactory */ (null);
      beforeEach(() => {
        factory = new ExportFactory();
      });

      it('has "hostrules" object in the response', async () => {
        const result = await factory.getExportData({
          hostrules: true,
        });
        const data = getData(result, 'hostrules');
        assert.typeOf(data, 'array', 'has an array');
        assert.lengthOf(data, 100, 'has all items');
      });

      it('has entity properties', async () => {
        const result = await factory.getExportData({
          hostrules: true,
        });
        const data = getData(result, 'hostrules');
        const [item] = data;
        assert.typeOf(item, 'object', 'has the index object');
        assert.typeOf(item._id, 'string', 'has the _id');
        assert.typeOf(item._rev, 'string', 'has the _rev');
        assert.typeOf(item.from, 'string', 'has from property');
      });

      it('gets large amount of data', async () => {
        await generator.insertHostRulesData({
          size: 2000,
        });
        const result = await factory.getExportData({
          hostrules: true,
        });
        const data = getData(result, 'hostrules');
        assert.lengthOf(data, 2100);
      });
    });

    describe('Variables data', () => {
      before(async () => {
        await generator.insertVariablesData({
          size: 100,
        });
      });

      after(async () => {
        await generator.destroyVariablesData();
      });

      let factory = /** @type ExportFactory */ (null);
      beforeEach(() => {
        factory = new ExportFactory();
      });

      it('has "variables" object in the response', async () => {
        const result = await factory.getExportData({
          variables: true,
        });
        const data = getData(result, 'variables');
        assert.typeOf(data, 'array', 'has an array');
        assert.lengthOf(data, 100, 'has all items');
      });

      it('has entity properties', async () => {
        const result = await factory.getExportData({
          variables: true,
        });
        const data = getData(result, 'variables');
        const [item] = data;
        assert.typeOf(item, 'object', 'has the index object');
        assert.typeOf(item._id, 'string', 'has the _id');
        assert.typeOf(item._rev, 'string', 'has the _rev');
        assert.typeOf(item.variable, 'string', 'has variable property');
      });

      it('gets large amount of data', async () => {
        await generator.insertVariablesData({
          size: 2000,
        });
        const result = await factory.getExportData({
          variables: true,
        });
        const data = getData(result, 'variables');
        assert.lengthOf(data, 2100);
      });
    });

    describe('Cookies (via datastore) data', () => {
      before(async () => {
        await generator.insertCookiesData({
          size: 100,
        });
      });

      after(async () => {
        await generator.destroyCookiesData();
      });

      let factory = /** @type ExportFactory */ (null);
      beforeEach(() => {
        factory = new ExportFactory();
      });

      it('has "cookies" object in the response', async () => {
        const result = await factory.getExportData({
          cookies: true,
        });
        const data = getData(result, 'cookies');
        assert.typeOf(data, 'array', 'has an array');
        assert.lengthOf(data, 100, 'has all items');
      });

      it('has entity properties', async () => {
        const result = await factory.getExportData({
          cookies: true,
        });
        const data = getData(result, 'cookies');
        const [item] = data;
        assert.typeOf(item, 'object', 'has the index object');
        assert.typeOf(item._id, 'string', 'has the _id');
        assert.typeOf(item._rev, 'string', 'has the _rev');
        assert.typeOf(item.expires, 'number', 'has variable property');
      });

      it('gets large amount of data', async () => {
        await generator.insertCookiesData({
          size: 2000,
        });
        const result = await factory.getExportData({
          cookies: true,
        });
        const data = getData(result, 'cookies');
        assert.lengthOf(data, 2100);
      });
    });
  });

  describe('prepareExportData()', () => {
    before(async () => {
      await generator.insertCookiesData({
        size: 10,
      });
      await generator.insertCertificatesData({
        size: 10,
      });
      await generator.insertUrlHistoryData({
        size: 10,
      });
    });

    after(async () => {
      await generator.destroyCookiesData();
      await generator.destroyClientCertificates();
      await generator.destroyUrlData();
    });

    let factory = /** @type ExportFactory */ (null);
    beforeEach(() => {
      factory = new ExportFactory();
    });

    it('processes data url history store data', async () => {
      const data = {
        urlhistory: true,
      };
      const result = await factory.prepareExportData('urlhistory', data);
      assert.equal(result.key, 'urlhistory');
      assert.typeOf(result.data, 'array');
      assert.lengthOf(result.data, 10);
    });

    it('processes cookie data', async () => {
      const data = {
        cookies: true,
      };
      const result = await factory.prepareExportData('cookies', data);
      assert.equal(result.key, 'cookies');
      assert.typeOf(result.data, 'array');
      assert.lengthOf(result.data, 10);
    });

    it('processes client certificates data', async () => {
      const data = {
        clientcertificates: true,
      };
      const result = await factory.prepareExportData('clientcertificates', data);
      assert.equal(result.key, 'clientcertificates');
      assert.typeOf(result.data, 'array');
      assert.lengthOf(result.data, 10);
    });

    it('returns passed values', async () => {
      const value = generator.generateBasicAuthData({
        size: 10,
      });
      const data = {
        authdata: value,
      };
      const result = await factory.prepareExportData('authdata', data);
      assert.equal(result.key, 'authdata');
      assert.typeOf(result.data, 'array');
      assert.deepEqual(result.data, value);
    });

    it('ignores wrong values', async () => {
      const data = {
        authdata: false,
      };
      const result = await factory.prepareExportData('authdata', data);
      assert.equal(result.key, 'authdata');
      assert.typeOf(result.data, 'array');
      assert.deepEqual(result.data, []);
    });
  });
});
