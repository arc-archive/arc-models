import { fixture, assert } from '@open-wc/testing';
import sinon from 'sinon';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import '../../host-rules-model.js';

/** @typedef {import('../../src/HostRulesModel').HostRulesModel} HostRulesModel */
/* eslint-disable no-param-reassign */

describe('<host-rules-model>', () => {
  const generator = new DataGenerator();
  describe('Static methods', () => {
    describe('update()', () => {
      afterEach(() => {
        return generator.destroyHostRulesData();
      });

      let element;
      let dataObj;
      beforeEach(async () => {
        element = /** @type {HostRulesModel} */ (await fixture(
          '<host-rules-model></host-rules-model>'
        ));
        dataObj = {
          _id: 'test-id-1',
          from: 'https://from',
          to: 'http://to',
          enabled: true,
          comment: 'test',
        };
      });

      it('Creates a new object in the datastore', async () => {
        const result = await element.update(dataObj);
        assert.typeOf(result._rev, 'string', '_rev is set');
        assert.equal(result._id, 'test-id-1', '_id is set');
        assert.equal(result.from, dataObj.from, 'from is set');
      });

      it('Updates created object', async () => {
        const result = await element.update(dataObj);
        const originalRev = result._rev;
        result.comment = 'test-2';
        const result2 = await element.update(result);
        assert.notEqual(result2._rev, originalRev, '_rev is regenerated');
        assert.equal(result2._id, 'test-id-1', '_id is the same');
        assert.equal(result2.comment, 'test-2', 'comment is set');
        assert.equal(result2.from, dataObj.from, 'from is set');
      });

      it('Fires host-rules-changed custom event', async () => {
        const spy = sinon.spy();
        element.addEventListener('host-rules-changed', spy);
        await element.update(dataObj);
        assert.isTrue(spy.calledOnce);
      });

      it('The host-rules-changed event has properties of newly created object', async () => {
        let eventData;
        element.addEventListener('host-rules-changed', (e) => {
          eventData = e.detail;
        });
        const result = await element.update(dataObj);
        // @ts-ignore
        assert.isUndefined(eventData.oldRev);
        assert.isUndefined(result.oldRev);
        // @ts-ignore
        assert.typeOf(eventData.rule, 'object');
      });

      it('The host-rules-changed event has properties of updated object', async () => {
        let eventData;
        const result = await element.update(dataObj);
        element.addEventListener('host-rules-changed', function f(e) {
          element.removeEventListener('host-rules-changed', f);
          eventData = e.detail;
        });
        const originalRev = result._rev;
        result.comment = 'test-2';
        await element.update(result);
        // @ts-ignore
        assert.equal(eventData.oldRev, originalRev);
        // @ts-ignore
        assert.typeOf(eventData.rule, 'object');
        // @ts-ignore
        assert.notEqual(eventData.rule._rev, originalRev);
      });
    });

    describe('read()', () => {
      afterEach(() => {
        return generator.destroyHostRulesData();
      });

      let element;
      let dataObj;
      beforeEach(async () => {
        element = /** @type {HostRulesModel} */ (await fixture(
          '<host-rules-model></host-rules-model>'
        ));
        dataObj = {
          _id: 'test-id-1',
          from: 'https://from',
          to: 'http://to',
          enabled: true,
          comment: 'test',
          updated: Date.now(),
        };
        return element.update(dataObj);
      });

      it('Reads project object by id only', () => {
        return element.read(dataObj._id).then((result) => {
          assert.equal(result._id, dataObj._id);
        });
      });

      it('Reads a revision', () => {
        let originalRev;
        let updatedRev;
        return element
          .read(dataObj._id)
          .then((result) => {
            originalRev = result._rev;
            result.comment = 'test-2';
            return element.update(result);
          })
          .then((result) => {
            updatedRev = result._rev;
            return element.read(dataObj._id, originalRev);
          })
          .then((result) => {
            assert.equal(result.comment, dataObj.comment);
            assert.notEqual(originalRev, updatedRev);
          });
      });
    });

    describe('delete()', () => {
      afterEach(() => {
        return generator.destroyHostRulesData();
      });

      let element;
      let dataObj;
      beforeEach(async () => {
        element = /** @type {HostRulesModel} */ (await fixture(
          '<host-rules-model></host-rules-model>'
        ));
        dataObj = {
          _id: 'test-id-1',
          from: 'https://from',
          to: 'http://to',
          enabled: true,
          comment: 'test',
          updated: Date.now(),
        };
        dataObj = await element.update(dataObj);
      });

      it('Removes object from the datastore', () => {
        return element
          .delete(dataObj._id, dataObj._rev)
          .then(() => {
            return element.read(dataObj._id);
          })
          .then(() => {
            throw new Error('TEST');
          })
          .catch((cause) => {
            assert.equal(cause.status, 404);
          });
      });

      it('Fires host-rules-deleted custom event', () => {
        const spy = sinon.spy();
        element.addEventListener('host-rules-deleted', spy);
        return element.delete(dataObj._id, dataObj._rev).then(() => {
          assert.isTrue(spy.calledOnce);
        });
      });

      it('host-rules-deleted event contains project data', () => {
        let eventData;
        element.addEventListener('host-rules-deleted', (e) => {
          eventData = e.detail;
        });
        return element.delete(dataObj._id, dataObj._rev).then(() => {
          assert.equal(eventData.id, dataObj._id);
          assert.equal(eventData.oldRev, dataObj._rev);
          assert.typeOf(eventData.rev, 'string');
          assert.notEqual(eventData.rev, dataObj._rev);
        });
      });
    });

    describe('list()', () => {
      afterEach(() => {
        return generator.destroyHostRulesData();
      });

      let element;
      let dataObj;
      beforeEach(async () => {
        element = /** @type {HostRulesModel} */ (await fixture(
          '<host-rules-model></host-rules-model>'
        ));
        dataObj = {
          _id: 'test-id-1',
          from: 'https://from',
          to: 'http://to',
          enabled: true,
          comment: 'test',
          updated: Date.now(),
        };
        dataObj = await element.update(dataObj);
      });

      it('Lists host rules', () => {
        return element.list().then((result) => {
          assert.typeOf(result, 'array');
          assert.lengthOf(result, 1);
        });
      });
    });

    describe('updateBulk()', () => {
      afterEach(() => {
        return generator.destroyHostRulesData();
      });

      let element;
      let data;
      beforeEach(async () => {
        element = /** @type {HostRulesModel} */ (await fixture(
          '<host-rules-model></host-rules-model>'
        ));
        data = [
          {
            from: 'https://from',
            to: 'http://to',
            enabled: true,
            comment: 'test',
            updated: Date.now(),
          },
          {
            from: 'https://from',
            to: 'http://to',
            enabled: true,
            comment: 'test',
            updated: Date.now(),
          },
        ];
      });

      it('Inserts data to the store', () => {
        return element
          .updateBulk(data)
          .then(() => element.list())
          .then((result) => {
            assert.lengthOf(result, 2);
          });
      });

      it('Results with insert resut data', () => {
        return element.updateBulk(data).then((response) => {
          assert.typeOf(response, 'array');
          assert.lengthOf(response, 2);
          assert.isTrue(response[0].ok);
        });
      });
    });
  });
});
