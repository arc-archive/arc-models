import {
  ARCHistoryRequest,
  ARCSavedRequest,
  ARCRequestRestoreOptions,
} from '@advanced-rest-client/arc-types/src/request/ArcRequest';
import {
  ARCRequestEventRequestOptions,
} from './RequestEvents';
import {
  ARCEntityChangeRecord,
  ARCModelListOptions,
  ARCModelListResult,
  DeletedEntity,
} from '../types';
import {
  IndexableRequest,
  IndexQueryResult,
} from '@advanced-rest-client/arc-types/src/models/Indexer';
import { ARCAuthData } from '@advanced-rest-client/arc-types/src/models/AuthData';
import { ARCHostRule } from '@advanced-rest-client/arc-types/src/models/HostRule';
import { ARCClientCertificate } from '@advanced-rest-client/arc-types/src/models/ClientCertificate';
import { ARCWebsocketUrlHistory, ARCUrlHistory } from '@advanced-rest-client/arc-types/src/models/UrlHistory';
import { ARCVariable, ARCEnvironment } from '@advanced-rest-client/arc-types/src/models/Variable';
import { ARCVariablesListOptions, EnvironmentStateDetail } from './VariableEvents';
import { ARCRestApi, ARCRestApiIndex } from '@advanced-rest-client/arc-types/src/models/RestApi';
import { ARCProject } from '@advanced-rest-client/arc-types/src/models/Project';

declare interface ProjectStateFunctions {
  /**
   * Dispatches an event after a project was updated
   *
   * @param target A node on which to dispatch the event.
   * @param record Change record
   */
  update(target: EventTarget, record: ARCEntityChangeRecord<ARCProject>): void;
  /**
   * Dispatches an event after a project was deleted
   *
   * @param target A node on which to dispatch the event.
   * @param id Deleted project ID.
   * @param rev Updated revision of the project.
   */
  delete(target: EventTarget, id: string, rev: string): void;
}

declare interface ProjectFunctions {
  /**
   * Dispatches an event handled by the data store to read the project metadata.
   *
   * @param target A node on which to dispatch the event.
   * @param id The ID of the project
   * @param rev The revision of the project. If not set then the latest revision is used.
   * @returns Promise resolved to a Project model.
   */
  read(target: EventTarget, id: string, rev?: string): Promise<ARCProject>;
  /**
   * Dispatches an event handled by the data store to update a project metadata.
   *
   * @param target A node on which to dispatch the event.
   * @param item The project object to update.
   * @returns Promise resolved to a Project model.
   */
  update(target: EventTarget, item: ARCProject): Promise<ARCEntityChangeRecord<ARCProject>>;

  /**
   * Dispatches an event handled by the data store to update a list of project metadata.
   *
   * @param target A node on which to dispatch the event.
   * @param projects The list of project objects to update.
   * @return Promise resolved to a list of change records
   */
  updateBulk(target: EventTarget, projects: ARCProject[]): Promise<ARCEntityChangeRecord<ARCProject>[]>;
  /**
   * Dispatches an event handled by the data store to delete a project metadata.
   *
   * @param target A node on which to dispatch the event.
   * @param id The id of the project to delete.
   * @param rev The revision of the project. If not set then the latest revision is used.
   * @returns Promise resolved to the delete record
   */
  delete(target: EventTarget, id: string, rev?: string): Promise<DeletedEntity>;

  /**
   * Dispatches an event to list the project data.
   *
   * @param target A node on which to dispatch the event.
   * @param opts Query options.
   * @returns Project list result.
   */
  list(target: EventTarget, opts?: ARCModelListOptions): Promise<ARCModelListResult<ARCProject>>;

  /**
   * Dispatches an event to list all project data.
   *
   * @param target A node on which to dispatch the event.
   * @param keys Project keys to read. When not set it reads all projects
   * @return List of projects.
   */
  listAll(target: EventTarget, keys?: string[]): Promise<ARCProject[]>;

  /**
   * Moves a request to a project and removes the request from other projects.
   *
   * @param target A node on which to dispatch the event.
   * @param projectId The target project id
   * @param requestId The request that is being moved/copied
   * @param requestType The request type
   * @param position The index at which to add the request. When not set it add the request to the end of the list.
   * @returns Promise resolved when the operation commits.
   */
  moveTo(target: EventTarget, projectId: string, requestId: string, requestType: string, position?: number): Promise<void>;

