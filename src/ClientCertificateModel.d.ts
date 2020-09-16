import { ArcBaseModel } from './ArcBaseModel';
import {
  Entity,
  ARCModelListOptions,
  ARCModelListResult,
  ARCEntityChangeRecord,
  DeletedEntity,
} from './types';

export declare interface ARCCertificate {
  /**
   * The certificate to use.
   * The `p12` type certificate must be a Buffer.
   * The model's `get()` method always returns original data type.
   */
  data: string|ArrayBuffer|Buffer|Uint8Array;
  /**
   * A passphrase to use to unlock the certificate.
   */
  passphrase?: string;
  /**
   * The original data type of the certificate.
   */
  type?: string;
}

export declare interface ARCClientCertificate extends Entity {
  /**
   * Certificate type. Either `p12` or `pem`.
   */
  type: string;
  /**
   * Certificate or list of certificates to use.
   */
  cert: ARCCertificate|ARCCertificate[];
  /**
   * Key for the `pem` type certificate.
   */
  key?: ARCCertificate|ARCCertificate[];
  /**
   * Custom name of the certificate.
   */
  name?: string;
  /**
   * Timestamp when the certificate was inserted into the data store.
   * Required when returning a result. Auto-generated when inserting.
   */
  created?: number;
  /**
   * Model's internal key. Not exposed through the API.
   */
  dataKey?: string;
}

export declare interface ARCCertificateIndex extends Entity {
  /**
   * Certificate type. Either `p12` or `pem`.
   */
  type: string;
  /**
   * Custom name of the certificate.
   */
  name: string;
  /**
   * Timestamp when the certificate was inserted into the data store.
   * Required when returning a result. Auto-generated when inserting.
   */
  created: number;
}

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
export declare class ClientCertificateModel extends ArcBaseModel {
  readonly dataDb: PouchDB.Database;

  constructor();
  _attachListeners(node: EventTarget): void;
  _detachListeners(node: EventTarget): void;

  /**
   * Lists certificates installed in the application.
   *
   * @param opts Query options.
   * @returns A promise resolved to a list of projects.
   */
  list(opts?: ARCModelListOptions): Promise<ARCModelListResult<ARCCertificateIndex>>;

  /**
   * Reads client certificate full structure.
   * Returns certificate's meta data + cert + key.
   *
   * @param id Certificate's datastore id.
   * @param rev Specific revision to read. Defaults to the latest revision.
   * @returns Promise resolved to a certificate object.
   */
  get(id: string, rev?: string): Promise<ARCClientCertificate>;

  /**
   * Safely deletes certificate data from the data store.
   * It marks the certificate as deleted so DB apis won't use this data but
   * it is possible to restore the data in case of accidental delete.
   *
   * Note, this data always stays only on the user's machine so there's no
   * conflict with GDPR.
   *
   * @param id Certificate's datastore id.
   * @returns Promise resolved when both entries are deleted.
   */
  delete(id: string): Promise<DeletedEntity>;

  /**
   * Inserts new client certificate object.
   * See class description for data structure.
   *
   * @param data Data to insert.
   * @returns Unlike other models, a promise resolved to inserted
   * id. Because this API operates on a single ID without reviews this won't
   * return the final object.
   */
  insert(data: ARCClientCertificate): Promise<ARCEntityChangeRecord<ARCClientCertificate>>;

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
   * @param cert Certificate definition. See class description.
   */
  certificateToStore(cert: ARCCertificate|ARCCertificate[]): ARCCertificate|ARCCertificate[];

  /**
   * Restores certificate object to it's original values after reading it from
   * the data store.
   *
   * @param cert Restored certificate definition.
   */
  certificateFromStore(cert: ARCCertificate|ARCCertificate[]): ARCCertificate|ARCCertificate[];

  /**
   * Converts incoming data to base64 string.
   *
   * @returns Safe to store string.
   */
  bufferToBase64(ab: Buffer): string;

  /**
   * Converts base64 string to Uint8Array.
   *
   * @returns Restored array view.
   */
  base64ToBuffer(str: string): Uint8Array;

  /**
   * Override's delete model function to include the "data" store.
   */
  deleteModel(): Promise<void>;
}
