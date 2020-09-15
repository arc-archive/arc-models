/* eslint-disable class-methods-use-this */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-param-reassign */

/**
@license
Copyright 2018 The Advanced REST client authors <arc@mulesoft.com>
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
*/
import 'pouchdb/dist/pouchdb.js';
import { v4 } from '@advanced-rest-client/uuid-generator';
import {
  isPostman,
  isArcFile,
  prepareImportObject,
} from './ImportUtils.js';
import { ArcLegacyTransformer } from '../transformers/ArcLegacyTransformer.js';
import { ArcDexieTransformer } from '../transformers/ArcDexieTransformer.js';
import { ArcPouchTransformer } from '../transformers/ArcPouchTransformer.js';
import { PostmanDataTransformer } from '../transformers/PostmanDataTransformer.js';

/* global PouchDB */

/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ArcExportObject} ArcExportObject */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcSavedRequest} ExportArcSavedRequest */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcHistoryRequest} ExportArcHistoryRequest */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcProjects} ExportArcProjects */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcWebsocketUrl} ExportArcWebsocketUrl */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcUrlHistory} ExportArcUrlHistory */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcHostRule} ExportArcHostRule */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcVariable} ExportArcVariable */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcAuthData} ExportArcAuthData */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcClientCertificateData} ExportArcClientCertificateData */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcCookie} ExportArcCookie */
/** @typedef {import('../../index').ARCEnvironment} ARCEnvironment */
/** @typedef {import('../../index').IndexableRequest} IndexableRequest */

export const handleConflictedItem = Symbol('handleConflictedItem');
export const insertGeneric = Symbol('insertGeneric');

/**
 * Export objects have `key` property instead of `_id`. This ensures the keys are coppied to
 * PouchDB's id.
 *
 * @param {object[]} items
 * @return {object[]}
 */
export function transformKeys(items) {
  return items.map((item) => {
    const data = { ...item };
    delete data.kind;
    if (!data.key) {
      data.key = v4();
    }
    data._id = data.key;
    delete data.key;
    return data;
  });
};

/**
 * A class that gives access to the datastore for ARC objects.
 */
export class ImportDataStore {
  /**
   * Transforms any previous ARC export file to the current export object.
   *
   * @param {string|object} data Data from the import file.
   * @return {Promise<ArcExportObject>} Normalized data import object.
   */
  async normalize(data) {
    data = prepareImportObject(data);
    if (isPostman(data)) {
      return this.normalizePostman(data);
    }
    if (isArcFile(data)) {
      return this.normalizeArcData(data);
    }
    throw new Error('File not recognized');
  }

  /**
   * Normalizes any previous and current ARC file expot data to common model.
   *
   * @param {object} data Imported data.
   * @return {Promise<ArcExportObject>} A promise resolved to ARC data export object.
   */
  async normalizeArcData(data) {
    switch (data.kind) {
      case 'ARC#SavedHistoryDataExport':
      case 'ARC#AllDataExport':
      case 'ARC#SavedDataExport':
      case 'ARC#SavedExport':
      case 'ARC#HistoryDataExport':
      case 'ARC#HistoryExport':
      case 'ARC#Project':
      case 'ARC#SessionCookies':
      case 'ARC#HostRules':
      case 'ARC#ProjectExport':
        return this.normalizeArcPouchSystem(data);
      case 'ARC#requestsDataExport':
        return this.normalizeArcDexieSystem(data);
      default:
        return this.normalizeArcLegacyData(data);
    }
  }

  /**
   * Normalizes export data from the GWT system.
   * @param {object} data Parsed data
   * @return {Promise<ArcExportObject>} Normalized import object
   */
  normalizeArcLegacyData(data) {
    const transformer = new ArcLegacyTransformer(data);
    return transformer.transform();
  }

  /**
   * Normalizes export data from Dexie powered data store.
   * @param {object} data Parsed data
   * @return {Promise<ArcExportObject>} Normalized import object
   */
  normalizeArcDexieSystem(data) {
    const transformer = new ArcDexieTransformer(data);
    return transformer.transform();
  }

  /**
   * Normalizes ARC's data exported in PouchDB system
   * @param {object} data Parsed data
   * @return {Promise<ArcExportObject>} Normalized import object
   */
  normalizeArcPouchSystem(data) {
    const transformer = new ArcPouchTransformer(data);
    return transformer.transform();
  }

  /**
   * Normalizes Postman data into ARC's data model.
   * @param {object} data Parsed data
   * @return {Promise<ArcExportObject>} Normalized import object
   */
  normalizePostman(data) {
    const transformer = new PostmanDataTransformer();
    return transformer.transform(data);
  }

