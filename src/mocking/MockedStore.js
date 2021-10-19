/* eslint-disable no-plusplus */
/* eslint-disable class-methods-use-this */
import { Authorization, Certificates, Cookies, HostRules, Http, RestApi, Urls, Variables } from '@advanced-rest-client/arc-mock';
import 'pouchdb/dist/pouchdb.js';
/* global PouchDB */

/** @typedef {import('@advanced-rest-client/arc-mock').ArcDataMockInit} ArcDataMockInit */
/** @typedef {import('@advanced-rest-client/events').ArcRequest.ARCHistoryRequest} ARCHistoryRequest */
/** @typedef {import('@advanced-rest-client/events').ArcRequest.ARCSavedRequest} ARCSavedRequest */
/** @typedef {import('@advanced-rest-client/events').Project.ARCProject} ARCProject */
/** @typedef {import('@advanced-rest-client/events').UrlHistory.ARCUrlHistory} ARCUrlHistory */
/** @typedef {import('@advanced-rest-client/events').Variable.ARCVariable} ARCVariable */
/** @typedef {import('@advanced-rest-client/events').Variable.ARCEnvironment} ARCEnvironment */
/** @typedef {import('@advanced-rest-client/events').Cookies.ARCCookie} ARCCookie */
/** @typedef {import('@advanced-rest-client/events').AuthData.ARCAuthData} ARCAuthData */
/** @typedef {import('@advanced-rest-client/events').HostRule.ARCHostRule} ARCHostRule */
/** @typedef {import('@advanced-rest-client/events').ClientCertificate.ClientCertificate} ClientCertificate */
/** @typedef {import('@advanced-rest-client/events').ClientCertificate.ARCCertificateIndex} ARCCertificateIndex */
/** @typedef {import('@advanced-rest-client/events').ClientCertificate.ARCRequestCertificate} ARCRequestCertificate */
/** @typedef {import('@advanced-rest-client/events').RestApi.ARCRestApi} ARCRestApi */
/** @typedef {import('@advanced-rest-client/events').RestApi.ARCRestApiIndex} ARCRestApiIndex */
/** @typedef {import('../types').InsertSavedResult} InsertSavedResult */
/** @typedef {import('@advanced-rest-client/arc-mock').RequestSavedInit} RequestSavedInit */
/** @typedef {import('@advanced-rest-client/arc-mock').ProjectCreateInit} ProjectCreateInit */
/** @typedef {import('@advanced-rest-client/arc-mock').RequestHistoryInit} RequestHistoryInit */
/** @typedef {import('@advanced-rest-client/arc-mock').VariableInit} VariableInit */
/** @typedef {import('@advanced-rest-client/arc-mock').RestApiIndexInit} RestApiIndexInit */
/** @typedef {import('@advanced-rest-client/arc-mock').CertificateCreateInit} CertificateCreateInit */

export class MockedStore {
  /**
   * @param {ArcDataMockInit=} init 
   */
  constructor(init={}) {
    this.http = new Http(init);
    this.urls = new Urls(init);
    this.variables = new Variables(init);
    this.cookies = new Cookies(init);
    this.authorization = new Authorization(init);
    this.hostRules = new HostRules(init);
    this.restApi = new RestApi(init);
    this.certificates = new Certificates(init);
  }

  /**
   * @param {string} name The data store name to create.
   * @returns {PouchDB.Database}
   */
  db(name) {
    return new PouchDB(name);
  }

  /**
   * Creates `_id` on the original insert object if it wasn't created before and
   * updates `_rev` property.
   * 
   * @template T
   * @param {(PouchDB.Core.Response|PouchDB.Core.Error)[]} insertResponse PouchDB build insert response
   * @param {T[]} insertedData The original array of inserted objects.
   * This changes contents of te array items which is passed by reference.
   * @return {PouchDB.Core.ExistingDocument<T>[]}
   */
  updateRevsAndIds(insertResponse, insertedData) {
    const result = [];
    insertResponse.forEach((item, i) => {
      const error = /** @type PouchDB.Core.Error */ (item);
      if (error.error) {
        return;
      }
      const copy = /** @type any */ ({ ...insertedData[i] });
      if (!copy._id) {
        copy._id = item.id;
      }
      copy._rev = item.rev;
      result.push(copy);
    });
    return result;
  }

