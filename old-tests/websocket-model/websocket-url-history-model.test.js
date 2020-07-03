import { assert } from '@open-wc/testing';
import '../../websocket-url-history-model.js';
import { sortFunction } from '../../src/WebsocketUrlHistoryModel.js';

describe('<websocket-url-history-model>', () => {
  describe('sortFunction()', () => {
    it('Returns 1 when a "time" is bigger', () => {
      const result = sortFunction(
        {
          // @ts-ignore
          _time: 1,
        },
        {
          _time: 0,
        }
      );
      assert.equal(result, 1);
    });

    it('Returns 1 when a "cnt" is bigger', () => {
      const result = sortFunction(
        {
          // @ts-ignore
          _time: 0,
          cnt: 1,
        },
        {
          _time: 0,
          cnt: 0,
        }
      );
      assert.equal(result, 1);
    });

    it('Returns -1 when a "time" is smaller', () => {
      const result = sortFunction(
        {
          // @ts-ignore
          _time: 0,
        },
        {
          _time: 1,
        }
      );
      assert.equal(result, -1);
    });

    it('Returns -1 when a "cnt" is samller', () => {
      const result = sortFunction(
        {
          // @ts-ignore
          _time: 0,
          cnt: 0,
        },
        {
          _time: 0,
          cnt: 1,
        }
      );
      assert.equal(result, -1);
    });

    it('Returns 0 when "time" and "cnt" equals', () => {
      const result = sortFunction(
        {
          // @ts-ignore
          _time: 0,
          cnt: 0,
        },
        {
          _time: 0,
          cnt: 0,
        }
      );
      assert.equal(result, 0);
    });
  });
});
