import { DataExport } from '@advanced-rest-client/arc-types';
import {PostmanTransformer} from './PostmanTransformer';

export declare interface PostmanBackupV1 {
  version: number;
  collections?: PostmanCollection[];
  environments?: PostmanEnvironment[];
  headerPresets?: PostmanHeadersPreset[];
  globals?: PostmanVariable[];
}

export declare interface PostmanCollection {
  id: string;
  name: string;
  description: string;
  order: string[];
  folders?: PostmanFolder[];
  folders_order: string[];
  timestamp: number;
  synced: boolean;
  remote_id: number;
  owner: number;
  sharedWithTeam: boolean;
  subscribed: boolean;
  remoteLink: string;
  remoteLinkUpdatedAt: string;
  public: boolean;
  createdAt: number;
  updatedAt: number;
  write: boolean;
  published: boolean;
  favorite: boolean;
  requests: PostmanRequest[];
}
export declare interface PostmanRequest {
  id: string;
  name: string;
  time: number;
  headers: string;
  url: string;
  queryParams: PostmanParameter[];
  headerData: PostmanParameter[];
  pathVariableData: PostmanParameter[];
  preRequestScript: string;
  method: string;
  collectionId: string;
  data: string|PostmanBodyParam[]|null;
  dataMode: string;
  description: string;
  descriptionFormat: string;
  version: number;
  tests: string;
  currentHelper: string;
}
export declare interface PostmanEnvironment {
  id: string;
  name: string;
  timestamp: number;
  synced: boolean;
  values: PostmanParameter[];
}
export declare interface PostmanHeadersPreset {
  id: string;
  name: string;
  headers: PostmanHeader[];
  timestamp: number;
}
export declare interface PostmanParameter {
  enabled: boolean;
  key: string;
  value: string;
  type: string;
}
export declare interface PostmanBodyParam extends PostmanParameter {
  description: string;
}
export declare interface PostmanVariable extends PostmanParameter {
}
export declare interface PostmanHeader extends PostmanParameter {
  description: string;
  warning: string;
}
export declare interface PostmanFolder {
  name: string;
  description: string;
  collectionId: string;
  collection: string;
  order: string[];
  owner: number;
  folders_order: string[];
  createdAt: number;
  updatedAt: number;
  id: string;
  collection_id: string;
}
export declare interface PostmanArcRequestData {
  projects: DataExport.ExportArcProjects[];
  requests: DataExport.ExportArcSavedRequest[];
}
export declare interface PostmanArcCollection {
  project: DataExport.ExportArcProjects;
  requests: DataExport.ExportArcSavedRequest[];
}

/**
 * Transformer for Postamn backup file.
 */
export declare class PostmanBackupTransformer extends PostmanTransformer {

  /**
   * Transforms `_data` into ARC data model.
   *
   * @returns Promise resolved when data are transformed.
   */
  transform(): Promise<DataExport.ArcExportObject>;

  /**
   * Iterates over collection requests array and transforms objects
   * to ARC requests.
   *
   * @returns List of ARC request objects.
   */
  readRequestsData(data: PostmanCollection[]): PostmanArcRequestData;

  /**
   * Reads collections data.
   *
   * @returns Map of projects and requests.
   */
  readCollectionData(collection: PostmanCollection, index: number): PostmanArcCollection;

  /**
   * Creates ordered list of requests as defined in collection order property.
   * This creates a flat structure of requests and order assumes ARC's flat
   * structure.
   *
   * @returns List of ordered Postman requests
   */
  computeRequestsOrder(collection: PostmanCollection): PostmanRequest[];

  /**
   * Computes list of folders including sub-folders .
   *
   * @param folders Collection folders definition
   * @param orderIds Collection order info array
   * @returns Ordered list of folders.
   */
  computeOrderedFolders(folders: PostmanFolder[], orderIds: string[]): PostmanFolder[];

  /**
   * Transforms postman request to ARC request
   *
   * @param item Postman request object
   * @param project Project object
   * @param projectIndex Order index of the request in the project
   * @returns ARC request object
   */
  createRequestObject(item: PostmanRequest, project: DataExport.ExportArcProjects): DataExport.ExportArcSavedRequest;

  /**
   * Computes list of variables to import.
   *
   * @param data Postman import object
   * @returns List of variables or undefined if no variables
   * found.
   */
  computeVariables(data: PostmanBackupV1): DataExport.ExportArcVariable[]|undefined;

  /**
   * Creates a variable object item.
   *
   * @param item Postman's variable definition.
   * @param environment Environment name
   * @returns ARC's variable definition.
   */
  computeVariableObject(item: PostmanVariable, environment: string): DataExport.ExportArcVariable;
}
