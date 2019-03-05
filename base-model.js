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
import { PolymerElement } from '../../@polymer/polymer/polymer-element.js';

import '../../uuid-generator/uuid-generator.js';
import { EventsTargetBehavior } from '../../events-target-behavior/events-target-behavior.js';
/**
 * A base class for all models.
 *
 * @appliesMixin ArcBehaviors.EventsTargetBehavior
 */
class ArcBaseModel extends EventsTargetBehavior(PolymerElement) {
  /**
   * @param {String} dbname Name of the data store
   * @param {Number} revsLimit Limit number of revisions on the data store.
   */
  constructor(dbname, revsLimit) {
    super();
    this.name = dbname;
    this.revsLimit = revsLimit;
    this._deleteModelHandler = this._deleteModelHandler.bind(this);
  }

  /**
   * Note, the element does not include PouchDB to the document!
   * @return {PouchDB} A PouchDB instance.
   */
  get db() {
    if (!this.name) {
      throw new Error('Model name not set');
    }
    if (typeof PouchDB === 'undefined') {
      throw new Error('Include PouchDB into the document first');
    }
    /* global PouchDB */
    const opts = {};
    if (this.revsLimit) {
      // jscs:disable
      opts.revs_limit = this.revsLimit;
      // jscs:enable
    }
    return new PouchDB(this.name, opts);
  }
  /**
   * Useful to generate uuid string.
   * Use it as `this.uuid.generate()`.
   *
   * @return {Element} Reference to `uuid-generator` element.
   */
  get uuid() {
    if (this._uuid) {
      return this._uuid;
    }
    this._uuid = document.createElement('uuid-generator');
    return this._uuid;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._uuid) {
      delete this._uuid;
    }
  }

  _attachListeners(node) {
    node.addEventListener('destroy-model', this._deleteModelHandler);
  }

  _detachListeners(node) {
    node.removeEventListener('destroy-model', this._deleteModelHandler);
  }

  /**
   * Reads an entry from the datastore.
   *
   * @param {String} id The ID of the datastore entry.
   * @param {?String} rev Specific revision to read. Defaults to latest revision.
   * @return {Promise} Promise resolved to a datastore object.
   */
  read(id, rev) {
    const opts = {};
    if (rev) {
      opts.rev = rev;
    }
    return this.db.get(id, opts);
  }
  /**
   * Computes past mindnight for given timestamp.
   *
   * @param {Number} time Timestamp
   * @return {Number} Time reduced to midnight.
   */
  _computeMidnight(time) {
    if (!time || isNaN(time)) {
      time = Date.now();
    } else {
      time = Number(time);
    }
    const day = new Date(time);
    day.setHours(0, 0, 0, 0);
    return day.getTime();
  }
  /**
   * Dispatches non-cancelable change event.
   *
   * @param {String} type Event type
   * @param {Object} detail A detail object to dispatch.
   * @return {CustomEvent} Created and dispatched event.
   */
  _fireUpdated(type, detail) {
    const e = new CustomEvent(type, {
      cancelable: false,
      composed: true,
      bubbles: true,
      detail: detail
    });
    this.dispatchEvent(e);
    return e;
  }
  /**
   * Handles any exception in the model in a unified way.
   * @param {Error|Object} e An error object
   * @param {?Boolean} noThrow If set the function will not throw error.
   * This allow to do the logic without stopping program.
   */
  _handleException(e, noThrow) {
    let message;
    if (e instanceof Error) {
      message = e.message;
    } else {
      message = JSON.stringify(e);
    }
    this.dispatchEvent(new CustomEvent('send-analytics', {
      bubbles: true,
      composed: true,
      detail: {
        type: 'exception',
        description: message,
        fatal: true
      }
    }));
    console.warn(this.constructor.name, e);
    if (!noThrow) {
      throw e;
    }
  }
  /**
   * Deletes current datastore.
   * Note that `name` property must be set before calling this function.
   * @return {Promise}
   */
  deleteModel() {
    try {
      return this.db.destroy()
      .then(() => this._notifyModelDestroyed(this.name));
    } catch (e) {
      return Promise.reject(e);
    }
  }
  /**
   * Notifies the application that the model has been removed and data sestroyed.
   * @param {String} type Database name.
   * @return {CustomEvent} Dispatched event
   */
  _notifyModelDestroyed(type) {
    const e = new CustomEvent('datastore-destroyed', {
      bubbles: true,
      composed: true,
      detail: {
        datastore: type
      }
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
    const models = e.detail.models;
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
   * @return {Boolean} True if event is already cancelled or dispatched by self.
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
   * Helper method to cancel the event and stop it's propagation.
   * @param {Event|CustomEvent} e Event to cancel
   */
  _cancelEvent(e) {
    e.preventDefault();
    e.stopPropagation();
  }
}
