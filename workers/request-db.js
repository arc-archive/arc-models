/* global indexedDB */
const INDEX_STORE_NAME = 'request-index';
const INDEX_STORE_VERSION = 1;

const lut = [];
for (let i = 0; i < 256; i++) {
  lut[i] = (i < 16 ? '0' : '') + (i).toString(16);
}

/**
 * A databse helper for requests indexing.
 */
class RequestDb {
  /**
   * Opens search index data store.
   * @return {Promise}
   */
  openSearchStore() {
    if (this.__db) {
      return Promise.resolve(this.__db);
    }
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(INDEX_STORE_NAME, INDEX_STORE_VERSION);
      request.onsuccess = (e) => {
        this.__db = e.target.result;
        resolve(e.target.result);
      };
      request.onerror = function() {
        reject(new Error('Unable to open the store'));
      };
      request.onupgradeneeded = this.createSchema;
    });
  }
  /**
   * Creates a database schema when is newly created.
   * @param {Event} e Database create request event
   */
  createSchema(e) {
    const db = e.target.result;
    const store = db.createObjectStore('urls', {keyPath: 'id'});
    store.createIndex('url', 'url', {unique: false});
    store.createIndex('requestId', 'requestId', {unique: false});
  }
  /**
   * Generates UUID
   * @return {String}
   */
  uuid() {
    const d0 = Math.random() * 0xffffffff | 0;
    const d1 = Math.random() * 0xffffffff | 0;
    const d2 = Math.random() * 0xffffffff | 0;
    const d3 = Math.random() * 0xffffffff | 0;
    return lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] +
      lut[d0 >> 24 & 0xff] + '-' + lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' +
      lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & 0xff] + '-' +
      lut[d2 & 0x3f | 0x80] +
      lut[d2 >> 8 & 0xff] + '-' + lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] +
      lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] + lut[d3 >> 16 & 0xff] +
      lut[d3 >> 24 & 0xff];
  }
}
this.RequestDb = RequestDb;
