/**
@license
Copyright 2018 The Advanced REST client authors <arc@mulesoft.com>
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

import 'pouchdb/dist/pouchdb.js';
import { ArcModelEventTypes } from './events/ArcModelEventTypes.js';
import { ArcModelEvents } from './events/ArcModelEvents.js';

/* eslint-disable class-methods-use-this */

/** @typedef {import('./types').ARCModelListResult} ARCModelListResult */
/** @typedef {import('./types').ARCModelListOptions} ARCModelListOptions */
/** @typedef {import('./events/BaseEvents').ARCModelDeleteEvent} ARCModelDeleteEvent */

export const deletemodelHandler = Symbol('deletemodelHandler');
export const notifyDestroyed = Symbol('notifyDestroyed');

/**
 * A base class for all models.
 */
export class ArcBaseModel extends HTMLElement {
  /**
   * @param {string=} dbname Name of the data store
   * @param {number=} revsLimit Limit number of revisions on the data store.
   */
  constructor(dbname, revsLimit) {
    super();
    this.name = dbname;
    this.revsLimit = revsLimit;
    this[deletemodelHandler] = this[deletemodelHandler].bind(this);
  }

  /**
   * Note, the element does not include PouchDB to the document!
   * @return {PouchDB.Database} A PouchDB instance.
   */
  get db() {
    if (!this.name) {
      throw new Error('Model name not set');
    }
    /* global PouchDB */
    const opts = {};
    if (this.revsLimit) {
      opts.revs_limit = this.revsLimit;
    }
    return new PouchDB(this.name, opts);
  }

  set eventsTarget(value) {
    this._eventsTargetChanged(value);
  }

  get eventsTarget() {
    return this._oldEventsTarget || window;
  }

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
  get defaultQueryOptions() {
    return {
      limit: 25,
      descending: true,
      include_docs: true,
    };
  }

  connectedCallback() {
    if (!this._oldEventsTarget) {
      this._eventsTargetChanged(this.eventsTarget);
    }
  }

  disconnectedCallback() {
    this._detachListeners(this.eventsTarget);
  }

  /**
   * @param {EventTarget} node
   */
  _attachListeners(node) {
    node.addEventListener(ArcModelEventTypes.destroy, this[deletemodelHandler]);
  }

  /**
   * @param {EventTarget} node
   */
  _detachListeners(node) {
    node.removeEventListener(ArcModelEventTypes.destroy, this[deletemodelHandler]);
  }

  /**
   * Removes old handlers (if any) and attaches listeners on new event
   * event target.
   *
   * @param {EventTarget} eventsTarget Event target to set handlers on. If not set it
   * will set handlers on the `window` object.
   */
  _eventsTargetChanged(eventsTarget) {
    if (this._oldEventsTarget) {
      this._detachListeners(this._oldEventsTarget);
    }
    this._oldEventsTarget = eventsTarget || window;
    this._attachListeners(this._oldEventsTarget);
  }

  /**
   * Reads an entry from the datastore.
   *
   * @template T
   * @param {string} id The ID of the datastore entry.
   * @param {string=} rev Specific revision to read. Defaults to latest revision.
   * @return {Promise<T>} Promise resolved to a datastore object.
   */
  async read(id, rev) {
    if (!id) {
      throw new Error('Missing identifier argument.');
    }
    const opts = {};
    if (rev) {
      opts.rev = rev;
    }
    return this.db.get(id, opts);
  }

  /**
   * Handles any exception in the model in a unified way.
   * @param {Error|object} e An error object
   * @param {boolean=} noThrow If set the function will not throw error.
   * This allow to do the logic without stopping program.
   */
  _handleException(e, noThrow) {
    let message;
    if (e instanceof Error) {
      message = e.message;
    } else {
      message = JSON.stringify(e);
    }
    this.dispatchEvent(
      new CustomEvent('send-analytics', {
        bubbles: true,
        composed: true,
        detail: {
          type: 'exception',
          description: message,
          fatal: true,
        },
      })
    );
    if (!noThrow) {
      throw e;
    }
  }

  /**
   * Deletes current datastore.
   * Note that `name` property must be set before calling this function.
   * @return {Promise<void>}
   */
  async deleteModel() {
    await this.db.destroy();
    this[notifyDestroyed](this.name);
  }

  /**
   * Notifies the application that the model has been removed and data sestroyed.
   *
   * @param {string} store The name of the deleted store
   */
  [notifyDestroyed](store) {
    ArcModelEvents.destroyed(this, store);
  }

  /**
   * Handler for `destroy-model` custom event.
   * Deletes current data when scheduled for deletion.
   * @param {ARCModelDeleteEvent} e
   */
  [deletemodelHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    const { stores, detail } = e;
    if (!stores || !stores.length || !this.name) {
      return;
    }
    /* istanbul ignore else */
    if (!Array.isArray(detail.result)) {
      detail.result = [];
    }
    if (stores.indexOf(this.name) !== -1) {
      e.detail.result.push(this.deleteModel());
    }
  }

  /**
   * Checks if event can be processed giving it's cancelation status or if
   * it was dispatched by current element.
   * @param {Event|CustomEvent} e  Event to test
   * @return {boolean} True if event is already cancelled or dispatched by self.
   */
  _eventCancelled(e) {
    if (e.defaultPrevented) {
      return true;
    }
    if (!e.cancelable) {
      return true;
    }
    if (e.composedPath()[0] === this) {
      return true;
    }
    return false;
  }

  /**
   * Decodes passed page token back to the passed parameters object.
   * @param {string} token The page token value.
   * @return {object|null} Restored page query parameters or null if error
   */
  decodePageToken(token) {
    if (!token) {
      return null;
    }
    try {
      const decoded = atob(token);
      return JSON.parse(decoded);
    } catch (e) {
      return null;
    }
  }

  /**
   * Encodes page parameters into a page token.
   * @param {object} params Parameters to encode
   * @return {string} Page token
   */
  encodePageToken(params) {
    const str = JSON.stringify(params);
    return btoa(str);
  }

  /**
   * Lists all project objects.
   *
   * @param {PouchDB.Database} db Reference to a database
   * @param {ARCModelListOptions=} opts Query options.
   * @return {Promise<ARCModelListResult>} A promise resolved to a list of entities.
   */
  async listEntities(db, opts={}) {
    const { limit, nextPageToken } = opts;
    let queryOptions = this.defaultQueryOptions;
    if (limit) {
      queryOptions.limit = limit;
    }
    if (nextPageToken) {
      const pageOptions = this.decodePageToken(nextPageToken);
      if (pageOptions) {
        queryOptions = { ...queryOptions, ...pageOptions };
      }
    }
    let items = [];
    let token;
    const response = await db.allDocs(queryOptions);
    if (response && response.rows.length > 0) {
      const params = {
        startkey: response.rows[response.rows.length - 1].key,
        skip: 1,
      }
      token = this.encodePageToken(params);
      items = response.rows.map((item) => item.doc);
    }
    return {
      items,
      nextPageToken: token,
    }
  }
}
