import { assert, fixture } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import { DataTestHelper } from './DataTestHelper.js';
import '../arc-data-import.js';

/** @typedef {import('../src/ArcDataImportElement.js').ArcDataImportElement} ArcDataImportElement */

describe('Postamn import to datastore - backup data', () => {
  const generator = new DataGenerator();

  /**
   * @return {Promise<ArcDataImportElement>}
   */
  async function basicFixture() {
    return fixture(`<arc-data-import></arc-data-import>`);
  }

  let originalData;
  let element = /** @type ArcDataImportElement */ (null);
  let data;
  before(async () => {
    const response = await DataTestHelper.getFile('postman/postman-data.json');
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
    assert.isUndefined(errors, 'has no errors');
    const requests = await generator.getDatastoreRequestData();
    assert.lengthOf(requests, 46, 'has all requests');
    const projects = await generator.getDatastoreProjectsData();
    assert.lengthOf(projects, 2, 'has all projects');
    const variables = await generator.getDatastoreVariablesData();
    assert.lengthOf(variables, 5, 'has all variables');
    const environments = await generator.getDatastoreEnvironmentsData();
    assert.lengthOf(environments, 2, 'has all environments');
  });

  it('Overrides all data', async () => {
    const parsed = await element.normalizeImportData(data);
    const errors = await element.storeData(parsed);
    assert.isUndefined(errors, 'has no errors');
    const requests = await generator.getDatastoreRequestData();
    assert.lengthOf(requests, 46, 'has all requests');
    const projects = await generator.getDatastoreProjectsData();
    assert.lengthOf(projects, 2, 'has all projects');
    const variables = await generator.getDatastoreVariablesData();
    // there are no keys for variables.
    assert.lengthOf(variables, 10, 'has all variables');
    const environments = await generator.getDatastoreEnvironmentsData();
    assert.lengthOf(environments, 2, 'has all environments');
  });
});
