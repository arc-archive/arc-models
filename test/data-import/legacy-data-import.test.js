import { assert, fixture } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import { DataTestHelper } from './DataTestHelper.js';
import '../arc-data-import.js';

/** @typedef {import('../src/ArcDataImportElement.js').ArcDataImportElement} ArcDataImportElement */

describe('Legacy data', () => {
  /**
   * @return {Promise<ArcDataImportElement>}
   */
  async function basicFixture() {
    return fixture(`<arc-data-import></arc-data-import>`);
  }

  const generator = new DataGenerator();

  describe('Legacy import to datastore', () => {
    let originalData;
    let element = /** @type ArcDataImportElement */ (null);
    let data;
    before(async () => {
      await generator.destroySavedRequestData();
      const response = await DataTestHelper.getFile('legacy-data-import.json');
      originalData = JSON.parse(response);
    });

    after(() => {
      return generator.destroySavedRequestData();
    });

    beforeEach(async () => {
      element = await basicFixture();
      data = generator.clone(originalData);
    });

    it('stores the data', async () => {
      const parsed = await element.normalizeImportData(data);
      const errors = await element.storeData(parsed);
      assert.isUndefined(errors, 'has no data storing error');
      const requests = await generator.getDatastoreRequestData();
      assert.lengthOf(requests, 2, 'has 2 requests');
      const projects = await generator.getDatastoreProjectsData();
      assert.lengthOf(projects, 1, 'Has 1 project');
    });
  });

  describe('Legacy single request to datastore', () => {
    let originalData;
    let element = /** @type ArcDataImportElement */ (null);
    let data;
    before(async () => {
      await generator.destroySavedRequestData();
      const response = await DataTestHelper.getFile('legacy-request-import.json');
      originalData = JSON.parse(response);
    });

    after(() => {
      return generator.destroySavedRequestData();
    });

    beforeEach(async () => {
      element = await basicFixture();
      data = generator.clone(originalData);
    });

    it('stores the data', async () => {
      const parsed = await element.normalizeImportData(data);
      const errors = await element.storeData(parsed);
      assert.isUndefined(errors, 'has no data storing error');
      const requests = await generator.getDatastoreRequestData();
      assert.lengthOf(requests, 1, 'has 1 request');
    });
  });
});
