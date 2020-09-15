import { assert } from '@open-wc/testing';
import { DataTestHelper } from './DataTestHelper.js';
import { PostmanV1Transformer } from '../../src/transformers/PostmanV1Transformer.js';

describe('PostmanV1Transformer (collection)', () => {
  describe('readProjectInfo()', () => {
    let transformer = /** @type PostmanV1Transformer */ (null);
    let jsonData;
    let result;
    before(async () => {
      const response = await DataTestHelper.getFile('postman/collection-v1.json');
      jsonData = JSON.parse(response);
    });

    beforeEach(() => {
      transformer = new PostmanV1Transformer(jsonData);
      result = transformer.readProjectInfo();
    });

    it('Returns an object', () => {
      assert.typeOf(result, 'object');
    });

    it('Contains key', () => {
      assert.equal(result.key, 'e4638c4e-1a37-9b63-4db3-4ad8c3516706');
    });

    it('name is set', () => {
      assert.equal(result.name, 'TestCollection');
    });

    it('description is set', () => {
      assert.equal(result.description, 'Some description');
    });

    it('created is set', () => {
      assert.equal(result.created, 1518549355798);
    });

    it('updated is set', () => {
      assert.equal(result.updated, 1518549355798);
    });

    it('order is set', () => {
      assert.equal(result.order, 0);
    });
  });

  describe('computeRequestsInOrder()', () => {
    let transformer = /** @type PostmanV1Transformer */ (null);
    let jsonData;
    let result;
    before(async () => {
      const response = await DataTestHelper.getFile('postman/collection-v1.json');
      jsonData = JSON.parse(response);
    });

    beforeEach(() => {
      transformer = new PostmanV1Transformer(jsonData);
      result = transformer.computeRequestsInOrder();
    });

    it('returns an array', () => {
      assert.typeOf(result, 'array');
      assert.lengthOf(result, 2);
    });

    it('requests are in order', () => {
      assert.equal(result[0].id, '6995f0d5-4c47-8bbd-de3c-1cd357e6a99d');
      assert.equal(result[1].id, '2246fd9b-169a-7051-c3e2-d2137ab90ede');
    });
  });

  describe('Data processing', () => {
    let jsonData;
    let result;
    before(async () => {
      const response = await DataTestHelper.getFile('postman/collection-v1.json');
      jsonData = JSON.parse(response);
    });

    beforeEach(async () => {
      const transformer = new PostmanV1Transformer(jsonData);
      result = await transformer.transform();
    });

    it('Returns the data', () => {
      assert.typeOf(result, 'object');
    });

    it('Contains export object properties', () => {
      assert.typeOf(result.createdAt, 'string');
      assert.equal(result.version, 'postman-collection-v1');
      assert.equal(result.kind, 'ARC#Import');
      assert.typeOf(result.projects, 'array');
      assert.typeOf(result.requests, 'array');
    });

    it('Data are accounted for', () => {
      assert.lengthOf(result.projects, 1);
      assert.lengthOf(result.requests, 2);
    });

    it('Request objects are valid', () => {
      for (let i = 0; i < result.requests.length; i++) {
        DataTestHelper.assertRequestObject(result.requests[i]);
      }
    });

    it('Project data is set', () => {
      const project = result.projects[0];
      for (let i = 0; i < result.requests.length; i++) {
        assert.equal(result.requests[i].projects[0], project.key);
      }
    });

    it('Projects have request data', () => {
      const project = result.projects[0];
      assert.typeOf(project.requests, 'array');
      assert.lengthOf(project.requests, 2);
    });

    it('Project object is valid', () => {
      DataTestHelper.assertProjectObject(result.projects[0]);
    });

    it('Variables are processed', () => {
      const model = result.requests[0];
      assert.equal(model.url, 'https://domain.com/accounts/${login}');
      assert.equal(model.headers, 'h1: h1v\n//h2: h2v\nh3: ${h3v}');
      const multipart = model.multipart;
      assert.equal(multipart[0].name, '${param}');
      assert.equal(multipart[0].value, '${value}');
      assert.equal(multipart[2].value, '${cloudhubApi}');
    });
  });
});
