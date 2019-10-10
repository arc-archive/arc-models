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
import { ArcBaseModel } from './ArcBaseModel.js';
/* eslint-disable require-atomic-updates */
/**
 * Events based access to client-certificates data store.
 *
 * Note: **All events must be cancelable.** When the event is cancelled by an instance
 * of the element it won't be handled again by other instance that possibly exists
 * in the DOM.
 *
 * Cancellable event is a request to models for change. Non-cancellable event
 * is a notification for views to update their values.
 * For example `request-object-changed` event notifies model to update object in
 * the datastore if the event is cancelable and to update views if it's not
 * cancellable.
 *
 * Each handled event contains the `result` property on the `detail` object. It
 * contains a `Promise` object with a result of the operation. Also, for update / delete
 * events the same non-cancelable event is fired.
 *
 * Events handled by this element are cancelled and propagation of the event is
 * stopped.
 *
 * The certificates are located in the `client-certificates-data` store.
 * Content is not stored with the listing data for performance.
 *
 * `clientCertificate` struct
 * - `type` {String} - Certificate type. Either p12 or pem. Required.
 * - `cert` {Array<Certificate>} or {Cetrificate} - Certificate or list of certificates to use. Required.
 * - `key` {Array<Certificate>} or {Cetrificate} - Key for pem certificate. Optional.
 * - `name` {String} - Custom name of the certificate. Optional.
 * - `created` {Number} - Timestamp when the certificate was inserted into the data store.
 * Required when returning a result. Auto-generated when inserting.
 *
 * `Certificate` struct
 * - `data` {String} or {ArrayBuffer} or {Buffer} The certificate to use. Required.
 * The p12 type certificate must be a Buffer. The `get()` method always returns
 * original data type.
 * - `passphrase` {String} - A passphrase to use to unlock the certificate. Optional.
 *
 * @customElement
 * @memberof LogicElements
 */
export class ClientCertificateModel extends ArcBaseModel {
  constructor() {
    super('client-certificates', 1);
    this._listHandler = this._listHandler.bind(this);
    this._getHandler = this._getHandler.bind(this);
    this._deleteHandler = this._deleteHandler.bind(this);
    this._insertHandler = this._insertHandler.bind(this);
  }
  /**
   * @return {Object} A handler to the datastore containing the actual
   * certificates contents.
   */
  get dataDb() {
    /* global PouchDB */
    return new PouchDB('client-certificates-data', {
      revs_limit: 1
    });
  }

  _attachListeners(node) {
    super._attachListeners(node);
    node.addEventListener('client-certificate-list', this._listHandler);
    node.addEventListener('client-certificate-get', this._getHandler);
    node.addEventListener('client-certificate-delete', this._deleteHandler);
    node.addEventListener('client-certificate-insert', this._insertHandler);
  }

