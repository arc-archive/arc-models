import { fixture, assert } from '@open-wc/testing';
import sinon from 'sinon/pkg/sinon-esm.js';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator/arc-data-generator.js';
import '../../auth-data-model.js';
describe('Authorization data model', function() {
  describe('_normalizeUrl()', () => {
    let element;
    beforeEach(async () => {
      element = /** @type {AuthDataModel} */ (await fixture('<auth-data-model></auth-data-model>'));
    });

    it('Returns the same URL when no QP and Hash', () => {
      const url = 'https://domain.com/path/to/resource';
      const result = element._normalizeUrl(url);
      assert.equal(result, url);
    });

    it('Removes query parameters', () => {
      const url = 'https://domain.com/path?a=b&c=d';
      const result = element._normalizeUrl(url);
      assert.equal(result, 'https://domain.com/path');
    });

    it('Removes hash', () => {
      const url = 'https://domain.com/path#test-abc';
      const result = element._normalizeUrl(url);
      assert.equal(result, 'https://domain.com/path');
    });

    it('Removes QP and hash', () => {
      const url = 'https://domain.com/path?a=b#test-abc';
      const result = element._normalizeUrl(url);
      assert.equal(result, 'https://domain.com/path');
    });

    it('Returns empty string when no argument', () => {
      const result = element._normalizeUrl();
      assert.equal(result, '');
    });
  });

  describe('_computeKey()', () => {
    let element;
    beforeEach(async () => {
      element = /** @type {AuthDataModel} */ (await fixture('<auth-data-model></auth-data-model>'));
    });

    const url = 'https://domain.com/path';
    const method = 'basic';

    it('Returns key for url and method', () => {
      const result = element._computeKey(method, url);
      assert.equal(result, 'basic/https%3A%2F%2Fdomain.com%2Fpath');
    });

    it('Returns key for url without method', () => {
      const result = element._computeKey(method);
      assert.equal(result, 'basic/');
    });
  });

  describe('update()', function() {
    afterEach(function() {
      return DataGenerator.destroyAuthData();
    });

    let element;
    let dataObj;
    const url = 'https://domain.com/path';
    const method = 'ntlm';
    const key = 'ntlm/https%3A%2F%2Fdomain.com%2Fpath';
    beforeEach(async () => {
      element = /** @type {AuthDataModel} */ (await fixture('<auth-data-model></auth-data-model>'));
      dataObj = {
        username: 'uname-test',
        password: 'pwd-test',
        domain: 'some'
      };
    });

    it('Creates a new object in the datastore', function() {
      return element.update(url, method, dataObj)
      .then((result) => {
        assert.typeOf(result._rev, 'string', '_rev is set');
        assert.equal(result._id, key, '_id is set');
        assert.equal(result.username, dataObj.username, 'username is set');
        assert.equal(result.password, dataObj.password, 'password is set');
        assert.equal(result.domain, dataObj.domain, 'username is set');
      });
    });

    it('Updates created object', function() {
      let originalRev;
      return element.update(url, method, dataObj)
      .then((result) => {
        originalRev = result._rev;
        result.username = 'test-2';
        return element.update(url, method, result);
      })
      .then((result) => {
        assert.notEqual(result._rev, originalRev, '_rev is regenerated');
        assert.equal(result._id, key, '_id is the same');
        assert.equal(result.username, 'test-2', 'Name is set');
      });
    });

    it('Fires project-object-changed custom event', function() {
      const spy = sinon.spy();
      element.addEventListener('auth-data-changed', spy);
      return element.update(dataObj)
      .then(() => {
        assert.isTrue(spy.calledOnce);
      });
    });
  });

  describe('query()', function() {
    const url = 'http://domain.com/auth';
    const method = 'x-ntlm';
    before(async () => {
      const element = /** @type {AuthDataModel} */ (await fixture('<auth-data-model></auth-data-model>'));
      return element.update(url, method, {
        username: 'uname-test',
        password: 'pwd-test',
        domain: 'some'
      });
    });

    after(function() {
      return DataGenerator.destroyAuthData();
    });

    let element;
    beforeEach(async () => {
      element = /** @type {AuthDataModel} */ (await fixture('<auth-data-model></auth-data-model>'));
    });

    it('Returns existing data from the data store', () => {
      return element.query(url, method)
      .then((result) => {
        assert.equal(result.username, 'uname-test');
        assert.equal(result.password, 'pwd-test');
        assert.equal(result.domain, 'some');
      });
    });

    it('Returns undefined if no data', () => {
      return element.query('other', method)
      .then((result) => {
        assert.isUndefined(result);
      });
    });
  });
});
