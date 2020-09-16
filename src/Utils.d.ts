import { ARCSavedRequest, ARCHistoryRequest } from './RequestTypes';
import { DeletedEntity, ARCEntityChangeRecord } from './types';

/**
 * Computes past midnight for given timestamp.
 *
 * @param time Timestamp
 * @returns Time reduced to midnight.
 */
export declare function computeMidnight(time: number): number;

/**
 * Computes time for timestamp's day, month and year and time set to 0.
 * @param {object} item Database entry item.
 * @returns The copy of the  database item with the `_time` property.
 */
export declare function computeTime(item: object): object;

/**
 * Helper method to cancel the event and stop it's propagation.
 * @param e Event to cancel
 */
export declare function cancelEvent(e: Event|CustomEvent): void;

/**
 * Normalizes various historical labels for the request to a currently used values.
 *
 * @param type `saved-requests`, `saved`, `history-requests`,`history`, `legacy-projects`, or `projects`
 * @returns `saved`, `history`, or `projects`
 */
export declare function normalizeRequestType(type: string): string;

/**
 * Normalizes request object to whatever the app is currently using.
 */
export declare function normalizeRequest(request: ARCHistoryRequest|ARCSavedRequest): ARCHistoryRequest|ARCSavedRequest;

/**
 * Generates an ID for a request history object
 *
 * @param request The request object
 * @returns Generated history ID.
 */
export declare function generateHistoryId(request: ARCHistoryRequest): string;

/**
 * Finds a next revision after the `deletedRevision` in the revisions history
 * which is the one that reverts any changes made after it.
 *
 * @param revs PouchDB revision history object
 * @param deletedRevision Revision of deleted object (after delete).
 * @returns Revision ID of the object before a change registered in `deletedRevision`
 */
export declare function findUndeletedRevision(revs: object, deletedRevision: string): string|null;

/**
 * Finds last not deleted revision of a document.
 *
 * @param db PouchDB instance
 * @param items List of documents to process
 * @returns Last not deleted version of each document.
 */
export declare function findNotDeleted<T>(db: PouchDB.Database, items: DeletedEntity[]): Promise<T[]>;
/**
 * Reverts deleted items.
 *
 * @param db The database handler to perform the operation on.
 * @param items List of objects to restore.
 * @returns Resolved promise with restored objects. Objects have updated `_rev` property.
 */
export declare function revertDelete<T>(db: PouchDB.Database, items: DeletedEntity[]): Promise<ARCEntityChangeRecord<T>[]>;
