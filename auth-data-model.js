/**
@license
Copyright 2017 The Advanced REST client authors <arc@mulesoft.com>
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
 * Model for host rules.
 *
 * @polymer
 * @customElement
 * @memberof LogicElements
 */
export class AuthDataModel extends ArcBaseModel {
  constructor() {
    super('auth-data', 10);
    this._queryHandler = this._queryHandler.bind(this);
    this._updateHandler = this._updateHandler.bind(this);
  }

  _attachListeners(node) {
    super._attachListeners(node);
    node.addEventListener('auth-data-query', this._queryHandler);
    node.addEventListener('auth-data-changed', this._updateHandler);
  }

  _detachListeners(node) {
    super._detachListeners(node);
    node.removeEventListener('auth-data-query', this._queryHandler);
    node.removeEventListener('auth-data-changed', this._updateHandler);
  }

  _queryHandler(e) {
    if (this._eventCancelled(e)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    e.detail.result = this.query(e.detail.url, e.detail.authMethod)
    .catch((e) => this._handleException(e));
  }
  /**
   * Queries for a datastore entry. Similar to `read()` but without using `id`
   * but rather the URL.
   *
   * @param {String} url The URL of the request
   * @param {String} authMethod The Authorization method to restore data for.
   * @return {Promise}
   */
  query(url, authMethod) {
    const parsedUrl = this._normalizeUrl(url);
    const key = this._computeKey(authMethod, parsedUrl);
    return this.db.get(key)
    .catch((cause) => {
      if (cause && cause.status === 404) {
        return;
      }
      throw cause;
    });
  }

  _updateHandler(e) {
    if (this._eventCancelled(e)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    e.detail.result = this.update(e.detail.url, e.detail.authMethod, e.detail.authData)
    .catch((e) => this._handleException(e));
  }
  /**
   * Creates or updates the auth data in the data store for given method and URl.
   *
   * @param {String} url The URL of the request
   * @param {String} authMethod The Authorization method to restore data for.
   * @param {Object} authData The authorization data to store. Schema depends on
   * the `authMethod` property. From model standpoint schema does not matter.
   * @return {Promise}
   */
  update(url, authMethod, authData) {
    const parsedUrl = this._normalizeUrl(url);
    const key = this._computeKey(authMethod, parsedUrl);
    const db = this.db;
    let stored;
    return db.get(key)
    .catch((error) => {
      if (error && error.status === 404) {
        return {
          _id: key
        };
      } else {
        this._handleException(error);
      }
    })
    .then((doc) => {
      doc = Object.assign(doc, authData);
      stored = doc;
      return db.put(doc);
    })
    .then((result) => {
      const detail = stored;
      detail._rev = result.rev;
      this.dispatchEvent(new CustomEvent('auth-data-changed', {
        bubbles: true,
        composed: true,
        detail
      }));
      return detail;
    });
  }

  /**
   * Removes query parameters and the fragment part from the URL
   * @param {String} url URL to process
   * @return {String} Canonical URL.
   */
  _normalizeUrl(url) {
    if (!url) {
      return '';
    }
    try {
      const u = new URL(url);
      u.hash = '';
      u.search = '';
      let result = u.toString();
      // polyfill library leaves '?#'
      result = result.replace('?', '');
      result = result.replace('#', '');
      return result;
    } catch (e) {
      return url;
    }
  }
  /**
   * Computes the database key for auth data
   *
   * @param {String} method The Authorization method to restore data for.
   * @param {?String} url The URL of the request
   * @return {String} Datastore key for auth data
   */
  _computeKey(method, url) {
    let path = method + '/';
    if (url) {
      path += encodeURIComponent(url);
    }
    return path;
  }
}
window.customElements.define('auth-data-model', AuthDataModel);
