import { DataExport } from '@advanced-rest-client/events';

/** @typedef {import('@advanced-rest-client/events').DataExport.ArcExportObject} ArcExportObject */

/**
 * A class that takes care of the import data and normalizes it to a common
 * object (ArcExportObject).
 *
 * Note, this class does not support content decryption. The data has to be decrypted.
 */
export declare class ImportNormalize {
  /**
   * Transforms any previous ARC export file to the current export object.
   *
   * Note, the data has to be decrypted before running this function.
   *
   * @param data Data from the import file.
   * @return Normalized data import object.
   */
  normalize(data: string|object): Promise<DataExport.ArcExportObject>;

  /**
   * Normalizes any previous and current ARC file export data to common model.
   *
   * @param data Imported data.
   * @returns A promise resolved to ARC data export object.
   */
  normalizeArcData(data: object): Promise<DataExport.ArcExportObject>;

  /**
   * Normalizes export data from the GWT system.
   * @param data Parsed data
   * @returns Normalized import object
   */
  normalizeArcLegacyData(data: object): Promise<DataExport.ArcExportObject>;

  /**
   * Normalizes export data from Dexie powered data store.
   * @param data Parsed data
   * @returns Normalized import object
   */
  normalizeArcDexieSystem(data: object): Promise<DataExport.ArcExportObject>;

  /**
   * Normalizes ARC's data exported in PouchDB system
   * @param data Parsed data
   * @returns Normalized import object
   */
  normalizeArcPouchSystem(data: object): Promise<DataExport.ArcExportObject>;

  /**
   * Normalizes Postman data into ARC's data model.
   * @param data Parsed data
   * @returns Normalized import object
   */
  normalizePostman(data: object): Promise<DataExport.ArcExportObject>;
}
