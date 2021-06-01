/**
@license
Copyright 2018-2020 The Advanced REST client authors <arc@mulesoft.com>
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
import {
  DataExportEventTypes,
  SessionCookieEventTypes,
  ExportEvents,
  GoogleDriveEvents,
  EncryptionEvents,
} from '@advanced-rest-client/arc-events';
import { ExportFactory } from './lib/ExportFactory.js';
import { ExportProcessor } from './lib/ExportProcessor.js';

/** @typedef {import('@advanced-rest-client/arc-events').ArcDataExportEvent} ArcDataExportEvent */
/** @typedef {import('@advanced-rest-client/arc-events').ArcExportEvent} ArcExportEvent */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ArcNativeDataExport} ArcNativeDataExport */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportOptions} ExportOptions */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ProviderOptions} ProviderOptions */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ArcExportResult} ArcExportResult */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportOptionsInternal} ExportOptionsInternal */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ArcExportProcessedData} ArcExportProcessedData */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ArcExportClientCertificateData} ArcExportClientCertificateData */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportKey} ExportKey */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ArcExportObject} ArcExportObject */
/** @typedef {import('@advanced-rest-client/arc-types').Cookies.ARCCookie} ARCCookie */
/** @typedef {import('@advanced-rest-client/arc-types').AuthData.ARCAuthData} ARCAuthData */

export const appVersionValue = Symbol('appVersionValue');
export const electronCookiesValue = Symbol('electronCookiesValue');
export const exportHandler = Symbol('exportHandler');
export const nativeExportHandler = Symbol('nativeExportHandler');
export const exportFile = Symbol('exportFile');
export const exportDrive = Symbol('exportDrive');
export const queryCookies = Symbol('queryCookies');
export const encryptData = Symbol('encryptData');

/**
 * An element to handle data export flow and events for Advanced REST Client.
 * The element uses `ExportProcessor` and `ExportFactory` classes from arc models
 * module to get the data from the store.
 */
