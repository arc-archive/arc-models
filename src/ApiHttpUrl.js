import { UrlParser } from '@advanced-rest-client/arc-url';

/** @typedef {import('@advanced-rest-client/arc-types').ApiTypes.ApiType} ApiType */
/** @typedef {import('./ApiHttpUrl').ApiHttpUrl} ApiHttpUrlInput */

export class ApiHttpUrl {
  /**
   * @param {ApiHttpUrlInput=} input Either ApiHttpUrl object from the data store or a string to parse
   */
  constructor(input={}) {
    /**
     * The value of the URL.
     * @type {string|undefined}
     */
    this.path = input.path;
    /**
     * The host value of the URL
     * @type {string|undefined}
     */
    this.host = input.host;
    /**
     * The protocol value of the URL
     * @type {string|undefined}
     */
    this.protocol= input.protocol;
    /**
     * The query parameters.
     * @type {ApiType[]|undefined}
     */
    this.query = input.query;
  }

  /**
   * @returns {string} An URL value from current properties.
   */
  toString() {
    const parser = new UrlParser('');
    parser.protocol = this.protocol;
    parser.host = this.host;
    parser.path = this.path;
    parser.searchParams = (this.query || []).map((item) => { return [ item.name, item.value ]; });
    return parser.toString();
  }

  /**
   * Creates a new instance of the class from a string value.
   * @static
   * @param {string} input
   * @returns {ApiHttpUrl}
   */
  static fromValue(input) {
    const parser = new UrlParser(input);
    const query = (parser.searchParams || []).map((item) => {
      const [name, value] = item;
      return /** @type ApiType */ ({
        name,
        value,
        type: 'string',
        enabled: true,
      });
    });
    return new ApiHttpUrl({
      protocol: parser.protocol,
      host: parser.host,
      path: parser.path,
      query,
    });
  }
}