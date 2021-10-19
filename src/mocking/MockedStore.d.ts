import { ARCCookie } from '@advanced-rest-client/events/src/cookies/Cookies';
import { ARCAuthData } from '@advanced-rest-client/events/src/models/AuthData';
import { ARCCertificateIndex, ARCRequestCertificate } from '@advanced-rest-client/events/src/models/ClientCertificate';
import { ARCHostRule } from '@advanced-rest-client/events/src/models/HostRule';
import { ARCProject } from '@advanced-rest-client/events/src/models/Project';
import { ARCRestApi, ARCRestApiIndex } from '@advanced-rest-client/events/src/models/RestApi';
import { ARCUrlHistory } from '@advanced-rest-client/events/src/models/UrlHistory';
import { ARCEnvironment, ARCVariable } from '@advanced-rest-client/events/src/models/Variable';
import { ARCHistoryRequest, ARCSavedRequest } from '@advanced-rest-client/events/src/request/ArcRequest';
import { Authorization, Certificates, Cookies, HostRules, Http, RestApi, Urls, Variables, ArcDataMockInit, CertificateCreateInit, ProjectCreateInit, RequestHistoryInit, RequestSavedInit, RestApiIndexInit, VariableInit } from '@advanced-rest-client/arc-mock';
import { InsertSavedResult } from '../types';

export declare class MockedStore {
  http: Http;
  urls: Urls;
  variables: Variables;
  cookies: Cookies;
  authorization: Authorization;
  hostRules: HostRules;
  restApi: RestApi;
  certificates: Certificates;

  constructor(init?: ArcDataMockInit);

  /**
   * Creates `_id` on the original insert object if it wasn't created before and
   * updates `_rev` property.
   * 
   * @param insertResponse PouchDB build insert response
   * @param insertedData The original array of inserted objects.
   * This changes contents of te array items which is passed by reference.
   */
  updateRevsAndIds<T>(insertResponse: (PouchDB.Core.Response|PouchDB.Core.Error)[], insertedData: T[]): PouchDB.Core.ExistingDocument<T>[];

  /**
   * Generates saved requests data and inserts them into the data store if they
   * are missing.
   *
   * @param requestsSize Default 25
   * @param projectsSize Default 5
   * @param requestsInit 
   * @param projectInit 
   * @returns Resolved promise when data are inserted into the datastore.
   * Promise resolves to generated data object
   */
  insertSaved(requestsSize?: number, projectsSize?: number, requestsInit?: RequestSavedInit, projectInit?: ProjectCreateInit): Promise<InsertSavedResult>;

  /**
   * Generates and saves history data to the data store.
   *
   * @param size The number of requests to generate. Default to 25.
   * @param init History init options.
   * @returns Promise resolved to generated history objects.
   */
  insertHistory(size?: number, init?: RequestHistoryInit): Promise<PouchDB.Core.ExistingDocument<ARCHistoryRequest>[]>;

  /**
   * Generates and saves a list of project objects.
   *
   * @param size Number of projects to insert. Default to 5.
   */
  insertProjects(size?: number, init?: ProjectCreateInit): Promise<PouchDB.Core.ExistingDocument<ARCProject>[]>;

  /**
   * Inserts saved data only if the store is empty.
   * @param requestsSize Default 25
   * @param projectsSize Default 5
   * @returns Resolved promise when data are inserted into the datastore.
   */
  insertSavedIfNotExists(requestsSize?: number, projectsSize?: number, requestsInit?: RequestSavedInit, projectInit?: ProjectCreateInit): Promise<InsertSavedResult>;

  /**
   * Inserts history data if the store is empty.
   * 
   * @param size The number of requests to generate. Default to 25.
   * @param init History init options.
   * @returns Resolved promise when data are inserted into the datastore.
   */
  insertHistoryIfNotExists(size?: number, init?: RequestHistoryInit): Promise<PouchDB.Core.ExistingDocument<ARCHistoryRequest>[]>;

  /**
   * Destroys saved and projects database.
   * @returns Resolved promise when the data are cleared.
   */
  destroySaved(): Promise<void>;

  /**
   * Destroys history database.
   * @returns Resolved promise when the data are cleared.
   */
  destroyHistory(): Promise<void>;

  /**
   * Destroys legacy projects database.
   * @returns Resolved promise when the data are cleared.
   */
  clearLegacyProjects(): Promise<void>;

  /**
   * Generates and saves websocket data to the data store.
   *
   * @param size The number of websocket data to insert.
   */
  insertWebsockets(size?: number): Promise<PouchDB.Core.ExistingDocument<ARCUrlHistory>[]>;
  /**
   * Generates and saves url history data to the data store.
   *
   * @param size The number of URL history data to insert.
   */
  insertUrlHistory(size?: number): Promise<PouchDB.Core.ExistingDocument<ARCUrlHistory>[]>;

  /**
   * Destroys websockets URL history database.
   * @returns Resolved promise when the data are cleared.
   */
  destroyWebsockets(): Promise<void>;

  /**
   * Destroys URL history database.
   * @returns Resolved promise when the data are cleared.
   */
  destroyUrlHistory(): Promise<void>;

