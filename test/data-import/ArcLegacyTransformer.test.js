import { assert } from '@open-wc/testing';
import { DataTestHelper } from './DataTestHelper.js';
import { ArcLegacyTransformer } from '../../src/transformers/ArcLegacyTransformer.js';

/** @typedef {import('@advanced-rest-client/events').DataExport.ArcExportObject} ArcExportObject */

describe('ArcLegacyTransformer', () => {
  describe('Single request import', () => {
    let jsonData;
    let result = /** @type ArcExportObject */ (null);

    before(async () => {
      const response = await DataTestHelper.getFile('legacy-request-import.json');
      jsonData = JSON.parse(response);
    });

    beforeEach(async () => {
      const transformer = new ArcLegacyTransformer(jsonData);
      result = await transformer.transform();
    });

    it('normalizes the data', () => {
      assert.typeOf(result, 'object');
    });

    it('contains export object properties', () => {
      assert.typeOf(result.createdAt, 'string');
      assert.equal(result.version, 'unknown');
      assert.equal(result.kind, 'ARC#Import');
      assert.typeOf(result.projects, 'array');
      assert.typeOf(result.requests, 'array');
    });

    it('has empty projects array', () => {
      assert.lengthOf(result.projects, 0);
    });

    it('has single request', () => {
      assert.lengthOf(result.requests, 1);
    });

    it('has valid request', () => {
      DataTestHelper.assertRequestObject(result.requests[0]);
    });

    it('has a default name', () => {
      assert.equal(result.requests[0].name, 'unnamed');
    });

    it('has request values set', () => {
      const request = result.requests[0];
      assert.equal(request.url, 'http://mulesoft.com');
      assert.equal(request.method, 'GET');
      assert.equal(request.headers, '');
      assert.equal(request.payload, '');
      assert.equal(request.created, 1450675637093);
    });

    it('Google Drive information is present', () => {
      const request = result.requests[0];
      assert.equal(request.driveId, '0Bzpy9PK_RiBOeWRYUEo0TmRyTzA');
    });
  });

  describe('Multiple requests import', () => {
    let jsonData;
    let result = /** @type ArcExportObject */ (null);

    before(async () => {
      const response = await DataTestHelper.getFile('legacy-data-import.json');
      jsonData = JSON.parse(response);
    });

    beforeEach(async () => {
      const transformer = new ArcLegacyTransformer(jsonData);
      result = await transformer.transform();
    });

    it('normalizes the data', () => {
      assert.typeOf(result, 'object');
    });

    it('contains export object properties', () => {
      assert.typeOf(result.createdAt, 'string');
      assert.equal(result.version, 'unknown');
      assert.equal(result.kind, 'ARC#Import');
      assert.typeOf(result.projects, 'array');
      assert.typeOf(result.requests, 'array');
    });

    it('has a project item', () => {
      assert.lengthOf(result.projects, 1);
    });

    it('has 2 requests', () => {
      assert.lengthOf(result.requests, 2);
    });

    it('has valid request object', () => {
      DataTestHelper.assertRequestObject(result.requests[0]);
      DataTestHelper.assertRequestObject(result.requests[1]);
    });

    it('has valid project object', () => {
      DataTestHelper.assertProjectObject(result.projects[0]);
    });

    it('has project values set', () => {
      const [project] = result.projects;
      assert.equal(project.name, 'test-project', 'name is set');
      assert.equal(project.created, 1506285256547, 'created is set');
      assert.strictEqual(project.order, 0, 'order is set');
    });

    it('has project information set on the request', () => {
      assert.equal(result.requests[0].projects[0], result.projects[0].key, 'Project ID is set');
      assert.isUndefined(result.requests[1].projects, 'Project id is undefined');
    });

    it('has project request reference', () => {
      const project = result.projects[0];
      assert.typeOf(project.requests, 'array');
      assert.lengthOf(project.requests, 1);
    });
  });
});
