import { assert } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import { DataTestHelper } from './DataTestHelper.js';
import { ImportNormalize } from '../../src/lib/ImportNormalize.js';
import { ImportFactory } from '../../src/lib/ImportFactory.js';

describe('Postman import to datastore - backup data', () => {
  const generator = new DataGenerator();

  let originalData;
  let data;
  before(async () => {
    const response = await DataTestHelper.getFile('postman/postman-data.json');
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
    const normalizer = new ImportNormalize();
    const parsed = await normalizer.normalize(data);
    const factory = new ImportFactory();
    const errors = await factory.importData(parsed);
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
