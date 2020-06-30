import { fixture, assert } from '@open-wc/testing';
import { UrlHistoryHelper } from './common.js';
import '../../url-history-model.js';
import { sortFunction } from '../../src/UrlHistoryModel.js';

/** @typedef {import('../../src/UrlHistoryModel').UrlHistoryModel} UrlHistoryModel */

describe('<url-history-model> - Querying', () => {
  /**
   * @return {Promise<UrlHistoryModel>}
   */
  async function basicFixture() {
    return fixture('<url-history-model></url-history-model>');
  }

  describe('Querying the data', () => {
    const baseUrl = 'https://api.mulesoft.com/endpoint/path?query=parameter';
    const similarUrl = 'https://api.mulesoft.com/';
    const otherUrl = 'https://api.domain.com/endpoint/';

    describe('query()', () => {
      let element = /** @type UrlHistoryModel */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      before(async () => {
        await UrlHistoryHelper.getDatabase().destroy();
        await UrlHistoryHelper.insertData([baseUrl, similarUrl, otherUrl]);
      });

      it('should not result with data', async () => {
        const result = await element.query('random');
        assert.typeOf(result, 'array', 'Result is an array');
        assert.lengthOf(result, 0, 'Result is empty');
      });

      it('Should result with single URL that equals URL', async () => {
        const result = await element.query(baseUrl);
        assert.lengthOf(result, 1);
      });

      it('Should result with matching URLs', async () => {
        const result = await element.query(similarUrl);
        assert.lengthOf(result, 2);
      });

      it('Should result with not valid URL', async () => {
        const result = await element.query('https');
        assert.lengthOf(result, 3);
      });
    });

    describe('query() event based', () => {
      // let element = /** @type UrlHistoryModel */ (null);
      beforeEach(async () => {
        await basicFixture();
      });

      before(async () => {
        await UrlHistoryHelper.getDatabase().destroy();
        await UrlHistoryHelper.insertData([baseUrl, similarUrl, otherUrl]);
      });

      it('Should not result with data', async () => {
        const e = UrlHistoryHelper.fire('url-history-query', {
          q: 'ranodm',
        });
        const result = await e.detail.result;
        assert.typeOf(result, 'array', 'Result is an array');
        assert.lengthOf(result, 0, 'Result is empty');
      });

      it('Should result with single URL that equals URL', async () => {
        const e = UrlHistoryHelper.fire('url-history-query', {
          q: baseUrl,
        });
        const result = await e.detail.result;
        assert.lengthOf(result, 1);
      });

      it('Should result with matching URLs', async () => {
        const e = UrlHistoryHelper.fire('url-history-query', {
          q: similarUrl,
        });
        const result = await e.detail.result;
        assert.lengthOf(result, 2);
      });

      it('Should result with not valid URL', async () => {
        const e = UrlHistoryHelper.fire('url-history-query', {
          q: 'https',
        });
        const result = await e.detail.result;
        assert.lengthOf(result, 3);
      });

      it('Event is cancelled', async () => {
        const e = UrlHistoryHelper.fire('url-history-query', {
          q: baseUrl,
        });
        assert.isTrue(e.defaultPrevented);
        await e.detail.result;
      });

      it('Rejects when query is not set', async () => {
        const e = UrlHistoryHelper.fire('url-history-query', {});
        let called = false;
        try {
          await e.detail.result;
        } catch (cause) {
          assert.equal(cause.message, 'The "q" property is not defined.');
          called = true;
        }
        assert.isTrue(called);
      });
    });
  });

  describe('sort() =>', () => {
    it('Returns 1 when a._time > b._time', () => {
      const result = sortFunction(
        {
          _time: 2,
        },
        {
          _time: 1,
        }
      );
      assert.equal(result, 1);
    });

    it('Returns -1 when a._time < b._time', () => {
      const result = sortFunction(
        {
          _time: 1,
        },
        {
          _time: 2,
        }
      );
      assert.equal(result, -1);
    });

    it('Returns 1 when a.cnt > b.cnt', () => {
      const result = sortFunction(
        {
          _time: 1,
          cnt: 2,
        },
        {
          _time: 1,
          cnt: 1,
        }
      );
      assert.equal(result, 1);
    });

    it('Returns -1 when a.cnt < b.cnt', () => {
      const result = sortFunction(
        {
          _time: 1,
          cnt: 1,
        },
        {
          _time: 1,
          cnt: 2,
        }
      );
      assert.equal(result, -1);
    });

    it('Returns 0 when a.cnt = b.cnt', () => {
      const result = sortFunction(
        {
          _time: 1,
          cnt: 1,
        },
        {
          _time: 1,
          cnt: 1,
        }
      );
      assert.equal(result, 0);
    });
  });
});
