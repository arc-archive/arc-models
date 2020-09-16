/* eslint-disable class-methods-use-this */
import {
  isPostman,
  isArcFile,
  prepareImportObject,
} from './ImportUtils.js';
import { ArcLegacyTransformer } from '../transformers/ArcLegacyTransformer.js';
import { ArcDexieTransformer } from '../transformers/ArcDexieTransformer.js';
import { ArcPouchTransformer } from '../transformers/ArcPouchTransformer.js';
import { PostmanDataTransformer } from '../transformers/PostmanDataTransformer.js';

/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ArcExportObject} ArcExportObject */

/**
 * A class that takes care of the import data and normalizes it to a common
 * object (ArcExportObject).
 *
 * Note, this class does not support content decryption. The data has to be decrypted.
 */
export class ImportNormalize {
  /**
   * Transforms any previous ARC export file to the current export object.
   *
   * Note, the data has to be decrypted before running this function.
   *
   * @param {string|object} data Data from the import file.
   * @return } Normalized data import object.
   */
  async normalize(data) {
    const processed = prepareImportObject(data);
    if (isPostman(processed)) {
      return this.normalizePostman(processed);
    }
    if (isArcFile(processed)) {
      return this.normalizeArcData(processed);
    }
    throw new Error('File not recognized');
  }

  /**
   * Normalizes any previous and current ARC file export data to common model.
   *
   * @param {object} data Imported data.
   * @return {Promise<ArcExportObject>} A promise resolved to ARC data export object.
   */
  async normalizeArcData(data) {
    switch (data.kind) {
      case 'ARC#SavedHistoryDataExport':
      case 'ARC#AllDataExport':
      case 'ARC#SavedDataExport':
      case 'ARC#SavedExport':
      case 'ARC#HistoryDataExport':
      case 'ARC#HistoryExport':
      case 'ARC#Project':
      case 'ARC#SessionCookies':
      case 'ARC#HostRules':
      case 'ARC#ProjectExport':
        return this.normalizeArcPouchSystem(data);
      case 'ARC#requestsDataExport':
        return this.normalizeArcDexieSystem(data);
      default:
        return this.normalizeArcLegacyData(data);
    }
  }

  /**
   * Normalizes export data from the GWT system.
   * @param {object} data Parsed data
   * @return {Promise<ArcExportObject>} Normalized import object
   */
  normalizeArcLegacyData(data) {
    const transformer = new ArcLegacyTransformer(data);
    return transformer.transform();
  }

  /**
   * Normalizes export data from Dexie powered data store.
   * @param {object} data Parsed data
   * @return {Promise<ArcExportObject>} Normalized import object
   */
  normalizeArcDexieSystem(data) {
    const transformer = new ArcDexieTransformer(data);
    return transformer.transform();
  }

  /**
   * Normalizes ARC's data exported in PouchDB system
   * @param {object} data Parsed data
   * @return {Promise<ArcExportObject>} Normalized import object
   */
  normalizeArcPouchSystem(data) {
    const transformer = new ArcPouchTransformer(data);
    return transformer.transform();
  }

  /**
   * Normalizes Postman data into ARC's data model.
   * @param {object} data Parsed data
   * @return {Promise<ArcExportObject>} Normalized import object
   */
  normalizePostman(data) {
    const transformer = new PostmanDataTransformer();
    return transformer.transform(data);
  }
}
