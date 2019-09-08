import { fixture, assert } from '@open-wc/testing';
import { DbHelper } from './db-helper.js';
import '../../url-indexer.js';

describe('<url-indexer> - Delete test', function() {
  async function basicFixture() {
    return /** @type {UrlIndexer} */ (await fixture('<url-indexer></url-indexer>'));
  }

  describe('deleteIndexedData()', function() {
    const FULL_URL = 'https://domain.com/api?a=b&c=d';
    const REQUEST_ID = 'test-id';
    const REQUEST_ID_2 = 'test-id-2';
    const REQUEST_TYPE = 'saved';

    let element;
    beforeEach(async () => {
      element = await basicFixture();
      await element.index([{
          url: FULL_URL,
          id: REQUEST_ID,
          type: REQUEST_TYPE
        }, {
          url: FULL_URL,
          id: REQUEST_ID_2,
          type: REQUEST_TYPE
        }]);
    });

    afterEach(() => DbHelper.clearData());

    it('Deletes index of a single request', () => {
      return element.deleteIndexedData([REQUEST_ID])
      .then(() => DbHelper.readAllIndexes())
      .then((data) => {
        assert.lengthOf(data, 8);
      });
    });

    it('Deletes both indexes', () => {
      return element.deleteIndexedData([REQUEST_ID, REQUEST_ID_2])
      .then(() => DbHelper.readAllIndexes())
      .then((data) => {
        assert.lengthOf(data, 0);
      });
    });
  });

  describe('deleteIndexedType()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
      await element.index([{
          url: 'https://domain.com/',
          id: 'r1',
          type: 't1'
        }, {
          url: 'https://domain.com/',
          id: 'r2',
          type: 't2'
        }]);
    });

    afterEach(() => DbHelper.clearData());

    it('Deletes by type only', () => {
      return element.deleteIndexedType('t1')
      .then(() => DbHelper.readAllIndexes())
      .then((data) => {
        assert.lengthOf(data, 3);
      });
    });
  });

  describe('clearIndexedData()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
      await element.index([{
          url: 'https://domain.com/',
          id: 'r1',
          type: 't1'
        }, {
          url: 'https://domain.com/',
          id: 'r2',
          type: 't2'
        }]);
    });

    afterEach(() => DbHelper.clearData());

    it('Deletes all index data', () => {
      return element.clearIndexedData()
      .then(() => DbHelper.readAllIndexes())
      .then((data) => {
        assert.lengthOf(data, 0);
      });
    });
  });
});
