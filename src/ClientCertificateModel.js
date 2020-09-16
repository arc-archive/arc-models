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
import { ArcModelEventTypes } from './events/ArcModelEventTypes.js';
import { ArcModelEvents } from './events/ArcModelEvents.js';

/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */

/** @typedef {import('./ClientCertificateModel').ARCClientCertificate} ARCClientCertificate */
/** @typedef {import('./ClientCertificateModel').ARCCertificateIndex} ARCCertificateIndex */
/** @typedef {import('./ClientCertificateModel').ARCCertificate} ARCCertificate */
/** @typedef {import('./events/CertificatesEvents').ARCClientCertificateInsertEvent} ARCClientCertificateInsertEvent */
/** @typedef {import('./events/CertificatesEvents').ARCClientCertificateReadEvent} ARCClientCertificateReadEvent */
/** @typedef {import('./events/CertificatesEvents').ARCClientCertificateDeleteEvent} ARCClientCertificateDeleteEvent */
/** @typedef {import('./events/CertificatesEvents').ARCClientCertificateListEvent} ARCClientCertificateListEvent */
/** @typedef {import('./types').ARCEntityChangeRecord} ARCEntityChangeRecord */
/** @typedef {import('./types').DeletedEntity} DeletedEntity */
/** @typedef {import('./types').ARCModelListResult} ARCModelListResult */
/** @typedef {import('./types').ARCModelListOptions} ARCModelListOptions */

export const listHandler = Symbol('listHandler');
export const insertHandler = Symbol('insertHandler');
export const deleteHandler = Symbol('deleteHandler');
export const readHandler = Symbol('readHandler');

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
 * `clientCertificate` structure
 * - `type` {String} - Certificate type. Either p12 or pem. Required.
 * - `cert` {Array<Certificate>} or {Certificate} - Certificate or list of certificates to use. Required.
 * - `key` {Array<Certificate>} or {Certificate} - Key for pem certificate. Optional.
 * - `name` {String} - Custom name of the certificate. Optional.
 * - `created` {Number} - Timestamp when the certificate was inserted into the data store.
 * Required when returning a result. Auto-generated when inserting.
 *
 * `Certificate` structure
 * - `data` {String} or {ArrayBuffer} or {Buffer} The certificate to use. Required.
 * The p12 type certificate must be a Buffer. The `get()` method always returns
 * original data type.
 * - `passphrase` {String} - A passphrase to use to unlock the certificate. Optional.
 */
export class ClientCertificateModel extends ArcBaseModel {
  constructor() {
    super('client-certificates');
    this[listHandler] = this[listHandler].bind(this);
    this[readHandler] = this[readHandler].bind(this);
    this[deleteHandler] = this[deleteHandler].bind(this);
    this[insertHandler] = this[insertHandler].bind(this);
  }

  /**
   * @return {PouchDB.Database} A handler to the datastore containing the actual
   * certificates contents.
   */
  get dataDb() {
    /* global PouchDB */
    return new PouchDB('client-certificates-data');
  }

  _attachListeners(node) {
    super._attachListeners(node);
    node.addEventListener(ArcModelEventTypes.ClientCertificate.list, this[listHandler]);
    node.addEventListener(ArcModelEventTypes.ClientCertificate.read, this[readHandler]);
    node.addEventListener(ArcModelEventTypes.ClientCertificate.delete, this[deleteHandler]);
    node.addEventListener(ArcModelEventTypes.ClientCertificate.insert, this[insertHandler]);
  }

  _detachListeners(node) {
    super._detachListeners(node);
    node.removeEventListener(ArcModelEventTypes.ClientCertificate.list, this[listHandler]);
    node.removeEventListener(ArcModelEventTypes.ClientCertificate.read, this[readHandler]);
    node.removeEventListener(ArcModelEventTypes.ClientCertificate.delete, this[deleteHandler]);
    node.removeEventListener(ArcModelEventTypes.ClientCertificate.insert, this[insertHandler]);
  }

  /**
   * Lists certificates installed in the application.
   *
   * @param {ARCModelListOptions=} opts Query options.
   * @return {Promise<ARCModelListResult>} A promise resolved to a list of projects.
   */
  async list(opts={}) {
    const result = await this.listEntities(this.db, opts);
    result.items.forEach((doc) => {
      delete doc.dataKey;
    });
    return result;
  }

