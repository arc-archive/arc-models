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
import { ArcBaseModel } from './ArcBaseModel.js';
import { ArcModelEventTypes } from './events/ArcModelEventTypes.js';
import { ArcModelEvents } from './events/ArcModelEvents.js';

/** @typedef {import('@advanced-rest-client/arc-types').AuthData.ARCAuthData} ARCAuthData */
/** @typedef {import('./events/AuthDataEvents').ARCAuthDataUpdateEvent} ARCAuthDataUpdateEvent */
/** @typedef {import('./events/AuthDataEvents').ARCAuthDataQueryEvent} ARCAuthDataQueryEvent */
/** @typedef {import('./types').ARCEntityChangeRecord} ARCEntityChangeRecord */

/**
 * Removes query parameters and the fragment part from the URL
 * @param {String} url URL to process
 * @return {String} Canonical URL.
 */
export function normalizeUrl(url) {
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
 * @param {String=} url The URL of the request
 * @return {String} Datastore key for auth data
 */
export function computeKey(method, url) {
  let path = `${method}/`;
  if (url) {
    path += encodeURIComponent(url);
  }
  return path;
}

export const queryHandler = Symbol('queryHandler');
export const updateHandler = Symbol('updateHandler');

/**
 * Model for authorization data stored in the application.
 */
export class AuthDataModel extends ArcBaseModel {
  constructor() {
    super('auth-data');
    this[queryHandler] = this[queryHandler].bind(this);
    this[updateHandler] = this[updateHandler].bind(this);
  }

  /**
   * @param {EventTarget} node
   */
  _attachListeners(node) {
    super._attachListeners(node);
    node.addEventListener(ArcModelEventTypes.AuthData.query, this[queryHandler]);
    node.addEventListener(ArcModelEventTypes.AuthData.update, this[updateHandler]);
  }

  /**
   * @param {EventTarget} node
   */
  _detachListeners(node) {
    super._detachListeners(node);
    node.removeEventListener(ArcModelEventTypes.AuthData.query, this[queryHandler]);
    node.removeEventListener(ArcModelEventTypes.AuthData.update, this[updateHandler]);
  }

  /**
   * @param {ARCAuthDataQueryEvent} e
   */
  [queryHandler](e) {
    if (this._eventCancelled(e)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const { url, method } = e;
    e.detail.result = this.query(url, method);
  }

  /**
   * Queries for a datastore entry. Similar to `read()` but without using `id`
   * but rather the URL.
   *
   * @param {string} url The URL of the request
   * @param {string} authMethod The Authorization method to restore data for.
   * @return {Promise<ARCAuthData|undefined>}
   */
  async query(url, authMethod) {
    const parsedUrl = normalizeUrl(url);
    const key = computeKey(authMethod, parsedUrl);
    try {
      return await this.db.get(key);
    } catch (cause) {
      /* istanbul ignore else */
      if (cause && cause.status === 404) {
        return undefined;
      }
      throw cause;
    }
  }

  /**
   * @param {ARCAuthDataUpdateEvent} e
   */
  [updateHandler](e) {
    if (this._eventCancelled(e)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const { url, method, authData } = e;

    e.detail.result = this.update(url, method, authData);
  }

  /**
   * Creates or updates the auth data in the data store for given method and URl.
   *
   * @param {string} url The URL of the request
   * @param {string} authMethod The Authorization method to restore data for.
   * @param {object} authData The authorization data to store. Schema depends on
   * the `authMethod` property. From model standpoint schema does not matter.
   * @return {Promise<ARCEntityChangeRecord>}
   */
  async update(url, authMethod, authData) {
    const parsedUrl = normalizeUrl(url);
    const key = computeKey(authMethod, parsedUrl);
    const { db } = this;
    let stored;
    try {
      stored = await db.get(key);
    } catch (error) {
      /* istanbul ignore else */
      if (error.status === 404) {
        stored = { _id: key };
      } else {
        this._handleException(error);
      }
    }
    const doc = { ...stored, ...authData };
    const result = await db.put(doc);
    const oldRev = doc._rev;
    doc._rev = result.rev;
    const record = {
      id: key,
      rev: result.rev,
      item: doc,
      oldRev,
    };
    ArcModelEvents.AuthData.State.update(this, record);
    return record;
  }
}
