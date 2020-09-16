import { DataExport } from '@advanced-rest-client/arc-types';
/**
 * A class that prepares export data from the models.
 */
export declare class ExportFactory {
  /**
   * The size of datastore read operation in a single fetch.
   * @type {Number}
   */
  dbChunk: 1000;

  /**
   * @param dbChunk The size of datastore read operation in a single fetch.
   */
  constructor(dbChunk?: number);

  /**
   * Creates an input data structure from datastore for further processing.
   * @param data A map of datastores to export.
   */
  getExportData(data: DataExport.ArcNativeDataExport): Promise<DataExport.ArcExportProcessedData[]>;

  /**
   * @param key THe key for the data
   * @param data A map of datastores to export.
   */
  prepareExportData(key: keyof DataExport.ArcNativeDataExport, data: DataExport.ArcNativeDataExport): Promise<DataExport.ArcExportProcessedData>;

  getClientCertificatesEntries(): Promise<DataExport.ArcExportClientCertificateData[]|undefined>
}
