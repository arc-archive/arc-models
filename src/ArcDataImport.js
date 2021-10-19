/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */

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
import {
  EncryptionEvents,
  ProcessEvents,
  DataImportEventTypes,
  ImportEvents,
  WorkspaceEvents,
  RestApiEvents,
  ArcModelEvents,
} from '@advanced-rest-client/events';
import { readFile, isSingleRequest } from './lib/ImportUtils.js';
import { ImportNormalize } from './lib/ImportNormalize.js';
import { ImportFactory } from './lib/ImportFactory.js';

/** @typedef {import('@advanced-rest-client/events').DataExport.ArcExportObject} ArcExportObject */
/** @typedef {import('@advanced-rest-client/events').Indexer.IndexableRequest} IndexableRequest */
/** @typedef {import('@advanced-rest-client/events').ArcImportNormalizeEvent} ArcImportNormalizeEvent */
/** @typedef {import('@advanced-rest-client/events').ArcImportEvent} ArcImportEvent */
/** @typedef {import('@advanced-rest-client/events').ArcImportFileEvent} ArcImportFileEvent */
/** @typedef {import('@advanced-rest-client/events').ArcImportDataEvent} ArcImportDataEvent */
/** @typedef {import('@advanced-rest-client/events').FileImportOptions} FileImportOptions */

export const notifyIndexer = Symbol('notifyIndexer');
export const normalizeHandler = Symbol('normalizeHandler');
export const importHandler = Symbol('importHandler');
export const processFileHandler = Symbol('processFileHandler');
export const processDataHandler = Symbol('processDataHandler');
export const decryptIfNeeded = Symbol('decryptIfNeeded');
export const notifyApiParser = Symbol('notifyApiParser');

/**
 * An element that initializes import flows.
 * This element has general flow logic for the import actions. ARC support import from:
 * - ARC current version
 * - ARC any previous version
 * - Postman (collections, requests, backup, environment)
 * - RAML and OAS APIs.
 *
 * The import process has (in most cases 3 steps):
 * 1. Normalize the data (create the export object from the input)
 * 2. Inspect data
 * 3. Import data
 *
 * Step 1 and 3 is handled by the `ImportFactory` and `ImportNormalize`
 * classes from ARC models module. The UI for the step 2 is in this module.
 *
 * When importing an API data additional steps are required but this element
 * recognizes the API data content and dispatches an event for the API processor library
 * to process the API data.
 */
export class ArcDataImport {
  /**
   * @param {EventTarget} eventsTarget The element to use to listen for the DOM events and dispatch the events on.
   */
  constructor(eventsTarget) {
    /**
     * The element to use to listen for the DOM events and dispatch the events on.
     */
    this.eventsTarget = eventsTarget;
    this[normalizeHandler] = this[normalizeHandler].bind(this);
    this[importHandler] = this[importHandler].bind(this);
    // A handler for when a file is selected
    this[processFileHandler] = this[processFileHandler].bind(this);
    // A case when JSON file is already parsed and is ready to be processed.
    this[processDataHandler] = this[processDataHandler].bind(this);
  }

  /**
   * Listens for the DOM events.
   */
  listen() {
    const { eventsTarget } = this;
    eventsTarget.addEventListener(DataImportEventTypes.normalize, this[normalizeHandler]);
    eventsTarget.addEventListener(DataImportEventTypes.dataImport, this[importHandler]);
    eventsTarget.addEventListener(DataImportEventTypes.processFile, this[processFileHandler]);
    eventsTarget.addEventListener(DataImportEventTypes.processData, this[processDataHandler]);
  }

  /**
   * Removes the DOM event listeners.
   */
  unlisten() {
    const { eventsTarget } = this; 
    eventsTarget.removeEventListener(DataImportEventTypes.normalize, this[normalizeHandler]);
    eventsTarget.removeEventListener(DataImportEventTypes.dataImport, this[importHandler]);
    eventsTarget.removeEventListener(DataImportEventTypes.processFile, this[processFileHandler]);
    eventsTarget.removeEventListener(DataImportEventTypes.processData, this[processDataHandler]);
  }

