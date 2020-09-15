// import {ARCSavedRequest} from '@advanced-rest-client/arc-models';
import {DataExport} from '@advanced-rest-client/arc-types';
import {Creator, Browser, Page, Entry, Header} from 'har-format/index';
import {BaseTransformer} from './BaseTransformer.js';

export declare interface DexieExport {
  kind: string;
  createdAt: string;
  version: string;
  requests?: DexieRequest[];
  projects?: DexieProject[];
}

export declare interface DexieRequest {
  order: number;
  url: string;
  method: string;
  type: string;
  updateTime: number;
  id: string;
  kind: string;
  har: DexieHar;
  _har?: DexieHar;
  name?: string;
  _name?: string;
  referenceEntry?: number;
  driveId?: string;
}

export declare interface DexieHar {
  comment: string;
  version: string;
  creator: Creator;
  browser: Browser;
  pages: Page[];
  entries: Entry[];
}

export declare interface DexieProject {
  order: number;
  created: number;
  updateTime: number;
  requestIds: string[];
  name: string;
  kind: string;
  id: number;
}

export declare interface ProjectItem {
  updateData: string[];
  legacyProject: DataExport.ExportArcProjects;
}

export declare interface RequestProcessItem {
  origin: string;
  request: DataExport.ExportArcSavedRequest | DataExport.ExportArcHistoryRequest;
}

export declare interface ProcessedRequests {
  saved: RequestProcessItem[];
  history: RequestProcessItem[];
}

/**
 * Transforms Dexie system (legacy system) into current data model.
 */
export declare class ArcDexieTransformer extends BaseTransformer {
  /**
   * Transforms legacy ARC export object based on Dexie data store
   * into current export data model.
   *
   * @returns New data model object.
   */
  transform(): Promise<DataExport.ArcExportObject>;

  /**
   * In new structure projects do not have a refference to request ids. It's
   * the other way around in previous system.
   * It's a bad pattern for object stores but it must suffice for now.
   *
   * @param projects List of projects in the import.
   * @returns preprocessed projects array
   */
  processProjects(projects: DexieProject[]): ProjectItem[];

  /**
   * Creates a pre-processed project data.
   *
   * @param item Project object from the import.
   * @returns Pre-processed project object with project store data
   * under the `legacyProject` property and list of requests IDs under
   * the `updateData` property.
   */
  processProjectItem(item: DexieProject): ProjectItem;

  /**
   * History is placed in its own store, saved items has own store.
   * Har data are not imported this way as user cannot actually use it.
   *
   * @param requests List of requests objects from the import file.
   * @returns A promise resolved when import is ready.
   */
  parseRequests(requests: DexieRequest[]): Promise<ProcessedRequests>;

  /**
   * Parses the request data.
   * It takes only portion of the data to parse so the script release the
   * event loop and ANR screen won't appear.
   *
   * @param requests List of requests from the import.
   * @param done A callkback function to be called when ready.
   * @param saved Final list of saved requests
   * @param history Final list of history items.
   */
  parseRequestsDeffered(requests: DexieRequest[], done: Function, saved?: RequestProcessItem[], history?: RequestProcessItem[]): void;
  parseHistoryItem(item: DexieRequest): RequestProcessItem;
  parseSavedItem(item: DexieRequest): RequestProcessItem;
  parseDriveItem(item: DexieRequest): RequestProcessItem;
  parseHarHeders(arr: Header[]): string;

  /**
   * Associate requests with project data.
   *
   * @param data Parsed requests object
   * @param projects List of projects
   * @returns Parsed requests object
   */
  associateProjects(data: ProcessedRequests, projects: ProjectItem[]): ProcessedRequests;
}
