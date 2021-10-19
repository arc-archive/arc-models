import { assert, fixture } from '@open-wc/testing';
import { MockedStore } from '../../index.js'
import { DataHelper } from './DataHelper.js';
import { ArcDataImport } from '../../src/ArcDataImport.js';

describe('Dexie legacy import', () => {
  const store = new MockedStore();

  async function etFixture() {
    return fixture(`<div></div>`);
  }

  describe('Dexie import to datastore', () => {
    let originalData;
    let data;
    before(async () => {
      await store.destroySaved();
      const response = await DataHelper.getFile('dexie-data-export.json');
      originalData = JSON.parse(response);
    });

    after(() => store.destroySaved());

    /** @type ArcDataImport */
    let element;
    /** @type Element */
    let et;
    beforeEach(async () => {
      et = await etFixture();
      element = new ArcDataImport(et);
      data = store.clone(originalData);
    });

    it('stores the data', async () => {
      const parsed = await element.normalizeImportData(data);
      const errors = await element.storeData(parsed);
      assert.isUndefined(errors, 'has no data storing error');
      const requests = await store.getDatastoreRequestData();
      assert.lengthOf(requests, 6, 'Has 6 requests');
      const projects = await store.getDatastoreProjectsData();
      assert.lengthOf(projects, 2, 'Has 2 projects');
      const history = await store.getDatastoreHistoryData();
      assert.lengthOf(history, 0, 'Has no history');
    });

    // it('overrides (some) data', async () => {
    //   const parsed = await element.normalizeImportData(data);
    //   const errors = await element.storeData(parsed);
    //   assert.isUndefined(errors, 'has no data storing error');
    //   const requests = await generator.getDatastoreRequestData();
    //   // 4 requests are in a project in the test data
    //   // and this import is missing project ID so it generates IDs again
    //   // so together it should give 6 from previous import + 4 new
    //   assert.lengthOf(requests, 10, 'Has 10 requests');
    //   const projects = await generator.getDatastoreProjectsData();
    //   assert.lengthOf(projects, 4, 'Has 4 projects');
    //   const history = await generator.getDatastoreHistoryData();
    //   assert.lengthOf(history, 0, 'Has no history');
    // });
  });
});
