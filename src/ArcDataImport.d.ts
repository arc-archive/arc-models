import { ArcImportNormalizeEvent, ArcImportEvent, ArcImportFileEvent, ArcImportDataEvent, FileImportOptions  } from '@advanced-rest-client/events';
import { DataExport, Indexer } from '@advanced-rest-client/events';

export declare const notifyIndexer: unique symbol;
export declare const normalizeHandler: unique symbol;
export declare const importHandler: unique symbol;
export declare const processFileHandler: unique symbol;
export declare const processDataHandler: unique symbol;
export declare const decryptIfNeeded: unique symbol;
export declare const notifyApiParser: unique symbol;

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
   * The element to use to listen for the DOM events and dispatch the events on.
   */
  eventsTarget: EventTarget;
  /**
   * @param eventsTarget The element to use to listen for the DOM events and dispatch the events on.
   */
  constructor(eventsTarget: EventTarget);

  /**
   * Listens for the DOM events.
   */
  listen(): void;
  /**
   * Removes the DOM event listeners.
   */
  unlisten(): void;

  /**
   * Handler for the `import-normalize` custom event.
   * It sets `result` property on the event's detail object which is the result
   * of calling `normalizeImportData` function call.
   *
   * The event is canceled so it's save to have more than one instance of this
   * element in the DOM.
   */
  [normalizeHandler](e: ArcImportNormalizeEvent): void;

  /**
   * Handler for the `import-data` custom event.
   * It sets `result` property on the event's detail object which is a result
   * of calling `storeData` function.
   *
   * The event is canceled so it's save to have more than one instance of this
   * element in the DOM.
   */
  [importHandler](e: ArcImportEvent): void;

  /**
   * Handles file import event dispatched by the UI.
   */
  [processFileHandler](e: ArcImportFileEvent): void;
  [processDataHandler](e: ArcImportDataEvent): void;

  /**
   * Normalizes passed data to the import object and processes the import.
   *
   * @param data The data to normalize and import
   * @returns A promise resolved when the data was processed.
   */
  processData(data: string|object): Promise<void>;

  /**
   * Stores import data in the datastore.
   * It must be normalized by `normalizeImportData` first or it returns an
   * error.
   *
   * @param importObject ARC import data
   * @returns Resolved promise to list of errors or `undefined` if error were not reported.
   */
  storeData(importObject: DataExport.ArcExportObject): Promise<string[]|undefined>;

  /**
   * Dispatches `url-index-update` event handled by `arc-models/url-indexer`.
   * It will index URL data for search function.
   * @param saved List of saved requests indexes
   * @param history List of history requests indexes
   */
  [notifyIndexer](saved: Indexer.IndexableRequest[], history: Indexer.IndexableRequest[]): void;

  /**
   * Transforms any previous ARC export file to the current export object.
   *
   * @param data Data from the import file.
   * @returns Normalized data import object.
   */
  normalizeImportData(data: string|object): Promise<DataExport.ArcExportObject>;

  /**
   * Processes import file data.
   * It tests if the file is API data or ARC/Postman dump.
   * If it is an API definition (zip file or actual API file) then it
   * dispatches a custom event handled by the API processing factory.
   * Otherwise it tries to import file data.
   *
   * @param file User file from the web or electron environment.
   * @param opts Additional options. `driveId` is only supported.
   */
  processFileData(file: File|Uint8Array|Buffer, opts?: FileImportOptions): Promise<void>;

  /**
   * Processes normalized file import data.
   * When it is a single request object it dispatches `request-workspace-append`
   * event to append request to the workspace. Otherwise it dispatches
   * `import-data-inspect` custom event.
   * @param data Normalized data
   * @param opts Additional options. `driveId` is only supported.
   * @returns passed data
   */
  handleNormalizedFileData(data: DataExport.ArcExportObject, opts?: FileImportOptions): DataExport.ArcExportObject;

  /**
   * Dispatches `api-process-file` to parse API data with a separate module.
   * In ARC electron it is `@advanced-rest-client/electron-amf-service`
   * node module. In other it might be other component.
   * @param file User file.
   */
  [notifyApiParser](file: File): Promise<void>;

  /**
   * Processes incoming data and if encryption is detected then id processes
   * the file for decryption.
   *
   * @param content File content
   * @returns The content of the file.
   */
  [decryptIfNeeded](content: string): Promise<string>;
}
