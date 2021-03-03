import { TransformedPayload } from '@advanced-rest-client/arc-types/src/request/ArcResponse';

/**
 * Calculates size of the string
 * @param str A string to compute size from.
 * @returns Size of the string.
 */
export declare function calculateBytes(str: string): number;

/**
 * @param data The size of the form data
 * @returns The size of the form data
 */
export declare function computeFormDataSize(data: FormData): Promise<number>;

/**
 * Computes size of the payload.
 *
 * @param payload The payload
 * @returns The size of the payload
 */
export declare function computePayloadSize(payload: ArrayBuffer|Blob|File|String|FormData|TransformedPayload): Promise<number>;
