const UrlHistoryHelper = {};

UrlHistoryHelper.fire = function(name, detail, node) {
  const e = new CustomEvent(name, {
    bubbles: true,
    composed: true,
    cancelable: true,
    detail: detail
  });
  (node || document.body).dispatchEvent(e);
  return e;
};
UrlHistoryHelper.getDatabase = function() {
  /* global PouchDB */
  return new PouchDB('url-history');
};
UrlHistoryHelper.insertData = function(urls) {
  urls = urls.map(function(url, i) {
    return {
      _id: url,
      cnt: 1,
      time: Date.now() + i,
      url: url
    };
  });
  return UrlHistoryHelper.getDatabase().bulkDocs(urls);
};
/**
 * Deletes PouchDB database
 *
 * @return {Promise}
 */
UrlHistoryHelper.deleteDatabase = function() {
  return new Promise(function(resolve, reject) {
    const request = window.indexedDB.deleteDatabase('_pouch_url-history');
    request.onerror = function() {
      reject(new Error('Unable to delete _pouch_url-history database'));
    };
    request.onsuccess = function() {
      resolve();
    };
  });
};
