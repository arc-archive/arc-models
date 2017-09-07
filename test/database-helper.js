const DatabaseHelper = {};
DatabaseHelper.clearDatabases = function(...names) {
  var promises = names.map(name => new PouchDB(name).destroy());
  return Promise.all(promises);
};

DatabaseHelper.clearProjects = function() {
  return DatabaseHelper.clearDatabases('legacy-projects');
};

DatabaseHelper.clearRequests = function() {
  return DatabaseHelper.clearDatabases('saved-requests'); //, 'history-requests'
};
DatabaseHelper.clearWebsocketUrlHostory = function() {
  return DatabaseHelper.clearDatabases('websocket-url-history');
};