  /**
   * Reads client certificate full structure.
   * Returns certificate's meta data + cert + key.
   * @param {String} id Certificate's datastore id.
   * @param {string=} rev Specific revision to read. Defaults to the latest revision.
   * @return {Promise<ARCClientCertificate>} Promise resolved to a certificate object.
   */
  async get(id, rev) {
    if (!id) {
      throw new Error('The "id" argument is missing');
    }
    const opts = {};
    if (rev) {
      opts.rev = rev;
    }
    const doc = await this.db.get(id, opts);
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
   * @param {string} id Certificate's datastore id.
   * @return {Promise<DeletedEntity>} Promise resolved when both entries are deleted.
   */
  async delete(id) {
    if (!id) {
      throw new Error('The "id" argument is missing');
    }
    const { db } = this;
    const doc = await db.get(id);
    doc._deleted = true;
    const updateRecord = await db.put(doc);
    const { dataKey } = doc;
    const { dataDb } = this;
    const data = await dataDb.get(dataKey);
    data._deleted = true;
    await dataDb.put(data);
    ArcModelEvents.ClientCertificate.State.delete(this, id, updateRecord.rev);
    return {
      id,
      rev: updateRecord.rev,
    };
  }

  /**
   * Inserts new client certificate object.
   * See class description for data structure.
   *
   * @param {ARCClientCertificate} cert Data to insert.
   * @return {Promise<ARCEntityChangeRecord>} Returns a change record for the entity
   */
  async insert(cert) {
    const data = { ...cert };
    if (!data.cert) {
      throw new Error('The "cert" property is required.');
    }
    if (!data.type) {
      throw new Error('The "type" property is required.');
    }
    const dataDoc = {
      cert: this.certificateToStore(data.cert),
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
    delete data.dataKey;
    data._id = res.id;
    data._rev = res.rev;

    const record = {
      id: res.id,
      rev: res.rev,
      item: data,
    };
    ArcModelEvents.ClientCertificate.State.update(this, record);
    return record;
  }

  /**
   * Prepares certificate object to be stored in the data store.
   * If the `data` property is not string then it assumes buffer (either
   * Node's or ArrayBuffer). In this case it converts buffer to base64 string.
   * It also adds `type` property set to `buffer` for the `certificateFromStore()`
   * function to recognize what to do with the data.
   *
   * Note, for optimization, PEM keys should be strings as the content of the
   * certificate is already a base62 string. To spare double base64 conversion
   * use string data.
   *
   * @param {ARCCertificate|ARCCertificate[]} cert Certificate definition. See class description.
   * @return {ARCCertificate|ARCCertificate[]}
   * @throws {Error} When data is not set
   */
  certificateToStore(cert) {
    if (Array.isArray(cert)) {
      return /** @type ARCCertificate[] */ (cert.map((info) =>
        this.certificateToStore(info)
      ));
    }
    if (!cert.data) {
      throw new Error('Certificate content not set.');
    }
    if (typeof cert.data !== 'string') {
      cert.type = 'buffer';
      const buff = /** @type Buffer */ (cert.data);
      cert.data = this.bufferToBase64(buff);
    }
    return cert;
  }

  /**
   * Restores certificate object to it's original values after reading it from
   * the data store.
   * @param {ARCCertificate|ARCCertificate[]} cert Restored certificate definition.
   * @return {ARCCertificate|ARCCertificate[]}
   */
  certificateFromStore(cert) {
    if (Array.isArray(cert)) {
      return /** @type ARCCertificate[] */ (cert.map((info) =>
        this.certificateFromStore(info)
      ));
    }
    if (cert.type) {
      delete cert.type;
      const content = /** @type string */ (cert.data);
      cert.data = this.base64ToBuffer(content);
    }
    return cert;
  }

  /**
   * Converts incoming data to base64 string.
   * @param {Buffer} view
   * @return {string} Safe to store string.
   */
  bufferToBase64(view) {
    const str = view.reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ''
    );
    return btoa(str);
  }

  /**
   * Converts base64 string to Uint8Array.
   * @param {string} str
   * @return {Uint8Array} Restored array view.
   */
  base64ToBuffer(str) {
    const asciiString = atob(str);
    return new Uint8Array([...asciiString].map((char) => char.charCodeAt(0)));
  }

  /**
   * @param {ARCClientCertificateListEvent} e
   */
  [listHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const { limit, nextPageToken } = e;

    e.detail.result = this.list({
      limit,
      nextPageToken,
    });
  }

  /**
   * @param {ARCClientCertificateReadEvent} e
   */
  [readHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const { id, rev } = e;
    e.detail.result = this.get(id, rev);
  }

  /**
   * @param {ARCClientCertificateDeleteEvent} e
   */
  [deleteHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const { id } = e;
    e.detail.result = this.delete(id);
  }

  /**
   * @param {ARCClientCertificateInsertEvent} e
   */
  [insertHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const { certificate } = e;
    e.detail.result = this.insert(certificate);
  }

  /**
   * Override's delete model function to include the "data" store.
   * @return {Promise<void>}
   */
  async deleteModel() {
    await this.dataDb.destroy();
    await super.deleteModel();
  }
}
