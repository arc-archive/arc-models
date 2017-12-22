const DatabaseHelper = {};
// DatabaseHelper.clearDatabases = function(...names) {
//   return DatabaseHelper.__clearDatabases(names);
// };

DatabaseHelper.clearDatabases = function(...names) {
  var promises = names.map(name => new PouchDB(name).destroy());
  return Promise.all(promises);
};

// DatabaseHelper.__clearDatabases = function(list) {
//   var name = list.shift();
//   if (!name) {
//     return Promise.resolve();
//   }
//   return DatabaseHelper.deleteDatabase(name)
//   .then(() => DatabaseHelper.__clearDatabases(list));
// };
//
// DatabaseHelper.deleteDatabase = function(name) {
//   return new Promise((resolve, reject) => {
//     var request = indexedDB.deleteDatabase('_pouch_' + name);
//     request.onsuccess = resolve;
//     request.onerror = reject;
//   });
// };

DatabaseHelper.clearProjects = function() {
  return DatabaseHelper.clearDatabases('legacy-projects');
};

DatabaseHelper.clearRequests = function() {
  return DatabaseHelper.clearDatabases('saved-requests'); //, 'history-requests'
};
DatabaseHelper.clearWebsocketUrlHostory = function() {
  return DatabaseHelper.clearDatabases('websocket-url-history');
};
DatabaseHelper.clearRestAPi = function() {
  return DatabaseHelper.clearDatabases('rest-api-index', 'rest-api-data');
};
DatabaseHelper.clearHostRules = function() {
  return DatabaseHelper.clearDatabases('host-rules');
};
