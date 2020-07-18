import { fixture, assert } from '@open-wc/testing';
import '../../url-indexer.js';
import { DbHelper } from './db-helper.js';
import { ArcModelEvents } from '../../src/events/ArcModelEvents.js';
import { UrlIndexer } from '../../index.js';

/** @typedef {import('../../src/UrlIndexer').UrlIndexer} UrlIndexer */

describe('UrlIndexer', () => {
  /**
   * @return {Promise<UrlIndexer>}
   */
  async function basicFixture() {
    return fixture('<url-indexer></url-indexer>');
  }

  before(async () => {
    await DbHelper.clearData();
  });

  describe('Query index', () => {
    describe('Querying for data', () => {
      before(async () => {
        const toIndex = [
          {
            id: 'test-id-1',
            url: 'https://domain.com/Api/Path?p1=1&p2=2',
            type: 'saved',
          },
          {
            id: 'test-id-2',
            url: 'https://domain.com/',
            type: 'saved',
          },
          {
            id: 'test-id-3',
            url: 'https://api.domain.com/',
            type: 'history',
          },
          {
            id: 'test-id-4',
            url: 'https://api.mulesoft.com/path/to?param=1',
            type: 'history',
          },
        ];
        const indexer = new UrlIndexer();
        await indexer.index(toIndex);
      });

      after(async () => {
        await DbHelper.clearData();
      });

      class SearchResults {
        constructor(url, size, savedSize, historySize) {
          this.url = url;
          this.size = size;
          this.savedSize = savedSize;
          this.historySize = historySize;
        }
      }

      describe('Case search', () => {
        let element = /** @type UrlIndexer */ (null);
        beforeEach(async () => {
          element = await basicFixture();
        });

        afterEach(async () => {
          const db = await element.openSearchStore();
          db.close();
        });

        [
          new SearchResults('https:', 4, 2, 2),
          new SearchResults('api', 2, 0, 2),
          new SearchResults('domain.com', 3, 2, 1),
          new SearchResults('mulesoft.com', 0, 0, 0),
        ].forEach(({ url, size, savedSize, historySize }) => {
          it(`Querying for "${url}"`, async () => {
            const result = await element.query(url, { detailed: false });
            assert.lengthOf(Object.keys(result), size);
          });

          it(`Querying for "${url}" - saved only `, async () => {
            const result = await element.query(url, {
              detailed: false,
              type: 'saved',
            });
            assert.lengthOf(Object.keys(result), savedSize);
          });

          it(`Querying for "${url}" - history only `, async () => {
            const result = await element.query(url, {
              detailed: false,
              type: 'history',
            });
            assert.lengthOf(Object.keys(result), historySize);
          });

          it('queries via event', async () => {
            const result = await ArcModelEvents.UrlIndexer.query(document.body, url);
            assert.lengthOf(Object.keys(result), size);
          });
        });
      });

      describe('Detailed search', () => {
        let element = /** @type UrlIndexer */ (null);
        beforeEach(async () => {
          element = await basicFixture();
        });

        afterEach(async () => {
          const db = await element.openSearchStore();
          db.close();
        });

        [
          new SearchResults('https:', 4, 2, 2),
          new SearchResults('api', 3, 1, 2),
          new SearchResults('domain.com', 3, 2, 1),
          new SearchResults('mulesoft.com', 1, 0, 1),
        ].forEach(({ url, size, savedSize, historySize }) => {
          it(`Querying for "${url}"`, async () => {
            const result = await element.query(url, { detailed: true });
            assert.lengthOf(Object.keys(result), size);
          });

          it(`Querying for "${url}" - saved only `, async () => {
            const result = await element.query(url, {
              detailed: true,
              type: 'saved',
            });
            assert.lengthOf(Object.keys(result), savedSize);
          });

          it(`Querying for "${url}" - history only `, async () => {
            const result = await element.query(url, {
              detailed: true,
              type: 'history',
            });
            assert.lengthOf(Object.keys(result), historySize);
          });

          it('queries via event', async () => {
            const result = await ArcModelEvents.UrlIndexer.query(document.body, url, undefined, true);
            assert.lengthOf(Object.keys(result), size);
          });

          it('queries via event with type', async () => {
            const result = await ArcModelEvents.UrlIndexer.query(document.body, url, 'history', true);
            assert.lengthOf(Object.keys(result), historySize);
          });
        });
      });
    });

    describe('IP based search', () => {
      let element = /** @type UrlIndexer */ (null);
      before(async () => {
        element = await basicFixture();
        const toIndex = [
          {
            id: 'test-id-1',
            url: 'https://178.1.2.5/api/test1',
            type: 'history',
          },
          {
            id: 'test-id-2',
            url: 'https://178.1.2.5/api/test2',
            type: 'history',
          },
          {
            id: 'test-id-3',
            url: 'https://178.1.2.5/api/test3',
            type: 'history',
          },
          {
            id: 'test-id-4',
            url: 'https://128.1.2.5/api/test4',
            type: 'history',
          },
        ];
        await element.index(toIndex);
      });

      after(async () => {
        await DbHelper.clearData();
      });

      const groupMatch = {
        'test-id-1': 'history',
        'test-id-2': 'history',
        'test-id-3': 'history',
      };

      const pathMatch = {
        'test-id-1': 'history',
        'test-id-2': 'history',
        'test-id-3': 'history',
        'test-id-4': 'history',
      };

      it('returns data for a partial IP address (1st group)', async () => {
        const result = await element.query('178', {
          detailed: false,
          type: 'history',
        });
        assert.deepEqual(result, groupMatch);
      });

      it('returns data for a partial IP address (2nd group)', async () => {
        const result = await element.query('178.1', {
          detailed: false,
          type: 'history',
        });
        assert.deepEqual(result, groupMatch);
      });

      it('returns data for a partial IP address (3rd group)', async () => {
        const result = await element.query('178.1.2', {
          detailed: false,
          type: 'history',
        });
        assert.deepEqual(result, groupMatch);
      });

      it('returns data for a partial IP address (4th group)', async () => {
        const result = await element.query('178.1.2.5', {
          detailed: false,
          type: 'history',
        });
        assert.deepEqual(result, groupMatch);
      });

      it('matches path', async () => {
        const result = await element.query('/api', {
          detailed: false,
          type: 'history',
        });
        assert.deepEqual(result, pathMatch);
      });

      it('matches path without first slash', async () => {
        const result = await element.query('api', {
          detailed: false,
          type: 'history',
        });
        assert.deepEqual(result, pathMatch);
      });

      it('matches path (detailed)', async () => {
        const result = await element.query('/api', {
          detailed: true,
          type: 'history',
        });
        assert.deepEqual(result, pathMatch);
      });

      it('matches path without first slash (detailed)', async () => {
        const result = await element.query('api', {
          detailed: true,
          type: 'history',
        });
        assert.deepEqual(result, pathMatch);
      });

      it('matches specific path', async () => {
        const result = await element.query('/api/test4', {
          detailed: false,
          type: 'history',
        });
        assert.equal(result['test-id-4'], 'history');
      });

      it('matches specific path without first slash', async () => {
        const result = await element.query('api/test4', {
          detailed: false,
          type: 'history',
        });
        assert.equal(result['test-id-4'], 'history');
      });

      it('matches specific path (detailed)', async () => {
        const result = await element.query('/api/test4', {
          detailed: true,
          type: 'history',
        });
        assert.equal(result['test-id-4'], 'history');
      });

      it('matches specific path without first slash (detailed)', async () => {
        const result = await element.query('api/test4', {
          detailed: true,
          type: 'history',
        });
        assert.equal(result['test-id-4'], 'history');
      });
    });
  });
});
