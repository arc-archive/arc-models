import { fixture, assert } from '@open-wc/testing';
import '../../websocket-url-history-model.js';

describe('<websocket-url-history-model>', function() {
  async function basicFixture() {
    return /** @type {WebsocketUrlHistoryModel} */ (await fixture('<websocket-url-history-model></websocket-url-history-model>'));
  }

  describe('_sortFunction()', function() {
    let element;
    before(async () => {
      element = await basicFixture();
    });

    it('Returns 1 when a "time" is bigger', () => {
      const result = element._sortFunction({
        _time: 1
      }, {
        _time: 0
      });
      assert.equal(result, 1);
    });

    it('Returns 1 when a "cnt" is bigger', () => {
      const result = element._sortFunction({
        _time: 0,
        cnt: 1
      }, {
        _time: 0,
        cnt: 0
      });
      assert.equal(result, 1);
    });

    it('Returns -1 when a "time" is smaller', () => {
      const result = element._sortFunction({
        _time: 0
      }, {
        _time: 1
      });
      assert.equal(result, -1);
    });

    it('Returns -1 when a "cnt" is samller', () => {
      const result = element._sortFunction({
        _time: 0,
        cnt: 0
      }, {
        _time: 0,
        cnt: 1
      });
      assert.equal(result, -1);
    });

    it('Returns 0 when "time" and "cnt" equals', () => {
      const result = element._sortFunction({
        _time: 0,
        cnt: 0
      }, {
        _time: 0,
        cnt: 0
      });
      assert.equal(result, 0);
    });
  });
});
