import { DataExport } from '@advanced-rest-client/arc-types';
import {BaseTransformer} from './BaseTransformer.js';

export interface LegacyExport {
  requests: LegacyRequest[];
  projects: LegacyProject[];
}

export interface LegacyRequest {
  id: number;
  name: string;
  project: number;
  url: string;
  method: string;
  encoding: string|null;
  headers: string|null;
  payload: string|null;
  skipProtocol: boolean;
  skipServer: boolean;
  skipParams: boolean;
  skipHistory: boolean;
  skipMethod: boolean;
  skipPayload: boolean;
  skipHeaders: boolean;
  skipPath: boolean;
  time: number;
  driveId?: string|null;
}

export interface LegacyProject {
  created: number;
  id: number;
  name: string;
}

export interface LegacyProjectProcessing extends DataExport.ExportArcProjects {
  originId: number;
}

/**
 * Tests if the data import is a single request export.
 *
 * @param data Imported data
 * @returns True if `data` represents single request
 */
export declare function isSingleRequest(data: any): boolean;

/**
 * Transforms the first ARC data object to current schema.
 */
export declare class ArcLegacyTransformer extends BaseTransformer {
  /**
   * Transforms legacy ARC export object into current export data model.
   *
   * @returns New data model object.
   */
  transform(): Promise<DataExport.ArcExportObject>;

  /**
   * Returns a list of projects from a legacy export file.
   *
   * Each project will have newly generated ID to not make conflicts with
   * existing projects. Old project id is moved to the `originId` property.
   *
   * @param projects List of legacy project objects
   * @return List of project object in current data model. It can be an empty array.
   */
  transformProjects(projects: LegacyProject[]): LegacyProjectProcessing[];

  /**
   * Transform the list of requests into new data model.
   */
  transformRequests(requests: LegacyRequest[], projects: LegacyProjectProcessing[]): DataExport.ExportArcSavedRequest[];

  /**
   * Transforms a single request object into current data model.
   *
   * Note that required properties will be default to the following:
   * -   `name` - "unnamed"
   * -   `url` - "http://"
   * -   `method` - "GET"
   *
   * @param item Legacy request definition
   * @param projects List of projects in the import file.
   * @returns Current model of the request object.
   */
  transformRequest(item: LegacyRequest, projects?: LegacyProjectProcessing[]): DataExport.ExportArcSavedRequest;

  /**
   * Finds a project in the list of projects.
   *
   * @param projectId A project ID to search for
   * @param projects List of project to look into. It compares the
   * `_oldId` property of the list items.
   * @returns A project object or undefined if not found.
   */
  findProject(projectId: number, projects: LegacyProjectProcessing[]): LegacyProjectProcessing|undefined;
}