  /**
   * Generates saved requests data and inserts them into the data store if they
   * are missing.
   *
   * @param {number=} requestsSize Default 25
   * @param {number=} projectsSize Default 5
   * @param {RequestSavedInit=} requestsInit 
   * @param {ProjectCreateInit=} projectInit 
   * @return {Promise<InsertSavedResult>} Resolved promise when data are inserted into the datastore.
   * Promise resolves to generated data object
   */
  async insertSaved(requestsSize, projectsSize, requestsInit, projectInit) {
    const data = this.http.savedData(requestsSize, projectsSize, requestsInit, projectInit);
    const result = /** @type InsertSavedResult */ ({
      projects: [],
      requests: [],
    });
    const projectsDb = this.db('legacy-projects');
    const response = await projectsDb.bulkDocs(data.projects);
    result.projects = this.updateRevsAndIds(response, data.projects);
    const savedDb = this.db('saved-requests');
    const response2 = await savedDb.bulkDocs(data.requests);
    result.requests = this.updateRevsAndIds(response2, data.requests);
    return result;
  }

  /**
   * Generates and saves history data to the data store.
   *
   * @param {number=} size The number of requests to generate. Default to 25.
   * @param {RequestHistoryInit=} init History init options.
   * @return {Promise<PouchDB.Core.ExistingDocument<ARCHistoryRequest>[]>} Promise resolved to generated history objects.
   */
  async insertHistory(size, init) {
    const data = this.http.listHistory(size, init);
    const db = this.db('history-requests');
    const response = await db.bulkDocs(data);
    return this.updateRevsAndIds(response, data);
  }

  /**
   * Generates and saves a list of project objects.
   *
   * @param {number=} size Number of projects to insert. Default to 5.
   * @param {ProjectCreateInit=} init
   * @return {Promise<PouchDB.Core.ExistingDocument<ARCProject>[]>}
   */
  async insertProjects(size, init) {
    const data = this.http.listProjects(size, init);
    const db = this.db('legacy-projects');
    const response = await db.bulkDocs(data);
    return this.updateRevsAndIds(response, data);
  }

  /**
   * Inserts saved data only if the store is empty.
   * @param {number=} requestsSize Default 25
   * @param {number=} projectsSize Default 5
   * @param {RequestSavedInit=} requestsInit 
   * @param {ProjectCreateInit=} projectInit 
   * @return {Promise<InsertSavedResult>} Resolved promise when data are inserted into the datastore.
   */
  async insertSavedIfNotExists(requestsSize, projectsSize, requestsInit, projectInit) {
    const savedDb = this.db('saved-requests');
    const response = await savedDb.allDocs({
      include_docs: true,
    });
    if (!response.rows.length) {
      return this.insertSaved(requestsSize, projectsSize, requestsInit, projectInit);
    }
    const result = {
      requests: response.rows.map(item => item.doc),
      projects: [],
    };
    const projectsDb = this.db('legacy-projects');
    const projectsResponse = await projectsDb.allDocs({
      include_docs: true,
    });
    result.projects = projectsResponse.rows.map(item => item.doc);
    return result;
  }

  /**
   * Inserts history data if the store is empty.
   * 
   * @param {number=} size The number of requests to generate. Default to 25.
   * @param {RequestHistoryInit=} init History init options.
   * @return {Promise<PouchDB.Core.ExistingDocument<ARCHistoryRequest>[]>} Resolved promise when data are inserted into the datastore.
   */
  async insertHistoryIfNotExists(size, init) {
    const db = this.db('history-requests');
    const response = await db.allDocs({
      include_docs: true,
    });
    if (!response.rows.length) {
      return this.insertHistory(size, init);
    }
    return response.rows.map(item => item.doc);
  }

  /**
   * Destroys saved and projects database.
   * @return {Promise<void>} Resolved promise when the data are cleared.
   */
  async destroySaved() {
    const savedDb = this.db('saved-requests');
    const projectsDb = this.db('legacy-projects');
    await savedDb.destroy();
    await projectsDb.destroy();
  }

  /**
   * Destroys history database.
   * @return {Promise<void>} Resolved promise when the data are cleared.
   */
  async destroyHistory() {
    const db = this.db('history-requests');
    await db.destroy();
  }

