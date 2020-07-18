const INDEX_STORE_NAME = 'request-index';
const INDEX_STORE_VERSION = 1;

export const DbHelper = {};
/**
 * Removes all indexes from the index data store.
 * @return {Promise}
 */
DbHelper.clearData = function() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(INDEX_STORE_NAME, INDEX_STORE_VERSION);
    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction('urls', 'readwrite');
      const store = tx.objectStore('urls');
      tx.onerror = () => {
        reject(new Error('Unable to clear the store'));
      };
      tx.oncomplete = () => {
        resolve();
      };
      store.clear();
    };
    request.onerror = function() {
      reject(new Error('Unable to open the store'));
    };
  });
};
/**
 * Reads all URL indexes datastore
 * @return {Promise}
 */
DbHelper.readAllIndexes = function() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(INDEX_STORE_NAME, INDEX_STORE_VERSION);
    request.onsuccess = (e) => {
      const results = [];
      const db = e.target.result;
      const tx = db.transaction('urls', 'readonly');
      tx.onerror = () => {
        reject(new Error('Get all tx error'));
      };
      tx.oncomplete = () => {
        resolve(results);
      };
      const store = tx.objectStore('urls');
      const request = store.openCursor();
      request.onsuccess = function(e) {
        const cursor = e.target.result;
        if (cursor) {
          results[results.length] = cursor.value;
          cursor.continue();
        }
      };
    };
    request.onerror = function() {
      reject(new Error('Unable to open the store'));
    };
  });
};
