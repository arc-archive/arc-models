import { assert } from '@open-wc/testing';
import { DataTestHelper } from './DataTestHelper.js';
import { PostmanEnvTransformer } from '../../src/transformers/PostmanEnvTransformer.js';

describe('PostmanEnvTransformer', () => {
  describe('_transformVariables()', () => {
    let transformer = /** @type PostmanEnvTransformer */ (null);
    let jsonData;
    before(async () => {
      const response = await DataTestHelper.getFile('postman/environment.json');
      jsonData = JSON.parse(response);
    });

    beforeEach(() => {
      transformer = new PostmanEnvTransformer(jsonData);
    });

    it('returns an array', () => {
      const result = transformer.transformVariables(jsonData.values, '');
      assert.typeOf(result, 'array');
      assert.lengthOf(result, 3);
    });

    it('transforms variables', () => {
      const result = transformer.transformVariables(jsonData.values, '');
      assert.equal(result[1].value, 'test ${var1}');
    });

    it('Sets `enabled` property', () => {
      const result = transformer.transformVariables(jsonData.values, '');
      assert.isTrue(result[1].enabled);
      assert.isFalse(result[2].enabled);
    });

    it('Sets environment property', () => {
      const env = 'test-env';
      const result = transformer.transformVariables(jsonData.values, env);
      assert.equal(result[0].environment, env);
      assert.equal(result[1].environment, env);
      assert.equal(result[2].environment, env);
    });

    it('Sets default environment property', () => {
      const env = 'default';
      const result = transformer.transformVariables(jsonData.values, '');
      assert.equal(result[0].environment, env);
      assert.equal(result[1].environment, env);
      assert.equal(result[2].environment, env);
    });
  });

  describe('transform()', () => {
    let jsonData;
    let transformer = /** @type PostmanEnvTransformer */ (null);
    before(async () => {
      const response = await DataTestHelper.getFile('postman/environment.json');
      jsonData = JSON.parse(response);
    });

    beforeEach(() => {
      transformer = new PostmanEnvTransformer(jsonData);
    });

    it('Returns Promise', () => {
      const result = transformer.transform();
      assert.typeOf(result.then, 'function');
    });

    it('Contains export object properties', async () => {
      const result = await transformer.transform();
      assert.typeOf(result.createdAt, 'string');
      assert.equal(result.version, 'postman-environment');
      assert.equal(result.kind, 'ARC#Import');
      assert.typeOf(result.variables, 'array');
      assert.lengthOf(result.variables, 3);
    });
  });
});
