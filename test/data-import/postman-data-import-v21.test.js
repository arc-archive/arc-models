import { assert } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import { DataTestHelper } from './DataTestHelper.js';
import { ImportNormalize } from '../../src/lib/ImportNormalize.js';
import { ImportFactory } from '../../src/lib/ImportFactory.js';

describe('Postman data import v2.1', () => {
  const generator = new DataGenerator();

  describe('Postman import to datastore - v2.1', () => {
    let originalData;
    let data;
    before(async () => {
      const response = await DataTestHelper.getFile('postman/collection-21.json')
      originalData = JSON.parse(response);
    });

    after(async () => {
      await generator.destroySavedRequestData();
    });

    beforeEach(async () => {
      data = generator.clone(originalData);
    });

    it('stores the data', async () => {
      const normalizer = new ImportNormalize();
      const parsed = await normalizer.normalize(data);
      const factory = new ImportFactory();
      const errors = await factory.importData(parsed);
      assert.isUndefined(errors, 'has no storing errors');
      const requests = await generator.getDatastoreRequestData();
      assert.lengthOf(requests, 5, 'has 5 requests');
      const projects = await generator.getDatastoreProjectsData();
      assert.lengthOf(projects, 1, 'has 1 project');
    });

    it('overrides all data', async () => {
      const normalizer = new ImportNormalize();
      const parsed = await normalizer.normalize(data);
      const factory = new ImportFactory();
      const errors = await factory.importData(parsed);
      assert.isUndefined(errors, 'has no storing errors');
      const requests = await generator.getDatastoreRequestData();
      assert.lengthOf(requests, 5, 'has 5 requests');
      const projects = await generator.getDatastoreProjectsData();
      assert.lengthOf(projects, 1, 'has 1 project');
    });
  });
});
