/**
 * DO NOT EDIT
 *
 * This file was automatically generated by
 *   https://github.com/Polymer/tools/tree/master/packages/gen-typescript-declarations
 *
 * To modify these typings, edit the source file(s):
 *   url-indexer.js
 */


// tslint:disable:variable-name Describing an API that's defined elsewhere.
// tslint:disable:no-any describes the API as best we are able today

declare namespace LogicElements {

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
  class UrlIndexer extends HTMLElement {
    readonly uuid: Element|null;
    readonly indexStoreName: any;
    readonly indexStoreVersion: any;
    connectedCallback(): void;
    disconnectedCallback(): void;
    _indexUpdateHandler(e: any): void;
    _indexQueryHandler(e: any): void;
    _normalizeType(type: any): any;
    _requestChangeHandler(e: any): void;

    /**
     * Calles index function with debouncer.
     * The debouncer runs the queue after 25 ms. Bulk operations should be called
     * onece unless there's a lot of data to process.
     *
     * @param id Request ID
     * @param url Request URL
     * @param type Request type (saved or history)
     */
    _indexDebounce(id: String|null, url: String|null, type: String|null): void;

    /**
     * Handler for `request-object-deleted` custom event.
     * It expects `id` property to be set on event detail object.
     * Cancelable events are ignored.
     */
    _requestDeleteHandler(e: CustomEvent|null): void;

    /**
     * Calles deleteIndexedData function with debouncer.
     * The debouncer runs the queue after 25 ms. Bulk operations should be called
     * onece unless there's a lot of data to process.
     *
     * @param id Request ID
     */
    _deleteIndexDebounce(id: String|null): void;
    _deleteModelHandler(e: any): any;
    _deleteStores(store: any): any;

    /**
     * Opens search index data store.
     */
    openSearchStore(): Promise<any>|null;

    /**
     * Creates a database schema when is newly created.
     *
     * @param e Database create request event
     */
    createSchema(e: Event|null): void;

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
    index(requests: any[]|null): Promise<any>|null;
    _processIndexedRequests(requests: any, map: any): any;
    _notifyIndexFinished(): void;

    /**
     * Removes indexed data for given requests.
     *
     * @param ids List of request ids to remove.
     */
    deleteIndexedData(ids: Array<String|null>|null): Promise<any>|null;

    /**
     * Removes indexed data for given `type`.
     *
     * @param type `history` or `saved`
     */
    deleteIndexedType(type: String|null): Promise<any>|null;

    /**
     * Removes all indexed data.
     */
    clearIndexedData(): Promise<any>|null;

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
    _getIndexedDataAll(db: object|null, ids: Array<String|null>|null): Promise<object|null>;

    /**
     * Prepares a list of objects to put into the indexeddb to index the request.
     *
     * @param request Request object with `id` and `url` properties
     * @param indexed List of already indexed properties
     * @returns A list of objects to store
     */
    _prepareRequestIndexData(request: object|null, indexed: Array<object|null>|null): Array<object|null>|null;

    /**
     * Generates ID for URL index object
     *
     * @param url URL to search for. It should be lower case
     * @param type Request type
     */
    _generateId(url: String|null, type: String|null): String|null;

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
    _createIndexIfMissing(url: String|null, id: String|null, type: String|null, indexed: Array<object|null>|null): object|null|undefined;

    /**
     * Creates an index object for the whole url, if it doesn't exists in already
     * indexed data.
     *
     * @param request The request object to index
     * @param indexed Already indexed data.
     * @returns Object to store or `undefined` if the object
     * already exists.
     */
    _getUrlObject(request: object|null, indexed: Array<object|null>|null): object|null|undefined;

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
    _getAuthorityPath(parser: URL|null, id: String|null, type: String|null, indexed: Array<object|null>|null): object|null|undefined;

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
    _getPathQuery(parser: URL|null, id: String|null, type: String|null, indexed: Array<object|null>|null): object|null|undefined;

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
    _getQueryString(parser: URL|null, id: String|null, type: String|null, indexed: Array<object|null>|null): object|null|undefined;

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
    _appendQueryParams(parser: URL|null, id: String|null, type: String|null, indexed: Array<object|null>|null, target: Array<object|null>|null): void;

    /**
     * Stores indexes in the data store.
     *
     * @param indexes List of indexes to store.
     * @returns window
     */
    _storeIndexes(db: object|null, indexes: Array<object|null>|null): Promise<any>|null;

    /**
     * Removes indexed items that are no longer relevant for the request.
     *
     * @param items List of datastore index items.
     */
    _removeRedundantIndexes(db: object|null, items: Array<object|null>|null): Promise<any>|null;

    /**
     * Queries for indexed data.
     *
     * @param query The query
     * @param opts Search options:
     * - type (string: saved || history): Request type
     * - detailed (Booelan): If set it uses slower algorithm but performs full
     * search on the index. When false it only uses filer like query + '*'.
     */
    query(query: String|null, opts: object|null): Promise<any>|null;

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
    _searchIndexOf(db: object|null, q: String|null, type: String|null): Promise<any>|null;

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
    _searchCasing(db: object|null, q: String|null, type: String|null): Promise<any>|null;

    /**
     * https://www.codeproject.com/Articles/744986/How-to-do-some-magic-with-indexedDB
     * Distributed under Apache 2 license
     *
     * @param key [description]
     * @param lowerKey [description]
     * @param upperNeedle [description]
     * @param lowerNeedle [description]
     */
    _nextCasing(key: String|null, lowerKey: String|null, upperNeedle: String|null, lowerNeedle: String|null): String|null|undefined;
    reindex(type: any): any;
    reindexSaved(): any;
    reindexHistory(): any;
    _renindex(type: any): any;
  }
}

declare global {

  interface HTMLElementTagNameMap {
    "url-indexer": LogicElements.UrlIndexer;
  }
}

export {};
