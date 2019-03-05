/**
@license
Copyright 2016 The Advanced REST client authors <arc@mulesoft.com>
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
*/
import {ArcBaseModel} from './base-model.js';

/**
 * Database query options for pagination.
 * Override this value to change the query options like limit of the results in one call.
 *
 * This is query options passed to the PouchDB `allDocs` function. Note that it will not
 * set `include_docs` option. A conviniet shortcut is to set the the `includeDocs` property
 * and the directive will be added automatically.
 *
 * @type {Object}
 */
const defaultQueryOptions = {
  limit: 100,
  descending: true,
  include_docs: true
};

/**
 * Events based access to REST APIs datastore.
 *
 * @polymer
 * @customElement
 * @memberof LogicElements
 */
export class RestApiModel extends ArcBaseModel {
  constructor() {
    super();
    this._readHandler = this._readHandler.bind(this);
    this._readIndexHandler = this._readIndexHandler.bind(this);
    this._indexChangeHandler = this._indexChangeHandler.bind(this);
    this._indexListHandler = this._indexListHandler.bind(this);
    this._dataUpdateHandler = this._dataUpdateHandler.bind(this);
    this._deletedHandler = this._deletedHandler.bind(this);
    this._indexesUpdatedHandler = this._indexesUpdatedHandler.bind(this);
    this._versionDeletedHandler = this._versionDeletedHandler.bind(this);

    this._cachedQueryOptions = {};
  }

  _attachListeners(node) {
    node.addEventListener('api-index-read', this._readIndexHandler);
    node.addEventListener('api-index-changed', this._indexChangeHandler);
    node.addEventListener('api-index-list', this._indexListHandler);
    node.addEventListener('api-index-changed-batch', this._indexesUpdatedHandler);
    node.addEventListener('api-data-changed', this._dataUpdateHandler);
    node.addEventListener('api-deleted', this._deletedHandler);
    node.addEventListener('api-version-deleted', this._versionDeletedHandler);
    node.addEventListener('api-data-read', this._readHandler);
  }

  _detachListeners(node) {
    node.removeEventListener('api-index-read', this._readIndexHandler);
    node.removeEventListener('api-index-changed', this._indexChangeHandler);
    node.removeEventListener('api-data-changed', this._dataUpdateHandler);
    node.removeEventListener('api-index-changed-batch', this._indexesUpdatedHandler);
    node.removeEventListener('api-index-list', this._indexListHandler);
    node.removeEventListener('api-deleted', this._deletedHandler);
    node.removeEventListener('api-version-deleted', this._versionDeletedHandler);
    node.removeEventListener('api-data-read', this._readHandler);
  }
  /**
   * A handler to the datastore. Contains listing data.
   */
  get indexDb() {
    /* global PouchDB */
    return new PouchDB('api-index');
  }
  /**
   * A handler to the datastore containing REST API data
   * (AMF model).
   */
  get dataDb() {
    return new PouchDB('api-data');
  }

