import { fixture, assert } from '@open-wc/testing';
import '../../request-model.js';

describe('save-history event', () => {
  async function basicFixture() {
    return /** @type {RequestModel} */ (await fixture('<request-model></request-model>'));
  }

  function fire(request) {
    const e = new CustomEvent('save-history', {
      bubbles: true,
      cancelable: true,
      detail: {
        request
      }
    });
    document.body.dispatchEvent(e);
    return e;
  }

  function generateId(request) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    let id = d.getTime();
    id += '/' + encodeURIComponent(request.url);
    id += '/' + request.method;
    return id;
  }

  describe('saving history data', function() {
    let request;
    let element;
    beforeEach(async () => {
      request = {
        url: 'test-url',
        method: 'test-method',
        headers: 'test-headers',
        payload: ''
      };
      element = await basicFixture();
    });

    it('Ignores cancelled events', function() {
      element._saveHistoryHandler({
        defaultPrevented: true
      });
      // No error
    });

    it('Generates history ID', () => {
      element.saveRequest = function(request) {
        return Promise.resolve(request);
      };
      const id = generateId(request);
      const e = fire(request);
      return e.detail.result
      .then((request) => {
        assert.equal(request._id, id);
      });
    });

    it('Sets history type', () => {
      element.saveRequest = function(request) {
        return Promise.resolve(request);
      };
      const e = fire(request);
      return e.detail.result
      .then((request) => {
        assert.equal(request.type, 'history');
      });
    });

    it('Inserts object to the data store', () => {
      const e = fire(request);
      return e.detail.result
      .then((request) => {
        assert.typeOf(request._rev, 'string');
      });
    });

    it('Updates existing item', () => {
      const e = fire(request);
      return e.detail.result
      .then((request) => {
        assert.equal(request._rev.indexOf('2-'), 0);
      });
    });
  });
});
