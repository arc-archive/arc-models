import { assert } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import { DataTestHelper } from './DataTestHelper.js';
import { ImportNormalize } from '../../src/lib/ImportNormalize.js';
import { ImportFactory } from '../../src/lib/ImportFactory.js';

describe('postman-data-import-env', () => {
  const generator = new DataGenerator();

  describe('Postman import to datastore - environment', () => {
    let originalData;
    let data;
    before(async () => {
      const response = await DataTestHelper.getFile('postman/environment.json');
      originalData = JSON.parse(response);
    });

    after(() => {
      return generator.destroyVariablesData();
    });

    beforeEach(async () => {
      data = generator.clone(originalData);
    });

    it('stores the data', async () => {
      const normalizer = new ImportNormalize();
      const parsed = await normalizer.normalize(data);
      const factory = new ImportFactory();
      const errors = await factory.importData(parsed);
      assert.isUndefined(errors, 'has no errors');
      const variables = await generator.getDatastoreVariablesData();
      assert.lengthOf(variables, 3, 'has all variables');
    });

    it('overrides all data', async () => {
      const normalizer = new ImportNormalize();
      const parsed = await normalizer.normalize(data);
      const factory = new ImportFactory();
      const errors = await factory.importData(parsed);
      assert.isUndefined(errors, 'has no errors');
      const variables = await generator.getDatastoreVariablesData();
      assert.lengthOf(variables, 3, 'has all variables');
    });
  });
});