  /**
   * Adds a request to a project.
   *
   * @param target A node on which to dispatch the event.
   * @param projectId The target project id
   * @param requestId The request that is being moved/copied
   * @param requestType The request type
   * @param position The index at which to add the request. When not set it add the request to the end of the list.
   * @returns Promise resolved when the operation commits.
   */
  addTo(target: EventTarget, projectId: string, requestId: string, requestType: string, position?: number): Promise<void>;

  /**
   * Removes a request from a project.
   *
   * @param target A node on which to dispatch the event.
   * @param projectId The target project id
   * @param requestId The request that is being moved/copied
   * @returns Promise resolved when the operation commits.
   */
  removeFrom(target: EventTarget, projectId: string, requestId: string): Promise<void>;

  State: ProjectStateFunctions;
}

declare interface RequestStateFunctions {
  /**
   * Dispatches an event after a request object was updated
   *
   * @param target A node on which to dispatch the event.
   * @param type ARC request type
   * @param record Change record
   */
  update(target: EventTarget, type: string, record: ARCEntityChangeRecord<ARCHistoryRequest|ARCSavedRequest>): void;
  /**
   * Dispatches an event after a request was deleted
   *
   * @param {EventTarget} target A node on which to dispatch the event.
   * @param {string} type ARC request type
   * @param {string} id Deleted ARC request ID.
   * @param {string} rev Updated revision of the ARC request entity.
   */
  delete(target: EventTarget, type: string, id: string, rev: string): void;
}

declare interface RequestFunctions {
  /**
   * Dispatches an event handled by the data store to read an ARC request metadata.
   *
   * @param target A node on which to dispatch the event.
   * @param type Request type. Either `saved` or `history`.
   * @param id Request id
   * @param opts ARC request read options.
   * @returns Promise resolved to an ARC request model.
   */
  read(target: EventTarget, type: string, id: string, opts?: ARCRequestEventRequestOptions): Promise<ARCHistoryRequest|ARCSavedRequest>;
  /**
   * Dispatches an event handled by the data store to read a list of ARC requests metadata.
   *
   * @param target A node on which to dispatch the event.
   * @param requestType Request type. Either `saved` or `history`.
   * @param ids List of ids to read
   * @param opts ARC request read options.
   * @return Promise resolved to a list of ARC requests.
   */
  readBulk(target: EventTarget, requestType: string, ids: string[], opts?: ARCRequestEventRequestOptions): Promise<(ARCHistoryRequest|ARCSavedRequest)[]>;
  /**
   * Dispatches an event handled by the data store to read an ARC request metadata.
   *
   * @param target A node on which to dispatch the event.
   * @param requestType Request type. Either `saved` or `history`.
   * @param opts List options.
   * @returns Promise resolved to list of results
   */
  list(target: EventTarget, requestType: string, opts?: ARCModelListOptions): Promise<ARCModelListResult<ARCHistoryRequest|ARCSavedRequest>>;

  /**
   * Dispatches an event handled by the data store to query for ARC request data
   *
   * @param target A node on which to dispatch the event.
   * @param term The search term for the query function
   * @param requestType The type of the requests to search for. By default it returns all data.
   * @param detailed If set it uses slower algorithm but performs full search on the index. When false it only uses filer like query + '*'.
   * @returns Promise resolved to list of results
   */
  query(target: EventTarget, term: string, requestType?: string, detailed?: boolean): Promise<(ARCHistoryRequest|ARCSavedRequest)[]>;

  /**
   * Dispatches an event handled by the data store to read an ARC request metadata.
   *
   * @param target A node on which to dispatch the event.
   * @param type Request type. Either `saved` or `history`.
   * @param request An ARC request to update.
   * @returns Promise resolved to a change record
   */
  update(target: EventTarget, type: string, request: ARCHistoryRequest|ARCSavedRequest): Promise<ARCEntityChangeRecord<ARCHistoryRequest|ARCSavedRequest>>;