  /**
   * Reads an entry from the index datastore.
   *
   * @param {String} id The ID of the datastore entry.
   * @param {?String} rev Specific revision to read. Defaults to latest revision.
   * @return {Promise} Promise resolved to a project object.
   */
  readIndex(id, rev) {
    const opts = {};
    if (rev) {
      opts.rev = rev;
    }
    return this.indexDb.get(id, opts);
  }
  /**
   * Reads an entry from the raml data datastore.
   *
   * @param {String} id The ID of the datastore entry.
   * @param {?String} rev Specific revision to read. Defaults to latest revision.
   * @return {Promise} Promise resolved to a project object.
   */
  readData(id, rev) {
    const opts = {};
    if (rev) {
      opts.rev = rev;
    }
    return this.dataDb.get(id, opts);
  }
  /**
   * Creates / updates API data object.
   *
   * @param {String} indexId Id of the index object
   * @param {String} version Version of the API data
   * @param {Object} data AMF model to store
   * @return {Promise} Resolved promise to a document with updated `_rev`
   */
  updateData(indexId, version, data) {
    const id = indexId + '|' + version;
    let object;
    return this.readData(id)
    .catch((reason) => {
      if (reason.status === 404) {
        return {
          indexId,
          version,
          _id: id
        };
      }
      this._handleException(reason);
    })
    .then((result) => {
      result.data = data;
      object = result;
      return this.dataDb.put(result);
    })
    .then((result) => {
      if (!result.ok) {
        this._handleException(result);
        return;
      }
      object._rev = result.rev;
      return object;
    });
  }
  /**
   * Creates / updates API index object.
   * The `_id` property must be already set on the object.
   *
   * This function fires `api-index-changed` custom event on success.
   *
   * @param {Object} doc PouchDB document.
   * @return {Promise} Resolved promise to a document with updated `_rev`
   */
  updateIndex(doc) {
    return this.indexDb.put(doc)
    .then((result) => {
      if (!result.ok) {
        this._handleException(result);
        return;
      }
      const detail = {
        oldRev: doc._rev,
        apiInfo: doc
      };
      detail.apiInfo._rev = result.rev;
      this._fireUpdated('api-index-changed', detail);
      return detail.apiInfo;
    });
  }
  /**
   * Updates many index objects in one request.
   *
   * @param {Array<Object>} docs List of PouchDB documents to update.
   * @return {Promise} Resolved promise to a list of document with updated `_rev`
   */
  updateIndexBatch(docs) {
    const copy = [];
    docs.forEach((item) => {
      copy.push(Object.assign({}, item));
    });
    return this.indexDb.bulkDocs(copy)
    .then((result) => {
      const toReturn = [];
      result.forEach((res, i) => {
        if (res.ok) {
          const detail = {
            oldRev: docs[i]._rev,
            apiInfo: docs[i]
          };
          detail.apiInfo._rev = result[i].rev;
          this._fireUpdated('api-index-changed', detail);
          toReturn.push(detail.apiInfo);
        } else {
          console.warn('Update error', result[i]);
          toReturn.push(docs[i]);
        }
      });
      return toReturn;
    });
  }
  /**
   * Removes all AMF and index data from datastores for given index id.
   *
   * @param {String} id Index entry ID to delete.
   * @return {Promise} Promise resolved to a new `_rev` property of deleted object.
   */
  remove(id) {
    return this.readIndex(id)
    .then((doc) => {
      doc._deleted = true;
      return this.removeVersions(id, doc.versions)
      .then(() => this.indexDb.put(doc));
    })
    .then((result) => {
      if (!result.ok) {
        throw result;
      }
      const detail = {
        id
      };
      this._fireUpdated('api-deleted', detail);
    });
  }
  /**
   * Removes information about version from AMD data datastore and from index
   * data.
   * @param {String} id Index object ID
   * @param {String} version Version to remove.
   * @return {Promise}
   */
  removeVersion(id, version) {
    return this.readIndex(id)
    .then((doc) => {
      const vs = doc.versions;
      if (!(vs instanceof Array)) {
        return;
      }
      const index = vs.indexOf(version);
      if (index === -1) {
        return;
      }
      vs.splice(index, 1);
      if (vs.length === 0) {
        return this.remove(id)
        .then(() => undefined);
      }
      doc.versions = vs;
      if (doc.latest === version) {
        doc.latest = vs[vs.length - 1];
      }
      return this.updateIndex(doc)
      .then(() => this._removeVersion(id + '|' + version));
    });
  }
  /**
   * Removes versions of API data in bulk operation.
   * @param {String} indexId Index object ID
   * @param {Array<String>} versions List of versions to remove.
   * @return {Promise}
   */
  removeVersions(indexId, versions) {
    if (!indexId || !(versions instanceof Array)) {
      return Promise.resolve();
    }
    const ids = versions.map((v) => indexId + '|' + v);
    return this._removeVersions(ids);
  }

