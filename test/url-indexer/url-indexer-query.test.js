import { fixture, assert } from '@open-wc/testing';
import '../../url-indexer.js';

describe('<url-indexer> - Indexing test', function() {
  async function basicFixture() {
    return /** @type {UrlIndexer} */ (await fixture('<url-indexer></url-indexer>'));
  }

  describe('Query index', function() {
    function clearAllIndexes(db) {
      return new Promise((resolve, reject) => {
        const tx = db.transaction('urls', 'readwrite');
        const store = tx.objectStore('urls');
        const results = [];
        tx.onerror = () => {
          reject(results);
        };
        tx.oncomplete = () => {
          resolve(results);
        };
        store.clear();
      });
    }

    describe('Querying for data', function() {
      let element;

      before(async () => {
        element = await basicFixture();
        const toIndex = [{
          id: 'test-id-1',
          url: 'https://domain.com/Api/Path?p1=1&p2=2',
          type: 'saved'
        }, {
          id: 'test-id-2',
          url: 'https://domain.com/',
          type: 'saved'
        }, {
          id: 'test-id-3',
          url: 'https://api.domain.com/',
          type: 'history'
        }, {
          id: 'test-id-4',
          url: 'https://api.mulesoft.com/path/to?param=1',
          type: 'history'
        }];
        await element.index(toIndex);
      });

      after(() => {
        return element.openSearchStore()
        .then((db) => clearAllIndexes(db));
      });

      describe('Case search', function() {
        [
          ['https:', 4, 2, 2],
          ['api', 2, 0, 2],
          ['domain.com', 3, 2, 1],
          ['mulesoft.com', 0, 0, 0]
        ].forEach(function(data) {
          it(`Querying for "${data[0]}"`, function() {
            return element.query(data[0], { detailed: false })
            .then((result) => {
              assert.lengthOf(Object.keys(result), data[1]);
            });
          });

          it(`Querying for "${data[0]}" - saved only `, function() {
            return element.query(data[0], {
              detailed: false,
              type: 'saved'
            })
            .then((result) => {
              assert.lengthOf(Object.keys(result), data[2]);
            });
          });

          it(`Querying for "${data[0]}" - history only `, function() {
            return element.query(data[0], {
              detailed: false,
              type: 'history'
            })
            .then((result) => {
              assert.lengthOf(Object.keys(result), data[3]);
            });
          });
        });
      });

      describe('Detailed search', function() {
        [
          ['https:', 4, 2, 2],
          ['api', 3, 1, 2],
          ['domain.com', 3, 2, 1],
          ['mulesoft.com', 1, 0, 1]
        ].forEach(function(data) {
          it(`Querying for "${data[0]}"`, function() {
            return element.query(data[0], { detailed: true })
            .then((result) => {
              assert.lengthOf(Object.keys(result), data[1]);
            });
          });

          it(`Querying for "${data[0]}" - saved only `, function() {
            return element.query(data[0], {
              detailed: true,
              type: 'saved'
            })
            .then((result) => {
              assert.lengthOf(Object.keys(result), data[2]);
            });
          });

          it(`Querying for "${data[0]}" - history only `, function() {
            return element.query(data[0], {
              detailed: true,
              type: 'history'
            })
            .then((result) => {
              assert.lengthOf(Object.keys(result), data[3]);
            });
          });
        });
      });
    });

    describe('IP based search', () => {
      let element;
      before(async () => {
        element = await basicFixture();
        const toIndex = [{
          id: 'test-id-1',
          url: 'https://178.1.2.5/api/test1',
          type: 'history'
        }, {
          id: 'test-id-2',
          url: 'https://178.1.2.5/api/test2',
          type: 'history'
        }, {
          id: 'test-id-3',
          url: 'https://178.1.2.5/api/test3',
          type: 'history'
        }, {
          id: 'test-id-4',
          url: 'https://128.1.2.5/api/test4',
          type: 'history'
        }];
        await element.index(toIndex);
      });

      after(async () => {
        const db = await element.openSearchStore();
        await clearAllIndexes(db);
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
          type: 'history'
        });
        assert.deepEqual(result, groupMatch);
      });

      it('returns data for a partial IP address (2nd group)', async () => {
        const result = await element.query('178.1', {
          detailed: false,
          type: 'history'
        });
        assert.deepEqual(result, groupMatch);
      });

      it('returns data for a partial IP address (3rd group)', async () => {
        const result = await element.query('178.1.2', {
          detailed: false,
          type: 'history'
        });
        assert.deepEqual(result, groupMatch);
      });

      it('returns data for a partial IP address (4th group)', async () => {
        const result = await element.query('178.1.2.5', {
          detailed: false,
          type: 'history'
        });
        assert.deepEqual(result, groupMatch);
      });

      it('matches path', async () => {
        const result = await element.query('/api', {
          detailed: false,
          type: 'history'
        });
        assert.deepEqual(result, pathMatch);
      });

      it('matches path without first slash', async () => {
        const result = await element.query('api', {
          detailed: false,
          type: 'history'
        });
        assert.deepEqual(result, pathMatch);
      });

      it('matches path (detailed)', async () => {
        const result = await element.query('/api', {
          detailed: true,
          type: 'history'
        });
        assert.deepEqual(result, pathMatch);
      });

      it('matches path without first slash (detailed)', async () => {
        const result = await element.query('api', {
          detailed: true,
          type: 'history'
        });
        assert.deepEqual(result, pathMatch);
      });

      it('matches specific path', async () => {
        const result = await element.query('/api/test4', {
          detailed: false,
          type: 'history'
        });
        assert.equal(result['test-id-4'], 'history');
      });

      it('matches specific path without first slash', async () => {
        const result = await element.query('api/test4', {
          detailed: false,
          type: 'history'
        });
        assert.equal(result['test-id-4'], 'history');
      });

      it('matches specific path (detailed)', async () => {
        const result = await element.query('/api/test4', {
          detailed: true,
          type: 'history'
        });
        assert.equal(result['test-id-4'], 'history');
      });

      it('matches specific path without first slash (detailed)', async () => {
        const result = await element.query('api/test4', {
          detailed: true,
          type: 'history'
        });
        assert.equal(result['test-id-4'], 'history');
      });
    });
  });
});