  /**
   * Dispatches an event handled by the data store to read an ARC request metadata.
   *
   * @param target A node on which to dispatch the event.
   * @param type Request type. Either `saved` or `history`.
   * @param requests List of ARC request objects to update.
   * @returns Promise resolved to a list of change record for each object
   */
  updateBulk(target: EventTarget, type: string, requests: (ARCHistoryRequest|ARCSavedRequest)[]): Promise<ARCEntityChangeRecord<ARCHistoryRequest|ARCSavedRequest>[]>;

  /**
   * Dispatches an event handled by the data store to save an ARC request object with metadata`.
   *
   * @param target A node on which to dispatch the event.
   * @param type Request type. Either `saved` or `history`.
   * @param request An ARC request to update.
   * @param projects List of project names to create with this request
   * and attach it to the request object. Only relevant for `saved` type.
   * @param opts Save request options.  Only relevant for `saved` type.
   * @returns Promise resolved to a change record
   */
  store(target: EventTarget, type: string, request: ARCHistoryRequest|ARCSavedRequest, projects?: string[]): Promise<ARCEntityChangeRecord<ARCHistoryRequest|ARCSavedRequest>>;

  /**
   * Dispatches an event handled by the data store to delete an ARC request from the store.
   *
   * @param target A node on which to dispatch the event.
   * @param type Request type. Either `saved` or `history`.
   * @param id Request id
   * @param rev A revision ID to delete
   * @returns Promise resolved to a new revision after delete.
   */
  delete(target: EventTarget, type: string, id: string, rev?: string): Promise<DeletedEntity>;
  /**
   * Dispatches an event handled by the data store to delete an ARC request from the store.
   *
   * @param target A node on which to dispatch the event.
   * @param requestType Request type. Either `saved` or `history`.
   * @param ids List of ids to delete.
   * @returns Promise resolved to a a list of deleted revisions
   */
  deleteBulk(target: EventTarget, requestType: string, ids: string[]): Promise<DeletedEntity[]>;
  /**
   * Dispatches an event handled by the data store to delete an ARC request from the store.
   *
   * @param target A node on which to dispatch the event.
   * @param requestType Request type. Either `saved` or `history`.
   * @param requests List of requests to restore
   * @returns Promise resolved to a a list of change records
   */
  undeleteBulk(target: EventTarget, requestType: string, requests: DeletedEntity[]): Promise<ARCEntityChangeRecord<ARCHistoryRequest|ARCSavedRequest>[]>;

  /**
   * Dispatches an event handled by the data store to list all requests that are association with a project.
   *
   * @param target A node on which to dispatch the event.
   * @param id The project id
   * @param opts ARC request read options.
   * @returns Promise resolved to a a list of requests
   */
  projectlist(target: EventTarget, id: string, opts?: ARCRequestRestoreOptions): Promise<(ARCHistoryRequest|ARCSavedRequest)[]>;
  State: RequestStateFunctions;
}

declare interface UrlIndexerStateFunctions {
  /**
   * Dispatches an event informing that the indexer has finished the indexing task
   *
   * @param target A node on which to dispatch the event.
   */
  finished(target: EventTarget): void;
}

declare interface UrlIndexerFunctions {
  /**
   * Dispatches an event handled by the data store to update indexed data.
   *
   * @param target A node on which to dispatch the event.
   * @param requests List of requests to index.
   * @returns Promise resolved when indexes were updated
   */
  update(target: EventTarget, requests: IndexableRequest[]): Promise<void>;
  /**
   * Dispatches an event handled by the data store to query for ARC request URL indexed data
   *
   * @param target A node on which to dispatch the event.
   * @param term The search term for the query function
   * @param requestType The type of the requests to search for.
   * By default it returns all data.
   * @param detailed If set it uses slower algorithm but performs full
   * search on the index. When false it only uses filer like query + '*'.
   * @returns Promise resolved to list of results
   */
  query(target: EventTarget, term: string, requestType?: string, detailed?: boolean): Promise<IndexQueryResult>;
  State: UrlIndexerStateFunctions;
}

declare interface AuthDataStateFunctions {
  /**
   * Dispatches an event informing about a change in the authdata model.
   *
   * @param target A node on which to dispatch the event.
   * @param record AuthData change record.
   */
  update(target: EventTarget, record: ARCEntityChangeRecord<ARCAuthData>): void;
}

