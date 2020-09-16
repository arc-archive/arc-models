export declare function createSchema(e: Event): void;
export declare const STORE_NAME: string;
export declare const STORE_VERSION: number;

export declare const generateId: symbol;
export declare const indexDebounce: symbol;
export declare const indexDebounceValue: symbol;
export declare const indexRequestQueueValue: symbol;
export declare const deleteIndexDebounce: symbol;
export declare const deleteIndexDebounceValue: symbol;
export declare const deleteRequestQueueValue: symbol;
export declare const prepareRequestIndexData: symbol;
export declare const createIndexIfMissing: symbol;
export declare const getUrlObject: symbol;
export declare const getAuthorityPath: symbol;
export declare const getPathQuery: symbol;
export declare const getQueryString: symbol;
export declare const appendQueryParams: symbol;
export declare const storeIndexes: symbol;
export declare const getIndexedDataAll: symbol;

export declare interface IndexableRequest {
  /**
   * stored request ID
   */
  id: string;
  /**
   * store name or identifier
   */
  type: string;
  /**
   * the URL to index
   */
  url: string;
}

declare interface IndexableRequestInternal extends IndexableRequest {
  /**
   * Whether it's a full URL (1) or just part of it (0)
   */
  fullUrl: number;
  /**
   * The request ID
   */
  requestId: string;
}

declare interface IndexableRequestMap {
  [key: string]: IndexableRequestInternal[];
}

declare interface ProcessedQueryResults {
  index: IndexableRequestInternal[];
  remove: IndexableRequestInternal[];
}

export declare interface IndexQueryOptions {
  /**
   * Request type: `saved` or `history`
   */
  type?: string;
  /**
   * If set it uses slower algorithm but performs full
   * search on the index. When `false` it only uses filer like query + '*'.
   */
  detailed?: boolean;
}

export declare interface IndexQueryResult {
  [key: string]: string;
}

/**
 * An element responsible for indexing and querying for URL data.
 *
 * To index an URL it requires the following properties:
 * - url - the URL to index
 * - id - datastore id of referenced object
 * - type - type of the object - it's data store name. Type is returned
 * with query results.
 *
 * It queries for indexed data by looking into URL structure. When the query
 * result is ready it returns ordered list of results (by relevance) with
 * `id` (referenced object), and `type`. The query function do not read the
 * data from referenced data store.
 *
 * The component is used to cooperate with saved/history request data model
 * and with REST APIs model. However it can index any URL.
 *
 * The component automatically handles request update/delete events to index or
 * remove index of a request object.
 *
 * ## Usage
 *
 * ### Storing URL data
 *
 * ```javascript
 * const e = new CustomEvent('url-index-update', {
 *  composed: true,
 *  bubbles: true,
 *  cancelable: true,
 *  detail: {
 *    data: [{
 *      id: 'xxx',
 *      type: 'saved-requests',
 *      url: 'https://domain.com'
 *    }]
 *  }
 * });
 * this.dispatchEvent(e);
 * e.detail.result
 * .then((result) => {
 *  console.log(result);
 * });
 * ```
 *
 * or directly on the component:
 *
 * ```javascript
 * const node = document.querySelector('url-indexer');
 * node.index([{
 *  id: 'xxx',
 *  type: 'saved',
 *  url: 'https://domain.com'
 * }])
 * .then((result) => {});
 * ```
 *
 * ### Querying for data
 *
 * ```javascript
 * const e = new CustomEvent('url-index-query', {
 *  composed: true,
 *  bubbles: true,
 *  cancelable: true,
 *  detail: {
 *    q: 'https://...',
 *    type: 'saved', // optional
 *    detailed: false // Optional, default to `false`
 *  }
 * });
 * this.dispatchEvent(e);
 * e.detail.result
 * .then((result) => {
 *  console.log(result);
 * });
 * ```
 *
 * or direct call:
 *
 * ```javascript
 * const node = document.querySelector('url-indexer');
 * node.query('https://...', {
 *  type: 'saved-requests', // optional
 *  detailed: false // Optional, default to `false`
 * })
 * .then((result) => {});
 * ```
 * See query method for description of parameters.
 */
export declare class UrlIndexer extends HTMLElement {
  constructor();
  connectedCallback(): void;
  disconnectedCallback(): void;

  /**
   * Opens search index data store.
   */
  openSearchStore(): Promise<IDBDatabase>;

  /**
   * Indexes request data in dedicated index store for requests.
   *
   * Each item on the `requests` list must contain:
   * - `id` - stored object ID (returned by the query)
   * - `type` - store name or identifier (returned by the query)
   * - `url` - the URL to index
   *
   * @param requests List of requests to index.
   */
  index(requests: IndexableRequest[]): Promise<void>;

  /**
   * Removes indexed data for given requests.
   *
   * @param ids List of request ids to remove.
   */
  deleteIndexedData(ids: string[]): Promise<void>;

  /**
   * Removes indexed data for given `type`.
   *
   * @param type `history` or `saved`
   */
  deleteIndexedType(type: string): Promise<void>;

  /**
   * Removes all indexed data.
   */
  clearIndexedData(): Promise<void>;

  /**
   * Queries for indexed data.
   *
   * @param query The query
   * @param opts Search options:
   * - type (string: saved || history): Request type
   * - detailed (Boolean): If set it uses slower algorithm but performs full
   * search on the index. When false it only uses filer like query + '*'.
   */
  query(query: string, opts?: IndexQueryOptions): Promise<IndexQueryResult>;

  /**
   * Reindexes a request by the type.
   * @param type Either `saved` or `history`
   */
  reindex(type: any): Promise<void>;

  /**
   * Reindexes saved requests
   */
  reindexSaved(): Promise<void>;

  /**
   * Reindexes history requests
   */
  reindexHistory(): Promise<void>;
}
