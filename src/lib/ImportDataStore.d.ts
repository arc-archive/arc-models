import { DataExport } from '@advanced-rest-client/arc-types';
import { IndexableRequest } from '@advanced-rest-client/arc-models';

export const handleConflictedItem: unique symbol;
export const insertGeneric: unique symbol;

/**
 * Export objects have `key` property instead of `_id`. This ensures the keys are coppied to
 * PouchDB's id.
 */
export declare function transformKeys<T>(items: T[]): T[];

/**
 * A class that gives access to the datastore for ARC objects.
 */
export declare class ImportDataStore {
  historyIndexes?: IndexableRequest[];
  savedIndexes?: IndexableRequest[];
  /**
   * Imports data into the data store.
   *
   * @param exportObj Normalized export object
   * @returns Promise resolved to list of error messages, if any.
   */
  importData(exportObj: DataExport.ArcExportObject): Promise<string[]|undefined>;

  /**
   * Performs an insert of the passed data on the data store.
   * @returns List of error messages, if any
   */
  [insertGeneric](db: PouchDB.Database, items: any[]): Promise<string[]|undefined>;

  /**
   * Imports saved requests data
   * @param requests The request export object
   * @returns List of error messages, if any
   */
  importRequests(requests: DataExport.ExportArcSavedRequest[]): Promise<string[]|undefined>;

  /**
   * Imports saved requests data
   * @param projects The projects export object
   * @returns List of error messages, if any
   */
  importProjects(projects: DataExport.ExportArcProjects[]): Promise<string[]|undefined>;

  importHistory(history: DataExport.ExportArcHistoryRequest[]): Promise<string[]|undefined>;

  importWebsocketUrls(urls: DataExport.ExportArcWebsocketUrl[]): Promise<string[]|undefined>;

  importUrls(urls: DataExport.ExportArcUrlHistory[]): Promise<string[]|undefined>;

  importCookies(data: DataExport.ExportArcCookie[]): Promise<string[]|undefined>;

  importAuthData(data: DataExport.ExportArcAuthData[]): Promise<string[]|undefined>;

  importHostRules(data: DataExport.ExportArcHostRule[]): Promise<string[]|undefined>;

  importVariables(data: DataExport.ExportArcVariable[]): Promise<string[]|undefined>;

  /**
   * Imports client certificates to the data store.
   * @param data Previously normalized certificates data.
   * @returns List of error messages, if any
   */
  importClientCertificates(data: DataExport.ExportArcClientCertificateData[]): Promise<string[]|undefined>;

  importEnvironments(variables: DataExport.ExportArcVariable[]): Promise<void>;

  /**
   * @returns List of error messages, if any
   */
  handleInsertResponse(result: (PouchDB.Core.Response|PouchDB.Core.Error)[], items: any[], db: PouchDB.Database): Promise<string[]|undefined>;

  /**
   * @param db Handle to the certs database
   * @param conflicted List of database entires that are conflicted.
   * @returns List of error messages, if any
   */
  handleConflictedInserts(db: PouchDB.Database, conflicted: any[]): Promise<string[]|undefined>;

  /**
   * Handles datastore conflict for datastore object.
   *
   * @param db PouchDB reference to the data store.
   * @param conflicted List of conflicted items
   * @param item Conflicted item.
   * @param index Index of conflicted item in `conflicted` array
   */
  [handleConflictedItem](db: PouchDB.Database, conflicted: any[], item: any, index: number): Promise<any>;

  /**
   * Lists all requests that should be added to URL index.
   * It builds an array of requests are required by `arc-models/url-indexer`
   * element.
   *
   * @param result PouchDB bulk insert response
   * @param requests Inserted requests
   * @param type Request type, `saved` or `history`
   */
  listRequestIndex(result: (PouchDB.Core.Response|PouchDB.Core.Error)[], requests: DataExport.ExportArcHistoryRequest[], type: string): IndexableRequest[]|undefined;
}
