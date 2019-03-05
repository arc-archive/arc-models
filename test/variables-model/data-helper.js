export const DataHelper = {};
/* global PouchDB */
DataHelper.addVars = function(items) {
  const db = new PouchDB('variables');
  if (items instanceof Array) {
    return db.bulkDocs(items);
  }
  return db.post(items);
};

DataHelper.addEnv = function(names) {
  const db = new PouchDB('variables-environments');
  if (names instanceof Array) {
    names = names.map(function(item) {
      return {
        name: item
      };
    });
  } else {
    names = {
      name: names
    };
  }
  if (names instanceof Array) {
    return db.bulkDocs(names);
  }
  return db.post(names);
};