  _removeVersions(ids) {
    const id = ids.shift();
    if (!id) {
      return Promise.resolve();
    }
    return this._removeVersion(id)
    .then(() => this._removeVersions(ids));
  }

  _removeVersion(id) {
    return this.readData(id)
    .catch((cause) => {
      if (cause.status === 404) {
        return;
      }
      this._handleException(cause);
    })
    .then((doc) => {
      if (!doc) {
        return;
      }
      doc._deleted = true;
      return this.dataDb.put(doc);
    })
    .then(() => {
      const parts = id.split('|');
      const detail = {
        id: parts[0],
        version: parts[1]
      };
      this._fireUpdated('api-version-deleted', detail);
    });
  }
  /**
   * Lists index data.
   *
   * ### QueryResultObject
   * - `data` {Array<Object>} List of PouchDB documents read from the datastore
   * - `nextPageToken` {String} Pagination string to be used with next call
   * to get resutls for a next page. The nextPageToken don't change over
   * subsequent requests.
   *
   * @param {Object} opts Query options:
   * - nextPageToken {String} Received from previous query page token.
   * @return {Promise} A promise resolved to a query result object on success.
   */
  listIndex(opts) {
    opts = opts || {};
    let queryOptions;
    if (opts.nextPageToken) {
      queryOptions = this._cachedQueryOptions[opts.nextPageToken];
    }
    if (!queryOptions) {
      queryOptions = Object.assign({}, defaultQueryOptions);
    }
    return this.indexDb.allDocs(queryOptions)
    .then((response) => {
      let data = [];
      if (response && response.rows.length > 0) {
        queryOptions.startkey = response.rows[response.rows.length - 1].key;
        queryOptions.skip = 1;
        data = response.rows.map((item) => item.doc);
      }
      opts.nextPageToken = opts.nextPageToken || this._makeNextPageToken();
      this._cachedQueryOptions[opts.nextPageToken] = queryOptions;
      return {
        nextPageToken: opts.nextPageToken,
        items: data
      };
    });
  }
  /**
   * Generates `nextPageToken` as a random string.
   *
   * @return {String} Random 32 characters long string.
   */
  _makeNextPageToken() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
  /**
   * A handler for `api-index-changed` custom event.
   *
   * @param {CustomEvent} e
   */
  _indexChangeHandler(e) {
    if (e.defaultPrevented || !e.cancelable) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    if (!e.detail || !e.detail.apiInfo) {
      e.detail.result = Promise.reject(new Error('The "apiInfo" property is missing.'));
      return;
    }
    e.detail.result = this.updateIndex(e.detail.apiInfo)
    .catch((e) => this._handleException(e));
  }
  /**
   * Handler for the `api-data-read` custom event.
   *
   * Event `detail` object must contain the `id` property with datastore entry
   * id and may contain a `rev` property to read a specific revision.
   *
   * It sets a `result` property on the event `detail` object that is a
   * promise returned by `readData()` function.
   *
   * @param {CustomEvent} e
   */
  _readHandler(e) {
    if (e.defaultPrevented || !e.cancelable) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    if (!e.detail.id) {
      e.detail.result = Promise.reject(new Error('The "id" property is missing.'));
      return;
    }
    e.detail.result = this.readData(e.detail.id, e.detail.rev)
    .catch((e) => this._handleException(e));
  }

