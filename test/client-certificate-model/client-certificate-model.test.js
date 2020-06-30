import { fixture, assert } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import * as sinon from 'sinon';
import 'chance/dist/chance.min.js';
import '../../client-certificate-model.js';

/** @typedef {import('../../src/ClientCertificateModel').ClientCertificateModel} ClientCertificateModel */
/** @typedef {import('../../src/ClientCertificateModel').ARCCertificate} ARCCertificate */

describe('<client-certificate-model>', () => {
  const generator = new DataGenerator();
  /**
   * @return {Promise<ClientCertificateModel>}
   */
  async function basicFixture() {
    return fixture('<client-certificate-model></client-certificate-model>');
  }

  describe('list()', () => {
    describe('With data', () => {
      before(async () => {
        await generator.insertCertificatesData({
          size: 5,
        });
      });

      after(async () => {
        await generator.destroyClientCertificates();
      });

      let element = /** @type ClientCertificateModel */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('returns all docs', async () => {
        const result = await element.list();
        assert.typeOf(result, 'array', 'result is an array');
        assert.lengthOf(result, 5, 'result has all items');
        assert.typeOf(result[0]._id, 'string', 'an item has an _id');
        assert.typeOf(result[0]._rev, 'string', 'an item has an _rev');
      });

      it('does not contain dataKey', async () => {
        const result = await element.list();
        // @ts-ignore
        assert.isUndefined(result[0].dataKey);
      });

      it('can be invoked via event', async () => {
        const e = new CustomEvent('client-certificate-list', {
          bubbles: true,
          cancelable: true,
          detail: {
            result: undefined,
          },
        });
        document.body.dispatchEvent(e);
        const result = await e.detail.result;
        assert.lengthOf(result, 5, 'result has all items');
      });

      it('ignores the event when not cancelable', () => {
        const e = new CustomEvent('client-certificate-list', {
          bubbles: true,
          cancelable: false,
          detail: {
            result: undefined,
          },
        });
        document.body.dispatchEvent(e);
        assert.isUndefined(e.detail.result);
      });
    });

    describe('Without data', () => {
      let element = /** @type ClientCertificateModel */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('returns empty array', async () => {
        const result = await element.list();
        assert.typeOf(result, 'array', 'result is an array');
        assert.lengthOf(result, 0, 'result has no items');
      });
    });
  });

  describe('get()', () => {
    describe('String data', () => {
      let id;
      before(async () => {
        const data = await generator.insertCertificatesData({
          size: 1,
        });
        id = data[0]._id;
      });

      after(async () => {
        await generator.destroyClientCertificates();
      });

      let element = /** @type ClientCertificateModel */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('returns the document', async () => {
        const doc = await element.get(id);
        assert.typeOf(doc, 'object');
      });

      it('has the certificate', async () => {
        const doc = await element.get(id);
        const certificate = /** @type ARCCertificate */ (doc.cert);
        assert.typeOf(certificate, 'object', 'certificate is set');
        assert.typeOf(certificate.data, 'string', 'certificate data is set');
        assert.typeOf(certificate.passphrase, 'string', 'passphrase is set');
      });

      it('has the key', async () => {
        const doc = await element.get(id);
        const info = /** @type ARCCertificate */ (doc.key);
        assert.typeOf(info, 'object', 'certificate is set');
        assert.typeOf(info.data, 'string', 'certificate data is set');
        assert.typeOf(info.passphrase, 'string', 'passphrase is set');
      });

      it('throws when no ID', async () => {
        let err;
        try {
          // @ts-ignore
          await element.get();
        } catch (e) {
          err = e;
        }
        assert.equal(err.message, 'The "id" argument is missing');
      });

      it('can be invoked via event', async () => {
        const e = new CustomEvent('client-certificate-get', {
          bubbles: true,
          cancelable: true,
          detail: {
            id,
            result: undefined,
          },
        });
        document.body.dispatchEvent(e);
        const result = await e.detail.result;
        assert.typeOf(result, 'object');
      });

      it('ignores the event when not cancelable', () => {
        const e = new CustomEvent('client-certificate-get', {
          bubbles: true,
          cancelable: false,
          detail: {
            id,
            result: undefined,
          },
        });
        document.body.dispatchEvent(e);
        assert.isUndefined(e.detail.result);
      });
    });

    describe('Binary data', () => {
      let id;
      before(async () => {
        const data = await generator.insertCertificatesData({
          size: 1,
          binary: true,
        });
        id = data[0]._id;
      });

      after(async () => {
        await generator.destroyClientCertificates();
      });

      let element = /** @type ClientCertificateModel */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('has the certificate', async () => {
        const doc = await element.get(id);
        const info = /** @type ARCCertificate */ (doc.cert);
        assert.typeOf(info, 'object', 'certificate is set');
        assert.typeOf(info.data, 'Uint8Array', 'certificate data is set');
        assert.typeOf(info.passphrase, 'string', 'passphrase is set');
      });

      it('has the key', async () => {
        const doc = await element.get(id);
        const info = /** @type ARCCertificate */ (doc.key);
        assert.typeOf(info, 'object', 'certificate is set');
        assert.typeOf(info.data, 'Uint8Array', 'certificate data is set');
        assert.typeOf(info.passphrase, 'string', 'passphrase is set');
      });
    });

    describe('No key data', () => {
      let id;
      before(async () => {
        const data = await generator.insertCertificatesData({
          size: 1,
          noKey: true,
        });
        id = data[0]._id;
      });

      after(async () => {
        await generator.destroyClientCertificates();
      });

      let element = /** @type ClientCertificateModel */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('has no key', async () => {
        const doc = await element.get(id);
        assert.isUndefined(doc.key);
      });
    });
  });

  describe('delete()', () => {
    let id;
    let element = /** @type ClientCertificateModel */ (null);
    beforeEach(async () => {
      const data = await generator.insertCertificatesData({
        size: 1,
      });
      id = data[0]._id;
      element = await basicFixture();
    });

    afterEach(async () => {
      await generator.destroyClientCertificates();
    });

    it('deletes the document', async () => {
      await element.delete(id);
      const all = await element.list();
      assert.lengthOf(all, 0);
    });

    it('throws when no ID', async () => {
      let err;
      try {
        await element.delete(undefined);
      } catch (e) {
        err = e;
      }
      assert.equal(err.message, 'The "id" argument is missing');
    });

    it('can be invoked via event', async () => {
      const e = new CustomEvent('client-certificate-delete', {
        bubbles: true,
        cancelable: true,
        detail: {
          id,
          result: undefined,
        },
      });
      document.body.dispatchEvent(e);
      await e.detail.result;
      const all = await element.list();
      assert.lengthOf(all, 0);
    });

    it('ignores the event when not cancelable', () => {
      const e = new CustomEvent('client-certificate-delete', {
        bubbles: true,
        cancelable: false,
        detail: {
          id,
          result: undefined,
        },
      });
      document.body.dispatchEvent(e);
      assert.isUndefined(e.detail.result);
    });
  });

  describe('insert()', () => {
    let element = /** @type ClientCertificateModel */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    afterEach(async () => {
      await generator.destroyClientCertificates();
    });

    it('inserts an item to the "index" store', async () => {
      const item = generator.generateClientCertificate();
      await element.insert(item);
      const all = await element.list();
      assert.lengthOf(all, 1);
    });

    it('returns ID of the "index" store', async () => {
      const item = generator.generateClientCertificate();
      const result = await element.insert(item);
      assert.typeOf(result, 'string');
    });

    it('inserts an item to the "data" store', async () => {
      const item = generator.generateClientCertificate();
      const id = await element.insert(item);
      const saved = await element.get(id);
      assert.typeOf(saved.cert, 'object');
    });

    it('stores binary data', async () => {
      const item = generator.generateClientCertificate({
        binary: true,
      });
      const id = await element.insert(item);
      const doc = await element.get(id);
      const info = /** @type ARCCertificate */ (doc.cert);
      assert.typeOf(info, 'object', 'certificate is set');
      assert.typeOf(info.data, 'Uint8Array', 'certificate data is set');
      assert.typeOf(info.passphrase, 'string', 'passphrase is set');
    });

    it('throws when no cert', async () => {
      let err;
      try {
        // @ts-ignore
        await element.insert({});
      } catch (e) {
        err = e;
      }
      assert.equal(err.message, 'The "cert" property is required.');
    });

    it('throws when no type', async () => {
      const item = generator.generateClientCertificate();
      delete item.type;
      let err;
      try {
        await element.insert(item);
      } catch (e) {
        err = e;
      }
      assert.equal(err.message, 'The "type" property is required.');
    });

    it('can be invoked via event', async () => {
      const e = new CustomEvent('client-certificate-insert', {
        bubbles: true,
        cancelable: true,
        detail: {
          value: generator.generateClientCertificate(),
          result: undefined,
        },
      });
      document.body.dispatchEvent(e);
      await e.detail.result;
      const all = await element.list();
      assert.lengthOf(all, 1);
    });

    it('ignores the event when not cancelable', () => {
      const e = new CustomEvent('client-certificate-insert', {
        bubbles: true,
        cancelable: false,
        detail: {
          value: generator.generateClientCertificate(),
          result: undefined,
        },
      });
      document.body.dispatchEvent(e);
      assert.isUndefined(e.detail.result);
    });

    it('dispatches non-cancelable insert event', async () => {
      const item = generator.generateClientCertificate();
      const spy = sinon.spy();
      element.addEventListener('client-certificate-insert', spy);
      const id = await element.insert(item);
      assert.isTrue(spy.called, 'Event is dispatched');
      const e = spy.args[0][0];
      assert.isFalse(e.cancelable, 'event is not cancelable');
      assert.equal(e.detail._id, id, 'has insert id');
      assert.typeOf(e.detail._rev, 'string', 'has insert _rev');
      assert.equal(e.detail.type, item.type, 'has insert type');
    });
  });

  describe('deleteModel()', () => {
    beforeEach(async () => {
      await generator.insertCertificatesData({
        size: 1,
      });
    });

    afterEach(async () => {
      await generator.destroyClientCertificates();
    });

    let element = /** @type ClientCertificateModel */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('clears the data', async () => {
      await element.deleteModel();
      const all = await element.list();
      assert.lengthOf(all, 0);
    });

    it('can be invoked via event', async () => {
      const e = new CustomEvent('destroy-model', {
        bubbles: true,
        cancelable: true,
        detail: {
          models: ['client-certificates'],
          result: [],
        },
      });
      document.body.dispatchEvent(e);
      await e.detail.result[0];
      const all = await element.list();
      assert.lengthOf(all, 0);
    });

    it('ignores the event for other stores', async () => {
      const e = new CustomEvent('destroy-model', {
        bubbles: true,
        cancelable: true,
        detail: {
          models: ['saved-request'],
          result: undefined,
        },
      });
      document.body.dispatchEvent(e);
      await e.detail.result;
      const all = await element.list();
      assert.lengthOf(all, 1);
    });
  });
});
