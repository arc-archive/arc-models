import { assert, fixture } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import { DataTestHelper } from './DataTestHelper.js';
import '../arc-data-import.js';

/** @typedef {import('../src/ArcDataImportElement.js').ArcDataImportElement} ArcDataImportElement */

describe('Postman data import v2', () => {
  const generator = new DataGenerator();

  /**
   * @return {Promise<ArcDataImportElement>}
   */
  async function basicFixture() {
    return fixture(`<arc-data-import></arc-data-import>`);
  }

  describe('Postamn import to datastore - v2', () => {
    let element = /** @type ArcDataImportElement */ (null);
    let originalData;
    let data;
    before(async () => {
      const response = await DataTestHelper.getFile('postman/collection-v2.json')
      originalData = JSON.parse(response);
    });

    after(async () => {
      await generator.destroySavedRequestData();
      await generator.destroyHeadersData();
    });

    beforeEach(async () => {
      element = await basicFixture();
      data = generator.clone(originalData);
    });

    it('stores the data', async () => {
      const parsed = await element.normalizeImportData(data);
      const errors = await element.storeData(parsed);
      assert.isUndefined(errors, 'has no storing errors');
      const requests = await generator.getDatastoreRequestData();
      assert.lengthOf(requests, 5, 'has 5 requests');
      const projects = await generator.getDatastoreProjectsData();
      assert.lengthOf(projects, 1, 'has 1 project');
    });

    it('overrides all data', async () => {
      const parsed = await element.normalizeImportData(data);
      const errors = await element.storeData(parsed);
      assert.isUndefined(errors, 'has no storing errors');
      const requests = await generator.getDatastoreRequestData();
      assert.lengthOf(requests, 5, 'has 5 requests');
      const projects = await generator.getDatastoreProjectsData();
      assert.lengthOf(projects, 1, 'has 1 project');
    });
  });
});