declare interface AuthDataFunctions {
  /**
   * Dispatches an event handled by the data store to update an authorization data.
   *
   * @param target A node on which to dispatch the event.
   * @param url The URL of the request associated with the authorization method
   * @param method The name of the authorization method
   * @param authData The authorization data to store.
   * @returns Promise resolved to a the auth change record
   */
  update(target: EventTarget, url: string, method: string, authData: ARCAuthData): Promise<ARCEntityChangeRecord<ARCAuthData>>;
  /**
   * Dispatches an event handled by the data store to query for ARC authorization data
   *
   * @param target A node on which to dispatch the event.
   * @param url The URL of the request associated with the authorization method
   * @param method The name of the authorization method
   * @returns A promise resolved to n auth data model.
   */
  query(target: EventTarget, url: string, method: string): Promise<ARCAuthData>;
  State: AuthDataStateFunctions;
}

declare interface HostRulesStateFunctions {
  /**
   * Dispatches an event informing about a change in the host rules model.
   *
   * @param {EventTarget} target A node on which to dispatch the event.
   * @param {ARCEntityChangeRecord} record Host rules change record.
   */
  update(target: EventTarget, record: ARCEntityChangeRecord<ARCHostRule>): void;
  /**
   * Dispatches an event after a host rule was deleted
   *
   * @param target A node on which to dispatch the event.
   * @param id Deleted host rule id.
   * @param rev Updated revision of the deleted entity.
   */
  delete(target: EventTarget, id: string, rev: string): void;
}

declare interface HostRulesFunctions {
  /**
   * Dispatches an event handled by the data store to update a host rule entity
   *
   * @param target A node on which to dispatch the event.
   * @param rule The rule object to save / update
   * @returns Promise resolved to a the change record
   */
  update(target: EventTarget, rule: ARCHostRule): Promise<ARCEntityChangeRecord<ARCHostRule>>;

  /**
   * Dispatches an event handled by the data store to update host rule entities in bulk
   *
   * @param target A node on which to dispatch the event.
   * @param rules The rules to save / update
   * @returns Promise resolved to a the list of a change record
   */
  updateBulk(target: EventTarget, rules: ARCHostRule[]): Promise<ARCEntityChangeRecord<ARCHostRule>[]>;

  /**
   * Dispatches an event handled by the data store to delete an ARC request from the store.
   *
   * @param target A node on which to dispatch the event.
   * @param id The host rule id
   * @param rev A revision ID to delete
   * @returns Delete record
   */
  delete(target: EventTarget, id: string, rev?: string): Promise<DeletedEntity>;

  /**
   * Dispatches an event handled by the data store to read a host rules data.
   *
   * @param target A node on which to dispatch the event.
   * @param opts List options.
   * @returns Promise resolved to list of results
   */
  list(target: EventTarget, opts?: ARCModelListOptions): Promise<ARCModelListResult<ARCHostRule>>;
  State: HostRulesStateFunctions;
}

declare interface ClientCertificateStateFunctions {
  /**
   * Dispatches an event after a client certificate was updated
   *
   * @param target A node on which to dispatch the event.
   * @param record Change record
   */
  update(target: EventTarget, record: ARCEntityChangeRecord<ARCClientCertificate>): void;
  /**
   * Dispatches an event after a client certificate was deleted
   *
   * @param target A node on which to dispatch the event.
   * @param id Deleted client certificate id.
   * @param rev Updated revision of the client certificate.
   */
  delete(target: EventTarget, id: string, rev: string): void;
}

declare interface ClientCertificateFunctions {
  /**
   * Dispatches an event handled by the data store to read the client certificate.
   *
   * @param target A node on which to dispatch the event.
   * @param id The id of the client certificate
   * @param rev The revision of the client certificate. If not set then the latest revision is used.
   * @returns Promise resolved to a client certificate model.
   */
  read(target: EventTarget, id: string, rev?: string): Promise<ARCClientCertificate>;
  /**
   * Dispatches an event to list the client certificates data.
   *
   * @param target A node on which to dispatch the event.
   * @param opts Query options.
   * @returns The list result.
   */
  list(target: EventTarget, opts?: ARCModelListOptions): Promise<ARCModelListResult<ARCClientCertificate>>;
  /**
   * Dispatches an event handled by the data store to delete a client certificate
   *
   * @param target A node on which to dispatch the event.
   * @param id The id of the project to delete.
   * @param rev The revision of the project. If not set then the latest revision is used.
   * @returns Promise resolved to a new revision after delete.
   */
  delete(target: EventTarget, id: string, rev?: string): Promise<DeletedEntity>;
  /**
   * Dispatches an event handled by the data store to insert a new client certificate.
   *
   * @param target A node on which to dispatch the event.
   * @param item The certificate object.
   * @returns Promise resolved to the change record
   */
  insert(target: EventTarget, item: ARCClientCertificate): Promise<ARCEntityChangeRecord<ARCClientCertificate>>;


