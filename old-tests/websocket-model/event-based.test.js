import { fixture, assert } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import * as sinon from 'sinon';
import '../../websocket-url-history-model.js';

/* eslint-disable require-atomic-updates */
/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-vars */

/** @typedef {import('../../src/WebsocketUrlHistoryModel').WebsocketUrlHistoryModel} WebsocketUrlHistoryModel */

describe('<websocket-url-history-model> - Events API', () => {
  const generator = new DataGenerator();
  /**
   * @return {Promise<WebsocketUrlHistoryModel>}
   */
  async function basicFixture() {
    return fixture(
      '<websocket-url-history-model></websocket-url-history-model>'
    );
  }

  describe('Events API for websocket url history', () => {
    function fireChanged(item) {
      const e = new CustomEvent('websocket-url-history-changed', {
        detail: {
          item,
          result: undefined,
        },
        bubbles: true,
        composed: true,
        cancelable: true,
      });
      document.body.dispatchEvent(e);
      return e;
    }

    describe('websocket-url-history-changed', () => {
      afterEach(() => {
        return generator.destroyWebsocketsData();
      });

      let element;
      let dataObj;
      beforeEach(async () => {
        element = await basicFixture();
        dataObj = {
          _id: 'http://domain.com',
          cnt: 1,
          time: Date.now(),
        };
      });

      it('Ignores non-cancellable event', () => {
        const e = {
          cancelable: false,
          detail: {
            item: dataObj,
            result: undefined,
          },
        };
        element._handleChange(e);
        assert.isUndefined(e.detail.result);
      });

      it('Ignores cancelled event', () => {
        const e = {
          cancelable: true,
          defaultPrevented: true,
          detail: {
            item: dataObj,
            result: undefined,
          },
        };
        element._handleChange(e);
        assert.isUndefined(e.detail.result);
      });

      it('Ignores self dispatched events', () => {
        const e = {
          cancelable: true,
          composedPath: () => {
            return [element];
          },
          detail: {
            item: dataObj,
            result: undefined,
          },
        };
        element._handleChange(e);
        assert.isUndefined(e.detail.result);
      });

      it('Event is canceled', () => {
        const e = fireChanged(dataObj);
        assert.isTrue(e.defaultPrevented);
        return e.detail.result;
      });

      it('Event detail contains "result" as promise', () => {
        const e = fireChanged(dataObj);
        assert.typeOf(e.detail.result, 'promise');
        return e.detail.result;
      });

      it('Creates a new object in the datastore', () => {
        const e = fireChanged(dataObj);
        return e.detail.result.then((result) => {
          assert.typeOf(result._rev, 'string', '_rev is set');
          assert.typeOf(result._id, 'string', '_id is set');
          assert.equal(result.cnt, dataObj.cnt, 'cnt is set');
          assert.equal(result.time, dataObj.time, 'time is set');
        });
      });

      it('Updates created object', () => {
        let originalRev;
        let originalId;
        const e = fireChanged(dataObj);
        return e.detail.result
          .then((result) => {
            originalRev = result._rev;
            originalId = result._id;
            result.cnt = 2;
            const ev = fireChanged(result);
            return ev.detail.result;
          })
          .then((result) => {
            assert.notEqual(result._rev, originalRev, '_rev is regenerated');
            assert.equal(result._id, originalId, '_id is the same');
            assert.equal(result.cnt, 2, 'Name is set');
          });
      });

      it('Rejects promise when save object is not set', async () => {
        const e = fireChanged();
        let called;
        try {
          await e.detail.result;
        } catch (cause) {
          assert.typeOf(cause, 'error');
          called = true;
        }
        assert.isTrue(called);
      });

      it('Rejects promise when save object has no id', async () => {
        const cp = { ...dataObj };
        cp._id = undefined;
        const e = fireChanged(cp);
        let called;
        try {
          await e.detail.result;
        } catch (cause) {
          assert.typeOf(cause, 'error');
          called = true;
        }
        assert.isTrue(called);
      });

      it('Handles exceptions', () => {
        const e = {
          cancelable: true,
          composedPath: () => [],
          preventDefault: () => {},
          stopPropagation: () => {},
          detail: {
            item: dataObj,
          },
        };
        element.update = () => {
          return Promise.reject(new Error('test'));
        };
        let called = false;
        element._handleChange(e);
        return e.detail.result
          .catch((cause) => {
            if (cause.message === 'test') {
              called = true;
            }
          })
          .then(() => {
            assert.isTrue(called);
          });
      });
    });

    describe('websocket-url-history-read', () => {
      afterEach(() => {
        return generator.destroyWebsocketsData();
      });

      let element;
      let dataObj;
      beforeEach(async () => {
        element = await basicFixture();
        dataObj = {
          _id: 'http://domain.com',
          cnt: 1,
          time: Date.now(),
        };
        const e = fireChanged(dataObj);
        dataObj = await e.detail.result;
      });

      function fire(id) {
        const e = new CustomEvent('websocket-url-history-read', {
          detail: {
            url: id,
            result: undefined,
          },
          bubbles: true,
          composed: true,
          cancelable: true,
        });
        document.body.dispatchEvent(e);
        return e;
      }

      it('Ignores non-cancellable event', async () => {
        const el = await basicFixture();
        const e = {
          cancelable: false,
          detail: {
            url: dataObj._id,
          },
        };
        el._handleRead(e);
        assert.isUndefined(e.detail.result);
      });

      it('Ignores cancelled event', async () => {
        const el = await basicFixture();
        const e = {
          cancelable: true,
          defaultPrevented: true,
          detail: {
            url: dataObj._id,
          },
        };
        el._handleRead(e);
        assert.isUndefined(e.detail.result);
      });

      it('Ignores self dispatched events', async () => {
        const el = await basicFixture();
        const e = {
          cancelable: true,
          composedPath: () => {
            return [el];
          },
          detail: {
            url: dataObj._id,
          },
        };
        el._handleRead(e);
        assert.isUndefined(e.detail.result);
      });

      it('Event is canceled', () => {
        const e = fire(dataObj._id);
        assert.isTrue(e.defaultPrevented);
        return e.detail.result;
      });

      it('Event detail contains "result" as promise', () => {
        const e = fire(dataObj._id);
        assert.typeOf(e.detail.result, 'promise');
        return e.detail.result;
      });

      it('Reads an object', () => {
        const e = fire(dataObj._id);
        return e.detail.result.then((result) => {
          assert.equal(result._id, dataObj._id);
        });
      });

      it('Rejects promise when no ID', async () => {
        const e = fire();
        let called;
        try {
          await e.detail.result;
        } catch (cause) {
          assert.typeOf(cause, 'error');
          called = true;
        }
        assert.isTrue(called);
      });

      it('Returns undefined when no object', () => {
        const e = fire('test-id-non-existing');
        return e.detail.result.then((result) => {
          assert.isUndefined(result);
        });
      });

      it('Handles exceptions', () => {
        element.read = () => {
          return Promise.reject(new Error('test'));
        };
        const e = fire('test-id-non-existing');
        let called = false;
        return e.detail.result
          .catch((cause) => {
            if (cause.message === 'test') {
              called = true;
            }
          })
          .then(() => {
            assert.isTrue(called);
          });
      });
    });

    describe('websocket-url-history-query', () => {
      afterEach(() => {
        return generator.destroyWebsocketsData();
      });

      let element;
      let dataObj;
      beforeEach(async () => {
        element = await basicFixture();
        dataObj = {
          _id: 'http://domain.com',
          cnt: 1,
          time: Date.now(),
        };
        const e = fireChanged(dataObj);
        dataObj = await e.detail.result;
      });

      function fire(q) {
        const e = new CustomEvent('websocket-url-history-query', {
          detail: {
            q,
            result: undefined,
          },
          bubbles: true,
          composed: true,
          cancelable: true,
        });
        document.body.dispatchEvent(e);
        return e;
      }

      it('Ignores non-cancellable event', () => {
        const e = {
          cancelable: false,
          detail: {
            q: 'test',
          },
        };
        element._handleQuery(e);
        assert.isUndefined(e.detail.result);
      });

      it('Ignores cancelled event', () => {
        const e = {
          cancelable: true,
          defaultPrevented: true,
          detail: {
            q: 'test',
          },
        };
        element._handleQuery(e);
        assert.isUndefined(e.detail.result);
      });

      it('Ignores self dispatched events', () => {
        const e = {
          cancelable: true,
          composedPath: () => {
            return [element];
          },
          detail: {
            q: 'test',
          },
        };
        element._handleQuery(e);
        assert.isUndefined(e.detail.result);
      });

      it('Event is canceled', () => {
        const e = fire('http');
        assert.isTrue(e.defaultPrevented);
        return e.detail.result;
      });

      it('Event detail contains "result" as promise', () => {
        const e = fire('http');
        assert.typeOf(e.detail.result, 'promise');
        return e.detail.result;
      });

      it('Returns a list of results', () => {
        const e = fire('http');
        return e.detail.result.then((result) => {
          assert.typeOf(result, 'array', 'Result is an array');
          assert.lengthOf(result, 1, 'Length is OK');
        });
      });

      it('Returned items contains _time property', () => {
        const e = fire('http');
        return e.detail.result.then((result) => {
          assert.typeOf(result[0]._time, 'number', '_time is a number');
        });
      });

      it('Returns all items when no query', async () => {
        const e = fire();
        const result = await e.detail.result;
        assert.typeOf(result, 'array', 'Result is an array');
        assert.lengthOf(result, 1, 'Length is OK');
      });

      it('Handles exceptions', () => {
        element.list = () => {
          return Promise.reject(new Error('test'));
        };
        const e = fire('test-id-non-existing');
        let called = false;
        return e.detail.result
          .catch((cause) => {
            if (cause.message === 'test') {
              called = true;
            }
          })
          .then(() => {
            assert.isTrue(called);
          });
      });
    });

    describe('websocket-url-history-list', () => {
      afterEach(() => {
        return generator.destroyWebsocketsData();
      });

      let element;
      let dataObj;
      beforeEach(async () => {
        element = await basicFixture();
        dataObj = {
          _id: 'http://domain.com',
          cnt: 1,
          time: Date.now(),
        };
        const e = fireChanged(dataObj);
        dataObj = await e.detail.result;
      });

      function fire() {
        const e = new CustomEvent('websocket-url-history-list', {
          detail: {
            result: undefined,
          },
          bubbles: true,
          composed: true,
          cancelable: true,
        });
        document.body.dispatchEvent(e);
        return e;
      }

      it('Ignores non-cancellable event', () => {
        const e = {
          cancelable: false,
          detail: {},
        };
        element._handleQueryHistory(e);
        assert.isUndefined(e.detail.result);
      });

      it('Ignores cancelled event', () => {
        const e = {
          cancelable: true,
          defaultPrevented: true,
          detail: {},
        };
        element._handleQueryHistory(e);
        assert.isUndefined(e.detail.result);
      });

      it('Ignores self dispatched events', () => {
        const e = {
          cancelable: true,
          composedPath: () => {
            return [element];
          },
          detail: {},
        };
        element._handleQueryHistory(e);
        assert.isUndefined(e.detail.result);
      });

      it('Event is canceled', () => {
        const e = fire();
        assert.isTrue(e.defaultPrevented);
        return e.detail.result;
      });

      it('Event detail contains "result" as promise', () => {
        const e = fire();
        assert.typeOf(e.detail.result, 'promise');
        return e.detail.result;
      });

      it('Returns a list of history objects', () => {
        const e = fire();
        return e.detail.result.then((result) => {
          assert.typeOf(result, 'array', 'Result is an array');
          assert.lengthOf(result, 1, 'Length is OK');
        });
      });

      it('Returned items contains _time property', () => {
        const e = fire();
        return e.detail.result.then((result) => {
          assert.typeOf(result[0]._time, 'number', '_time is a number');
        });
      });

      it('Handles exceptions', () => {
        element.list = () => {
          return Promise.reject(new Error('test'));
        };
        const e = fire();
        let called = false;
        return e.detail.result
          .catch((cause) => {
            if (cause.message === 'test') {
              called = true;
            }
          })
          .then(() => {
            assert.isTrue(called);
          });
      });
    });

    describe('"destroy-model" event', () => {
      function fire(models) {
        const e = new CustomEvent('destroy-model', {
          detail: {
            models,
            result: undefined,
          },
          bubbles: true,
        });
        document.body.dispatchEvent(e);
        return e;
      }

      it('Deletes saved model', async () => {
        await basicFixture();
        const e = fire(['websocket-url-history']);
        assert.typeOf(e.detail.result, 'array');
        assert.lengthOf(e.detail.result, 1);
        await Promise.all(e.detail.result);
      });

      it('Calls delete functions', async () => {
        const element = await basicFixture();
        const spy = sinon.spy(element, 'deleteModel');
        const e = fire(['websocket-url-history']);
        assert.isTrue(spy.called, 'called the function');
        await Promise.all(e.detail.result);
      });
    });
  });
});
