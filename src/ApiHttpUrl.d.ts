import { ApiType } from '@advanced-rest-client/arc-types/src/models/ApiTypes';

export declare class ApiHttpUrl {
  /**
   * The value of the URL.
   */
  path?: string;
  /**
   * The host value of the URL
   */
  host?: string;
  /**
   * The protocol value of the URL
   */
  protocol?: string;
  /**
   * The query parameters.
   */
  query?: ApiType[];

  /**
   * @param {ApiHttpUrl=} input Either ApiHttpUrl object from the data store or a string to parse
   */
  constructor(input?: ApiHttpUrl);

  /**
   * @returns An URL value from current properties.
   */
  toString(): string;

  /**
   * Creates a new instance of the class from a string value.
   */
  static fromValue(input: string): ApiHttpUrl;
}