import { fixture, assert } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import '../../auth-data-model.js';
import { ArcModelEventTypes } from '../../src/events/ArcModelEventTypes.js';
import { ArcModelEvents } from '../../src/events/ArcModelEvents.js';

/** @typedef {import('../../src/AuthDataModel').AuthDataModel} AuthDataModel */

/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-vars */

describe('Authorization data model - events', () => {
  const generator = new DataGenerator();
  const url = 'http://domain.com/auth';
  const method = 'x-ntlm';

  /**
   * @return {Promise<AuthDataModel>}
   */
  async function basicFixture() {
    return fixture('<auth-data-model></auth-data-model>');
  }

  describe(`${ArcModelEventTypes.AuthData.query} event`, () => {
    before(async () => {
      const element = await basicFixture();
      await element.update(url, method, {
        username: 'uname-test',
        password: 'pwd-test',
        domain: 'some',
      });
    });

    after(async () => {
      await generator.destroyAuthData();
    });

    beforeEach(async () => {
      await basicFixture();
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
    after(() => {
      return generator.destroyAuthData();
    });

    beforeEach(async () => {
      await basicFixture();
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