  /**
   * Generates and saves variables data to the data store.
   *
   * @param size The number of variables to generate.
   * @param init 
   * @returns Promise resolves to inserted variables.
   */
  insertVariables(size?: number, init?: VariableInit): Promise<PouchDB.Core.ExistingDocument<ARCVariable>[]>;

  /**
   * Generates and saves variables data to the data store and then environments generated from the variables.
   *
   * @param size The number of variables to generate.
   * @param init 
   * @returns Promise resolves to inserted variables.
   */
  insertVariablesAndEnvironments(size?: number, init?: VariableInit): Promise<PouchDB.Core.ExistingDocument<ARCVariable>[]>;

  /**
   * Destroys variables and environments database.
   * @returns Resolved promise when the data are cleared.
   */
  destroyVariables(): Promise<void>;

  /**
   * Generates and saves cookies data to the data store.
   *
   * @param size Number of cookies to insert. Default to 25.
   */
  insertCookies(size?: number): Promise<PouchDB.Core.ExistingDocument<ARCCookie>[]>;

  /**
   * Destroys cookies database.
   * @returns Resolved promise when the data are cleared.
   */
  destroyCookies(): Promise<void>;

  /**
   * Generates and saves basic auth data to the data store.
   *
   * @param size Number of auth data to insert. Default to 25.
   * @returns Promise resolved to created auth data.
   */
  insertBasicAuth(size?: number): Promise<PouchDB.Core.ExistingDocument<ARCAuthData>[]>;

  /**
   * Destroys auth data database.
   * @returns Resolved promise when the data are cleared.
   */
  destroyBasicAuth(): Promise<void>;

  /**
   * Generates and saves host rules data to the data store.
   *
   * @param size Number of rules to insert. Default to 25.
   */
  insertHostRules(size?: number): Promise<PouchDB.Core.ExistingDocument<ARCHostRule>[]>;

  /**
   * Destroys hosts data database.
   * @returns Resolved promise when the data are cleared.
   */
  destroyHostRules(): Promise<void>;

  insertApis(size?: number, init?: RestApiIndexInit): Promise<(PouchDB.Core.ExistingDocument<any>)[]>;

  /**
   * Destroys api-index data database.
   * @returns Resolved promise when the data are cleared.
   */
  destroyApiIndexes(): Promise<void>;

  /**
   * Destroys api-data database.
   * @returns Resolved promise when the data are cleared.
   */
  destroyApiData(): Promise<void>;

  destroyApisAll(): Promise<void>;

  /**
   * @param size The number of certificates to generate.
   * @param {CertificateCreateInit=} opts Create options
   */
  insertCertificates(size?: number, opts?: CertificateCreateInit): Promise<PouchDB.Core.ExistingDocument<ARCCertificateIndex>[]>;
  destroyClientCertificates(): Promise<void>;

  /**
   * Destroys all databases.
   * @returns Resolved promise when the data are cleared.
   */
  destroyAll(): Promise<void>;

  /**
   * Deeply clones an object.
   * @param obj Object to be cloned
   * @returns Copied object
   */
  clone<T>(obj: T): T;

  /**
   * Reads all data from a data store.
   * @param name Name of the data store to read from. Without `_pouch_` prefix
   * @returns Promise resolved to all read docs.
   */
  getDatastoreData(name: string): Promise<any[]>;

  /**
   * Returns a promise with all saved requests
   */
  getDatastoreRequestData(): Promise<PouchDB.Core.ExistingDocument<ARCSavedRequest>[]>;

  /**
   * Returns a promise with all legacy projects
   */
  getDatastoreProjectsData(): Promise<PouchDB.Core.ExistingDocument<ARCProject>[]>;

  /**
   * Returns a promise with all history requests
   */
  getDatastoreHistoryData(): Promise<PouchDB.Core.ExistingDocument<ARCHistoryRequest>[]>;

  /**
   * Returns a promise with all variables
   */
  getDatastoreVariablesData(): Promise<PouchDB.Core.ExistingDocument<ARCVariable>[]>;
  getDatastoreEnvironmentsData(): Promise<PouchDB.Core.ExistingDocument<ARCEnvironment>[]>;
  getDatastoreCookiesData(): Promise<PouchDB.Core.ExistingDocument<ARCCookie>[]>;
  getDatastoreWebsocketsData(): Promise<PouchDB.Core.ExistingDocument<ARCUrlHistory>[]>;
  getDatastoreUrlsData(): Promise<PouchDB.Core.ExistingDocument<ARCUrlHistory>[]>;
  getDatastoreAuthData(): Promise<PouchDB.Core.ExistingDocument<ARCAuthData>[]>;
  getDatastoreHostRulesData(): Promise<PouchDB.Core.ExistingDocument<ARCHostRule>[]>;
  getDatastoreApiIndexData(): Promise<PouchDB.Core.ExistingDocument<ARCRestApiIndex>[]>;
  getDatastoreHostApiData(): Promise<PouchDB.Core.ExistingDocument<ARCRestApi>[]>;
  getDatastoreClientCertificates(): Promise<(ARCCertificateIndex|ARCRequestCertificate)[][]>;

  /**
   * Updates an object in an data store.
   *
   * @param dbName Name of the data store.
   * @param obj The object to be stored.
   * @returns A promise resolved to insert result.
   */
  updateObject(dbName: string, obj: any): Promise<PouchDB.Core.Response>;
}