  /**
   * Handler for the `import-normalize` custom event.
   * It sets `result` property on the event's detail object which is the result
   * of calling `normalizeImportData` function call.
   *
   * The event is canceled so it's save to have more than one instance of this
   * element in the DOM.
   *
   * @param {ArcImportNormalizeEvent} e
   */
  [normalizeHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    const { data } = e;
    if (!data) {
      e.detail.result = Promise.reject(new Error('The data property was not set'));
      return;
    }
    e.detail.result = this.normalizeImportData(data);
  }

  /**
   * Handler for the `import-data` custom event.
   * It sets `result` property on the event's detail object which is a result
   * of calling `storeData` function.
   *
   * The event is canceled so it's save to have more than one instance of this
   * element in the DOM.
   *
   * @param {ArcImportEvent} e
   */
  [importHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    const { data } = e;
    if (!data) {
      e.detail.result = Promise.reject(
        new Error('The "data" property was not set')
      );
      return;
    }
    e.detail.result = this.storeData(data);
  }

  /**
   * Handles file import event dispatched by the UI.
   * @param {ArcImportFileEvent} e
   */
  [processFileHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    const { file, options } = e;
    if (!file) {
      e.detail.result = Promise.reject(
        new Error('The "file" property was not set')
      );
      return;
    }
    e.detail.result = this.processFileData(file, options);
  }

  /**
   * @param {ArcImportDataEvent} e
   */
  [processDataHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    const { data } = e;
    if (!data) {
      e.detail.result = Promise.reject(
        new Error('The "data" property was not set')
      );
      return;
    }
    e.detail.result = this.processData(data);
  }

  /**
   * Normalizes passed data to the import object and processes the import.
   *
   * @param {string|object} data The data to normalize and import
   * @return {Promise<void>} A promise resolved when the data was processed.
   */
  async processData(data) {
    const normalized = await this.normalizeImportData(data);
    this.handleNormalizedFileData(normalized);
  }

  /**
   * Stores import data in the datastore.
   * It must be normalized by `normalizeImportData` first or it returns an
   * error.
   *
   * @param {ArcExportObject} importObject ARC import data
   * @return {Promise<string[]|undefined>} Resolved promise to list of errors or `undefined`
   * if error were not reported.
   */
  async storeData(importObject) {
    if (!importObject) {
      throw new Error('Missing required argument.');
    }
    if (!importObject.kind || importObject.kind !== 'ARC#Import') {
      throw new Error('Data not normalized for import.');
    }
    const store = new ImportFactory();
    const result = await store.importData(importObject);
    const { savedIndexes, historyIndexes } = store;
    this[notifyIndexer](savedIndexes, historyIndexes);
    ImportEvents.dataImported(this.eventsTarget);
    return result;
  }

  /**
   * Dispatches `url-index-update` event handled by `arc-models/url-indexer`.
   * It will index URL data for search function.
   * @param {IndexableRequest[]} saved List of saved requests indexes
   * @param {IndexableRequest[]} history List of history requests indexes
   */
  [notifyIndexer](saved, history) {
    let indexes = [];
    if (saved) {
      indexes = indexes.concat(saved);
    }
    if (history) {
      indexes = indexes.concat(history);
    }
    if (!indexes.length) {
      return;
    }
    ArcModelEvents.UrlIndexer.update(this.eventsTarget, indexes);
  }

  /**
   * Transforms any previous ARC export file to the current export object.
   *
   * @param {string|object|File|Blob} data Data from the import file.
   * @return {Promise<ArcExportObject>} Normalized data import object.
   */
  async normalizeImportData(data) {
    let importData = data;
    if (importData.type) {
      importData = await readFile(data);
    }
    if (typeof importData === 'string') {
      importData = await this[decryptIfNeeded](importData);
    }
    const processor = new ImportNormalize();
    return processor.normalize(importData);
  }