  /**
   * Destroys legacy projects database.
   * @return {Promise<void>} Resolved promise when the data are cleared.
   */
  async clearLegacyProjects() {
    const db = this.db('legacy-projects');
    await db.destroy();
  }

  /**
   * Generates and saves websocket data to the data store.
   *
   * @param {number=} size The number of websocket data to insert.
   * @return {Promise<PouchDB.Core.ExistingDocument<ARCUrlHistory>[]>} 
   */
  async insertWebsockets(size) {
    const data = this.urls.urls(size);
    const db = this.db('websocket-url-history');
    const response = await db.bulkDocs(data);
    return this.updateRevsAndIds(response, data);
  }

  /**
   * Generates and saves url history data to the data store.
   *
   * @param {number=} size The number of URL history data to insert.
   * @return {Promise<PouchDB.Core.ExistingDocument<ARCUrlHistory>[]>}
   */
  async insertUrlHistory(size) {
    const data = this.urls.urls(size);
    const db = this.db('url-history');
    const response = await db.bulkDocs(data);
    return this.updateRevsAndIds(response, data);
  }

  /**
   * Destroys websockets URL history database.
   * @return {Promise<void>} Resolved promise when the data are cleared.
   */
  async destroyWebsockets() {
    const db = this.db('websocket-url-history');
    await db.destroy();
  }

  /**
   * Destroys URL history database.
   * @return {Promise<void>} Resolved promise when the data are cleared.
   */
  async destroyUrlHistory() {
    const db = this.db('url-history');
    await db.destroy();
  }

  /**
   * Generates and saves variables data to the data store.
   *
   * @param {number=} size The number of variables to generate.
   * @param {VariableInit=} init 
   * @return {Promise<PouchDB.Core.ExistingDocument<ARCVariable>[]>} Promise resolves to inserted variables.
   */
  async insertVariables(size, init) {
    const data = this.variables.listVariables(size, init);
    const db = this.db('variables');
    const response = await db.bulkDocs(data);
    return this.updateRevsAndIds(response, data);
  }

  /**
   * Generates and saves variables data to the data store and then environments generated from the variables.
   *
   * @param {number=} size The number of variables to generate.
   * @param {VariableInit=} init 
   * @return {Promise<PouchDB.Core.ExistingDocument<ARCVariable>[]>} Promise resolves to inserted variables.
   */
  async insertVariablesAndEnvironments(size, init) {
    const result = await this.insertVariables(size, init);
    const items = [];
    const names = [];
    result.forEach((variable) => {
      if (variable.environment !== 'default' && !names.includes(variable.environment)) {
        names.push(variable.environment)
        items.push({
          name: variable.environment,
          created: Date.now(),
        });
      }
    });
    if (items.length) {
      const db = this.db('variables-environments');
      await db.bulkDocs(items);
    }
    return result;
  }

  /**
   * Destroys variables and environments database.
   * @return {Promise<void>} Resolved promise when the data are cleared.
   */
  async destroyVariables() {
    const db = this.db('variables');
    const db2 = this.db('variables-environments');
    await db.destroy();
    await db2.destroy();
  }

  /**
   * Generates and saves cookies data to the data store.
   *
   * @param {number=} size Number of cookies to insert. Default to 25.
   * @return {Promise<PouchDB.Core.ExistingDocument<ARCCookie>[]>} 
   */
  async insertCookies(size) {
    const data = this.cookies.cookies(size);
    const db = this.db('cookies');
    const response = await db.bulkDocs(data);
    return this.updateRevsAndIds(response, data);
  }

  /**
   * Destroys cookies database.
   * @return {Promise<void>} Resolved promise when the data are cleared.
   */
  async destroyCookies() {
    const db = this.db('cookies');
    await db.destroy();
  }

  /**
   * Generates and saves basic auth data to the data store.
   *
   * @param {number=} size Number of auth data to insert. Default to 25.
   * @return {Promise<PouchDB.Core.ExistingDocument<ARCAuthData>[]>} Promise resolved to created auth data.
   */
  async insertBasicAuth(size) {
    const data = this.authorization.basicList(size);
    const db = this.db('auth-data');
    const response = await db.bulkDocs(data);
    return this.updateRevsAndIds(response, data);
  }

  /**
   * Destroys auth data database.
   * @return {Promise<void>} Resolved promise when the data are cleared.
   */
  async destroyBasicAuth() {
    const db = this.db('auth-data');
    await db.destroy();
  }

