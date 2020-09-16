import { assert } from '@open-wc/testing';
import { DataTestHelper } from './DataTestHelper.js';
import { PostmanV21Transformer } from '../../src/transformers/PostmanV21Transformer.js';

/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcProjects} ExportArcProjects */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcSavedRequest} ExportArcSavedRequest */

describe('PostmanV21Transformer', () => {
  describe('readProjectInfo()', () => {
    let jsonData;
    let result = /** @type ExportArcProjects */ (null);
    before(async () => {
      const response = await DataTestHelper.getFile('postman/collection-21.json');
      jsonData = JSON.parse(response);
    });

    beforeEach(async () => {
      const transformer = new PostmanV21Transformer(jsonData);
      const requests = await transformer.readRequestsData();
      result = transformer.readProjectInfo(requests);
    });

    it('returns an object', () => {
      assert.typeOf(result, 'object');
    });

    it('has the key', () => {
      assert.equal(result.key, '04da3a01-4bf2-43d2-9d15-8f6ce26d0e8f');
    });

    it('has the name is set', () => {
      assert.equal(result.name, 'TestCollection v2');
    });

    it('has the description', () => {
      assert.equal(result.description, 'V2 description');
    });

    it('has the created', () => {
      assert.typeOf(result.created, 'number');
    });

    it('has the updated', () => {
      assert.typeOf(result.updated, 'number');
    });

    it('has the order', () => {
      assert.equal(result.order, 0);
    });
  });

  describe('Body computation', () => {
    let transformer = /** @type PostmanV21Transformer */ (null);
    let jsonData;
    let item;
    describe('formDataBody()', () => {
      before(async () => {
        const response = await DataTestHelper.getFile('postman/collection-21.json')
        jsonData = JSON.parse(response);
        item = jsonData.item[3];
      });

      beforeEach(() => {
        transformer = new PostmanV21Transformer(jsonData);
      });

      it('returns empty string', () => {
        const arcItem = /** @type ExportArcSavedRequest */ ({});
        const result = transformer.formDataBody(item.request.body.formdata, arcItem);
        assert.equal(result, '');
      });

      it('Sets multipart model data', () => {
        const arcItem = /** @type ExportArcSavedRequest */ ({});
        transformer.formDataBody(item.request.body.formdata, arcItem);
        assert.typeOf(arcItem.multipart, 'array');
      });

      it('Model includes all items', () => {
        const arcItem = /** @type ExportArcSavedRequest */ ({});
        transformer.formDataBody(item.request.body.formdata, arcItem);
        assert.lengthOf(arcItem.multipart, 4);
      });

      it('Marks items enabled / disabled', () => {
        const arcItem = /** @type ExportArcSavedRequest */ ({});
        transformer.formDataBody(item.request.body.formdata, arcItem);
        // @ts-ignore
        assert.isTrue(arcItem.multipart[0].enabled);
        // @ts-ignore
        assert.isFalse(arcItem.multipart[1].enabled);
        // @ts-ignore
        assert.isTrue(arcItem.multipart[2].enabled);
        // @ts-ignore
        assert.isTrue(arcItem.multipart[3].enabled);
      });

      it('Sets names in the model', () => {
        const arcItem = /** @type ExportArcSavedRequest */ ({});
        transformer.formDataBody(item.request.body.formdata, arcItem);
        assert.equal(arcItem.multipart[0].name, 'fb1');
        assert.equal(arcItem.multipart[1].name, 'fb2');
        assert.equal(arcItem.multipart[2].name, 'fb3');
        assert.equal(arcItem.multipart[3].name, 'fb4');
      });

      it('Sets values in the model', () => {
        const arcItem = /** @type ExportArcSavedRequest */ ({});
        transformer.formDataBody(item.request.body.formdata, arcItem);
        assert.equal(arcItem.multipart[0].value, 'v1');
        assert.equal(arcItem.multipart[1].value, '${v2}');
        assert.equal(arcItem.multipart[2].value, 'v3');
        assert.equal(arcItem.multipart[3].value, '');
      });
    });

    describe('urlEncodedBody()', () => {
      before(async () => {
        const response = await DataTestHelper.getFile('postman/collection-21.json');
        jsonData = JSON.parse(response);
        item = jsonData.item[0].item[0].request.body.urlencoded;
      });

      let shallowCopy;
      beforeEach(() => {
        transformer = new PostmanV21Transformer(jsonData);
        shallowCopy = Array.from(item, (i) => { return { ...i } });
      });

      it('computes body value', () => {
        const result = transformer.urlEncodedBody(shallowCopy);
        assert.equal(result, 'fd1=${v1}&${fd3}=3');
      });
    });

    describe('computePayload() - binary data', () => {
      before(async () => {
        const response = await DataTestHelper.getFile('postman/collection-21.json');
        jsonData = JSON.parse(response);
        item = jsonData.item[1].request.body;
      });

      beforeEach(() => {
        transformer = new PostmanV21Transformer(jsonData);
      });

      it('Always returns empty value', () => {
        const arcItem = /** @type ExportArcSavedRequest */ ({});
        const result = transformer.computePayload(item, arcItem);
        assert.equal(result, '');
      });
    });

    describe('computePayload() - raw value', () => {
      before(async () => {
        const response = await DataTestHelper.getFile('postman/collection-21.json');
        jsonData = JSON.parse(response);
        item = jsonData.item[2].request.body;
      });

      beforeEach(() => {
        transformer = new PostmanV21Transformer(jsonData);
      });

      it('returns raw value', () => {
        const arcItem = /** @type ExportArcSavedRequest */ ({});
        const result = transformer.computePayload(item, arcItem);
        assert.equal(result, 'some ${raw} value');
      });
    });
  });

  describe('Headers computation', () => {
    let transformer = /** @type PostmanV21Transformer */ (null);
    let jsonData;
    let headers;
    let item;
    before(async () => {
      const response = await DataTestHelper.getFile('postman/collection-21.json');
      jsonData = JSON.parse(response);
      headers = jsonData.item[0].item[1].request.header;
      item = jsonData.item[0].item[1];
    });

    let shallowCopy;
    describe('computeHeaders()', () => {
      beforeEach(() => {
        transformer = new PostmanV21Transformer(jsonData);
        shallowCopy = Array.from(headers, (i) => { return { ...i } });
      });

      it('Computes headers value', () => {
        const result = transformer.computeHeaders(shallowCopy);
        let compare = 'Content-Type: application/x-www-form-urlencoded\n';
        compare += 'Content-Length: 2\n';
        compare += 'x-test: {{host}}';
        assert.equal(result, compare);
      });

      it('Computes variables from headers', () => {
        const result = transformer.ensureVarsRecursively(shallowCopy);
        assert.equal(result[2].value, '${host}');
      });
    });

    describe('computeArcRequest()', () => {
      beforeEach(() => {
        transformer = new PostmanV21Transformer(jsonData);
        shallowCopy = { ...item };
      });

      it('Computes headers value', () => {
        const result = transformer.computeArcRequest(shallowCopy);
        let compare = 'Content-Type: application/x-www-form-urlencoded\n';
        compare += 'Content-Length: 2\n';
        compare += 'x-test: ${host}';
        assert.equal(result.headers, compare);
      });
    });
  });

  describe('URL and query parameters computation', () => {
    let transformer = /** @type PostmanV21Transformer */ (null);
    let jsonData;
    let item;
    let shallowCopy;
    before(async () => {
      const response = await DataTestHelper.getFile('postman/collection-21.json');
      jsonData = JSON.parse(response);
      item = jsonData.item[0].item[0];
    });

    beforeEach(() => {
      transformer = new PostmanV21Transformer(jsonData);
      shallowCopy = { ...item };
    });

    it('URL is computed', () => {
      const result = transformer.computeArcRequest(shallowCopy);
      const compare = 'https://onet.pl/${random()}?${a}=${bb}&e=ff';
      assert.equal(result.url, compare);
    });
  });

  describe('Generating the request object', () => {
    let transformer = /** @type PostmanV21Transformer */ (null);
    let jsonData;
    let item;
    let shallowCopy;
    before(async () => {
      const response = await DataTestHelper.getFile('postman/collection-21.json');
      jsonData = JSON.parse(response);
      item = jsonData.item[0].item[0];
    });

    beforeEach(() => {
      transformer = new PostmanV21Transformer(jsonData);
      shallowCopy = { ...item };
    });

    it('Creates an object', () => {
      const result = transformer.computeArcRequest(shallowCopy);
      assert.typeOf(result, 'object');
    });

    it('Name is set', () => {
      const result = transformer.computeArcRequest(shallowCopy);
      assert.equal(result.name, 'url encoded');
    });

    it('url is set', () => {
      const result = transformer.computeArcRequest(shallowCopy);
      assert.equal(result.url, 'https://onet.pl/${random()}?${a}=${bb}&e=ff');
    });

    it('method is set', () => {
      const result = transformer.computeArcRequest(shallowCopy);
      assert.equal(result.method, 'PUT');
    });

    it('headers is set', () => {
      const result = transformer.computeArcRequest(shallowCopy);
      assert.equal(result.headers, 'Content-Type: application/x-www-form-urlencoded');
    });

    it('payload is set', () => {
      const result = transformer.computeArcRequest(shallowCopy);
      assert.equal(result.payload, 'fd1=${v1}&${fd3}=3');
    });

    it('created and updated are set', () => {
      const result = transformer.computeArcRequest(shallowCopy);
      assert.typeOf(result.created, 'number');
      assert.typeOf(result.updated, 'number');
    });

    it('type is "saved"', () => {
      const result = transformer.computeArcRequest(shallowCopy);
      assert.equal(result.type, 'saved');
    });

    it('project is set on request', () => {
      const result = transformer.computeArcRequest(shallowCopy);
      assert.equal(result.projects[0], jsonData.info._postman_id);
    });

    it('request is set on project', async () => {
      const result = await transformer.transform();
      const project = result.projects[0];
      assert.typeOf(project.requests, 'array');
      assert.lengthOf(project.requests, 5);
    });

    it('key is set', () => {
      let cmp = 'url%20encoded/https%3A%2F%2Fonet.pl%2F%24%7Brandom()%7D';
      cmp += '%3F%24%7Ba%7D%3D%24%7Bbb%7D%26e%3Dff/put/';
      cmp += '04da3a01-4bf2-43d2-9d15-8f6ce26d0e8f';
      const result = transformer.computeArcRequest(shallowCopy);
      assert.equal(result.key, cmp);
    });
  });

  describe('transform()', () => {
    let transformer = /** @type PostmanV21Transformer */ (null);
    let jsonData;

    beforeEach(async () => {
      const response = await DataTestHelper.getFile('postman/collection-21.json');
      jsonData = JSON.parse(response);
      transformer = new PostmanV21Transformer(jsonData);
    });

    it('Returns Promise', () => {
      const result = transformer.transform();
      assert.typeOf(result.then, 'function');
    });

    it('Contains export object properties', async () => {
      const result = await transformer.transform();
      assert.typeOf(result.createdAt, 'string');
      assert.equal(result.version, 'postman-collection-v2');
      assert.equal(result.kind, 'ARC#Import');
      assert.typeOf(result.projects, 'array');
      assert.typeOf(result.requests, 'array');
    });

    it('Projects contains 1 entry', async () => {
      const result = await transformer.transform();
      assert.lengthOf(result.projects, 1);
    });

    it('Requests contains 5 entries', async () => {
      const result = await transformer.transform();
      assert.lengthOf(result.requests, 5);
    });
  });
});