  _readIndexHandler(e) {
    if (e.defaultPrevented || !e.cancelable) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    if (!e.detail.baseUri) {
      e.detail.result = Promise.reject(new Error('The "baseUri" property is missing.'));
      return;
    }
    e.detail.result = this.readIndex(e.detail.baseUri, e.detail.rev)
    .catch((e) => {
      if (e.status === 404) {
        return;
      }
      this._handleException(e);
    });
  }
  /**
   * Handler for the `api-data-changed` custom event.
   *
   * @param {CustomEvent} e
   */
  _dataUpdateHandler(e) {
    if (!e.cancelable || e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const {data, indexId, version} = e.detail;
    if (!indexId) {
      e.detail.result = Promise.reject(new Error('The "indexId" property is missing.'));
      return;
    }
    if (!version) {
      e.detail.result = Promise.reject(new Error('The "version" property is missing.'));
      return;
    }
    if (!data) {
      e.detail.result = Promise.reject(new Error('The "data" property is missing.'));
      return;
    }
    e.detail.result = this.updateData(indexId, version, data)
    .catch((e) => this._handleException(e));
  }
  /**
   * Deletes the object from the datastores.
   * It is only handled if the event in cancelable and not cancelled.
   *
   * Event has to have `id` property set on the detail object.
   *
   * It sets `result` property on the event detail object with a result of
   * calling `remove()` function.
   *
   * @param {CustomEvent} e
   */
  _deletedHandler(e) {
    if (!e.cancelable || e.composedPath()[0] === this || e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    if (!e.detail.id) {
      e.detail.result = Promise.reject(new Error('The "id" property is missing.'));
      return;
    }
    e.detail.result = this.remove(e.detail.id)
    .catch((e) => this._handleException(e));
  }

  _versionDeletedHandler(e) {
    if (!e.cancelable || e.composedPath()[0] === this || e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const {id, version} = e.detail;
    if (!id) {
      e.detail.result = Promise.reject(new Error('The "id" property is missing.'));
      return;
    }
    if (!version) {
      e.detail.result = Promise.reject(new Error('The "version" property is missing.'));
      return;
    }
    e.detail.result = this.removeVersion(id, version)
    .catch((e) => this._handleException(e));
  }
  /**
   * Handler for the `api-index-changed-batch` custom event.
   * It requires to have `items` property set to event detail as an array of
   * PouchDB documents to update.
   *
   * It sets `result` property on the event detail object with a result of
   * calling `updateIndexBatch()` function.
   *
   * @param {CustomEvent} e
   */
  _indexesUpdatedHandler(e) {
    if (!e.cancelable || e.composedPath()[0] === this || e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const {items} = e.detail;
    if (!items) {
      e.detail.result = Promise.reject(new Error('The "items" property is missing.'));
      return;
    }
    if (!(items instanceof Array)) {
      e.detail.result = Promise.reject(
        new Error('The "items" property is not an array.'));
      return;
    }
    e.detail.result = this.updateIndexBatch(e.detail.items)
    .catch((e) => this._handleException(e));
  }
  /**
   * Handler for the `api-index-list` custom event.
   *
   * @param {CustomEvent} e
   */
  _indexListHandler(e) {
    if (!e.cancelable || e.composedPath()[0] === this || e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    e.detail.result = this.listIndex(e.detail)
    .catch((e) => this._handleException(e));
  }
  /**
   * Fired when index data has been updated.
   * The event is non cancelable which means that the change is commited to the
   * datastore.
   *
   * It sets a `result` property on event `detail` object which contains a return
   * value from calling `updateIndex()` function.
   *
   * @event api-index-changed
   * @param {Object} doc PouchDB document representing index data.
   */

  /**
   * Fired when RAML (API) data has been updated.
   * The event is non cancelable which means that the change is commited to the
   * datastore.
   *
   * It sets a `result` property on event `detail` object which contains a return
   * value from calling `updateData()` function.
   *
   * @event api-data-changed
   * @param {Object} doc PouchDB document representing API data.
   */

  /**
   * Fired when data has been deleted.
   * The event is non cancelable which means that the change is commited to the
   * datastore.
   *
   * It sets a `result` property on event `detail` object which contains a return
   * value from calling `remove()` function.
   *
   * @event api-deleted
   * @param {String} id Datastore ID of deleted item.
   */
}

window.customElements.define('rest-api-model', RestApiModel);
