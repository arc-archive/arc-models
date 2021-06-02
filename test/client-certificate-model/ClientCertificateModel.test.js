import { fixture, assert } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import sinon from 'sinon';
import { ArcModelEventTypes } from '@advanced-rest-client/arc-events';
import 'chance/dist/chance.min.js';
import '../../client-certificate-model.js';

/** @typedef {import('../../src/ClientCertificateModel').ClientCertificateModel} ClientCertificateModel */
/** @typedef {import('@advanced-rest-client/arc-types').ClientCertificate.ARCClientCertificate} ARCClientCertificate */
/** @typedef {import('@advanced-rest-client/arc-types').ClientCertificate.Certificate} Certificate */
/** @typedef {import('@advanced-rest-client/arc-types').ClientCertificate.ClientCertificate} ClientCertificate */

describe('ClientCertificateModel', () => {
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
          size: 30,
        });
      });

      after(async () => {
        await generator.destroyClientCertificates();
      });

      let element = /** @type ClientCertificateModel */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('returns a query result for default parameters', async () => {
        const result = await element.list();
        assert.typeOf(result, 'object', 'result is an object');
        assert.typeOf(result.nextPageToken, 'string', 'has page token');
        assert.typeOf(result.items, 'array', 'has response items');
        assert.lengthOf(result.items, element.defaultQueryOptions.limit, 'has default limit of items');
      });

      it('respects "limit" parameter', async () => {
        const result = await element.list({
          limit: 5,
        });
        assert.lengthOf(result.items, 5);
      });

      it('respects "nextPageToken" parameter', async () => {
        const result1 = await element.list({
          limit: 10,
        });
        const result2 = await element.list({
          nextPageToken: result1.nextPageToken,
        });
        assert.lengthOf(result2.items, 20);
      });

      it('does not set "nextPageToken" when no more results', async () => {
        const result1 = await element.list({
          limit: 40,
        });
        const result2 = await element.list({
          nextPageToken: result1.nextPageToken,
        });
        assert.isUndefined(result2.nextPageToken);
      });

      it('removes dataKey from the items', async () => {
        const result = await element.list();
        // @ts-ignore
        assert.isUndefined(result.items[0].dataKey);
      });
    });

    describe('Without data', () => {
      let element = /** @type ClientCertificateModel */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('returns empty array', async () => {
        const result = await element.list();
        assert.typeOf(result, 'object', 'result is an object');
        assert.lengthOf(result.items, 0, 'result has no items');
        assert.isUndefined(result.nextPageToken, 'nextPageToken is undefined');
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
        const certificate = /** @type Certificate */ (doc.cert);
        assert.typeOf(certificate, 'object', 'certificate is set');
        assert.typeOf(certificate.data, 'string', 'certificate data is set');
        assert.typeOf(certificate.passphrase, 'string', 'passphrase is set');
      });

      it('has the key', async () => {
        const doc = await element.get(id);
        const info = /** @type Certificate */ (doc.key);
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
        const info = /** @type Certificate */ (doc.cert);
        assert.typeOf(info, 'object', 'certificate is set');
        assert.typeOf(info.data, 'Uint8Array', 'certificate data is set');
        assert.typeOf(info.passphrase, 'string', 'passphrase is set');
      });

      it('has the key', async () => {
        const doc = await element.get(id);
        const info = /** @type Certificate */ (doc.key);
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
      assert.lengthOf(all.items, 0);
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
      const item = /** @type ClientCertificate */ (generator.generateClientCertificate());
      await element.insert(item);
      const all = await element.list();
      assert.lengthOf(all.items, 1);
    });

    it('returns chnagerecord of the "index" store', async () => {
      const item = /** @type ClientCertificate */ (generator.generateClientCertificate());
      const result = await element.insert(item);
      assert.typeOf(result, 'object', 'returns an object');
      assert.typeOf(result.id, 'string', 'has an id');
      assert.typeOf(result.rev, 'string', 'has a rev');
      assert.typeOf(result.item, 'object', 'has created object');
      assert.isUndefined(result.oldRev, 'has no oldRev');
    });

    it('inserts an item to the "data" store', async () => {
      const item = /** @type ClientCertificate */ (generator.generateClientCertificate());
      const record = await element.insert(item);
      const saved = await element.get(record.id);
      assert.typeOf(saved.cert, 'object');
    });

    it('inserts both object with the same id', async () => {
      const item = /** @type ClientCertificate */ (generator.generateClientCertificate());
      const record = await element.insert(item);
      const dataObj = await element.dataDb.get(record.id);
      const indexObj = await element.db.get(record.id);
      assert.ok(dataObj, 'Data object is stored');
      assert.ok(indexObj, 'Index object is stored');
    });

    it('stores binary data', async () => {
      const item = /** @type ClientCertificate */ (generator.generateClientCertificate({
        binary: true,
      }));
      const record = await element.insert(item);
      const doc = await element.get(record.id);
      const info = /** @type Certificate */ (doc.cert);
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
      const item = /** @type ClientCertificate */ (generator.generateClientCertificate());
      delete item.type;
      let err;
      try {
        await element.insert(item);
      } catch (e) {
        err = e;
      }
      assert.equal(err.message, 'The "type" property is required.');
    });

    it('dispatches change event', async () => {
      const item = /** @type ClientCertificate */ (generator.generateClientCertificate());
      const spy = sinon.spy();
      element.addEventListener(ArcModelEventTypes.ClientCertificate.State.update, spy);
      const record = await element.insert(item);
      assert.isTrue(spy.called, 'Event is dispatched');
      const e = spy.args[0][0];
      const { changeRecord } = e;
      assert.typeOf(changeRecord, 'object', 'returns an object');
      assert.equal(changeRecord.id, record.id, 'has an id');
      assert.typeOf(changeRecord.rev, 'string', 'has a rev');
      assert.typeOf(changeRecord.item, 'object', 'has created object');
      assert.isUndefined(changeRecord.oldRev, 'has no oldRev');
    });

    it('adds "created" property when not set', async () => {
      const item = /** @type ClientCertificate */ (generator.generateClientCertificate());
      delete item.created;
      const record = await element.insert(item);
      assert.typeOf(record.item.created, 'number');
    });

    it('ignores the key if now set', async () => {
      const item = /** @type ClientCertificate */ (generator.generateClientCertificate({
        noKey: true,
      }));
      const record = await element.insert(item);
      assert.isUndefined(record.item.key);
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
      assert.lengthOf(all.items, 0);
    });
  });

  describe('certificateToStore()', () => {
    let element = /** @type ClientCertificateModel */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    afterEach(async () => {
      await generator.destroyClientCertificates();
    });

    it('returns the same certificate when has string data', () => {
      const cert = generator.generateCertificate({
        binary: false,
      });
      assert.typeOf(cert.data, 'string');
      const result = /** @type Certificate */ (element.certificateToStore(cert));
      assert.typeOf(result.data, 'string');
    });

    it('converts binary data to safe string', () => {
      const cert = generator.generateCertificate({
        binary: true,
      });
      assert.notTypeOf(cert.data, 'string');
      const result = /** @type Certificate */ (element.certificateToStore(cert));
      assert.typeOf(result.data, 'string', 'has the string data');
      assert.equal(result.type, 'buffer');
    });

    it('processes a list of certificates', () => {
      const cert = generator.generateCertificate({
        binary: true,
      });
      assert.notTypeOf(cert.data, 'string');
      const result = /** @type Certificate[] */ (element.certificateToStore([cert]));
      assert.typeOf(result, 'array', 'the result is an array');
      assert.lengthOf(result, 1, 'has the same number of items');
      assert.typeOf(result[0].data, 'string', 'has the string data');
    });

    it('throws when no data property', () => {
      const cert = generator.generateCertificate({
        binary: true,
      });
      delete cert.data;
      assert.throws(() => {
        element.certificateToStore(cert);
      });
    });
  });

  describe('certificateFromStore()', () => {
    let element = /** @type ClientCertificateModel */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    afterEach(async () => {
      await generator.destroyClientCertificates();
    });

    it('returns the same certificate when has no type', () => {
      const cert = generator.generateCertificate({
        binary: false,
      });
      assert.typeOf(cert.data, 'string');
      const result = /** @type Certificate */ (element.certificateFromStore(cert));
      assert.typeOf(result.data, 'string');
    });

    it('converts string back to the binary data', () => {
      const cert = generator.generateCertificate({
        binary: true,
      });
      // @ts-ignore
      cert.data = element.bufferToBase64(cert.data);
      cert.type = 'buffer';
      const result = /** @type Certificate */ (element.certificateFromStore(cert));
      assert.typeOf(result.data, 'Uint8Array');
    });

    it('processes a list of certificates', () => {
      const cert = generator.generateCertificate({
        binary: false,
      });
      const result = /** @type Certificate[] */ (element.certificateFromStore([cert]));
      assert.typeOf(result, 'array', 'the result is an array');
      assert.lengthOf(result, 1, 'has the same number of items');
    });
  });
});