  /**
   * Generates and saves host rules data to the data store.
   *
   * @param {number=} size Number of rules to insert. Default to 25.
   * @return {Promise<PouchDB.Core.ExistingDocument<ARCHostRule>[]>} 
   */
  async insertHostRules(size) {
    const data = this.hostRules.rules(size);
    const db = this.db('host-rules');
    const response = await db.bulkDocs(data);
    return this.updateRevsAndIds(response, data);
  }

  /**
   * Destroys hosts data database.
   * @return {Promise<void>} Resolved promise when the data are cleared.
   */
  async destroyHostRules() {
    const db = this.db('host-rules');
    await db.destroy();
  }

  /**
   * @param {number=} size
   * @param {RestApiIndexInit=} init
   * @return {Promise<(PouchDB.Core.ExistingDocument<any>)[]>}
   */
  async insertApis(size, init) {
    let index = this.restApi.apiIndexList(size, init);
    let data = this.restApi.apiDataList(index);
    const indexDb = this.db('api-index');
    const indexResponse = await indexDb.bulkDocs(index);
    index = this.updateRevsAndIds(indexResponse, index);
    const dataDb = this.db('api-data');
    const dataResponse = await dataDb.bulkDocs(data);
    data = this.updateRevsAndIds(dataResponse, data);
    return [index, data];
  }

  /**
   * Destroys api-index data database.
   * @return {Promise<void>} Resolved promise when the data are cleared.
   */
  async destroyApiIndexes() {
    const db = this.db('api-index');
    await db.destroy();
  }

  /**
   * Destroys api-data database.
   * @return {Promise<void>} Resolved promise when the data are cleared.
   */
  async destroyApiData() {
    const db = this.db('api-data');
    await db.destroy();
  }

  /**
   * @return {Promise<void>} 
   */
  async destroyApisAll() {
    await this.destroyApiIndexes();
    await this.destroyApiData();
  }

  /**
   * @param {number=} size The number of certificates to generate.
   * @param {CertificateCreateInit=} opts Create options
   * @returns {Promise<PouchDB.Core.ExistingDocument<ARCCertificateIndex>[]>}
   */
  async insertCertificates(size, opts) {
    const data = this.certificates.clientCertificates(size, opts);
    const responses = [];
    const indexDb = this.db('client-certificates');
    const dataDb = this.db('client-certificates-data');
    for (let i = 0; i < data.length; i++) {
      const cert = data[i];
      const dataEntity = /** @type ARCRequestCertificate */({
        cert: this.certificates.toStore(cert.cert),
        type: cert.type,
      });
      if (cert.key) {
        dataEntity.key = this.certificates.toStore(cert.key);
      }
      const indexEntity = /** @type ARCCertificateIndex */({
        name: cert.name,
        type: cert.type,
      });
      if (cert.created) {
        indexEntity.created = cert.created;
      } else {
        indexEntity.created = Date.now();
      }

      /* eslint-disable-next-line no-await-in-loop */
      const dataRes = await dataDb.post(dataEntity);
      indexEntity._id = dataRes.id;
      /* eslint-disable-next-line no-await-in-loop */
      responses[responses.length] = await indexDb.post(indexEntity);
    }
    return this.updateRevsAndIds(responses, data);
  }

  /**
   * @return {Promise<void>} 
   */
  async destroyClientCertificates() {
    await this.db('client-certificates').destroy();
    await this.db('client-certificates-data').destroy();
  }

  /**
   * Destroys all databases.
   * @return {Promise<void>} Resolved promise when the data are cleared.
   */
  async destroyAll() {
    await this.destroySaved();
    await this.destroyHistory();
    await this.destroyWebsockets();
    await this.destroyUrlHistory();
    await this.destroyVariables();
    await this.destroyCookies();
    await this.destroyBasicAuth();
    await this.destroyHostRules();
    await this.destroyApiIndexes();
    await this.destroyApiData();
    await this.destroyClientCertificates();
  }

