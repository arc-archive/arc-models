import { ARCSavedRequest, ARCHistoryRequest, ARCAuthData, ARCWebsocketUrlHistory, ARCHostRule, ARCUrlHistory, ARCVariable, ARCProject } from '../../index';
import { DataExport } from '@advanced-rest-client/arc-types';
/**
 * A class that processes ARC data to create a standard export object.
 */
export declare class ExportProcessor {
  /**
   * @param electronCookies True if the cookies were read from electron storage
   */
  constructor(electronCookies: boolean);

  /**
   * Creates an export object for the data.
   *
   * @param exportData
   * @param options Export configuration object
   * @return ARC export object declaration.
   */
  createExportObject(data: DataExport.ArcExportProcessedData[], options: DataExport.ExportOptionsInternal): DataExport.ArcExportObject;
  prepareItem(key: keyof DataExport.ArcNativeDataExport, values: any[]): any[];
  /**
   * Maps list of request to the export object.
   * @param requests The list of requests to process.
   */
  prepareRequestsList(requests: ARCSavedRequest[]): DataExport.ExportArcSavedRequest[];
  prepareProjectsList(projects: ARCProject[]): DataExport.ExportArcProjects[];
  prepareHistoryDataList(history: ARCHistoryRequest[]): DataExport.ExportArcHistoryRequest[];
  prepareWsUrlHistoryData(data: ARCWebsocketUrlHistory[]): DataExport.ExportArcWebsocketUrl[];
  prepareUrlHistoryData(data: ARCUrlHistory[]): DataExport.ExportArcUrlHistory[];
  prepareVariablesData(data: ARCVariable[]): DataExport.ExportArcVariable[];
  prepareAuthData(authData: ARCAuthData[]): DataExport.ExportArcAuthData[];
  prepareCookieData(cookies: any[]): any[];
  prepareHostRulesData(hostRules: ARCHostRule[]): DataExport.ExportArcHostRule[];
  prepareClientCertData(items: DataExport.ArcExportClientCertificateData[]): DataExport.ExportArcClientCertificateData[];
}
