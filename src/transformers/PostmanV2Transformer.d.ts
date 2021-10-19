import { DataExport } from '@advanced-rest-client/events';
import {PostmanTransformer} from './PostmanTransformer.js';

export declare const currentItemValue: unique symbol;

export declare interface PostmanInfo {
  /**
   * Name of the collection
   */
  name: string;
  /**
   * This should ideally hold a link to the Postman schema that is used to validate this collection. E.g: https://schema.getpostman.com/collection/v1
   */
  schema: string;
  /**
   * Every collection is identified by the unique value of this field. The value of this field is usually easiest to generate using a UID generator function. If you already have a collection, it is recommended that you maintain the same id since changing the id usually implies that is a different collection than it was originally.\n *Note: This field exists for compatibility reasons with Collection Format V1.
   */
  _postman_id?: string;
  description?: string;
}

export declare interface PostmanRequestUrl {
  raw?: string;
  protocol?: string;
  host?: string | string[];
  path?: string | string[];
  port?: string;
}
export declare interface PostmanParameter {
  key?: string|null;
  value?: string|null;
  disabled?: boolean;
  description?: string;
}
export declare interface PostmanRequestUrlQuery extends PostmanParameter {
}
export declare interface PostmanHeader extends PostmanParameter {
}
export declare interface PostmanUrlEncoded extends PostmanParameter {
  type?: string;
}
export declare interface PostmanFormData extends PostmanParameter {
  type?: string;
  src?: string;
  contentType?: string;
}
export declare interface PostmanFile {
  src: string|null;
  contentType?: string;
}
export declare interface PostmanBody {
  mode: string | null;
  raw?: string;
  urlencoded?: PostmanUrlEncoded[];
  formdata?: PostmanFormData[];
  file?: PostmanFile;
}

export declare interface PostmanRequest {
  url?: string | PostmanRequestUrl;
  method?: string;
  description?: string;
  header?: string|PostmanHeader[];
  body?: PostmanBody;
}

export declare interface PostmanResponse {
}

export declare interface PostmanItem {
  /**
   * A unique ID that is used to identify collections internally
   */
  id?: string;
  /**
   * Name of the collection
   */
  name?: string;
  description?: string;
  request: PostmanRequest;
  response?: PostmanResponse[];
}

export declare interface PostmanItemGroup {
  /**
   * A folder's friendly name is defined by this field. You would want to set this field to a value that would allow you to easily identify this folder.
   */
  name?: string;
  description?: string;
  item: PostmanItem[] | PostmanItemGroup[];
}

export declare interface PostmanV2 {
  variables?: any[];
  info: PostmanInfo;
  item: PostmanItem[] | PostmanItemGroup[];
}

/**
 * Transforms Postman v2 collections to ARC import object.
 */
export declare class PostmanV2Transformer extends PostmanTransformer {

  chunkSize: number;
  [currentItemValue]: number;

  /**
   * @param data Import data object
   */
  constructor(data: any);

  /**
   * Transforms the import data into an ARC export object.
   *
   * @returns Promise resolved when data are transformed.
   */
  transform(): Promise<DataExport.ArcExportObject>;

  /**
   * Creates the project model based on Postman collection
   *
   * @param requests list of read requests
   * @returns Arc project data model.
   */
  readProjectInfo(requests: DataExport.ExportArcSavedRequest[]): DataExport.ExportArcProjects;

  /**
   * Iterates over collection requests array and transforms objects
   * to ARC requests.
   *
   * @returns Promise resolved to list of ARC request objects.
   */
  readRequestsData(): Promise<DataExport.ExportArcSavedRequest[]>;

  /**
   * Extracts all requests in order from postman v2 collection.
   *
   * @param data List of Postman V2 collection `item`.
   * (why it's called item and not items?)
   * @param result Array where to append results.
   * @returns Promise resolved when all objects are computed.
   */
  extractRequestsV2(data: (PostmanItem|PostmanItemGroup)[], result?: DataExport.ExportArcSavedRequest[]): Promise<DataExport.ExportArcSavedRequest[]>;

  /**
   * Computes ARC request out of Postman v2 item.
   *
   * @param item Postman v2 item.
   * @returns ARC request object.
   */
  computeArcRequest(item: PostmanItem): DataExport.ExportArcSavedRequest;

  /**
   * Computes headers string from item's headers.
   *
   * @param headers Postman Request.header model.
   * @returns Computed value of headers.
   */
  computeHeaders(headers: string|PostmanHeader[]): string;

  /**
   * Computes body value for v2 request.body.
   *
   * @param body v2 request.body
   * @param item ARC request object.
   * @returns Body value as string.
   */
  computePayload(body: PostmanBody, item: DataExport.ExportArcSavedRequest): string;

  /**
   * Computes body as a FormData data model.
   * This function sets `multipart` property on the item.
   *
   * @param items List of `formdata` models.
   * @param item ARC request object.
   * @returns Body value. Always empty string.
   */
  formDataBody(items: PostmanFormData[], item: DataExport.ExportArcSavedRequest): string;
  /**
   * Computes body as a URL encoded data model.
   *
   * @param items List of `urlencoded` models.
   * @returns Body value.
   */
  urlEncodedBody(items: PostmanUrlEncoded[]): string;
}
