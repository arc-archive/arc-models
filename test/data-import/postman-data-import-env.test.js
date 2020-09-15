import { assert, fixture } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import { DataTestHelper } from './DataTestHelper.js';
import '../arc-data-import.js';

/** @typedef {import('../src/ArcDataImportElement.js').ArcDataImportElement} ArcDataImportElement */

describe('postman-data-import-env', () => {
  const generator = new DataGenerator();

  /**
   * @return {Promise<ArcDataImportElement>}
   */
  async function basicFixture() {
    return fixture(`<arc-data-import></arc-data-import>`);
  }

  describe('Postamn import to datastore - environment', () => {
    let originalData;
    let element = /** @type ArcDataImportElement */ (null);
    let data;
    before(async () => {
      const response = await DataTestHelper.getFile('postman/environment.json');
      originalData = JSON.parse(response);
    });

    after(() => {
      return generator.destroyVariablesData();
    });

    beforeEach(async () => {
      element = await basicFixture();
      data = generator.clone(originalData);
    });

    it('stores the data', async () => {
      const parsed = await element.normalizeImportData(data);
      const errors = await element.storeData(parsed);
      assert.isUndefined(errors, 'has no errors');
      const variables = await generator.getDatastoreVariablesData();
      assert.lengthOf(variables, 3, 'has all variables');
    });

    it('overrides all data', async () => {
      const parsed = await element.normalizeImportData(data);
      const errors = await element.storeData(parsed);
      assert.isUndefined(errors, 'has no errors');
      const variables = await generator.getDatastoreVariablesData();
      assert.lengthOf(variables, 3, 'has all variables');
    });
  });
});
