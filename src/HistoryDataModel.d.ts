import { ArcBaseModel } from './ArcBaseModel.js';
import { ArcRequest, ArcResponse, HistoryData } from '@advanced-rest-client/events';
import { ApiResponseEvent } from '@advanced-rest-client/events';

export declare const responseHandler:  unique symbol;
export declare const saveHistoryData:  unique symbol;
export declare const updateHistory:  unique symbol;
export declare const createHistoryDataModel:  unique symbol;
export declare const createEmptyTimings:  unique symbol;
export declare const computeHistoryStoreUrl:  unique symbol;
export declare const computeHistoryDataId:  unique symbol;
export declare const prepareResponseBody:  unique symbol;
export declare const computeTotalTime:  unique symbol;

/**
 * The model that stores requests history object (for the history menu and panel)
 * and the HAR-like object for each request event made.
 * 
 * This element should be added to the dom to add support for the ARC history.
 */
export class HistoryDataModel extends ArcBaseModel {
  /** 
   * When set the element won't store history request as ARC history.
   * It does not change the history data.
   */
  historyDisabled: boolean;
  /** 
   * When set the element won't store history data.
   * It does not change the history request.
   */
  dataDisabled: boolean;

  constructor();

  /**
   * Processes API response action.
   * @param {ApiResponseEvent} e
   */
  [responseHandler](e: ApiResponseEvent): void;

  /**
   * Saves request and response data in history.
   *
   * @param request The transport generated request object
   * @param response ARC response object
   * @param source The source request object
   */
  saveHistory(request: ArcRequest.TransportRequest, response: ArcResponse.Response, source: ArcRequest.ArcBaseRequest): Promise<void>;

  /**
   * Saves historical request and response data in the data store.
   * This (for now) has no UI surface and is not technically processed. It is to be used
   * to analyze the data for API generation and also to show history analysis.
   * @param {TransportRequest} request The transport generated request object
   * @param {Response} response ARC response object
   * @return {Promise<void>}
   */
  [saveHistoryData](request: ArcRequest.TransportRequest, response: ArcResponse.Response): Promise<void>;

  /**
   * Creates an entry in the ARC request history
   * @param {ArcBaseRequest} source The source request from the editor
   * @param {TransportRequest} request The transport generated request object
   * @param {Response} response ARC response
   * @return {Promise<void>}
   */
  [updateHistory](source: ArcRequest.ArcBaseRequest, request: ArcRequest.TransportRequest, response: ArcResponse.Response): Promise<void>;

  /**
   * @param {TransportRequest} request The transport generated request object
   * @param {Response} response ARC response object
   */
  [createHistoryDataModel](request: ArcRequest.TransportRequest, response: ArcResponse.Response): Promise<HistoryData.HistoryData>;

  /**
   * @returns Empty request timings in case they were missing.
   */
  [createEmptyTimings](): ArcResponse.RequestTime;

  /**
   * Produces valid URL to be used in the history-data store.
   * The URL is stripped from query parameters and hash.
   *
   * @param {string} url A URL to process
   * @returns {string} Indexable history data id
   */
  [computeHistoryStoreUrl](url: string): string;

  /**
   * Computes an id value for the `history-data` data store.
   *
   * @param {string} url The request URL with removed query parameters and the hash.
   * @param {string} method HTTP method name.
   * @return {string} Generated unique for this request data store ID. It uses
   * UUID generator to add some random data to the ID except for the
   * URL and method.
   */
  [computeHistoryDataId](url: string, method: string): string;

  /**
   * Replaces buffer with base64 string in response's payload
   * @param {Response} response ARC response object
   * @returns {Response} The copy of the response object with payload as string.
   */
  [prepareResponseBody](body: string|Buffer|ArrayBuffer|ArcResponse.TransformedPayload): string|ArcResponse.TransformedPayload;

  /**
   * Computes total time of the request from the timings object.
   *
   * @param timings Rhe request timings.
   * @return Sum of times in the `timings` object. The `-1` values are ignored.
   */
  [computeTotalTime](timings: ArcResponse.RequestTime): number;
}
