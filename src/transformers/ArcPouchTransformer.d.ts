import { DataExport } from '@advanced-rest-client/events';
import { BaseTransformer } from './BaseTransformer.js';

/**
 * Updates `updated` property and ensures `created` property
 * @param item An item to updated
 * @returns Shallow copy of the passed item.
 */
export declare function updateItemTimings(item: object): object;

/**
 * Transforms data exported by the PouchDB (the current system).
 */
export declare class ArcPouchTransformer extends BaseTransformer {
  /**
   * Transforms PouchDB ARC export object based into current export data model.
   *
   * @returns New data model object.
   */
  transform(): Promise<DataExport.ArcExportObject>;

  transformProjects(projects: DataExport.ExportArcProjects[]): DataExport.ExportArcProjects[];
  transformRequests(requests: DataExport.ExportArcSavedRequest[], projects: DataExport.ExportArcProjects[]): DataExport.ExportArcSavedRequest[];
  transformHistory(history: DataExport.ExportArcHistoryRequest[]): DataExport.ExportArcHistoryRequest[];
  transformClientCertificates(items: DataExport.ExportArcClientCertificateData[]): DataExport.ExportArcClientCertificateData[];
}
