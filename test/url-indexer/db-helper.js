const INDEX_STORE_NAME = 'request-index';
const INDEX_STORE_VERSION = 1;

export const DbHelper = {};

DbHelper.destroy = async () => {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.deleteDatabase(INDEX_STORE_NAME);
    request.onsuccess = () => {
      resolve();
    };
    request.onerror = () => {
      reject();
    };
  });
};

/**
 * Removes all indexes from the index data store.
 * @return {Promise}
 */
DbHelper.clearData = () => {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(INDEX_STORE_NAME, INDEX_STORE_VERSION);
    request.onsuccess = (e) => {
      const evTarget = /** @type IDBOpenDBRequest */ (e.target);
      const db = evTarget.result;
      const tx = db.transaction('urls', 'readwrite');
      const store = tx.objectStore('urls');
      tx.onerror = () => {
        db.close();
        reject(new Error('Unable to clear the store'));
      };
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      store.clear();
    };
    request.onerror = () => {
      reject(new Error('Unable to open the store'));
    };
  });
};
/**
 * Reads all URL indexes datastore
 * @return {Promise}
 */
DbHelper.readAllIndexes = () => {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(INDEX_STORE_NAME, INDEX_STORE_VERSION);
    request.onsuccess = (e) => {
      const results = [];
      const evTarget = /** @type IDBOpenDBRequest */ (e.target);
      const db = evTarget.result;
      const tx = db.transaction('urls', 'readonly');
      tx.onerror = () => {
        db.close();
        reject(new Error('Get all tx error'));
      };
      tx.oncomplete = () => {
        db.close();
        resolve(results);
      };
      const store = tx.objectStore('urls');
      const crequest = store.openCursor();
      crequest.onsuccess = (ce) => {
        // @ts-ignore
        const cursor = ce.target.result;
        if (cursor) {
          results[results.length] = cursor.value;
          cursor.continue();
        }
      };
    };
    request.onerror = () => {
      reject(new Error('Unable to open the store'));
    };
  });
};
