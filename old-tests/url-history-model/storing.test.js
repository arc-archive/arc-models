import { fixture, assert } from '@open-wc/testing';
import { UrlHistoryHelper } from './common.js';
import '../../url-history-model.js';

/** @typedef {import('../../src/UrlHistoryModel').UrlHistoryModel} UrlHistoryModel */

describe('<url-history-model> - Storing data', () => {
  /**
   * @return {Promise<UrlHistoryModel>}
   */
  async function basicFixture() {
    return fixture('<url-history-model></url-history-model>');
  }

  describe('Storing the data', () => {
    let element = /** @type UrlHistoryModel */ (null);
    const baseUrl = 'https://api.mulesoft.com/endpoint/path?query=parameter';
    const otherUrl = 'https://api.domain.com/endpoint/';
    describe('store()', () => {
      let previousInsert;

      before(async () => {
        await UrlHistoryHelper.deleteDatabase();
      });

      beforeEach(async () => {
        element = await basicFixture();
      });

      it('stores the URL', async () => {
        previousInsert = await element.store(baseUrl);
        assert.isTrue(previousInsert.ok);
      });

      it('updates existing URL data', async () => {
        const result = await element.store(baseUrl);
        assert.isTrue(result.ok, 'Operation succeeded');
        assert.equal(result.id, previousInsert.id, 'Ids matches previous');
        assert.notEqual(result.rev, previousInsert.rev, 'Rev is different');
      });

      it('Creates another URL data', async () => {
        const result = await element.store(otherUrl);
        assert.isTrue(result.ok, 'Operation succeeded');
        assert.notEqual(result.id, previousInsert.id, 'IDs are different');
      });
    });
  });
});