  State: ClientCertificateStateFunctions;
}

declare interface WSUrlHistoryStateFunctions {
  /**
   * Dispatches an event after an URL entity was updated
   *
   * @param target A node on which to dispatch the event.
   * @param record The change record
   */
  update(target: EventTarget, record: ARCEntityChangeRecord<ARCWebsocketUrlHistory>): void;
}

declare interface WSUrlHistoryFunctions {
  /**
   * Dispatches an event handled by the data store to list a page of the results
   *
   * @param target A node on which to dispatch the event.
   * @param opts List options.
   * @returns Promise resolved to the change record for the URL
   */
  list(target: EventTarget, opts?: ARCModelListOptions): Promise<ARCModelListResult<ARCWebsocketUrlHistory>>;
  /**
   * Dispatches an event handled by the data store to add a WS URL to the history
   *
   * @param target A node on which to dispatch the event.
   * @param url The URL to insert
   * @returns Promise resolved to the change record for the URL
   */
  insert(target: EventTarget, url: string): Promise<ARCEntityChangeRecord<ARCWebsocketUrlHistory>>;
  /**
   * Dispatches an event handled by the data store to list a page of the results
   *
   * @param target A node on which to dispatch the event.
   * @param term THe query term
   * @returns Promise resolved to the change record for the URL
   */
  query(target: EventTarget, term: string): Promise<ARCWebsocketUrlHistory[]>;

  State: WSUrlHistoryStateFunctions;
}

declare interface UrlHistoryStateFunctions {
  /**
   * Dispatches an event after an URL entity was updated
   *
   * @param target A node on which to dispatch the event.
   * @param record The change record
   */
  update(target: EventTarget, record: ARCEntityChangeRecord<ARCUrlHistory>): void;
}

declare interface UrlHistoryFunctions {
  /**
   * Dispatches an event handled by the data store to list a page of the results
   *
   * @param target A node on which to dispatch the event.
   * @param opts List options.
   * @returns Promise resolved to the change record for the URL
   */
  list(target: EventTarget, opts?: ARCModelListOptions): Promise<ARCModelListResult<ARCUrlHistory>>;
  /**
   * Dispatches an event handled by the data store to add an URL to the history
   *
   * @param target A node on which to dispatch the event.
   * @param url The URL to insert
   * @returns Promise resolved to the change record for the URL
   */
  insert(target: EventTarget, url: string): Promise<ARCEntityChangeRecord<ARCUrlHistory>>;
  /**
   * Dispatches an event handled by the data store to list a page of the results
   *
   * @param target A node on which to dispatch the event.
   * @param term THe query term
   * @returns Promise resolved to the change record for the URL
   */
  query(target: EventTarget, term: string): Promise<ARCUrlHistory[]>;

  State: UrlHistoryStateFunctions;
}

declare interface EnvironmentStateFunctions {
  /**
   * Dispatches an event after an environment was updated
   *
   * @param target A node on which to dispatch the event.
   * @param record Change record
   */
  update(target: EventTarget, record: ARCEntityChangeRecord<ARCEnvironment>): void;
  /**
   * Dispatches an event after an environment was deleted
   *
   * @param target A node on which to dispatch the event.
   * @param id Deleted record id.
   * @param rev Updated revision.
   */
  delete(target: EventTarget, id: string, rev: string): void;
  /**
   * Dispatches an event to read current environment information.
   *
   * @param target A node on which to dispatch the event.
   * @param state Current environment state definition.
   * @returns This has no side effects.
   */
  select(target: EventTarget, state: EnvironmentStateDetail): void;
}

