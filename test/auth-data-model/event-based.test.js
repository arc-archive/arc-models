import { fixture, assert } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator/arc-data-generator.js';
import '../../auth-data-model.js';

describe('Authorization data model - events', function() {
  const url = 'http://domain.com/auth';
  const method = 'x-ntlm';

  describe('"auth-data-query"', function() {
    before(async () => {
      const element = /** @type {AuthDataModel} */ (await fixture('<auth-data-model></auth-data-model>'));
      await element.update(url, method, {
        username: 'uname-test',
        password: 'pwd-test',
        domain: 'some'
      });
    });

    after(async () => {
      await DataGenerator.destroyAuthData();
    });

    it('Cancels the event', async () => {
      await fixture('<auth-data-model></auth-data-model>');
      const e = new CustomEvent('auth-data-query', {
        bubbles: true,
        cancelable: true,
        detail: {
          url,
          authMethod: method
        }
      });
      document.body.dispatchEvent(e);
      await e.detail.result;
      assert.isTrue(e.defaultPrevented);
    });

    it('Ignores non-cancellable event', async () => {
      const element = /** @type {AuthDataModel} */ (await fixture('<auth-data-model></auth-data-model>'));
      const e = {
        cancelable: false,
        detail: {
          url,
          authMethod: method
        }
      };
      element._queryHandler(e);
      assert.isUndefined(e.detail.result);
    });

    it('Ignores cancelled event', async () => {
      const element = /** @type {AuthDataModel} */ (await fixture('<auth-data-model></auth-data-model>'));
      const e = {
        cancelable: true,
        defaultPrevented: true,
        detail: {
          url,
          authMethod: method
        }
      };
      element._queryHandler(e);
      assert.isUndefined(e.detail.result);
    });

    it('Ignores self dispatched events', async () => {
      const element = /** @type {AuthDataModel} */ (await fixture('<auth-data-model></auth-data-model>'));
      const e = {
        cancelable: true,
        composedPath: function() {
          return [element];
        },
        detail: {
          url,
          authMethod: method
        }
      };
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
          authMethod: method
        }
      });
      document.body.dispatchEvent(e);
      const result = await e.detail.result;
      assert.equal(result.username, 'uname-test');
      assert.equal(result.password, 'pwd-test');
      assert.equal(result.domain, 'some');
    });

    it('Handles exceptions', async () => {
      const element = /** @type {AuthDataModel} */ (await fixture('<auth-data-model></auth-data-model>'));
      const e = {
        cancelable: true,
        composedPath: () => [],
        preventDefault: () => {},
        stopPropagation: () => {},
        detail: {
          url,
          authMethod: method
        }
      };
      element.query = () => {
        return Promise.reject(new Error('test'));
      };
      let called = false;
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
    after(function() {
      return DataGenerator.destroyAuthData();
    });

    it('Ignores non-cancellable event', async () => {
      const element = /** @type {AuthDataModel} */ (await fixture('<auth-data-model></auth-data-model>'));
      const e = {
        cancelable: false,
        detail: {
          url,
          authMethod: method,
          authData
        }
      };
      element._updateHandler(e);
      assert.isUndefined(e.detail.result);
    });

    it('Ignores cancelled event', async () => {
      const element = /** @type {AuthDataModel} */ (await fixture('<auth-data-model></auth-data-model>'));
      const e = {
        cancelable: true,
        defaultPrevented: true,
        detail: {
          url,
          authMethod: method,
          authData
        }
      };
      element._updateHandler(e);
      assert.isUndefined(e.detail.result);
    });

    it('Ignores self dispatched events', async () => {
      const element = /** @type {AuthDataModel} */ (await fixture('<auth-data-model></auth-data-model>'));
      const e = {
        cancelable: true,
        composedPath: function() {
          return [element];
        },
        detail: {
          url,
          authMethod: method,
          authData
        }
      };
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
          authData
        }
      });
      document.body.dispatchEvent(e);
      await e.detail.result;
      assert.isTrue(e.defaultPrevented);
    });

    it('Handles exceptions', async () => {
      const element = /** @type {AuthDataModel} */ (await fixture('<auth-data-model></auth-data-model>'));
      const e = {
        cancelable: true,
        composedPath: () => [],
        preventDefault: () => {},
        stopPropagation: () => {},
        detail: {
          url,
          authMethod: method,
          authData
        }
      };
      element.update = () => {
        return Promise.reject(new Error('test'));
      };
      let called = false;
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
      const element = /** @type {AuthDataModel} */ (await fixture('<auth-data-model></auth-data-model>'));
      element.update = function(...data) {
        args = data;
        return Promise.resolve();
      };
      const e = new CustomEvent('auth-data-changed', {
        bubbles: true,
        cancelable: true,
        detail: {
          url,
          authMethod: method,
          authData
        }
      });
      document.body.dispatchEvent(e);
      return e.detail.result
      .then(() => {
        assert.ok(args);
        assert.equal(args[0], url);
        assert.equal(args[1], method);
        assert.deepEqual(args[2], authData);
      });
    });
  });
});
