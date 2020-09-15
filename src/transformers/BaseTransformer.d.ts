import {DataExport} from '@advanced-rest-client/arc-types';

export declare const dataValue: unique symbol;

/**
 * Base class for all transformers.
 * Has common functions for the transformers.
 */
export declare class BaseTransformer {
  [dataValue]: any;

  /**
   * @param data Data to be transformed.
   */
  constructor(data: any);

  /**
   * Generates request's datastore ID value.
   *
   * @param item A request object property.
   * @param projectId If set it adds project information to the ID.
   * @returns Request ID value.
   */
  generateRequestId(item: DataExport.ExportArcSavedRequest | DataExport.ExportArcHistoryRequest, projectId?: string): string;

  /**
   * Computes history item ID
   *
   * @param timestamp The timestamp to use
   * @param item History item
   * @returns Datastore ID
   */
  generateHistoryId(timestamp: number, item: DataExport.ExportArcHistoryRequest): string;

  /**
   * Sets hours, minutes, seconds and ms to 0 and returns timestamp.
   *
   * @param timestamp Day's timestamp.
   * @returns Timestamp to the day.
   */
  getDayToday(timestamp: number): number;

  /**
   * Adds project reference to a request object.
   *
   * @param request Request object to alter
   * @param id Project id
   */
  addProjectReference(request: DataExport.ExportArcSavedRequest | DataExport.ExportArcHistoryRequest, id: string): void;

  /**
   * Adds request reference to a project object.
   *
   * @param project Project object to alter
   * @param id Request id
   */
  addRequestReference(project: DataExport.ExportArcProjects, id: string): void;
}
