import { assert } from '@open-wc/testing';
import { DataTestHelper } from './DataTestHelper.js';
import { PostmanBackupTransformer } from '../../src/transformers/PostmanBackupTransformer.js';

describe('Postman backup transformer', () => {
  let jsonData;
  let result;
  before(async () => {
    const response = await DataTestHelper.getFile('postman/postman-data.json');
    jsonData = JSON.parse(response);
  });

  beforeEach(async () => {
    const transformer = new PostmanBackupTransformer(jsonData);
    result = await transformer.transform();
  });

  it('normalizes the data', () => {
    assert.typeOf(result, 'object');
  });

  it('contains export object properties', () => {
    assert.typeOf(result.createdAt, 'string');
    assert.equal(result.version, 'postman-backup');
    assert.equal(result.kind, 'ARC#Import');
    assert.typeOf(result.projects, 'array');
    assert.typeOf(result.requests, 'array');
    assert.typeOf(result.variables, 'array');
  });

  it('data are accounted for', () => {
    assert.lengthOf(result.projects, 2);
    assert.lengthOf(result.requests, 46);
    assert.lengthOf(result.variables, 5);
  });

  it('request objects are valid', () => {
    for (let i = 0; i < result.requests.length; i++) {
      DataTestHelper.assertRequestObject(result.requests[i]);
    }
  });

  it('set project data', () => {
    for (let i = 0; i < result.requests.length; i++) {
      assert.typeOf(result.requests[i].projects, 'array');
    }
  });

  function findProject(projects, projectId) {
    return projects.find((item) => item.key === projectId);
  }

  it('Project exists in the projects list', () => {
    for (let i = 0; i < result.requests.length; i++) {
      const id = result.requests[i].projects[0];
      const project = findProject(result.projects, id);
      assert.ok(project);
    }
  });

  it('Projects have request data', () => {
    const project = result.projects[0];
    assert.typeOf(project.requests, 'array');
    assert.lengthOf(project.requests, 9);
  });

  it('Project objects are valid', () => {
    DataTestHelper.assertProjectObject(result.projects[0]);
    DataTestHelper.assertProjectObject(result.projects[1]);
  });

  it('Variables are computed', () => {
    assert.equal(result.variables[3].value, 'test ${host}', 'Variable is transformed');
    assert.equal(result.requests[5].headers,
      'Content-Type: application/json\nx-var: ${var}',
      'Header is transformed');
    assert.equal(result.requests[5].url,
      'https://httpbin.org/anything/${param}',
      'URL is transformed');

    assert.equal(result.requests[2].multipart[0].value, '${bodyValue}', 'multipart is transformed');
    assert.equal(result.requests[3].payload,
      'url encoded key=url encoded value&other key=${otherValue}',
      'payload url encoded is transformed');
  });
});
