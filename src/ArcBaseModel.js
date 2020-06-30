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
// import { v4 } from '@advanced-rest-client/uuid-generator';
import 'pouchdb/dist/pouchdb.js';

/**
 * A base class for all models.
 *
 * @appliesMixin EventsTargetMixin
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
    this._deleteModelHandler = this._deleteModelHandler.bind(this);
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
    node.addEventListener('destroy-model', this._deleteModelHandler);
  }

  /**
   * @param {EventTarget} node
   */
  _detachListeners(node) {
    node.removeEventListener('destroy-model', this._deleteModelHandler);
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
   * Dispatches non-cancelable change event.
   *
   * @param {string} type Event type
   * @param {object} detail A detail object to dispatch.
   * @return {CustomEvent} Created and dispatched event.
   */
  _fireUpdated(type, detail) {
    const e = new CustomEvent(type, {
      cancelable: false,
      composed: true,
      bubbles: true,
      detail,
    });
    this.dispatchEvent(e);
    return e;
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
    this._notifyModelDestroyed(this.name);
  }

  /**
   * Notifies the application that the model has been removed and data sestroyed.
   * @param {string} type Database name.
   * @return {CustomEvent} Dispatched event
   */
  _notifyModelDestroyed(type) {
    const e = new CustomEvent('datastore-destroyed', {
      bubbles: true,
      composed: true,
      detail: {
        datastore: type,
      },
    });
    this.dispatchEvent(e);
    return e;
  }

  /**
   * Handler for `destroy-model` custom event.
   * Deletes current data when scheduled for deletion.
   * @param {CustomEvent} e
   */
  _deleteModelHandler(e) {
    const { models } = e.detail;
    if (!models || !models.length || !this.name) {
      return;
    }
    if (models.indexOf(this.name) !== -1) {
      if (!e.detail.result) {
        e.detail.result = [];
      }
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
}