export class ArcDataExportElement extends HTMLElement {
  static get observedAttributes() {
    return [
      'appversion', 'electroncookies'
    ];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'appversion': this.appVersion = newValue; break;
      case 'electroncookies': this.electronCookies = newValue; break;
      default:
    }
  }

  /**
   * @return {string} Hosting application version number. If not set it sends `app-version`
   * custom event to query for the application version number.
   */
  get appVersion() {
    return this[appVersionValue];
  }

  set appVersion(value) {
    const old = this[appVersionValue];
    if (old === value) {
      return;
    }
    const typedValue = String(value);
    this[appVersionValue] = typedValue;
    if (this.getAttribute('appversion') !== typedValue) {
      this.setAttribute('appversion', typedValue);
    }
  }

  /**
   * @return {boolean} If set it uses arc electron session state module to read cookie data
   */
  get electronCookies() {
    return this[electronCookiesValue];
  }

  set electronCookies(value) {
    let typedValue;
    if (value === null || value === false || value === undefined) {
      typedValue = false;
    } else {
      typedValue = true;
    }
    const old = this[electronCookiesValue];
    if (old === typedValue) {
      return;
    }
    this[electronCookiesValue] = typedValue;
    if (typedValue) {
      if (!this.hasAttribute('electroncookies')) {
        this.setAttribute('electroncookies', '');
      }
    } else if (this.hasAttribute('electroncookies')) {
        this.removeAttribute('electroncookies');
      }
  }

  constructor() {
    super();
    this[exportHandler] = this[exportHandler].bind(this);
    this[nativeExportHandler] = this[nativeExportHandler].bind(this);
  }

  connectedCallback() {
    window.addEventListener(DataExportEventTypes.customData, this[exportHandler]);
    window.addEventListener(DataExportEventTypes.nativeData, this[nativeExportHandler]);
  }

  disconnectedCallback() {
    window.removeEventListener(DataExportEventTypes.customData, this[exportHandler]);
    window.removeEventListener(DataExportEventTypes.nativeData, this[nativeExportHandler]);
  }

  /**
   * Handler for the `export-data` custom event.
   * This event is not meant to be used to export ARC datastore data.
   * @param {ArcExportEvent} e
   */
  [exportHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    const { data, exportOptions, providerOptions } = e;

    e.detail.result = this.dataExport(data, exportOptions, providerOptions);
  }

  /**
   * Handler for `arc-data-export` event that exports ARC data
   * (settings, requests, project, etc).
   * @param {ArcDataExportEvent} e Event dispatched by element requesting the export.
   */
  [nativeExportHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    const { data, exportOptions, providerOptions } = e;
    e.detail.result = this.arcExport(data, exportOptions, providerOptions);
  }

  /**
   * Exports any data with any of the export providers.
   * @param {any} data The data to export
   * @param {ExportOptions} exportOptions Export options
   * @param {ProviderOptions} providerOptions Options passed to the export provider
   * @return {Promise<ArcExportResult>} Promise resolved to a result of saving a file.
   */
  async dataExport(data, exportOptions, providerOptions) {
    if (!exportOptions) {
      throw new Error('The "exportOptions" property is not set.');
    }
    if (!providerOptions) {
      throw new Error('The "providerOptions" property is not set.');
    }
    if (!exportOptions.provider) {
      throw new Error('The "options.provider" property is not set.');
    }
    if (!providerOptions.file) {
      throw new Error('The "options.file" property is not set.');
    }
    let payload;
    if (exportOptions.encrypt) {
      payload = await this[encryptData](data, exportOptions.passphrase);
    } else {
      payload = data;
    }
    switch (exportOptions.provider) {
      case 'file': return this[exportFile](payload, providerOptions);
      case 'drive': return this[exportDrive](payload, providerOptions);
      default: return Promise.reject(new Error(`Unknown export provider ${exportOptions.provider}.`));
    }
  }

  /**
   * Generates and saves ARC export object from user data.
   * @param {ArcNativeDataExport} data The data to export
   * @param {ExportOptions} exportOptions Export options
   * @param {ProviderOptions} providerOptions Options passed to the export provider
   * @return {Promise<ArcExportResult>} Promise resolved to a result of saving a file.
   */
  async arcExport(data, exportOptions, providerOptions) {
    if (!exportOptions) {
      throw new Error('The "exportOptions" property is not set.');
    }
    if (!providerOptions) {
      throw new Error('The "providerOptions" property is not set.');
    }
    if (!exportOptions.provider) {
      throw new Error('The "options.provider" property is not set.');
    }
    if (!providerOptions.file) {
      throw new Error('The "options.file" property is not set.');
    }
    const providerConfig = { ...providerOptions, contentType: 'application/restclient+data' };
    const exportObject = await this.createExport(data, exportOptions);
    let payload = JSON.stringify(exportObject);
    if (exportOptions.encrypt) {
      payload = await this[encryptData](payload, exportOptions.passphrase);
    }
    switch (exportOptions.provider) {
      case 'file': return this[exportFile](payload, providerConfig);
      case 'drive': return this[exportDrive](payload, providerConfig);
      default: throw new Error(`Unknown export provider ${exportOptions.provider}.`);
    }
  }

  /**
   * Reads the data store and creates an export object
   * @param {ArcNativeDataExport} data A map of datastores to export.
   * @param {ExportOptions} options Export configuration object
   * @return {Promise<ArcExportObject>}
   */
  async createExport(data, options) {
    const factory = new ExportFactory();
    const { cookies } = data;
    const exportData = await factory.getExportData(data);
    if (cookies && this.electronCookies) {
      const cookieData = await this[queryCookies]();
      const index = exportData.findIndex((i) => i.key === 'cookies');
      if (index !== -1) {
        exportData.splice(index, 1);
      }
      exportData.push({
        key: 'cookies',
        data: cookieData,
      });
    }
    return this.createExportObject(exportData, options);
  }

  /**
   * Creates an export object for the data.
   *
   * @param {ArcExportProcessedData[]} data
   * @param {ExportOptions} options Export configuration object
   * @return {ArcExportObject} ARC export object declaration.
   */
  createExportObject(data, options) {
    const config = /** @type ExportOptionsInternal */ ({ ...options });
    config.appVersion = this.appVersion || 'Unknown version';
    if (!options.kind) {
      config.kind = 'ARC#AllDataExport';
    }
    const processor = new ExportProcessor(this.electronCookies);
    return processor.createExportObject(data, config);
  }

  /**
   * Dispatches the cookie list event and returns  the result
   * @return {Promise<ARCCookie[]>}
   */
  async [queryCookies]() {
    const e = new CustomEvent(SessionCookieEventTypes.listAll, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {
        result: /** @type Promise<ARCCookie[]> */ (null),
      }
    });
    this.dispatchEvent(e);
    const cookies = await e.detail.result;
    if (!cookies) {
      return [];
    }
    return cookies;
  }

  /**
   * Requests application to export data to file.
   *
   * @param {any} data The data to export
   * @param {ProviderOptions} options Provider options
   * @return {Promise<ArcExportResult>}
   */
  async [exportFile](data, options) {
    const config = { ...options };
    if (!config.contentType) {
      config.contentType = 'application/json';
    }
    const result = await ExportEvents.fileSave(this, data, config);
    if (!result) {
      throw new Error('The file export provider not found.');
    }
    return result;
  }

  /**
   * Requests application to export data to Google Drive.
   *
   * @param {any} data The data to export
   * @param {ProviderOptions} options Provider options
   * @return {Promise<ArcExportResult>}
   */
  async [exportDrive](data, options) {
    const config = { ...options };
    if (!config.contentType) {
      config.contentType = 'application/restclient+data';
    }
    const result = await GoogleDriveEvents.save(this, data, config);
    if (!result) {
      throw new Error('The Google Drive export provider not found.');
    }
    return result;
  }

  /**
   * Dispatches event requesting to encrypt the data.
   *
   * @param {string} data Data to encode
   * @param {string} passphrase Passphrase to use to encode the data
   * @return {Promise<string>} Encoded data.
   * @throws {Error} When the password is not set
   * @throws {Error} When the encode event is not handled
   */
  async [encryptData](data, passphrase) {
    if (typeof passphrase !== 'string') {
      throw new Error('Encryption passphrase needs to be a string.');
    }
    const encoded = await EncryptionEvents.encrypt(this, data, passphrase, 'aes');
    if (!encoded) {
      throw new Error('Encryption module not ready or does not handle the event');
    }
    return `aes\n${encoded}`;
  }
}
