import { fixture, assert } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator/arc-data-generator.js';
import '../../host-rules-model.js';

describe('<host-rules-model> - Events based', () => {
  // See https://gist.github.com/haroldtreen/5f1055eee5fcf01da3e0e15b8ec86bf6
  function isError(e) {
    if (typeof e === 'string') {
      return Promise.reject(new Error(e));
    }
    return Promise.resolve(e);
  }

  describe('host-rules-changed', function() {
    afterEach(function() {
      return DataGenerator.destroyHostRulesData();
    });

    let dataObj;
    let element;
    beforeEach(async () => {
      element = /** @type {HostRulesModel} */ (await fixture('<host-rules-model></host-rules-model>'));
      dataObj = {
        _id: 'test-id-1',
        from: 'https://from',
        to: 'http://to',
        enabled: true,
        comment: 'test'
      };
    });

    function fire(rule, cancelable) {
      if (cancelable !== false) {
        cancelable = true;
      }
      const e = new CustomEvent('host-rules-changed', {
        detail: {
          rule: rule
        },
        bubbles: true,
        composed: true,
        cancelable
      });
      document.body.dispatchEvent(e);
      return e;
    }

    it('Event is canceled', function() {
      const e = fire(dataObj);
      assert.isTrue(e.defaultPrevented);
      return e.detail.result;
    });

    it('Event detail contains "result" as promise', function() {
      const e = fire(dataObj);
      assert.typeOf(e.detail.result, 'promise');
      return e.detail.result;
    });

    it('Creates a new object in the datastore', function() {
      const e = fire(dataObj);
      return e.detail.result
      .then((result) => {
        assert.typeOf(result._rev, 'string', '_rev is set');
        assert.equal(result._id, 'test-id-1', '_id is set');
        assert.equal(result.from, dataObj.from, 'from is set');
        assert.equal(result.to, dataObj.to, 'to is set');
        assert.equal(result.enabled, dataObj.enabled, 'enabled is set');
        assert.equal(result.comment, dataObj.comment, 'comment is set');
      });
    });

    it('Updates created object', function() {
      let originalRev;
      const e = fire(dataObj);
      return e.detail.result
      .then((result) => {
        originalRev = result._rev;
        result.comment = 'test-2';
        const e = fire(result);
        return e.detail.result;
      })
      .then((result) => {
        assert.notEqual(result._rev, originalRev, '_rev is regenerated');
        assert.equal(result._id, 'test-id-1', '_id is the same');
        assert.equal(result.comment, 'test-2', 'comment is set');
        assert.equal(result.from, dataObj.from, 'from is set');
      });
    });

    it('Updates created object without "_rev" property', function() {
      let originalRev;
      const e = fire(dataObj);
      return e.detail.result
      .then((result) => {
        originalRev = result._rev;
        result.comment = 'test-2';
        delete result._rev;
        const e = fire(result);
        return e.detail.result;
      })
      .then((result) => {
        assert.notEqual(result._rev, originalRev, '_rev is regenerated');
        assert.equal(result._id, 'test-id-1', '_id is the same');
        assert.equal(result.comment, 'test-2', 'comment is set');
        assert.equal(result.from, dataObj.from, 'from is set');
      });
    });

    it('Rejects promise when save object is not set', function() {
      const e = fire();
      return e.detail.result
      .then(() => {
        return Promise.reject('Expected method to reject.');
      })
      .catch(isError)
      .then((err) => {
        assert.isDefined(err);
      });
    });

    it('Ignores non cancelable event', function() {
      const e = fire(dataObj, false);
      assert.isFalse(e.defaultPrevented);
    });

    it('Handles exceptions', () => {
      let called = false;
      return element.update(dataObj)
      .then((result) => {
        dataObj._rev = result.rev;
        element.update = () => {
          return Promise.reject(new Error('test'));
        };
        const e = fire(dataObj);
        return e.detail.result;
      })
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

  describe('host-rules-deleted', function() {
    afterEach(function() {
      return DataGenerator.destroyHostRulesData();
    });

    let element;
    let dataObj;
    beforeEach(async () => {
      element = /** @type {HostRulesModel} */ (await fixture('<host-rules-model></host-rules-model>'));
      dataObj = {
        _id: 'test-id-1',
        from: 'https://from',
        to: 'http://to',
        enabled: true,
        comment: 'test'
      };
      return element.update(dataObj)
      .then((result) => dataObj = result);
    });

    function fire(id, rev, cancelable) {
      if (cancelable !== false) {
        cancelable = true;
      }
      const e = new CustomEvent('host-rules-deleted', {
        detail: {
          id: id,
          rev: rev
        },
        bubbles: true,
        composed: true,
        cancelable
      });
      document.body.dispatchEvent(e);
      return e;
    }

    it('Event is canceled', function() {
      const e = fire(dataObj._id);
      assert.isTrue(e.defaultPrevented);
      return e.detail.result;
    });

    it('Event detail contains "result" as promise', function() {
      const e = fire(dataObj._id);
      assert.typeOf(e.detail.result, 'promise');
      return e.detail.result;
    });

    it('Removes object from the datastore', function() {
      const e = fire(dataObj._id, dataObj._rev);
      return e.detail.result
      .then(() => element.read(dataObj._id))
      .then(() => {
        throw new Error('TEST');
      })
      .catch((cause) => {
        assert.equal(cause.status, 404);
      });
    });

    it('Rejects promise when no ID', function() {
      const e = fire();
      return e.detail.result
      .then(() => Promise.reject('Expected method to reject.'))
      .catch(isError)
      .then((err) => {
        assert.isDefined(err);
      });
    });

    it('Ignores non cancelable event', function() {
      const e = fire(dataObj._id, dataObj._rev, false);
      assert.isFalse(e.defaultPrevented);
    });

    it('Handles exceptions', () => {
      let called = false;
      const e = fire('other-id');
      return e.detail.result
      .catch((cause) => {
        if (cause.status === 404) {
          called = true;
        }
      })
      .then(() => {
        assert.isTrue(called);
      });
    });
  });

  describe('host-rules-list', function() {
    afterEach(function() {
      return DataGenerator.destroyHostRulesData();
    });

    let element;
    let dataObj;
    beforeEach(async () => {
      element = /** @type {HostRulesModel} */ (await fixture('<host-rules-model></host-rules-model>'));
      dataObj = {
        _id: 'test-id-1',
        from: 'https://from',
        to: 'http://to',
        enabled: true,
        comment: 'test'
      };
      return element.update(dataObj)
      .then((result) => dataObj = result);
    });

    function fire(cancelable) {
      if (cancelable !== false) {
        cancelable = true;
      }
      const e = new CustomEvent('host-rules-list', {
        detail: {},
        bubbles: true,
        composed: true,
        cancelable
      });
      document.body.dispatchEvent(e);
      return e;
    }

    it('Event is canceled', function() {
      const e = fire();
      assert.isTrue(e.defaultPrevented);
      return e.detail.result;
    });

    it('Event detail contains "result" as promise', function() {
      const e = fire();
      assert.typeOf(e.detail.result, 'promise');
      return e.detail.result;
    });

    it('Lists saved projects', function() {
      const e = fire();
      return e.detail.result
      .then((result) => {
        assert.typeOf(result, 'array');
        assert.lengthOf(result, 1);
      });
    });

    it('Ignores non cancelable event', function() {
      const e = fire(false);
      assert.isFalse(e.defaultPrevented);
    });

    it('Handles exceptions', () => {
      let called = false;
      element.list = () => {
        return Promise.reject(new Error('test'));
      };
      const e = fire();
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

  describe('host-rules-clear', function() {
    afterEach(function() {
      return DataGenerator.destroyHostRulesData();
    });

    let element;
    let data;
    beforeEach(async () => {
      element = /** @type {HostRulesModel} */ (await fixture('<host-rules-model></host-rules-model>'));
      data = [{
        from: 'https://from',
        to: 'http://to',
        enabled: true,
        comment: 'test'
      }, {
        from: 'https://from',
        to: 'http://to',
        enabled: true,
        comment: 'test'
      }];
      return element.updateBulk(data);
    });

    function fire(cancelable) {
      if (cancelable !== false) {
        cancelable = true;
      }
      const e = new CustomEvent('host-rules-clear', {
        detail: {},
        bubbles: true,
        composed: true,
        cancelable
      });
      document.body.dispatchEvent(e);
      return e;
    }

    it('Event is canceled', function() {
      const e = fire();
      assert.isTrue(e.defaultPrevented);
      return e.detail.result;
    });

    it('Event detail contains "result" as promise', function() {
      const e = fire();
      assert.typeOf(e.detail.result, 'promise');
      return e.detail.result;
    });

    it('Removes all data', function() {
      const e = fire();
      return e.detail.result
      .then(() => element.list())
      .then((result) => {
        assert.lengthOf(result, 0);
      });
    });

    it('Dispatches "host-rules-clear" event', function(done) {
      element.addEventListener('host-rules-clear', function(e) {
        assert.isFalse(e.cancelable);
        done();
      });
      fire();
    });

    it('Ignores non cancelable event', function() {
      const e = fire(false);
      assert.isFalse(e.defaultPrevented);
    });
  });

  describe('"host-rules-insert" event', function() {
    let element;
    let data;
    beforeEach(async () => {
      element = /** @type {HostRulesModel} */ (await fixture('<host-rules-model></host-rules-model>'));
      data = [{
        from: 'https://from',
        to: 'http://to',
        enabled: true,
        comment: 'test'
      }, {
        from: 'https://from',
        to: 'http://to',
        enabled: true,
        comment: 'test'
      }];
    });

    afterEach(function() {
      return DataGenerator.destroyHostRulesData();
    });

    function fire(rules, cancelable) {
      if (cancelable !== false) {
        cancelable = true;
      }
      const e = new CustomEvent('host-rules-insert', {
        detail: {
          rules
        },
        bubbles: true,
        composed: true,
        cancelable
      });
      document.body.dispatchEvent(e);
      return e;
    }

    it('Event is canceled', function() {
      const e = fire(data);
      assert.isTrue(e.defaultPrevented);
      return e.detail.result;
    });

    it('Event detail contains "result" as promise', function() {
      const e = fire(data);
      assert.typeOf(e.detail.result, 'promise');
      return e.detail.result;
    });

    it('Ignores non cancelable event', function() {
      const e = fire(data, false);
      assert.isFalse(e.defaultPrevented);
    });

    it('Insserts the data', function() {
      const e = fire(data);
      return e.detail.result
      .then(() => element.list())
      .then((result) => {
        assert.lengthOf(result, 2);
      });
    });

    it('Promise results with insert resut data', function() {
      const e = fire(data);
      return e.detail.result
      .then((response) => {
        assert.typeOf(response, 'array');
        assert.lengthOf(response, 2);
        assert.isTrue(response[0].ok);
      });
    });

    it('Rejects promise when no items', (done) => {
      const e = fire();
      e.detail.result.catch(() => done());
    });

    it('Handles exceptions', () => {
      element.updateBulk = () => {
        return Promise.reject(new Error('test'));
      };
      const e = fire(data);
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
});
