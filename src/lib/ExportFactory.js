/* eslint-disable no-param-reassign */
import {
  getDatabaseEntries,
  processRequestsArray,
} from './DbUtils.js';
import { normalizeRequest } from '../Utils.js';

/** @typedef {import('@advanced-rest-client/events').DataExport.ArcNativeDataExport} ArcNativeDataExport */
/** @typedef {import('@advanced-rest-client/events').DataExport.ArcExportProcessedData} ArcExportProcessedData */
/** @typedef {import('@advanced-rest-client/events').DataExport.ExportKey} ExportKey */
/** @typedef {import('@advanced-rest-client/events').DataExport.ArcExportClientCertificateData} ArcExportClientCertificateData */
/** @typedef {import('@advanced-rest-client/events').ClientCertificate.ARCRequestCertificate} ARCRequestCertificate */
/** @typedef {import('@advanced-rest-client/events').ClientCertificate.ARCCertificateIndex} ARCCertificateIndex */

/**
 * Maps export key from the event to database name.
 * @param {keyof ArcNativeDataExport} key Export data type name from the event.
 * @returns {string} Database name
 */
function getDatabaseName(key) {
  switch (key) {
    case 'history': return 'history-requests';
    case 'requests': return 'saved-requests';
    case 'websocketurlhistory': return 'websocket-url-history';
    case 'urlhistory': return 'url-history';
    case 'authdata': return 'auth-data';
    case 'projects': return 'legacy-projects';
    case 'hostrules': return 'host-rules';
    default: return String(key);
  }
}

/**
 * A class that prepares export data from the models.
 */
export class ExportFactory {
  /**
   * @param {number=} [dbChunk=1000] The size of datastore read operation in a single fetch.
   */
  constructor(dbChunk=1000) {
    /**
     * The size of datastore read operation in a single fetch.
     * @type {Number}
     */
    this.dbChunk = dbChunk;
  }

  /**
   * Creates an input data structure from datastore for further processing.
   * @param {ArcNativeDataExport} data A map of datastores to export.
   * @return {Promise<ArcExportProcessedData[]>}
   */
  async getExportData(data) {
    const dataKeys = /** @type ExportKey[] */ (Object.keys(data));
    const ps = dataKeys.map((key) => this.prepareExportData(key, data));
    const results = await Promise.all(ps);
    const ccIndex = results.findIndex(({key}) => key === 'clientcertificates');
    let ccData;
    if (ccIndex > -1) {
      ccData = results[ccIndex].data;
    }
    const hasSaved = dataKeys.includes('requests');
    if (hasSaved && !dataKeys.includes('projects')) {
      results.push({
        key: 'projects',
        data: await getDatabaseEntries('legacy-projects', this.dbChunk),
      });
    }
    let addCc = [];
    if (hasSaved) {
      const index = results.findIndex(({key}) => key === 'requests');
      const ccs = await processRequestsArray(results[index].data, ccData);
      if (ccs) {
        addCc = addCc.concat(ccs);
      }
    }
    if (dataKeys.includes('history')) {
      const index = results.findIndex(({key}) => key === 'history');
      const ccs = await processRequestsArray(results[index].data, ccData);
      if (ccs) {
        addCc = addCc.concat(ccs);
      }
    }
    if (addCc.length) {
      results.push({
        key: 'clientcertificates',
        data: addCc,
      });
    }
    return results;
  }

  /**
   * @param {keyof ArcNativeDataExport} key THe key for the data
   * @param {ArcNativeDataExport} data A map of datastores to export.
   * @return {Promise<ArcExportProcessedData>}
   */
  async prepareExportData(key, data) {
    const value = /** @type any[] */ (data[key]);
    const result = {
      key,
      data: [],
    };
    const normalize = ['requests', 'history'].includes(key)
    if (typeof value === 'boolean' && value) {
      if (key === 'clientcertificates') {
        result.data = await this.getClientCertificatesEntries();
      } else {
        const dbName = getDatabaseName(key);
        result.data = await getDatabaseEntries(dbName, this.dbChunk);
        if (normalize) {
          result.data = result.data.map((request) => normalizeRequest(request));
        }
      }
    } else if (Array.isArray(value) && value.length) {
      result.data = value.map((item) => ({ ...item}));
    }
    return result;
  }

  /**
   * @return {Promise<ArcExportClientCertificateData[]|undefined>}
   */
  async getClientCertificatesEntries() {
    const indexData = /** @type ARCCertificateIndex[] */ (await getDatabaseEntries('client-certificates', this.dbChunk));
    if (!indexData.length) {
      return undefined;
    }
    const data = /** @type ARCRequestCertificate[] */ (await getDatabaseEntries('client-certificates-data', this.dbChunk));
    const result = [];
    indexData.forEach((item) => {
      const { dataKey, _id } = item;
      const id = dataKey || _id;
      if (dataKey) {
        delete item.dataKey;
      }
      const index = data.findIndex((cdata) => cdata._id === id);
      if (index >= 0) {
        result[result.length] = /** @type ArcExportClientCertificateData */ ({
          item,
          data: data[index],
        });
        data.splice(index, 1);
      }
    });
    return result;
  }
}
