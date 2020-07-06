import { ARCSavedRequest, ARCHistoryRequest } from './RequestTypes';

/**
 * Computes past mindnight for given timestamp.
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
 * Normalizes various historical labels for the request to a curently used values.
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
