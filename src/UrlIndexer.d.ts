export declare function normalizeType(type: string): string;
export declare function createSchema(e: Event): void;
export declare const STORE_NAME: string;
export declare const STORE_VERSION: number;

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

  _indexUpdateHandler(e: CustomEvent): void;
  _indexQueryHandler(e: CustomEvent): void;
  _requestChangeHandler(e: CustomEvent): void;

  /**
   * Calles index function with debouncer.
   * The debouncer runs the queue after 25 ms. Bulk operations should be called
   * onece unless there's a lot of data to process.
   *
   * @param id Request ID
   * @param url Request URL
   * @param type Request type (saved or history)
   */
  _indexDebounce(id: string, url: string, type: string): void;

  /**
   * Handler for `request-object-deleted` custom event.
   * It expects `id` property to be set on event detail object.
   * Cancelable events are ignored.
   */
  _requestDeleteHandler(e: CustomEvent): void;

  /**
   * Calles deleteIndexedData function with debouncer.
   * The debouncer runs the queue after 25 ms. Bulk operations should be called
   * onece unless there's a lot of data to process.
   *
   * @param id Request ID
   */
  _deleteIndexDebounce(id: string): void;
  _deleteModelHandler(e: CustomEvent): Promise<void>;

  /**
   * Removes indexed data from select stores.
   * @param store A stores that being destroyed in the app.
   */
  _deleteStores(store: string[]): Promise<void>;

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

  _processIndexedRequests(requests: IndexableRequest[], map: IndexableRequestMap): ProcessedQueryResults;
  _notifyIndexFinished(): void;

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
   * Retreives index data for requests.
   *
   * @param db Database reference
   * @param ids List of request ids
   * @returns A map where keys are request IDs and values are
   * an array of index data.
   * ```
   * {
   *  "[request-id]": [{
   *    "id": "...",
   *    "requestId": [request-id],
   *    "url": "...",
   *    "type": "..."
   *   }]
   * }
   * ```
   */
  _getIndexedDataAll(db: IDBDatabase, ids: string[]): Promise<IndexableRequestMap>;

  /**
   * Prepares a list of objects to put into the indexeddb to index the request.
   *
   * @param request Request object with `id` and `url` properties
   * @param indexed List of already indexed properties
   * @returns A list of objects to store
   */
  _prepareRequestIndexData(request: IndexableRequest, indexed: IndexableRequestInternal[]): IndexableRequestInternal[];

  /**
   * Generates ID for URL index object
   *
   * @param url URL to search for. It should be lower case
   * @param type Request type
   */
  _generateId(url: string, type: string): string;

  /**
   * Creates an index datastore object if it doesn't exists in the list
   * of indexed items.
   *
   * @param url URL to search for.
   * @param id Request ID
   * @param type Request type
   * @param indexed Already indexed data.
   * @returns Index object to store or `undefined` if already
   * indexed.
   */
  _createIndexIfMissing(url: string, id: string, type: string, indexed: IndexableRequestInternal[]): IndexableRequestInternal|undefined;

  /**
   * Creates an index object for the whole url, if it doesn't exists in already
   * indexed data.
   *
   * @param request The request object to index
   * @param indexed Already indexed data.
   * @returns Object to store or `undefined` if the object
   * already exists.
   */
  _getUrlObject(request: IndexableRequest, indexed: IndexableRequestInternal[]): IndexableRequestInternal|undefined;

  /**
   * Creates an index object for authority part of the url,
   * if it doesn't exists in already indexed data.
   *
   * @param parser Instance of URL object
   * @param id Request ID
   * @param type Request type
   * @param indexed Already indexed data.
   * @returns Object to store or `undefined` if the object
   * already exists.
   */
  _getAuthorityPath(parser: URL, id: string, type: string, indexed: IndexableRequestInternal[]): IndexableRequestInternal|undefined;

  /**
   * Creates an index object for path part of the url,
   * if it doesn't exists in already indexed data.
   *
   * @param parser Instance of URL object
   * @param id Request ID
   * @param type Request type
   * @param indexed Already indexed data.
   * @returns Object to store or `undefined` if the object
   * already exists.
   */
  _getPathQuery(parser: URL, id: string, type: string, indexed: IndexableRequestInternal[]): IndexableRequestInternal|undefined;

  /**
   * Creates an index object for query string of the url,
   * if it doesn't exists in already indexed data.
   *
   * @param parser Instance of URL object
   * @param id Request ID
   * @param type Request type
   * @param indexed Already indexed data.
   * @returns Object to store or `undefined` if the object
   * already exists.
   */
  _getQueryString(parser: URL, id: string, type: string, indexed: IndexableRequestInternal[]): IndexableRequestInternal|undefined;

  /**
   * Creates an index object for each query parameter of the url,
   * if it doesn't exists in already indexed data.
   *
   * @param parser Instance of URL object
   * @param id Request ID
   * @param type Request type
   * @param indexed Already indexed data.
   * @param target A list where to put generated data
   */
  _appendQueryParams(parser: URL, id: string, type: string, indexed: IndexableRequestInternal[], target: IndexableRequestInternal[]): void;

  /**
   * Stores indexes in the data store.
   *
   * @param indexes List of indexes to store.
   * @returns window
   */
  _storeIndexes(db: IDBDatabase, indexes: IndexableRequestInternal[]): Promise<void>;

  /**
   * Removes indexed items that are no longer relevant for the request.
   *
   * @param items List of datastore index items.
   */
  _removeRedundantIndexes(db: IDBDatabase, items: IndexableRequestInternal[]): Promise<void>;

  /**
   * Queries for indexed data.
   *
   * @param query The query
   * @param opts Search options:
   * - type (string: saved || history): Request type
   * - detailed (Booelan): If set it uses slower algorithm but performs full
   * search on the index. When false it only uses filer like query + '*'.
   */
  query(query: string, opts?: IndexQueryOptions): Promise<IndexQueryResult>;

  /**
   * Performance search on the data store using `indexOf` on the primary key.
   * This function is slower than `_searchCasing` but much, much faster than
   * other ways to search for this data.
   * It allows to perform a search on the part of the url only like:
   * `'*' + q + '*'` while `_searchCasing` only allows `q + '*'` type search.
   *
   * @param db Reference to the database
   * @param q A string to search for
   * @param type A type of the request to include into results.
   */
  _searchIndexOf(db: IDBDatabase, q: string, type: string): Promise<IndexQueryResult>;

  /**
   * Uses (in most parts) algorithm described at
   * https://www.codeproject.com/Articles/744986/How-to-do-some-magic-with-indexedDB
   * Distributed under Apache 2 license
   *
   * This is much faster than `_searchIndexOf` function. However may not find
   * some results. For ARC it's a default search function.
   *
   * @param db Reference to the database
   * @param q A string to search for
   * @param type A type of the request to include into results.
   */
  _searchCasing(db: IDBDatabase, q: string, type: string): Promise<IndexQueryResult>;

  /**
   * https://www.codeproject.com/Articles/744986/How-to-do-some-magic-with-indexedDB
   * Distributed under Apache 2 license
   *
   * @param key [description]
   * @param lowerKey [description]
   * @param upperNeedle [description]
   * @param lowerNeedle [description]
   */
  _nextCasing(key: string, lowerKey: string, upperNeedle: string, lowerNeedle: string): string|undefined;

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

  /**
   * Reindexes a request by the type.
   * @param type Either `saved` or `history`
   */
  _renindex(type: string): Promise<void>;
}
