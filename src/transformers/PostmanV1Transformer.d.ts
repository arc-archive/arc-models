import { DataExport } from '@advanced-rest-client/arc-types';
import {PostmanTransformer} from './PostmanTransformer';

export declare interface PostmanV1 {
  id: string;
  name: string;
  description?: string;
  order: string[];
  requests: PostmanRequest[];
  folders_order?: string[];
  folders?: PostmanFolder[];
  timestamp?: number;
  owner?: number;
  public?: boolean;
}

export declare interface PostmanRequest {
  folder?: string;
  id: string;
  name: string;
  dataMode?: string;
  dataDisabled?: boolean;
  data?: any;
  descriptionFormat?: string;
  description?: string;
  headers: string;
  method: string;
  url: string;
  rawModeData?: string|any[];
  collectionId?: string;
  collection?: string;
  time?: number;
  currentHelper: string;
}

export declare interface PostmanFolder {
  id: string;
  name: string;
  description?: string;
  order: string[];
  folders_order?: string[];
  collection_id?: string;
  collection?: string;
}

/**
 * Transforms Postamn v1 collections to ARC import object.
 */
export declare class PostmanV1Transformer extends PostmanTransformer {
  /**
   * Transforms `_data` into ARC data model.
   *
   * @returns Promise resolved when data are transformed.
   */
  transform(): Promise<DataExport.ArcExportObject>;

  /**
   * Creates the project model baqsed on Postman collections
   *
   * @returns Arc project data model.
   */
  readProjectInfo(): DataExport.ExportArcProjects;

  /**
   * Iterates over collection requests array and transforms objects
   * to ARC requests.
   *
   * @param project Project object
   * @returns List of ARC request objects.
   */
  readRequestsData(project: DataExport.ExportArcProjects): DataExport.ExportArcSavedRequest[];

  /**
   * Creates ordered list of requests as defined in collection order property.
   * This creates a flat structure of requests and order assumes ARC's flat
   * structure.
   *
   * @returns List of ordered Postman requests
   */
  computeRequestsInOrder(): PostmanRequest[];

  /**
   * Computes list of folders including sub-folders .
   *
   * @param folders Collection folders definition
   * @param orderIds Collection order info array
   * @returns Ordered list of folders.
   */
  computeOrderedFolders(folders: PostmanFolder[], orderIds: string[]): PostmanFolder[]|undefined;

  /**
   * Transforms postman request to ARC request
   *
   * @param item Postman request object
   * @param project Project object
   * @returns ARC request object
   */
  postmanRequestToArc(item: PostmanRequest, project: DataExport.ExportArcProjects): DataExport.ExportArcSavedRequest;
}
