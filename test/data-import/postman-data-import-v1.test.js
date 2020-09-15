import { assert, fixture } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import { DataTestHelper } from './DataTestHelper.js';
import '../arc-data-import.js';

/** @typedef {import('../src/ArcDataImportElement.js').ArcDataImportElement} ArcDataImportElement */

describe('postman-data-import-v1-test', () => {
  const generator = new DataGenerator();

  /**
   * @return {Promise<ArcDataImportElement>}
   */
  async function basicFixture() {
    return fixture(`<arc-data-import></arc-data-import>`);
  }

  describe('Postamn import to datastore - v1', () => {
    let originalData;
    let element = /** @type ArcDataImportElement */ (null);
    let data;
    before(async () => {
      const response = await DataTestHelper.getFile('postman/collection-v1.json');
      originalData = JSON.parse(response);
    });

    after(async () => {
      await generator.destroySavedRequestData();
      await generator.destroyVariablesData();
      await generator.destroyHeadersData();
    });

    beforeEach(async () => {
      element = await basicFixture();
      data = generator.clone(originalData);
    });

    it('Stores the data', async () => {
      const parsed = await element.normalizeImportData(data);
      const errors = await element.storeData(parsed);
      assert.isUndefined(errors, 'has no storing errors');
      const requests = await generator.getDatastoreRequestData();
      assert.lengthOf(requests, 2, 'has 2 requests');
      const projects = await generator.getDatastoreProjectsData();
      assert.lengthOf(projects, 1, 'has a single project');
    });

    it('overrides all data', async () => {
      const parsed = await element.normalizeImportData(data);
      const errors = await element.storeData(parsed);
      assert.isUndefined(errors, 'has no storing errors');
      const requests = await generator.getDatastoreRequestData();
      assert.lengthOf(requests, 2, 'has 2 requests');
      const projects = await generator.getDatastoreProjectsData();
      assert.lengthOf(projects, 1, 'has a single project');
    });
  });
});
