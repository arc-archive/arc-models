import { assert } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import { DataTestHelper } from './DataTestHelper.js';
import { ArcPouchTransformer } from '../../src/transformers/ArcPouchTransformer.js';
import { ExportProcessor } from '../../src/lib/ExportProcessor.js';

/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ArcExportObject} ArcExportObject */

describe('ArcPouchTransformer', () => {
  describe('previous version', () => {
    let jsonData;
    let result = /** @type ArcExportObject */ (null);
    before(async () => {
      const response = await DataTestHelper.getFile('pouch-data-export.json');
      jsonData = JSON.parse(response);
      const transformer = new ArcPouchTransformer(JSON.parse(response));
      result = await transformer.transform();
    });

    it('normalizes the data', () => {
      assert.typeOf(result, 'object');
    });

    it('contains export object properties', () => {
      assert.typeOf(result.createdAt, 'string');
      assert.equal(result.version, '9.14.64.305');
      assert.equal(result.kind, 'ARC#Import');
      assert.typeOf(result.projects, 'array');
      assert.typeOf(result.requests, 'array');
      assert.typeOf(result.history, 'array');
      assert.typeOf(result.variables, 'array');
      assert.typeOf(result.cookies, 'array');
      assert.typeOf(result.websocketurlhistory, 'array');
      assert.typeOf(result.urlhistory, 'array');
      assert.typeOf(result.authdata, 'array');
      assert.typeOf(result.hostrules, 'array');
    });

    it('has all the data', () => {
      assert.lengthOf(result.projects, 2, 'has 2 projects');
      assert.lengthOf(result.requests, 5, 'has 5 saved');
      assert.lengthOf(result.history, 3, 'has 3 history');
      assert.lengthOf(result.variables, 4, 'has 4 variables');
      assert.lengthOf(result.cookies, 2, 'has 2 cookies');
      assert.lengthOf(result.websocketurlhistory, 1, 'has 1 websocket url');
      assert.lengthOf(result.urlhistory, 5, 'has 5 history urls');
      assert.lengthOf(result.authdata, 1, 'has 1 auth data');
      assert.lengthOf(result.hostrules, 1, 'has 1 host rules');
    });

    it('has valid request objects', () => {
      DataTestHelper.assertRequestObject(result.requests[0]);
      DataTestHelper.assertRequestObject(result.requests[1]);
      DataTestHelper.assertRequestObject(result.requests[2]);
      DataTestHelper.assertRequestObject(result.requests[3]);
    });

    it('has valid project objects', () => {
      DataTestHelper.assertProjectObject(result.projects[0]);
      DataTestHelper.assertProjectObject(result.projects[1]);
    });

    it('has valid history objects', () => {
      DataTestHelper.assertHistoryObject(result.history[0]);
      DataTestHelper.assertHistoryObject(result.history[1]);
      DataTestHelper.assertHistoryObject(result.history[2]);
    });

    it('has request values', () => {
      let request = result.requests[0];
      let compare = jsonData.requests[0];
      assert.equal(request.url, compare.url);
      assert.equal(request.method, compare.method);
      assert.equal(request.headers, compare.headers);
      assert.equal(request.payload, compare.payload);
      assert.equal(request.created, compare.updated, 'the created is the previous updated');
      assert.equal(request.updated, compare.updated, 'has the updated property');
      assert.equal(request.name, compare.name);
      assert.equal(request.type, compare.type);
      assert.equal(request.kind, 'ARC#HttpRequest');

      request = result.requests[1];
      compare = jsonData.requests[1];
      assert.equal(request.url, compare.url);
      assert.equal(request.method, compare.method);
      assert.equal(request.headers, '');
      assert.equal(request.payload, '');
      assert.equal(request.created, compare.created, 'has the created property');
      assert.typeOf(request.updated, 'number', 'has the generated updated property');
      assert.equal(request.name, compare.name);
      assert.equal(request.type, compare.type);
      assert.equal(request.kind, 'ARC#HttpRequest');

      request = result.requests[3];
      compare = jsonData.requests[3];
      assert.equal(request.url, compare.url);
      assert.equal(request.method, compare.method);
      assert.equal(request.headers, compare.headers);
      assert.equal(request.payload, compare.payload);
      assert.equal(request.created, compare.updated, 'the created is the previous updated');
      assert.equal(request.name, compare.name);
      assert.equal(request.type, compare.type);
      assert.equal(request.kind, 'ARC#HttpRequest');
    });

    it('has project values', () => {
      let project = result.projects[0];
      let compare = jsonData.projects[0];
      assert.equal(project.name, compare.name, 'name is set');
      assert.equal(project.created, compare.created, 'created is set');
      assert.strictEqual(project.order, compare.order, 'order is set');
      assert.equal(project.kind, 'ARC#ProjectData');

      project = result.projects[1];
      compare = jsonData.projects[1];
      assert.equal(project.name, compare.name, 'name is set');
      assert.equal(project.created, compare.created, 'created is set');
      assert.strictEqual(project.order, compare.order, 'order is set');
      assert.equal(project.kind, 'ARC#ProjectData');
    });

    it('associates requests with projects', () => {
      assert.isUndefined(result.requests[0].projects);
      assert.isUndefined(result.requests[1].projects);
      assert.typeOf(result.requests[2].projects, 'array');
      assert.lengthOf(result.requests[2].projects, 1);
      assert.typeOf(result.requests[3].projects, 'array');
      assert.lengthOf(result.requests[3].projects, 1);
    });

    it('associates projects with requests', () => {
      const p1 = result.projects[0];
      assert.typeOf(p1.requests, 'array');
      assert.lengthOf(p1.requests, 1);
      const p2 = result.projects[0];
      assert.typeOf(p2.requests, 'array');
      assert.lengthOf(p2.requests, 1);
    });

    it('sets correct project ID', () => {
      const p1id = result.projects[0].key;
      const p2id = result.projects[1].key;
      assert.equal(result.requests[2].projects[0], p1id);
      assert.equal(result.requests[3].projects[0], p2id);
    });

    it('transforms variable objects', () => {
      result.variables.forEach((item, index) => {
        const processed = { ...item };
        const original = { ...jsonData.variables[index] };
        assert.typeOf(processed.name, 'string', 'processed item has name property');
        assert.equal(processed.name, original.variable, 'processed item has name value from the original variable');
        delete processed.name;
        delete original.variable;
        assert.deepEqual(processed, original, 'has all properties');
      });
    });

    it('does not transform cookies object', () => {
      assert.deepEqual(result.cookies, jsonData.cookies);
    });

    it('sets websocketurlhistory object without transformation', () => {
      assert.deepEqual(result.websocketurlhistory, jsonData['websocket-url-history']);
    });

    it('sets urlhistory object without transformation', () => {
      assert.deepEqual(result.urlhistory, jsonData['url-history']);
    });

    it('sets authdata object without transformation', () => {
      assert.deepEqual(result.authdata, jsonData['auth-data']);
    });

    it('sets hostrules object without transformation', () => {
      assert.deepEqual(result.hostrules, jsonData['host-rules']);
    });

    it('transforms client certificates', () => {
      assert.lengthOf(result.clientcertificates, 1);
    });

    it('sets client certificates data', () => {
      const [item] = result.clientcertificates;
      assert.equal(item.name, 'Bob pem', 'has the name');
      assert.equal(item.type, 'pem', 'has the type');
      assert.equal(item.dataKey, '2bcf5d24-744b-4002-ad80-5e3b9bfead18', 'has the dataKey');
      assert.equal(item.created, 1577999288834, 'has the created');
      assert.equal(item.key, '60547629-570a-4b4a-8529-55723cd3f80d', 'has the key');
      assert.equal(item.kind, 'ARC#ClientCertificate', 'has the kind');
      assert.typeOf(item.cert, 'object', 'has the cert');
      assert.typeOf(item.pKey, 'object', 'has the pKey');
    });
  });

  describe('Current export system', () => {
    const generator = new DataGenerator();
    const exportFactory = new ExportProcessor(false);

    function createExport(key, data) {
      return exportFactory.createExportObject([
        {
          key,
          data,
        },
      ], {
        appVersion: 'test',
        provider: 'test',
      });
    }

    it('does not process the saved requests data', async () => {
      const projects = generator.generateProjects({
        projectsSize: 1
      });
      const data = generator.generateRequests({
        requestsSize: 2,
      });
      const exportObject = exportFactory.createExportObject([
        {
          key: 'projects',
          data: projects,
        },
        {
          key: 'saved',
          data,
        },
      ], {
        appVersion: 'test',
        provider: 'test',
      });
      const factory = new ArcPouchTransformer(exportObject);
      const result = await factory.transform();
      assert.deepEqual(exportObject.requests, result.requests);
      const [project] = result.projects;
      assert.typeOf(project.created, 'number', 'the project has the created property');
      assert.typeOf(project.updated, 'number', 'the project has the updated property');
      delete project.created;
      delete project.updated;
      assert.deepEqual(exportObject.projects[0], project);
    });

    it('does not process the history requests data', async () => {
      const data = generator.generateHistoryRequestsData({
        requestsSize: 2,
        forcePayload: true,
      });
      const exportObject = createExport('history', data);
      const factory = new ArcPouchTransformer(exportObject);
      const result = await factory.transform();
      assert.deepEqual(exportObject.history, result.history);
    });

    it('does not process the ws url data', async () => {
      const data = generator.generateUrlsData({
        size: 2,
      });
      const exportObject = createExport('websocketurlhistory', data);
      const factory = new ArcPouchTransformer(exportObject);
      const result = await factory.transform();
      assert.deepEqual(exportObject.websocketurlhistory, result.websocketurlhistory);
    });

    it('does not process the url history data', async () => {
      const data = generator.generateUrlsData({
        size: 2,
      });
      const exportObject = createExport('urlhistory', data);
      const factory = new ArcPouchTransformer(exportObject);
      const result = await factory.transform();
      assert.deepEqual(exportObject.urlhistory, result.urlhistory);
    });

    it('does not process the url history data', async () => {
      const data = generator.generateVariablesData({
        size: 2,
      });
      const exportObject = createExport('variables', data);
      const factory = new ArcPouchTransformer(exportObject);
      const result = await factory.transform();
      assert.deepEqual(exportObject.variables, result.variables);
    });

    it('does not process the authorization data', async () => {
      const data = generator.generateBasicAuthData({
        size: 2,
      });
      const exportObject = createExport('authdata', data);
      const factory = new ArcPouchTransformer(exportObject);
      const result = await factory.transform();
      assert.deepEqual(exportObject.authdata, result.authdata);
    });

    it('does not process the host rules data', async () => {
      const data = generator.generateHostRulesData({
        size: 2,
      });
      const exportObject = createExport('hostrules', data);
      const factory = new ArcPouchTransformer(exportObject);
      const result = await factory.transform();
      assert.deepEqual(exportObject.hostrules, result.hostrules);
    });
  });
});
