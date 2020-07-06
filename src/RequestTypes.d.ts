import { Entity } from './types';

/**
 * The definition of the ARC project data entity.
 */
export declare interface ARCProject extends Entity {
  /**
   * Project order
   */
  order?: number;
  /**
   * List of requests associated with the project.
   */
  requests?: string[];
  /**
   * Timestamp when the project was last updated.
   */
  updated?: number;
  /**
   * Timestamp when the project was created.
   */
  created?: number;
  /**
   * The name of the project
   */
  name: string;
  /**
   * The description of the project
   */
  description?: string;
  error?: boolean;
}

export declare interface MultipartTransformer {
  isFile: boolean;
  name: string;
  value: string;
}

/**
 * The definition of the ARC base HTTP request object
 */
export declare interface HTTPRequest {
  /**
   * The request URL
   */
  url: string;
  /**
   * HTTP method name
   */
  method: string;
  /**
   * HTTP headers string
   */
  headers?: string;
  /**
   * The request payload
   */
  payload?: string|File|Buffer|ArrayBuffer|FormData;
  /**
   * ARCs internal transformation of a native FormData into a struct that
   * can be stored in the data store. This is used internally by ther model
   * and when requesting ARC request object this is restored to the original
   * format.
   */
  multipart?: MultipartTransformer[];
}

/**
 * The definition of the ARC base HTTP request object
 */
export declare interface ARCRequest extends HTTPRequest {
  /**
   * The type of the request stored in the data store.
   * Can be either `saved` or `history` which corresponds
   * to `SavedRequest` and `HistoryRequest` definitions respectively.
   */
  type: string;
  /**
   * Timestamp when the request was last updated.
   */
  updated?: number;
  /**
   * Timestamp when the request was created.
   */
  created?: number;
  /**
   * An ID of Google Drive object where this request is stored.
   */
  driveId?: string;
}

/**
 * The definition of the ARC request history data entity.
 */
export declare interface ARCHistoryRequest extends ARCRequest, Entity {

}

export declare interface ARCSavedRequest extends ARCRequest, Entity {
  /**
   * The name of the request
   */
  name: string;
  /**
   * The description of the request
   */
  description?: string;
  /**
   * A list of projects this request is assigned to.
   */
  projects?: string[];
}

export declare interface SaveARCRequestOptions {
  /**
   * When set the request is also stored on Google Drive.
   */
  isDrive?: boolean;
}

export declare interface ARCRequestRestoreOptions {
  /**
   * When set the payload is transformed to the original object
   */
  restorePayload?: boolean;
}