declare interface EnvironmentFunctions {
  /**
   * Dispatches an event handled by the data store to read the environment metadata
   *
   * @param target A node on which to dispatch the event.
   * @param name The name of the environment
   * @returns Promise resolved to an environment model.
   */
  read(target: EventTarget, name: string): Promise<ARCEnvironment>;
  /**
   * Dispatches an event handled by the data store to update an environment metadata.
   *
   * @param target A node on which to dispatch the event.
   * @param item The environment object to update.
   * @returns Promise resolved to the change record
   */
  update(target: EventTarget, item: ARCEnvironment): Promise<ARCEntityChangeRecord<ARCEnvironment>>;
  /**
   * Dispatches an event handled by the data store to delete an environment and its variables.
   *
   * @param target A node on which to dispatch the event.
   * @param id The id of the environment to delete.
   * @returns Promise resolved to the delete record
   */
  delete(target: EventTarget, id: string): Promise<DeletedEntity>;
  /**
   * Dispatches an event to list the environments data.
   *
   * @param target A node on which to dispatch the event.
   * @param opts Query options.
   * @returns Model query result.
   */
  list(target: EventTarget, opts?: ARCVariablesListOptions): Promise<ARCModelListResult<ARCEnvironment>>;
  /**
   * Dispatches an event to read the current environment information.
   *
   * @param target A node on which to dispatch the event.
   * @returns Promise resolved to the current environment definition.
   */
  current(target: EventTarget): Promise<EnvironmentStateDetail>;
  /**
   * Dispatches an event to read current environment information.
   *
   * @param target A node on which to dispatch the event.
   * @param id The id of the environment to select. Falsy value if should select the default environment.
   * @returns This has no side effects.
   */
  select(target: EventTarget, id: string): void;
  State: EnvironmentStateFunctions;
}

declare interface VariableStateFunctions {
  /**
   * Dispatches an event after a variable was updated
   *
   * @param target A node on which to dispatch the event.
   * @param record Change record
   */
  update(target: EventTarget, record: ARCEntityChangeRecord<ARCVariable>): void;
  /**
   * Dispatches an event after an variable was deleted
   *
   * @param target A node on which to dispatch the event.
   * @param id Deleted record id.
   * @param rev Updated revision.
   */
  delete(target: EventTarget, id: string, rev: string): void;
}

declare interface VariableFunctions {
  /**
   * Dispatches an event handled by the data store to update a variable metadata.
   *
   * @param target A node on which to dispatch the event.
   * @param item The variable object to update.
   * @returns Promise resolved to the change record
   */
  update(target: EventTarget, item: ARCVariable): Promise<ARCEntityChangeRecord<ARCVariable>>;
  /**
   * Dispatches an event handled by the data store to delete a variable.
   *
   * @param target A node on which to dispatch the event.
   * @param id The id of the variable to delete.
   * @returns Promise resolved to the delete record
   */
  delete(target: EventTarget, id: string): Promise<DeletedEntity>;
  /**
   * Dispatches an event to list the variables data.
   *
   * @param target A node on which to dispatch the event.
   * @param name The name of the environment
   * @param opts Query options.
   * @returns Model query result.
   */
  list(target: EventTarget, name: string, opts?: ARCVariablesListOptions): Promise<ARCModelListResult<ARCVariable>>;
  /**
   * Dispatches an event handled by the data store to set a variable for the current environment.
   *
   * @param target A node on which to dispatch the event.
   * @param name The name of the variable. Case sensitive.
   * @param value The value to set on the variable.
   * @returns Promise resolved to the change record
   */
  set(target: EventTarget, name: string, value: string): Promise<ARCEntityChangeRecord<ARCVariable>>;
  
  State: VariableStateFunctions;
}

declare interface RestApiStateFunctions {
  /**
   * Dispatches an event after a REST API index entity was updated
   *
   * @param target A node on which to dispatch the event.
   * @param record Change record
   */
  update(target: EventTarget, record: ARCEntityChangeRecord<ARCRestApiIndex>): void;
  /**
   * Dispatches an event after a REST API was deleted
   *
   * @param target A node on which to dispatch the event.
   * @param id Deleted entity id
   * @param rev Updated revision of the entity.
   */
  dataUpdate(target: EventTarget, record: ARCEntityChangeRecord<ARCRestApi>): void;
  /**
   * Dispatches an event after a REST API data entity was updated
   *
   * @param target A node on which to dispatch the event.
   * @param record Change record
   */
  delete(target: EventTarget, id: string, rev: string): void;
  /**
   * Dispatches an event after a REST API version was deleted
   *
   * @param target A node on which to dispatch the event.
   * @param id Deleted entity id
   * @param rev Updated revision of the entity.
   * @param indexId Index id of the removed item
   * @param version Removed version name
   */
  versionDelete(target: EventTarget, id: string, rev: string, indexId: string, version: string): void;
}

