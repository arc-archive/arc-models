import { ArcBaseModel } from './ArcBaseModel';
import { Entity, ARCEntityChangeRecord } from './types';

export declare interface ARCAuthData extends Entity {
  username?: string;
  password?: string;
  domain?: string;
}

/**
 * Removes query parameters and the fragment part from the URL
 * @param url URL to process
 * @returns Canonical URL.
 */
export declare function normalizeUrl(url: string): string;
/**
 * Computes the database key for auth data
 *
 * @param method The Authorization method to restore data for.
 * @param url The URL of the request
 * @returns Datastore key for auth data
 */
export declare function computeKey(method: string, url?: string): string;

/**
 * Model for authorization data stored in the application.
 */
export declare class AuthDataModel extends ArcBaseModel {

  constructor();

  _attachListeners(node: EventTarget): void;
  _detachListeners(node: EventTarget): void;

  /**
   * Queries for a datastore entry. Similar to `read()` but without using `id`
   * but rather the URL.
   *
   * @param url The URL of the request
   * @param authMethod The Authorization method to restore data for.
   */
  query(url: string, authMethod: string): Promise<ARCAuthData|undefined>;

  /**
   * Creates or updates the auth data in the data store for given method and URl.
   *
   * @param url The URL of the request
   * @param authMethod The Authorization method to restore data for.
   * @param authData The authorization data to store. Schema depends on
   * the `authMethod` property. From model standpoint schema does not matter.
   */
  update(url: string, authMethod: string, authData: object): Promise<ARCEntityChangeRecord<ARCAuthData>>;
}
