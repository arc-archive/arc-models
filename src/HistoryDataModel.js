/* eslint-disable no-plusplus */
/* eslint-disable class-methods-use-this */
/**
@license
Copyright 2017 The Advanced REST client authors <arc@mulesoft.com>
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
*/
import { v4 } from '@advanced-rest-client/uuid';
import { TransportEventTypes, ArcModelEvents } from '@advanced-rest-client/events';
import { BodyProcessor } from '@advanced-rest-client/libs';
import { ArcBaseModel } from './ArcBaseModel.js';
import { normalizeRequest } from './Utils.js';
import { computePayloadSize, calculateBytes } from './lib/DataSize.js';

/** @typedef {import('@advanced-rest-client/events').ApiResponseEvent} ApiResponseEvent */
/** @typedef {import('@advanced-rest-client/events').ArcRequest.TransportRequest} TransportRequest */
/** @typedef {import('@advanced-rest-client/events').ArcRequest.ArcBaseRequest} ArcBaseRequest */
/** @typedef {import('@advanced-rest-client/events').ArcRequest.ARCHistoryRequest} ARCHistoryRequest */
/** @typedef {import('@advanced-rest-client/events').ArcResponse.Response} Response */
/** @typedef {import('@advanced-rest-client/events').ArcResponse.ErrorResponse} ErrorResponse */
/** @typedef {import('@advanced-rest-client/events').ArcResponse.RequestTime} RequestTime */
/** @typedef {import('@advanced-rest-client/events').ArcResponse.TransformedPayload} TransformedPayload */
/** @typedef {import('@advanced-rest-client/events').HistoryData.HistoryData} HistoryData */

export const responseHandler = Symbol('responseHandler');
export const saveHistoryData = Symbol('saveHistoryData');
export const updateHistory = Symbol('saveHistoryData');
export const createHistoryDataModel = Symbol('createHistoryDataModel');
export const createEmptyTimings = Symbol('createEmptyTimings');
export const computeHistoryStoreUrl = Symbol('computeHistoryStoreUrl');
export const computeHistoryDataId = Symbol('computeHistoryDataId');
export const prepareResponseBody = Symbol('prepareResponseBody');
export const computeTotalTime = Symbol('computeTotalTime');

/**
 * The model that stores requests history object (for the history menu and panel)
 * and the HAR-like object for each request made with ARC.
 */
export class HistoryDataModel extends ArcBaseModel {

  // static get properties() {
  //   return {
  //     /** 
  //      * When set the element won't store history request as ARC history.
  //      * It does not change the history data.
  //      */
  //     historyDisabled: { type: Boolean },
  //     /** 
  //      * When set the element won't store history data.
  //      * It does not change the history request.
  //      */
  //     dataDisabled: { type: Boolean },
  //   };
  // }

  constructor() {
    super('history-data');
    this.historyDisabled = false;
    this.dataDisabled = false;
    this[responseHandler] = this[responseHandler].bind(this);
  }

  /**
   * @param {EventTarget} node
   */
  listen(node) {
    super.listen(node);
    node.addEventListener(TransportEventTypes.response, this[responseHandler]);
  }

  /**
   * @param {EventTarget} node
   */
  unlisten(node) {
    super.unlisten(node);
    node.removeEventListener(TransportEventTypes.response, this[responseHandler]);
  }

  /**
   * Processes API response action.
   * @param {ApiResponseEvent} e
   */
  [responseHandler](e) {
    const { request, response, source } = e.detail;
    const typedError = /** @type ErrorResponse */ (response);
    if (typedError.error) {
      return;
    }
    const typedResponse = /** @type Response */ (response);
    // Async so the response can be rendered to the user faster.
    setTimeout(() => this.saveHistory(request, typedResponse, source));
  }

  /**
   * Saves request and response data in history.
   *
   * @param {TransportRequest} request The transport generated request object
   * @param {Response} response ARC response object
   * @param {ArcBaseRequest} source The source request object
   * @return {Promise<void>}
   */
  async saveHistory(request, response, source) {
    try {
      await this[saveHistoryData](request, response);
      await this[updateHistory](source, request, response);
    } catch (cause) {
      this._handleException(cause);
    }
  }

  /**
   * Saves historical request and response data in the data store.
   * This (for now) has no UI surface and is not technically processed. It is to be used
   * to analyze the data for API generation and also to show history analysis.
   * @param {TransportRequest} request The transport generated request object
   * @param {Response} response ARC response object
   * @return {Promise<void>}
   */
  async [saveHistoryData](request, response) {
    if (this.dataDisabled) {
      return;
    }
    const doc = await this[createHistoryDataModel](request, response);
    try {
      await this.db.put(doc);
    } catch (e) {
      this._handleException(e);
    }
  }

