import { fixture, assert } from '@open-wc/testing';
import { ArcModelEventTypes, ArcModelEvents } from '@advanced-rest-client/events';
import { AuthDataModel } from '../../src/AuthDataModel.js';
import { MockedStore } from '../../index.js'


/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-vars */

describe('Authorization data model - events', () => {
  const url = 'http://domain.com/auth';
  const method = 'x-ntlm';

  const store = new MockedStore();
  
  async function etFixture() {
    return fixture(`<div></div>`);
  }

  describe(`the query event`, () => {
    before(async () => {
      const et = await etFixture();
      const element = new AuthDataModel();
      element.listen(et);
      await element.update(url, method, {
        username: 'uname-test',
        password: 'pwd-test',
        domain: 'some',
      });
    });
    
    /** @type Element */
    let et;
    /** @type AuthDataModel */
    let element;

    after(async () => {
      await store.destroyBasicAuth();
    });

    beforeEach(async () => {
      et = await etFixture();
      element = new AuthDataModel();
      element.listen(et);
    });

    it('ignores cancelled events', async () => {
      document.body.addEventListener(ArcModelEventTypes.AuthData.query, function f(e) {
        e.preventDefault();
        document.body.removeEventListener(ArcModelEventTypes.AuthData.query, f);
      });
      const e = new CustomEvent(ArcModelEventTypes.AuthData.query, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: { result: undefined },
      });
      // @ts-ignore
      e.url = url;
      // @ts-ignore
      e.method = method;
      document.body.dispatchEvent(e);
      assert.isUndefined(e.detail.result);
    });

    it('results with auth data', async () => {
      const result = await ArcModelEvents.AuthData.query(document.body, url, method);
      assert.equal(result.username, 'uname-test');
      assert.equal(result.password, 'pwd-test');
      assert.equal(result.domain, 'some');
    });
  });

  describe(`${ArcModelEventTypes.AuthData.update} event`, () => {
    const authData = { username: 'uname', password: 'other' };
    after(() => store.destroyBasicAuth());

    /** @type Element */
    let et;
    /** @type AuthDataModel */
    let element;

    beforeEach(async () => {
      et = await etFixture();
      element = new AuthDataModel();
      element.listen(et);
    });

    it('ignores cancelled events', async () => {
      document.body.addEventListener(ArcModelEventTypes.AuthData.update, function f(e) {
        e.preventDefault();
        document.body.removeEventListener(ArcModelEventTypes.AuthData.update, f);
      });
      const e = new CustomEvent(ArcModelEventTypes.AuthData.update, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: { result: undefined },
      });
      // @ts-ignore
      e.url = url;
      // @ts-ignore
      e.method = method;
      // @ts-ignore
      e.authData = authData;
      document.body.dispatchEvent(e);
      assert.isUndefined(e.detail.result);
    });

    it('updates the entity', async () => {
      const record = await ArcModelEvents.AuthData.update(document.body, url, method, authData);
      assert.typeOf(record, 'object', 'returns an object');
      assert.typeOf(record.rev, 'string', 'revision is set');
      assert.typeOf(record.id, 'string', 'id is set');
      assert.typeOf(record.item, 'object', 'item is set');
    });
  });
});
