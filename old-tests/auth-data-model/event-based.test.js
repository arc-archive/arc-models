import { fixture, assert } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import '../../auth-data-model.js';

/** @typedef {import('../../src/AuthDataModel').AuthDataModel} AuthDataModel */

/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-vars */

describe('Authorization data model - events', () => {
  const generator = new DataGenerator();
  const url = 'http://domain.com/auth';
  const method = 'x-ntlm';

  describe('"auth-data-query"', () => {
    before(async () => {
      const element = /** @type {AuthDataModel} */ (await fixture(
        '<auth-data-model></auth-data-model>'
      ));
      await element.update(url, method, {
        username: 'uname-test',
        password: 'pwd-test',
        domain: 'some',
      });
    });

    after(async () => {
      await generator.destroyAuthData();
    });

    it('Cancels the event', async () => {
      await fixture('<auth-data-model></auth-data-model>');
      const e = new CustomEvent('auth-data-query', {
        bubbles: true,
        cancelable: true,
        detail: {
          url,
          authMethod: method,
          result: undefined,
        },
      });
      document.body.dispatchEvent(e);
      await e.detail.result;
      assert.isTrue(e.defaultPrevented);
    });

    it('Ignores non-cancellable event', async () => {
      const element = /** @type {AuthDataModel} */ (await fixture(
        '<auth-data-model></auth-data-model>'
      ));
      const e = {
        cancelable: false,
        detail: {
          url,
          authMethod: method,
          result: undefined,
        },
      };
      // @ts-ignore
      element._queryHandler(e);
      assert.isUndefined(e.detail.result);
    });

    it('Ignores cancelled event', async () => {
      const element = /** @type {AuthDataModel} */ (await fixture(
        '<auth-data-model></auth-data-model>'
      ));
      const e = {
        cancelable: true,
        defaultPrevented: true,
        detail: {
          url,
          authMethod: method,
          result: undefined,
        },
      };
      // @ts-ignore
      element._queryHandler(e);
      assert.isUndefined(e.detail.result);
    });

    it('Ignores self dispatched events', async () => {
      const element = /** @type {AuthDataModel} */ (await fixture(
        '<auth-data-model></auth-data-model>'
      ));
      const e = {
        cancelable: true,
        composedPath: () => {
          return [element];
        },
        detail: {
          url,
          authMethod: method,
          result: undefined,
        },
      };
      // @ts-ignore
      element._queryHandler(e);
      assert.isUndefined(e.detail.result);
    });

    it('Resutls with auth data', async () => {
      await fixture('<auth-data-model></auth-data-model>');
      const e = new CustomEvent('auth-data-query', {
        bubbles: true,
        cancelable: true,
        detail: {
          url,
          authMethod: method,
          result: undefined,
        },
      });
      document.body.dispatchEvent(e);
      const result = await e.detail.result;
      assert.equal(result.username, 'uname-test');
      assert.equal(result.password, 'pwd-test');
      assert.equal(result.domain, 'some');
    });

    it('Handles exceptions', async () => {
      const element = /** @type {AuthDataModel} */ (await fixture(
        '<auth-data-model></auth-data-model>'
      ));
      const e = {
        cancelable: true,
        composedPath: () => [],
        preventDefault: () => {},
        stopPropagation: () => {},
        detail: {
          url,
          authMethod: method,
        },
      };
      element.query = () => {
        return Promise.reject(new Error('test'));
      };
      let called = false;
      // @ts-ignore
      element._queryHandler(e);
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

  describe('"auth-data-changed" event', () => {
    const authData = { test: true };
    after(() => {
      return generator.destroyAuthData();
    });

    it('Ignores non-cancellable event', async () => {
      const element = /** @type {AuthDataModel} */ (await fixture(
        '<auth-data-model></auth-data-model>'
      ));
      const e = {
        cancelable: false,
        detail: {
          url,
          authMethod: method,
          authData,
        },
      };
      // @ts-ignore
      element._updateHandler(e);
      assert.isUndefined(e.detail.result);
    });

    it('Ignores cancelled event', async () => {
      const element = /** @type {AuthDataModel} */ (await fixture(
        '<auth-data-model></auth-data-model>'
      ));
      const e = {
        cancelable: true,
        defaultPrevented: true,
        detail: {
          url,
          authMethod: method,
          authData,
          result: undefined,
        },
      };
      // @ts-ignore
      element._updateHandler(e);
      assert.isUndefined(e.detail.result);
    });

    it('Ignores self dispatched events', async () => {
      const element = /** @type {AuthDataModel} */ (await fixture(
        '<auth-data-model></auth-data-model>'
      ));
      const e = {
        cancelable: true,
        composedPath: () => {
          return [element];
        },
        detail: {
          url,
          authMethod: method,
          authData,
          result: undefined,
        },
      };
      // @ts-ignore
      element._updateHandler(e);
      assert.isUndefined(e.detail.result);
    });

    it('Cancels the event', async () => {
      await fixture('<auth-data-model></auth-data-model>');
      const e = new CustomEvent('auth-data-changed', {
        bubbles: true,
        cancelable: true,
        detail: {
          url,
          authMethod: method,
          authData,
          result: undefined,
        },
      });
      document.body.dispatchEvent(e);
      await e.detail.result;
      assert.isTrue(e.defaultPrevented);
    });

    it('Handles exceptions', async () => {
      const element = /** @type {AuthDataModel} */ (await fixture(
        '<auth-data-model></auth-data-model>'
      ));
      const e = {
        cancelable: true,
        composedPath: () => [],
        preventDefault: () => {},
        stopPropagation: () => {},
        detail: {
          url,
          authMethod: method,
          authData,
          result: undefined,
        },
      };
      element.update = () => {
        return Promise.reject(new Error('test'));
      };
      let called = false;
      // @ts-ignore
      element._updateHandler(e);
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

    it('Calls update function', async () => {
      let args;
      const element = /** @type {AuthDataModel} */ (await fixture(
        '<auth-data-model></auth-data-model>'
      ));
      // @ts-ignore
      element.update = (...data) => {
        args = data;
        return Promise.resolve();
      };
      const e = new CustomEvent('auth-data-changed', {
        bubbles: true,
        cancelable: true,
        detail: {
          url,
          authMethod: method,
          authData,
          result: undefined,
        },
      });
      document.body.dispatchEvent(e);
      return e.detail.result.then(() => {
        assert.ok(args);
        assert.equal(args[0], url);
        assert.equal(args[1], method);
        assert.deepEqual(args[2], authData);
      });
    });
  });
});
