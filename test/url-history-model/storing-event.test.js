import { fixture, assert } from '@open-wc/testing';
import { UrlHistoryHelper } from './common.js';
import '../../url-history-model.js';

/** @typedef {import('../../src/UrlHistoryModel').UrlHistoryModel} UrlHistoryModel */

describe('<url-history-model> - Storing event', () => {
  /**
   * @return {Promise<UrlHistoryModel>}
   */
  async function basicFixture() {
    return fixture('<url-history-model></url-history-model>');
  }

  describe('Storing the data - Event based', () => {
    let previousInsert;
    const baseUrl = 'https://api.mulesoft.com/endpoint/path?query=parameter';
    const otherUrl = 'https://api.domain.com/endpoint/';

    before(async () => UrlHistoryHelper.deleteDatabase());

    beforeEach(async () => {
      await basicFixture();
    });

    it('stores the URL', async () => {
      const e = UrlHistoryHelper.fire('url-history-store', {
        value: baseUrl,
      });
      const result = await e.detail.result;
      assert.isTrue(result.ok);
      previousInsert = result;
    });

    it('Updates existing URL data', async () => {
      const e = UrlHistoryHelper.fire('url-history-store', {
        value: baseUrl,
      });
      const result = await e.detail.result;
      assert.isTrue(result.ok, 'Operation succeeded');
      assert.equal(result.id, previousInsert.id, 'Ids matches previous');
      assert.notEqual(result.rev, previousInsert.rev, 'Rev is different');
    });

    it('Creates another URL data', async () => {
      const e = UrlHistoryHelper.fire('url-history-store', {
        value: otherUrl,
      });
      const result = await e.detail.result;
      assert.isTrue(result.ok, 'Operation succeeded');
      assert.notEqual(result.id, previousInsert.id, 'IDs are different');
    });

    it('Event is cancelled', async () => {
      const e = UrlHistoryHelper.fire('url-history-store', {
        value: baseUrl,
      });
      assert.isTrue(e.defaultPrevented);
      await e.detail.result;
    });

    it('Rejects when no value', async () => {
      const e = UrlHistoryHelper.fire('url-history-store', {});
      let called = false;
      try {
        await e.detail.result;
      } catch (error) {
        assert.equal(error.message, 'The "value" property is not defined.');
        called = true;
      }
      assert.isTrue(called);
    });
  });
});
