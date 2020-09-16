import { assert } from '@open-wc/testing';
import { DataTestHelper } from './DataTestHelper.js';
import { ArcDexieTransformer } from '../../src/transformers/ArcDexieTransformer.js';

describe('ArcDexieTransformer', () => {
  describe('Dexie export', () => {
    let result;
    before(async () => {
      const response = await DataTestHelper.getFile('dexie-data-export.json')
      const jsonData = JSON.parse(response);
      const transformer = new ArcDexieTransformer(jsonData);
      result = await transformer.transform();
    });

    it('normalizes the data', () => {
      assert.typeOf(result, 'object');
    });

    it('has export object properties', () => {
      assert.typeOf(result.createdAt, 'string');
      assert.equal(result.version, 'unknown');
      assert.equal(result.kind, 'ARC#Import');
      assert.typeOf(result.projects, 'array');
      assert.typeOf(result.requests, 'array');
      assert.typeOf(result.history, 'array');
    });

    it('has 2 projects', () => {
      assert.lengthOf(result.projects, 2);
    });

    it('has empty history', () => {
      assert.lengthOf(result.history, 0);
    });

    it('has 6 requests', () => {
      assert.lengthOf(result.requests, 6);
    });

    it('produces valid request objects', () => {
      DataTestHelper.assertRequestObject(result.requests[0]);
      DataTestHelper.assertRequestObject(result.requests[3]);
      DataTestHelper.assertRequestObject(result.requests[5]);
    });

    it('sets values on the requests', () => {
      let request = result.requests[0];
      assert.equal(request.url, 'http://localhost:8080/url2');
      assert.equal(request.method, 'GET');
      assert.equal(request.headers, '');
      assert.equal(request.payload, '');
      assert.equal(request.created, 1506365775233);
      assert.equal(request.name, 'test-request');
      assert.equal(request.type, 'saved');

      request = result.requests[3];
      assert.equal(request.url, 'http://onet.pl/test');
      assert.equal(request.method, 'GET');
      assert.equal(request.headers, '');
      assert.equal(request.payload, '');
      assert.equal(request.created, 1506365939968);
      assert.equal(request.name, 'Other endpoint');
      assert.equal(request.type, 'saved');

      request = result.requests[5];
      assert.equal(request.url, 'http://second-project.com');
      assert.equal(request.method, 'PUT');
      assert.equal(request.headers, 'x-test: headers');
      assert.equal(request.payload, 'test-payload');
      assert.equal(request.created, 1506367353657);
      assert.equal(request.name, 'second-project-request');
      assert.equal(request.type, 'saved');
    });

    it('produces valid project objects', () => {
      DataTestHelper.assertProjectObject(result.projects[0]);
      DataTestHelper.assertProjectObject(result.projects[1]);
    });

    it('Project values are set', () => {
      let project = result.projects[0];
      assert.equal(project.name, 'Project name', 'name is set');
      assert.equal(project.created, 1506365878724, 'created is set');
      assert.strictEqual(project.order, 0, 'order is set');

      project = result.projects[1];
      assert.equal(project.name, 'second-project', 'name is set');
      assert.equal(project.created, 1506367353678, 'created is set');
      assert.strictEqual(project.order, 0, 'order is set');
    });

    it('Associate requests with projects', () => {
      assert.isUndefined(result.requests[0].projects);
      assert.isUndefined(result.requests[1].projects);
      assert.typeOf(result.requests[2].projects[0], 'string');
      assert.typeOf(result.requests[3].projects[0], 'string');
      assert.typeOf(result.requests[4].projects[0], 'string');
      assert.typeOf(result.requests[5].projects[0], 'string');
    });

    it('Project ID is set correctly', () => {
      const p1id = result.projects[0].key;
      const p2id = result.projects[1].key;
      assert.equal(result.requests[2].projects[0], p1id);
      assert.equal(result.requests[3].projects[0], p1id);
      assert.equal(result.requests[4].projects[0], p1id);
      assert.equal(result.requests[5].projects[0], p2id);
    });

    it('Project has request reference', () => {
      const p1 = result.projects[0];
      const p2 = result.projects[1];
      assert.typeOf(p1.requests, 'array');
      assert.lengthOf(p1.requests, 4);
      assert.typeOf(p2.requests, 'array');
      assert.lengthOf(p2.requests, 1);
    });
  });

  describe('Dexie history', () => {
    let result;
    before(async () => {
      const response = await DataTestHelper.getFile('dexie-history-export.json')
      const jsonData = JSON.parse(response);
      const transformer = new ArcDexieTransformer(jsonData);
      result = await transformer.transform();
    });

    it('Normalizes the data', () => {
      assert.typeOf(result, 'object');
    });

    it('History contains 4 entries', () => {
      assert.lengthOf(result.history, 4);
    });

    it('has valid history objects', () => {
      DataTestHelper.assertHistoryObject(result.history[0]);
      DataTestHelper.assertHistoryObject(result.history[1]);
      DataTestHelper.assertHistoryObject(result.history[2]);
      DataTestHelper.assertHistoryObject(result.history[3]);
    });

    it('Request values are set', () => {
      let request = result.history[0];
      assert.equal(request.url, 'http://wp.pl');
      assert.equal(request.method, 'GET');
      assert.equal(request.headers, '');
      assert.equal(request.payload, '');
      assert.equal(request.created, 1506366584358);

      request = result.history[2];
      assert.equal(request.url, 'http://google.com');
      assert.equal(request.method, 'PUT');
      assert.equal(request.headers, '');
      assert.equal(request.payload, '');
      assert.equal(request.created, 1506365841855);
    });
  });

  describe('Dexie saved export', () => {
    let result;
    before(async () => {
      const response = await DataTestHelper.getFile('dexie-saved-export.json')
      const jsonData = JSON.parse(response);
      const transformer = new ArcDexieTransformer(jsonData);
      result = await transformer.transform();
    });

    it('Requests contains 2 entries', () => {
      assert.lengthOf(result.requests, 2);
    });

    it('Request objects are valid', () => {
      DataTestHelper.assertRequestObject(result.requests[0]);
      DataTestHelper.assertRequestObject(result.requests[1]);
    });

    it('Request values are set', () => {
      let request = result.requests[0];
      assert.equal(request.url, 'http://localhost:8080/url2');
      assert.equal(request.method, 'GET');
      assert.equal(request.headers, '');
      assert.equal(request.payload, '');
      assert.equal(request.created, 1506365775233);
      assert.equal(request.name, 'Request in project');
      assert.equal(request.type, 'saved');

      request = result.requests[1];
      assert.equal(request.url, 'http://google.com');
      assert.equal(request.method, 'GET');
      assert.equal(request.headers, '');
      assert.equal(request.payload, '');
      assert.equal(request.created, 1506365826194);
      assert.equal(request.name, 'Regular request');
      assert.equal(request.type, 'saved');
    });
  });
});