  /**
   * Processes import file data.
   * It tests if the file is API data or ARC/Postman dump.
   * If it is an API definition (zip file or actual API file) then it
   * dispatches a custom event handled by the API processing factory.
   * Otherwise it tries to import file data.
   *
   * @param {File|Uint8Array|Buffer} file User file from the web or electron environment.
   * @param {FileImportOptions=} opts Additional options. `driveId` is only supported.
   * @return {Promise}
   */
  async processFileData(file, opts) {
    const apiTypes = [
      'application/zip',
      'application/yaml',
      'application/x-yaml',
      'application/raml',
      'application/x-raml',
      'application/x-zip-compressed',
    ];
    const typedFile = /** @type File */ (file);
    const isFile = !(file instanceof Uint8Array);

    if (isFile && apiTypes.indexOf(typedFile.type) !== -1) {
      return this[notifyApiParser](typedFile);
    }

    // RAML files
    if (isFile && typedFile.name &&
      (typedFile.name.indexOf('.raml') !== -1 ||
        typedFile.name.indexOf('.yaml') !== -1 ||
        typedFile.name.indexOf('.zip') !== -1)
    ) {
      return this[notifyApiParser](typedFile);
    }

    const id = new Date().toISOString();
    ProcessEvents.loadingstart(this.eventsTarget, id, 'Processing file data');
    let content;
    if (!isFile) {
      content = file.toString();
    } else {
      content = await readFile(typedFile);
    }
    content = content.trim();
    content = await this[decryptIfNeeded](content);
    if (content[0] === '#' && content.indexOf('#%RAML') === 0) {
      return this[notifyApiParser](typedFile);
    }
    let data;
    try {
      data = JSON.parse(content);
    } catch (e) {
      ProcessEvents.loadingstop(this.eventsTarget, id);
      throw new Error('Unknown file format');
    }
    if (data.swagger) {
      ProcessEvents.loadingstop(this.eventsTarget, id);
      return this[notifyApiParser](typedFile);
    }
    const importData = await this.normalizeImportData(data);
    ProcessEvents.loadingstop(this.eventsTarget, id);
    return this.handleNormalizedFileData(importData, opts);
  }

  /**
   * Processes normalized file import data.
   * When it is a single request object it dispatches `request-workspace-append`
   * event to append request to the workspace. Otherwise it dispatches
   * `import-data-inspect` custom event.
   * @param {ArcExportObject} data Normalized data
   * @param {FileImportOptions=} opts Additional options. `driveId` is only supported.
   * @return {ArcExportObject} passed data
   */
  handleNormalizedFileData(data, opts) {
    if (!data) {
      throw new Error('File has no import data');
    }
    
    if (isSingleRequest(data)) {
      const obj = data.requests[0];
      if (opts && opts.driveId) {
        obj.driveId = opts.driveId;
      }
      delete obj.kind;
      obj._id = obj.key;
      delete obj.key;
      WorkspaceEvents.appendRequest(this.eventsTarget, obj);
    } else if (data.loadToWorkspace) {
      WorkspaceEvents.appendExport(this.eventsTarget, data);
    } else {
      ImportEvents.inspect(this.eventsTarget, data);
    }
    return data;
  }

  /**
   * Dispatches `api-process-file` to parse API data with a separate module.
   * In ARC electron it is `@advanced-rest-client/electron-amf-service`
   * node module. In other it might be other component.
   * @param {File} file User file.
   * @return {Promise<void>}
   */
  async [notifyApiParser](file) {
    const result = await RestApiEvents.processFile(this.eventsTarget, file);
    if (!result) {
      throw new Error('API processor not available');
    }
    RestApiEvents.dataReady(this.eventsTarget, result.model, result.type);
  }

  /**
   * Processes incoming data and if encryption is detected then id processes
   * the file for decryption.
   *
   * @param {string} content File content
   * @return {Promise<string>} The content of the file.
   */
  async [decryptIfNeeded](content) {
    const headerIndex = content.indexOf('\n');
    const header = content.substr(0, headerIndex).trim();
    if (header === 'aes') {
      const data = content.substr(headerIndex + 1);
      content = await EncryptionEvents.decrypt(this.eventsTarget, data, '', 'aes');
    }
    return content;
  }
}