  /**
   * Creates an entry in the ARC request history
   * @param {ArcBaseRequest} source The source request from the editor
   * @param {TransportRequest} request The transport generated request object
   * @param {Response} response ARC response
   * @return {Promise<void>}
   */
  async [updateHistory](source, request, response) {
    if (this.historyDisabled) {
      return;
    }
    const responseCopy = { ...response };
    responseCopy.payload = this[prepareResponseBody](responseCopy.payload);
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const encoded = encodeURIComponent(source.url);
    const id = `${d.getTime()}/${encoded}/${source.method}`;
    const copy = { ...source, type: 'history', _id: id };
    const normalized = normalizeRequest(copy);
    const transportCopy = await BodyProcessor.payloadToString(normalizeRequest(request));
    const created = request.startTime;
    const updated = request.endTime;
    const doc = /** @type ARCHistoryRequest */ ({
      ...normalized,
      updated,
      created,
      response: responseCopy,
      transportRequest: transportCopy,
    });
    await ArcModelEvents.Request.store(this, 'history', doc);
  }

  /**
   * @param {TransportRequest} request The transport generated request object
   * @param {Response} response ARC response object
   * @returns {Promise<HistoryData>} 
   */
  async [createHistoryDataModel](request, response) {
    const url = this[computeHistoryStoreUrl](request.url);
    const id = this[computeHistoryDataId](url, request.method);
    const timings = response.timings || this[createEmptyTimings]();
    const totalTime = this[computeTotalTime](timings);
    const requestPayloadSize = await computePayloadSize(request.payload);
    const responsePayloadSize = await computePayloadSize(response.payload);
    const requestHeadersSize = calculateBytes(request.headers);
    const responseHeadersSize = calculateBytes(response.headers);
    const requestCopy = await BodyProcessor.payloadToString(request);
    const responsePayload = this[prepareResponseBody](response.payload);
    const doc = /** @type HistoryData */ ({
      _id: id,
      timings,
      totalTime,
      created: request.startTime,
      request: {
        headers: request.headers,
        payload: requestCopy.payload,
        url: request.url,
        method: request.method,
        // @ts-ignore
        multipart: requestCopy.multipart,
        // @ts-ignore
        blob: requestCopy.blob,
      },
      response: {
        statusCode: response.status,
        statusText: response.statusText,
        headers: response.headers,
        payload: responsePayload,
      },
      stats: {
        request: {
          headersSize: requestHeadersSize,
          payloadSize: requestPayloadSize,
        },
        response: {
          headersSize: responseHeadersSize,
          payloadSize: responsePayloadSize,
        }
      }
    });
    return doc;
  }

  /**
   * @returns {RequestTime} Empty request timings in case they were missing.
   */
  [createEmptyTimings]() {
    return {
      blocked: -1,
      connect: -1,
      receive: -1,
      send: -1,
      ssl: -1,
      wait: -1,
      dns: -1,
    };
  }

  /**
   * Produces valid URL to be used in the history-data store.
   * The URL is stripped from query parameters and hash.
   *
   * @param {string} url A URL to process
   * @returns {string} Indexable history data id
   */
  [computeHistoryStoreUrl](url) {
    let value = url;
    try {
      const parser = new URL(url);
      parser.search = '';
      parser.hash = '';
      value = parser.toString();
    } catch (e) {
      // ..
    }
    if (value) {
      let i = value.indexOf('?');
      if (i !== -1) {
        value = value.substr(0, i);
      }
      i = value.indexOf('#');
      if (i !== -1) {
        value = value.substr(0, i);
      }
    }
    return value;
  }

  /**
   * Computes an id value for the `history-data` data store.
   *
   * @param {string} url The request URL with removed query parameters and the hash.
   * @param {string} method HTTP method name.
   * @return {string} Generated unique for this request data store ID. It uses
   * UUID generator to add some random data to the ID except for the
   * URL and method.
   */
  [computeHistoryDataId](url, method) {
    const uuid = v4();
    const encoded = encodeURIComponent(url);
    return `${encoded}/${method}/${uuid}`;
  }

  /**
   * Replaces buffer with base64 string in response's payload
   * @param {string|Buffer|ArrayBuffer|TransformedPayload} body The response body
   * @returns {string|TransformedPayload} Either the string (when input is a string) or
   * an object with the original type and data 
   */
  [prepareResponseBody](body) {
    if (!body) {
      return undefined;
    }
    const typedBuffer = /** @type Buffer */(body);
    /* istanbul ignore if */
    if (typeof typedBuffer.copy === 'function') {
      return {
        type: 'Buffer',
        data: [...typedBuffer],
      };
    }
    const typedArrayBuffer = /** @type ArrayBuffer */(body);
    if (typedArrayBuffer.byteLength) {
      const view = new Uint8Array(typedArrayBuffer);
      return {
        type: 'ArrayBuffer',
        data: Array.from(view),
      };
    }
    return String(body);
  }

  /**
   * Computes total time of the request from the timings object.
   *
   * @param {RequestTime} timings Rhe request timings.
   * @return {number} Sum of times in the `timings` object. The `-1` values are ignored.
   */
  [computeTotalTime](timings) {
    const values = Object.keys(timings).map((key) => timings[key]);
    let total = values.reduce((sum, value) => {
      if (value > -1) {
        return sum + value;
      }
      return sum;
    }, 0);
    if (total === 0) {
      total = -1;
    }
    return total;
  }
}