  _detachListeners(node) {
    super._detachListeners(node);
    node.removeEventListener('api-index-list', this._listHandler);
    node.removeEventListener('client-certificate-get', this._getHandler);
    node.removeEventListener('client-certificate-delete', this._deleteHandler);
    node.removeEventListener('client-certificate-insert', this._insertHandler);
  }
  /**
   * Lists certificates installed in the application.
   *
   * Note, pagination is not enabled for this store. By calling this function
   * it returns all certificates from the database.
   *
   * The list data only contain certificate's meta data. Certificate's content
   * and password is kept in different store.
   *
   * @return {Promise}
   */
  async list() {
    const response = await this.db.allDocs({
      include_docs: true
    });
    const result = response.rows.map((item) => {
      const { doc } = item;
      delete doc.dataKey;
      return doc;
    });
    return result;
  }
  /**
   * Reads clioent certificate full structure.
   * Returns certificate's meta data + cert + key.
   * @param {String} id Certificate's datastore id.
   * @return {Promise} Promise resolved to a certificate object.
   */
  async get(id) {
    if (!id) {
      throw new Error('The "id" argument is missing');
    }
    const doc = await this.db.get(id);
    const { dataKey } = doc;
    const data = await this.dataDb.get(dataKey);
    delete data._id;
    delete data._rev;
    delete doc.dataKey;
    doc.cert = this.certificateFromStore(data.cert);
    if (data.key) {
      doc.key = this.certificateFromStore(data.key);
    }
    return doc;
  }
  /**
   * Safely deletes certificate data from the data store.
   * It marks the certificate as deleted so DB apis won't use this data but
   * it is possible to restore the data in case of accidental delete.
   *
   * Note, this data always stays only on the user's machine so there's no
   * conflict with GDPR.
   *
   * @param {String} id Certificate's datastore id.
   * @return {Promise} Promise resolved when both entries are deleted.
   */
  async delete(id) {
    if (!id) {
      throw new Error('The "id" argument is missing');
    }
    const db = this.db;
    const doc = await db.get(id);
    doc._deleted = true;
    await db.put(doc);
    const { dataKey } = doc;
    const dataDb = this.dataDb;
    const data = await dataDb.get(dataKey);
    data._deleted = true;
    await dataDb.put(data);
    const detail = {
      id
    };
    this._fireUpdated('client-certificate-delete', detail);
  }
  /**
   * Inserts new client certificate object.
   * See class description for data structure.
   *
   * @param {Object} data Data to insert.
   * @return {Promise} Unlike other models, rromise resolved to inserted
   * id. Because this API operates on a single ID without reviews this won't
   * return the final object.
   */
  async insert(data) {
    data = Object.assign({}, data);
    if (!data.cert) {
      throw new Error('The "cert" property is required.');
    }
    if (!data.type) {
      throw new Error('The "type" property is required.');
    }
    const dataDoc = {
      cert: this.certificateToStore(data.cert)
    };
    delete data.cert;
    if (data.key) {
      dataDoc.key = this.certificateToStore(data.key);
      delete data.key;
    }
    const dataRes = await this.dataDb.post(dataDoc);
    data.dataKey = dataRes.id;
    if (!data.created) {
      data.created = Date.now();
    }
    const res = await this.db.post(data);
    return res.id;
  }
  /**
   * Prepares certificate object to be stored in the data store.
   * If the `data` property is not string then it assumes buffer (either
   * Node's or ArrayBuffer). In this case it converts buffer to base64 string.
   * It also adds `type` property set to `buffer` for the `certificateFromStore()`
   * function to recognize what to do with the data.
   *
   * Note, for optimization, PEM keys should be strings as the content of the
   * certificate is already a base62 string. To spare dounble base64 convertion
   * use string data.
   *
   * @param {Object} cert Certificate definition. See class description.
   * @return {Object}
   * @throws {Error} When data is not set
   */
  certificateToStore(cert) {
    if (!cert.data) {
      throw new Error('Certificate content not set.');
    }
    if (typeof cert.data !== 'string') {
      cert.type = 'buffer';
      cert.data = this.bufferToBase64(cert.data);
    }
    return cert;
  }
  /**
   * Restores certificate object to it's original values after reading it from
   * the data store.
   * @param {Object} cert Restored certificate definition.
   * @return {Object}
   */
  certificateFromStore(cert) {
    if (cert.type) {
      delete cert.type;
      cert.data = this.base64ToBuffer(cert.data);
    }
    return cert;
  }
  /**
   * Converts incomming data to base64 string.
   * @param {ArrayBuffer|Buffer} ab
   * @return {String} Safe to store string.
   */
  bufferToBase64(ab) {
    return btoa(String.fromCharCode(...ab));
  }
  /**
   * Converts base64 string to Uint8Array.
   * @param {String} str
   * @return {Uint8Array} Restored array view.
   */
  base64ToBuffer(str) {
    const asciiString = atob(str);
    return new Uint8Array([...asciiString].map((char) => char.charCodeAt(0)));
  }

  _listHandler(e) {
    if (e.defaultPrevented || !e.cancelable) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    e.detail.result = this.list();
  }

  _getHandler(e) {
    if (e.defaultPrevented || !e.cancelable) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const { id } = e.detail;
    e.detail.result = this.get(id);
  }

  _deleteHandler(e) {
    if (e.defaultPrevented || !e.cancelable) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const { id } = e.detail;
    e.detail.result = this.delete(id);
  }

  _insertHandler(e) {
    if (e.defaultPrevented || !e.cancelable) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const { value } = e.detail;
    e.detail.result = this.insert(value);
  }
  /**
   * Override's delete model function to include the "data" store.
   * @return {Promise}
   */
  async deleteModel() {
    await this.dataDb.destroy();
    await super.deleteModel();
  }
};
