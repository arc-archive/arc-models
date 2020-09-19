import { assert } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import { DataTestHelper } from './DataTestHelper.js';
import { ImportNormalize } from '../../src/lib/ImportNormalize.js';
import { ImportFactory } from '../../src/lib/ImportFactory.js';

describe('postman-data-import-v1-test', () => {
  const generator = new DataGenerator();

  describe('Postman import to datastore - v1', () => {
    let originalData;
    let data;
    before(async () => {
      const response = await DataTestHelper.getFile('postman/collection-v1.json');
      originalData = JSON.parse(response);
    });

    after(async () => {
      await generator.destroySavedRequestData();
      await generator.destroyVariablesData();
    });

    beforeEach(async () => {
      data = generator.clone(originalData);
    });

    it('Stores the data', async () => {
      const normalizer = new ImportNormalize();
      const parsed = await normalizer.normalize(data);
      const factory = new ImportFactory();
      const errors = await factory.importData(parsed);
      assert.isUndefined(errors, 'has no storing errors');
      const requests = await generator.getDatastoreRequestData();
      assert.lengthOf(requests, 2, 'has 2 requests');
      const projects = await generator.getDatastoreProjectsData();
      assert.lengthOf(projects, 1, 'has a single project');
    });

    it('overrides all data', async () => {
      const normalizer = new ImportNormalize();
      const parsed = await normalizer.normalize(data);
      const factory = new ImportFactory();
      const errors = await factory.importData(parsed);
      assert.isUndefined(errors, 'has no storing errors');
      const requests = await generator.getDatastoreRequestData();
      assert.lengthOf(requests, 2, 'has 2 requests');
      const projects = await generator.getDatastoreProjectsData();
      assert.lengthOf(projects, 1, 'has a single project');
    });
  });
});