  /**
   * Imports data into the data store.
   *
   * @param {ArcExportObject} exportObj Normalized export object
   * @return {Promise<string[]|undefined>} Promise resolved to list of error messages, if any.
   */
  async importData(exportObj) {
    let errors = [];
    function handleInfo(info) {
      if (info && info.length) {
        errors = errors.concat(info);
      }
    }
    if (exportObj.requests && exportObj.requests.length) {
      const result = await this.importRequests(exportObj.requests);
      handleInfo(result);
    }
    if (exportObj.projects && exportObj.projects.length) {
      const result = await this.importProjects(exportObj.projects);
      handleInfo(result);
    }
    if (exportObj.history && exportObj.history.length) {
      const result = await this.importHistory(exportObj.history);
      handleInfo(result);
    }
    const wuh = exportObj.websocketurlhistory;
    if (wuh && wuh.length) {
      const result = await this.importWebsocketUrls(wuh);
      handleInfo(result);
    }
    const uh = exportObj.urlhistory;
    if (uh && uh.length) {
      const result = await this.importUrls(uh);
      handleInfo(result);
    }
    if (exportObj.cookies && exportObj.cookies.length) {
      const result = await this.importCookies(exportObj.cookies);
      handleInfo(result);
    }
    const ad = exportObj.authdata;
    if (ad && ad.length) {
      const result = await this.importAuthData(ad);
      handleInfo(result);
    }
    if (exportObj.variables && exportObj.variables.length) {
      const result = await this.importVariables(exportObj.variables);
      handleInfo(result);
      const eresult = await this.importEnvironments(exportObj.variables);
      handleInfo(eresult);
    }
    const hr = exportObj.hostrules;
    if (hr && hr.length) {
      const result = await this.importHostRules(hr);
      handleInfo(result);
    }

    const cc = exportObj.clientcertificates;
    if (cc && cc.length) {
      const result = await this.importClientCertificates(cc);
      handleInfo(result);
    }
    return errors.length ? errors : undefined;
  }

  /**
   * Performs an insert of the passed data on the data store.
   * @param {PouchDB.Database} db
   * @param {any[]} items
   * @return {Promise<string[]|undefined>} List of error messages, if any
   */
  async [insertGeneric](db, items) {
    const data = transformKeys(items);
    const result = await db.bulkDocs(data);
    return this.handleInsertResponse(result, data, db);
  }

  /**
   * Imports saved requests data
   * @param {ExportArcSavedRequest[]} requests The request export object
   * @return {Promise<string[]|undefined>} List of error messages, if any
   */
  async importRequests(requests) {
    const db = new PouchDB('saved-requests');
    const data = transformKeys(requests);
    const result = await db.bulkDocs(data);
    this.savedIndexes = this.listRequestIndex(result, data, 'saved');
    return this.handleInsertResponse(result, data, db);
  }

  /**
   * Imports saved requests data
   * @param {ExportArcProjects[]} projects The projects export object
   * @return {Promise<string[]|undefined>} List of error messages, if any
   */
  async importProjects(projects) {
    const db = new PouchDB('legacy-projects');
    return this[insertGeneric](db, projects);
  }

  /**
   * @param {ExportArcHistoryRequest[]} history
   * @return {Promise<string[]|undefined>}
   */
  async importHistory(history) {
    const db = new PouchDB('history-requests');
    const data = transformKeys(history);
    const result = await db.bulkDocs(data);
    this.historyIndexes = this.listRequestIndex(result, data, 'history');
    return this.handleInsertResponse(result, data, db);
  }

  /**
   * @param {ExportArcWebsocketUrl[]} urls
   * @return {Promise<string[]|undefined>}
   */
  async importWebsocketUrls(urls) {
    const db = new PouchDB('websocket-url-history');
    return this[insertGeneric](db, urls);
  }

  /**
   * @param {ExportArcUrlHistory[]} urls
   * @return {Promise<string[]|undefined>}
   */
  async importUrls(urls) {
    const db = new PouchDB('url-history');
    return this[insertGeneric](db, urls);
  }

  /**
   * @param {ExportArcCookie[]} data
   * @return {Promise<string[]|undefined>}
   */
  async importCookies(data) {
    const db = new PouchDB('cookies');
    return this[insertGeneric](db, data);
  }

  /**
   * @param {ExportArcAuthData[]} data
   * @return {Promise<string[]|undefined>}
   */
  async importAuthData(data) {
    const db = new PouchDB('auth-data');
    return this[insertGeneric](db, data);
  }

  /**
   * @param {ExportArcHostRule[]} data
   * @return {Promise<string[]|undefined>}
   */
  async importHostRules(data) {
    const db = new PouchDB('host-rules');
    return this[insertGeneric](db, data);
  }

  /**
   * @param {ExportArcVariable[]} data
   * @return {Promise<string[]|undefined>}
   */
  async importVariables(data) {
    const db = new PouchDB('variables');
    return this[insertGeneric](db, data);
  }