declare interface RestApiFunctions {
  /**
   * Dispatches an event to list the REST API index data.
   *
   * @param target A node on which to dispatch the event.
   * @param opts Query options.
   * @returns List query result.
   */
  list(target: EventTarget, opts?: ARCModelListOptions): Promise<ARCModelListResult<ARCRestApiIndex>>;
  /**
   * Dispatches an event handled by the data store to read the REST API index metadata.
   *
   * @param target A node on which to dispatch the event.
   * @param id The entity id
   * @param rev The optional revision
   * @returns Promise resolved to the entity
   */
  read(target: EventTarget, id: string, rev?: string): Promise<ARCRestApiIndex>;
  /**
   * Dispatches an event handled by the data store to read the REST API data metadata.
   *
   * @param target A node on which to dispatch the event.
   * @param id The entity id
   * @param rev The optional revision
   * @returns Promise resolved to the entity
   */
  dataRead(target: EventTarget, id: string, rev?: string): Promise<ARCRestApi>;
  /**
   * Dispatches an event handled by the data store to update an API Index entity
   *
   * @param target A node on which to dispatch the event.
   * @param entity The entity to update.
   * @returns Promise resolved to a the change record
   */
  update(target: EventTarget, entity: ARCRestApiIndex): ARCEntityChangeRecord<ARCRestApiIndex>;
  /**
   * Dispatches an event handled by the data store to update a REST API data entity
   *
   * @param target A node on which to dispatch the event.
   * @param entity The entity to update.
   * @returns Promise resolved to a the change record
   */
  dataUpdate(target: EventTarget, entity: ARCRestApi): Promise<ARCEntityChangeRecord<ARCRestApi>>;
  /**
   * Dispatches an event handled by the data store to update a list of REST API index entities.
   *
   * @param target A node on which to dispatch the event.
   * @param entities The list of entities to update.
   * @returns Promise resolved to a list of change records
   */
  updateBulk(target: EventTarget, entities: ARCRestApiIndex[]): Promise<ARCEntityChangeRecord<ARCRestApiIndex>[]>;
  /**
   * Dispatches an event handled by the data store to delete a RETS API.
   *
   * @param target A node on which to dispatch the event.
   * @param id The id of the entity to delete.
   * @param rev The revision of the entity.
   * @returns Promise resolved to the delete record
   */
  delete(target: EventTarget, id: string, rev?: string): Promise<DeletedEntity>;
  /**
   * Dispatches an event handled by the data store to delete a version of a RETS API.
   *
   * @param target A node on which to dispatch the event.
   * @param id The id of the entity to delete.
   * @param version The version of the API to delete
   * @returns Promise resolved to the delete record
   */
  versionDelete(target: EventTarget, id: string, version: string): Promise<DeletedEntity>;
  State: RestApiStateFunctions;
}

declare interface ArcModelEvents {
  /**
   * Dispatches an event handled by the data store to destroy a data store.
   *
   * @param target A node on which to dispatch the event.
   * @param stores A list of store names to affect
   * @returns A promise resolved when all requested stores are deleted
   */
  destroy(target: EventTarget, stores: string[]): Promise<void>;
  /**
   * Dispatches an event information the app that a store has been destroyed.
   *
   * @param target A node on which to dispatch the event.
   * @param store The name of the deleted store
   */
  destroyed(target: EventTarget, store: string): void;
  Project: ProjectFunctions;
  Request: RequestFunctions;
  UrlIndexer: UrlIndexerFunctions;
  AuthData: AuthDataFunctions;
  HostRules: HostRulesFunctions;
  ClientCertificate: ClientCertificateFunctions;
  WSUrlHistory: WSUrlHistoryFunctions;
  UrlHistory: UrlHistoryFunctions;
  Environment: EnvironmentFunctions;
  Variable: VariableFunctions;
  RestApi: RestApiFunctions;
}

declare const events: ArcModelEvents;
export { events as  ArcModelEvents };
