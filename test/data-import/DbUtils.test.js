import { assert } from '@open-wc/testing';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import {
  getEntry,
  fetchEntriesPage,
  getDatabaseEntries,
  readClientCertificateIfNeeded,
  processRequestsArray,
} from '../../src/lib/DbUtils.js';

/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ARCSavedRequest} ARCSavedRequest */

/* global PouchDB */

describe('DbUtils', () => {
  const generator = new DataGenerator();

  describe('getEntry()', () => {
    let db = /** @type PouchDB.Database */ (null);
    const dbName = 'test-db';
    before(async () => {
      db = new PouchDB(dbName);
    });

    after(async () => {
      await db.destroy();
      db = null;
    });

    it('returns the entry', async () => {
      const response = await db.post({ test: true });
      const result = await getEntry(dbName, response.id);
      assert.typeOf(result, 'object');
      assert.isTrue(result.test);
    });

    it('returns undefined when no object', async () => {
      const result = await getEntry(dbName, 'unknown');
      assert.isUndefined(result);
    });
  });

  describe('fetchEntriesPage()', () => {
    let db = /** @type PouchDB.Database */ (null);
    const dbName = 'url-history';
    let created;
    before(async () => {
      created = await generator.insertUrlHistoryData({
        size: 50,
      });
      db = new PouchDB(dbName);
    });

    after(async () => {
      await db.destroy();
      db = null;
    });

    it('returns the query result', async () => {
      const result = await fetchEntriesPage(db, {});
      assert.typeOf(result, 'object', 'result is an object');
      assert.typeOf(result.config, 'object', 'config is an object');
      assert.typeOf(result.docs, 'array', 'has docs array');
      assert.equal(result.config.skip, 1, 'has skip value');
      assert.equal(result.config.startkey, result.docs[result.docs.length - 1]._id, 'has start key value');
    });

    it('has the documents list', async () => {
      const result = await fetchEntriesPage(db, {});
      assert.lengthOf(result.docs, 50);
      for (let i = 0; i < result.docs.length; i++) {
        const doc = result.docs[i];
        const existing = created.find((item) => item._id === doc._id);
        assert.deepEqual(doc, existing);
      }
    });

    it('returns null when no more results', async () => {
      const result1 = await fetchEntriesPage(db, {});
      const result2 = await fetchEntriesPage(db, result1.config);
      assert.strictEqual(result2, null);
    });
  });

  describe('getDatabaseEntries()', () => {
    let db = /** @type PouchDB.Database */ (null);
    const dbName = 'url-history';
    before(async () => {
      await generator.insertUrlHistoryData({
        size: 50,
      });
      db = new PouchDB(dbName);
    });

    after(async () => {
      await db.destroy();
      db = null;
    });

    it('returns all requests in a single request', async () => {
      const result = await getDatabaseEntries(dbName, 100);
      assert.typeOf(result, 'array');
      assert.lengthOf(result, 50);
    });

    it('returns all requests in a batched request', async () => {
      const result = await getDatabaseEntries(dbName, 10);
      assert.typeOf(result, 'array');
      assert.lengthOf(result, 50);
    });
  });

  describe('readClientCertificateIfNeeded()', () => {
    let created;
    before(async () => {
      created = await generator.insertCertificatesData({
        size: 5,
      });
    });

    after(async () => {
      await generator.destroyClientCertificates();
    });

    it('returns null when no id', async () => {
      const result = await readClientCertificateIfNeeded(undefined);
      assert.equal(result, null);
    });

    it('returns null when certificate is in the list of created certs', async () => {
      const id = created[0]._id;
      const result = await readClientCertificateIfNeeded(id, created.map((cert) => {
        return {
          item: cert,
        };
      }));
      assert.equal(result, null);
    });

    it('reads certificate data from the store', async () => {
      const id = created[0]._id;
      const result = await readClientCertificateIfNeeded(id);
      assert.typeOf(result, 'object', 'has the result');
      assert.typeOf(result.item, 'object', 'has the index object');
      assert.typeOf(result.data, 'object', 'has the data object');
    });
  });

  describe('processRequestsArray()', () => {
    let created;
    before(async () => {
      created = await generator.insertCertificatesData({
        size: 5,
      });
    });

    after(async () => {
      await generator.destroyClientCertificates();
    });

    it('returns certificates for the legacy system', async () => {
      const { requests } = generator.generateSavedRequestData({
        requestsSize: 3,
      });
      // @ts-ignore
      requests[0].authType = 'client certificate';
      // @ts-ignore
      requests[0].auth = { id: created[0]._id };
      // @ts-ignore
      requests[1].authType = 'basic';
      // @ts-ignore
      delete requests[2].authType;
      const result = await processRequestsArray(requests, []);
      assert.typeOf(result, 'array');
      assert.lengthOf(result, 1);
    });

    it('returns certificates the are not already defined', async () => {
      const requests = /** @type ARCSavedRequest[] */ (generator.generateSavedRequestData({
        requestsSize: 3,
      }).requests);

      requests[0].authorization = [
        {
          type: 'client certificate',
          enabled: true,
          config: {
            id: created[0]._id,
          }
        }
      ];
      requests[1].authorization = [
        {
          type: 'basic',
          enabled: true,
          config: {
            username: 'test',
          }
        }
      ];
      delete requests[2].authorization;
      const result = await processRequestsArray(requests, []);
      assert.typeOf(result, 'array');
      assert.lengthOf(result, 1);
    });

    it('ignores when certificate in already defined', async () => {
      const requests = /** @type ARCSavedRequest[] */ (generator.generateSavedRequestData({
        requestsSize: 3,
      }).requests);

      requests[0].authorization = [
        {
          type: 'client certificate',
          enabled: true,
          config: {
            id: created[0]._id,
          }
        }
      ];
      requests[1].authorization = [
        {
          type: 'basic',
          enabled: true,
          config: {
            username: 'test',
          }
        }
      ];
      delete requests[2].authorization;
      const result = await processRequestsArray(requests, created.map((cert) => {
        return {
          item: cert,
        };
      }));
      assert.typeOf(result, 'array');
      assert.lengthOf(result, 0);
    });
  });
});