  /**
   * Deeply clones an object.
   * @param {any[]|Date|object} obj Object to be cloned
   * @return {any[]|Date|object} Copied object
   */
  clone(obj) {
    let copy;
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    if (obj instanceof Date) {
      copy = new Date();
      copy.setTime(obj.getTime());
      return copy;
    }
    if (Array.isArray(obj)) {
      copy = [];
      for (let i = 0, len = obj.length; i < len; i++) {
        copy[i] = this.clone(obj[i]);
      }
      return copy;
    }
    if (obj instanceof Object) {
      copy = {};
      Object.keys(obj).forEach((key) => {
        copy[key] = this.clone(obj[key]);
      });
      return copy;
    }
    throw new Error("Unable to copy obj! Its type isn't supported.");
  }

  /**
   * Reads all data from a data store.
   * @param {string} name Name of the data store to read from. Without
   * `_pouch_` prefix
   * @return {Promise<any[]>} Promise resolved to all read docs.
   */
  async getDatastoreData(name) {
    const db = this.db(name);
    const response = await db.allDocs({
      include_docs: true,
    });
    return response.rows.map(item => item.doc);
  }

  /**
   * Returns a promise with all saved requests
   * @return {Promise<PouchDB.Core.ExistingDocument<ARCSavedRequest>[]>}
   */
  async getDatastoreRequestData() {
    return this.getDatastoreData('saved-requests');
  }

  /**
   * Returns a promise with all legacy projects
   * @return {Promise<PouchDB.Core.ExistingDocument<ARCProject>[]>}
   */
  async getDatastoreProjectsData() {
    return this.getDatastoreData('legacy-projects');
  }

  /**
   * Returns a promise with all history requests
   * @return {Promise<PouchDB.Core.ExistingDocument<ARCHistoryRequest>[]>}
   */
  async getDatastoreHistoryData() {
    return this.getDatastoreData('history-requests');
  }

  /**
   * Returns a promise with all variables
   * @return {Promise<PouchDB.Core.ExistingDocument<ARCVariable>[]>}
   */
  async getDatastoreVariablesData() {
    return this.getDatastoreData('variables');
  }

  /**
   * Returns a promise with all environments
   * @return {Promise<PouchDB.Core.ExistingDocument<ARCEnvironment>[]>}
   */
  async getDatastoreEnvironmentsData() {
    return this.getDatastoreData('variables-environments');
  }

  /**
   * @return {Promise<PouchDB.Core.ExistingDocument<ARCCookie>[]>}
   */
  async getDatastoreCookiesData() {
    return this.getDatastoreData('cookies');
  }

  /**
   * @return {Promise<PouchDB.Core.ExistingDocument<ARCUrlHistory>[]>}
   */
  async getDatastoreWebsocketsData() {
    return this.getDatastoreData('websocket-url-history');
  }

  /**
   * @return {Promise<PouchDB.Core.ExistingDocument<ARCUrlHistory>[]>}
   */
  async getDatastoreUrlsData() {
    return this.getDatastoreData('url-history');
  }

  /**
   * @return {Promise<PouchDB.Core.ExistingDocument<ARCAuthData>[]>}
   */
  async getDatastoreAuthData() {
    return this.getDatastoreData('auth-data');
  }

  /**
   * @return {Promise<PouchDB.Core.ExistingDocument<ARCHostRule>[]>}
   */
  async getDatastoreHostRulesData() {
    return this.getDatastoreData('host-rules');
  }

  /**
   * @return {Promise<PouchDB.Core.ExistingDocument<ARCRestApiIndex>[]>}
   */
  async getDatastoreApiIndexData() {
    return this.getDatastoreData('api-index');
  }

  /**
   * @return {Promise<PouchDB.Core.ExistingDocument<ARCRestApi>[]>}
   */
  async getDatastoreHostApiData() {
    return this.getDatastoreData('api-data');
  }

  /**
   * @return {Promise<(ARCCertificateIndex|ARCRequestCertificate)[][]>}
   */
  async getDatastoreClientCertificates() {
    const certs = await this.getDatastoreData('client-certificates');
    const data = await this.getDatastoreData('client-certificates-data');
    return [certs, data];
  }

  /**
   * Updates an object in an data store.
   *
   * @param {string} dbName Name of the data store.
   * @param {object} obj The object to be stored.
   * @return {Promise<PouchDB.Core.Response>} A promise resolved to insert result.
   */
  async updateObject(dbName, obj) {
    const db = this.db(dbName);
    return db.put(obj, {
      force: true,
    });
  }
}
