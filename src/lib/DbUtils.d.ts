import { DataExport } from '@advanced-rest-client/arc-types';

declare interface PageResult {
  docs: any[];
  config: PouchDB.Core.AllDocsWithinRangeOptions;
}

/**
 * Safely reads a datastore entry. It returns undefined if the entry does not exist.
 *
 * @param dbName Name of the datastore to get the data from.
 * @param id The id of the entry
 * @returns Resolved promise to the document or undefined.
 */
export declare function getEntry(dbName: string, id: string): Promise<any|undefined>;

/**
 * Fetches a single page of results from the database.
 * @param db PouchDB instance
 * @param options Fetch options. This object is altered during the fetch.
 * @returns Promise resolved to the list of documents.
 */
export declare function fetchEntriesPage(db: PouchDB.Database, options: PouchDB.Core.AllDocsOptions): Promise<PageResult>;

/**
 * Returns all data from a database.
 *
 * @param dbName Name of the datastore to get the data from.
 * @returns Resolved promise to array of objects. It always resolves.
 */
export declare function getDatabaseEntries(dbName: string, limit: number): Promise<any[]>;

/**
 * Returns a client certificate data for a given ID.
 * @param id The certificate ID
 * @param certificates Already read certificate data.
 * @returns A certificate data to add to the certificates list or undefined if the certificate is already defined.
 */
export declare function readClientCertificateIfNeeded(id: string, certificates?: DataExport.ArcExportClientCertificateData[]): Promise<DataExport.ArcExportClientCertificateData|null>;

/**
 * Processes request data for required export properties after the data
 * has been received from the data store but before creating export object.
 *
 * @param requests A list of requests to process
 * @param certificates The list of read certificates
 * @returns Promise resolved to altered list of requests.
 */
export declare function processRequestsArray(requests: object[], certificates: DataExport.ArcExportClientCertificateData[]): Promise<DataExport.ArcExportClientCertificateData[]>;
