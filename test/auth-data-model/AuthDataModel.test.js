import { fixture, assert, oneEvent } from '@open-wc/testing';
import { ArcModelEventTypes } from '@advanced-rest-client/events';
import { normalizeUrl, computeKey, AuthDataModel } from '../../src/AuthDataModel.js';
import { MockedStore } from '../../index.js'

describe('AuthDataModel', () => {
  const store = new MockedStore();
  
  async function etFixture() {
    return fixture(`<div></div>`);
  }

  describe('normalizeUrl()', () => {
    it('returns the same URL when no QP and Hash', () => {
      const url = 'https://domain.com/path/to/resource';
      const result = normalizeUrl(url);
      assert.equal(result, url);
    });

    it('Removes query parameters', () => {
      const url = 'https://domain.com/path?a=b&c=d';
      const result = normalizeUrl(url);
      assert.equal(result, 'https://domain.com/path');
    });

    it('Removes hash', () => {
      const url = 'https://domain.com/path#test-abc';
      const result = normalizeUrl(url);
      assert.equal(result, 'https://domain.com/path');
    });

    it('Removes QP and hash', () => {
      const url = 'https://domain.com/path?a=b#test-abc';
      const result = normalizeUrl(url);
      assert.equal(result, 'https://domain.com/path');
    });

    it('Returns empty string when no argument', () => {
      const result = normalizeUrl(undefined);
      assert.equal(result, '');
    });
  });

  describe('computeKey()', () => {
    const url = 'https://domain.com/path';
    const method = 'basic';

    it('Returns key for url and method', () => {
      const result = computeKey(method, url);
      assert.equal(result, 'basic/https%3A%2F%2Fdomain.com%2Fpath');
    });

    it('Returns key for url without method', () => {
      const result = computeKey(method);
      assert.equal(result, 'basic/');
    });
  });

  describe('update()', () => {
    afterEach(() => store.destroyBasicAuth());

    /** @type AuthDataModel */
    let element;
    /** @type Element */
    let et;
    let dataObj;
    const url = 'https://domain.com/path';
    const method = 'ntlm';
    const key = 'ntlm/https%3A%2F%2Fdomain.com%2Fpath';
    beforeEach(async () => {
      et = await etFixture();
      element = new AuthDataModel();
      element.listen(et);
      dataObj = {
        username: 'uname-test',
        password: 'pwd-test',
        domain: 'some',
      };
    });

    it('returns change record', async () => {
      const record = await element.update(url, method, dataObj);
      assert.typeOf(record, 'object', 'returns an object');
      assert.typeOf(record.rev, 'string', 'revision is set');
      assert.equal(record.id, key, 'id is set');
      assert.typeOf(record.item, 'object', 'item is set');
    });

    it('creates a new object in the datastore', async () => {
      const result = await element.update(url, method, dataObj);
      const { item } = result;
      assert.typeOf(item._rev, 'string', '_rev is set');
      assert.equal(item._id, key, '_id is set');
      assert.equal(item.username, dataObj.username, 'username is set');
      assert.equal(item.password, dataObj.password, 'password is set');
      assert.equal(item.domain, dataObj.domain, 'username is set');
    });

    it('Updates created object', async () => {
      const result = await element.update(url, method, dataObj);
      const originalRev = result.rev;
      result.item.username = 'test-2';
      const updated = await element.update(url, method, result.item);
      assert.notEqual(updated.rev, originalRev, '_rev is regenerated');
      assert.equal(updated.id, key, '_id is the same');
      assert.equal(updated.item.username, 'test-2', 'Name is set');
    });

    it('dispatches change event', async () => {
      element.update(url, method, dataObj);
      await oneEvent(et, ArcModelEventTypes.AuthData.State.update);
    });
  });

  describe('query()', () => {
    const url = 'http://domain.com/auth';
    const method = 'x-ntlm';
    before(async () => {
      const et = await etFixture();
      const element = new AuthDataModel();
      element.listen(et);
      return element.update(url, method, {
        username: 'uname-test',
        password: 'pwd-test',
        domain: 'some',
      });
    });

    after(async () => store.destroyBasicAuth());

    let element = /** @type AuthDataModel */ (null);
    beforeEach(async () => {
      const et = await etFixture();
      element = new AuthDataModel();
      element.listen(et);
    });

    it('Returns existing data from the data store', async () => {
      const result = await element.query(url, method);
      assert.equal(result.username, 'uname-test');
      assert.equal(result.password, 'pwd-test');
      assert.equal(result.domain, 'some');
    });

    it('Returns undefined if no data', async () => {
      const result = await element.query('other', method);
      assert.isUndefined(result);
    });
  });
});