  /**
   * Imports client certificates to the data store.
   * @param {ExportArcClientCertificateData[]} data Previously normalized certificates data.
   * @return {Promise<string[]|undefined>} Promise resolved to the list of errors or `undefined`.
   */
  async importClientCertificates(data) {
    const indexes = [];
    const certs = [];
    data.forEach((item) => {
      const index = {
        _id: item.key,
        // updated: item.updated,
        created: item.created,
        dataKey: item.key,
        name: item.name,
        type: item.type,
      };
      const certData = {
        _id: item.key,
        cert: item.cert,
      };
      if (item.pKey) {
        certData.key = item.pKey;
      }
      indexes.push(index);
      certs.push(certData);
    });

    const db = new PouchDB('client-certificates');
    const indexesResponse = await db.bulkDocs(indexes);
    const indexesResult = await this.handleInsertResponse(indexesResponse, indexes, db);
    const dataDb = new PouchDB('client-certificates-data');
    const dataResponse = await dataDb.bulkDocs(certs);
    const dataResult = await this.handleInsertResponse(dataResponse, certs, dataDb);
    const final = (indexesResult || []).concat(dataResult || []);
    return final.length ? final : undefined;
  }

  /**
   * @param {ExportArcVariable[]} variables
   * @return {Promise} [description]
   */
  async importEnvironments(variables) {
    const userDefined = [];
    variables.forEach((item) => {
      if (item.environment && item.environment !== 'default') {
        const name = item.environment.toLowerCase();
        if (userDefined.indexOf(name) === -1) {
          userDefined.push(name);
        }
      }
    });
    if (!userDefined.length) {
      return;
    }
    const db = new PouchDB('variables-environments');
    const response = await db.allDocs({
      include_docs: true,
    });
    if (response && response.rows.length) {
      response.rows.forEach((item) => {
        const stored = /** @type ARCEnvironment */ (item.doc);
        const name = stored.name.toLowerCase();
        const index = userDefined.indexOf(name);
        if (index > -1) {
          userDefined.splice(index, 1);
        }
      });
    }
    if (!userDefined.length) {
      return;
    }
    const docs = /** @type ARCEnvironment[] */ (userDefined.map((name) => {
      return {
        name,
        created: Date.now(),
      };
    }));
    await db.bulkDocs(docs);
  }

  /**
   * @param {(PouchDB.Core.Response|PouchDB.Core.Error)[]} result
   * @param {any[]} items
   * @param {PouchDB.Database} db
   * @return {Promise<string[]|undefined>} List of error messages, if any
   */
  async handleInsertResponse(result, items, db) {
    const conflicted = [];
    const errors = [];
    result.forEach((item, index) => {
      const errorItem = /** @type PouchDB.Core.Error */ (item);
      if (errorItem.error && errorItem.status === 409) {
        conflicted[conflicted.length] = items[index];
      } else if (errorItem.error) {
        errors.push(errorItem.message);
      }
    });
    if (conflicted.length) {
      const insertResult = await this.handleConflictedInserts(db, conflicted);
      if (!insertResult) {
        return errors;
      }
      return errors.concat(insertResult);
    }
    return undefined;
  }

  /**
   * @param {PouchDB.Database} db Handle to the certs database
   * @param {any[]} conflicted List of database entires that are conflicted.
   * @return {Promise<string[]|undefined>} List of error messages, if any
   */
  async handleConflictedInserts(db, conflicted) {
    const errors = [];
    const keys = conflicted.map((item) => item._id);
    const result = await db.allDocs({ keys })
    const data = [];
    for (let i = 0, len = result.rows.length; i < len; i++) {
      const item = result.rows[i];
      data[data.length] = await this[handleConflictedItem](db, conflicted, item, i);
    }
    const insertResponse = await db.bulkDocs(data);
    insertResponse.forEach((item) => {
      const entity = /** @type PouchDB.Core.Error */ (item);
      if (entity.error) {
        errors.push(entity.message);
      }
    });
    return errors.length ? errors : undefined;
  }

  /**
   * Handles datastore conflict for datastore object.
   *
   * @param {PouchDB.Database} db PouchDB reference to the data store.
   * @param {any[]} conflicted List of conflicted items
   * @param {any} item Conflicted item.
   * @param {number} index Index of conflicted item in `conflicted` array
   * @return {Promise<any>}
   */
  async [handleConflictedItem](db, conflicted, item, index) {
    if (item.value.deleted) {
      const response = await db.get(item.id, { rev: item.value.rev });
      response._deleted = false;
      const result = await db.put(response);
      conflicted[index]._rev = result.rev;
      return conflicted[index];
    }
    conflicted[index]._rev = item.value.rev;
    return conflicted[index];
  }

  /**
   * Lists all requests that should be added to URL index.
   * It builds an array of requests are required by `arc-models/url-indexer`
   * element.
   *
   * @param {(PouchDB.Core.Response|PouchDB.Core.Error)[]} result PouchDB bulk insert response
   * @param {ExportArcHistoryRequest[]} requests Inserted requests
   * @param {string} type Request type, `saved` or `history`
   * @return {IndexableRequest[]|undefined}
   */
  listRequestIndex(result, requests, type) {
    const index = [];
    result.forEach((item, i) => {
      const entity = /** @type PouchDB.Core.Error */ (item);
      if (entity.error) {
        return;
      }
      index[index.length] = {
        id: item.id,
        url: requests[i].url,
        type,
      };
    });
    return index.length ? index : undefined;
  }
}
