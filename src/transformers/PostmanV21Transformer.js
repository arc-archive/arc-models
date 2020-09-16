/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */

import { dataValue } from './BaseTransformer.js';
import { PostmanTransformer, paramValue } from './PostmanTransformer.js';
import { aTimeout } from '../lib/ImportUtils.js';

export const currentItemValue = Symbol('currentItemValue');

/** @typedef {import('./PostmanV2Transformer').PostmanV2} PostmanV2 */
/** @typedef {import('./PostmanV2Transformer').PostmanItem} PostmanItem */
/** @typedef {import('./PostmanV2Transformer').PostmanItemGroup} PostmanItemGroup */
/** @typedef {import('./PostmanV2Transformer').PostmanHeader} PostmanHeader */
/** @typedef {import('./PostmanV2Transformer').PostmanBody} PostmanBody */
/** @typedef {import('./PostmanV2Transformer').PostmanUrlEncoded} PostmanUrlEncoded */
/** @typedef {import('./PostmanV2Transformer').PostmanFormData} PostmanFormData */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcSavedRequest} ExportArcSavedRequest */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcProjects} ExportArcProjects */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ArcExportObject} ArcExportObject */

/**
 * Transforms Postman v2.1 collections to ARC import object.
 */
export class PostmanV21Transformer extends PostmanTransformer {
  /**
   * @constructor
   * @param {object} data Import data object
   */
  constructor(data) {
    super(data);
    this.chunkSize = 200;
    this[currentItemValue] = 0;
  }

  /**
   * Transforms `_data` into ARC data model.
   * @return {Promise<ArcExportObject>} Promise resolved when data are transformed.
   */
  async transform() {
    const requests = await this.readRequestsData();
    const project = this.readProjectInfo(requests);
    const result = {
      createdAt: new Date().toISOString(),
      version: 'postman-collection-v2',
      kind: 'ARC#Import',
      requests,
      projects: [project],
    };
    return result;
  }

  /**
   * Creates the project model based on Postman collection
   *
   * @param {ExportArcSavedRequest[]} requests list of read requests
   * @return {ExportArcProjects} Arc project data model.
   */
  readProjectInfo(requests) {
    const raw = /** @type PostmanV2 */ (this[dataValue]);
    const { info } = raw;
    const time = Date.now();
    const result = {
      kind: 'ARC#ProjectData',
      key: info._postman_id,
      name: info.name,
      description: info.description,
      created: time,
      updated: time,
      order: 0
    };
    if (requests && requests.length) {
      result.requests = requests.map((item) => item._id);
    }
    return result;
  }

  /**
   * Iterates over collection requests array and transforms objects
   * to ARC requests.
   *
   * @return {Promise<ExportArcSavedRequest[]>} Promise resolved to list of ARC request objects.
   */
  async readRequestsData() {
    const raw = /** @type PostmanV2 */ (this[dataValue]);
    const data = raw.item;
    if (!data || !data.length) {
      return [];
    }
    return this.extractRequestsV2(data);
  }

  /**
   * Extracts all requests in order from postman v2 collection.
   *
   * @param {(PostmanItem|PostmanItemGroup)[]} data List of Postman V2 collection `item`.
   * (why it's called item and not items?)
   * @param {ExportArcSavedRequest[]=} result Array where to append results.
   * @return {Promise<ExportArcSavedRequest[]>} Promise resolved when all objects are computed.
   */
  async extractRequestsV2(data, result=[]) {
    const item = data.shift();
    if (!item) {
      return result;
    }
    const group = /** @type PostmanItemGroup */ (item);
    // is it a folder?
    if (group.item) {
      await this.extractRequestsV2(group.item, result);
      // Array is passed by reference so it can be reused here
      return this.extractRequestsV2(data, result);
    }
    const arcRequest = this.computeArcRequest(/** @type PostmanItem */ (item));
    result.push(arcRequest);
    const currIt = this[currentItemValue];
    if (currIt === this.chunkSize) {
      await aTimeout(16);
      this[currentItemValue] = 0;
      return this.extractRequestsV2(data, result);
    }
    this[currentItemValue] = currIt + 1;
    return this.extractRequestsV2(data, result);
  }

  /**
   * Computes ARC request out of Postman v2 item.
   *
   * @param {PostmanItem} item Postman v2 item.
   * @return {ExportArcSavedRequest} ARC request object.
   */
  computeArcRequest(item) {
    const { request } = item;
    const name = item.name || 'unnamed';
    let url;
    if (typeof request.url === 'string') {
      url = request.url;
    } else if (request.url && request.url.raw) {
      url = request.url.raw;
    } else {
      url = 'http://';
    }
    url = this.ensureVariablesSyntax(url);
    let method = request.method || 'GET';
    method = this.ensureVariablesSyntax(method);
    const header = this.ensureVarsRecursively(request.header);
    const time = Date.now();
    const result = /** @type ExportArcSavedRequest */ ({
      kind: 'ARC#RequestData',
      name,
      url,
      method,
      created: time,
      updated: time,
      type: 'saved',
      headers: this.computeHeaders(header)
    });
    const raw = /** @type PostmanV2 */ (this[dataValue]);
    const projectId = raw.info._postman_id;
    result.key = this.generateRequestId(result, projectId);
    result.payload = this.computePayload(request.body, result);
    this.addProjectReference(result, projectId);
    return result;
  }

  /**
   * Computes headers string from item's headers.
   *
   * @param {string|PostmanHeader[]} headers Postman Request.header model.
   * @return {String} Computed value of headers.
   */
  computeHeaders(headers) {
    if (typeof headers === 'string') {
      return headers;
    }
    if (!Array.isArray(headers)) {
      return '';
    }
    const tmp = headers.filter((h) => !h.disabled);
    return tmp.map((item) => `${item.key}: ${item.value}`).join('\n');
  }

  /**
   * Computes body value for v2 request.body.
   *
   * @param {PostmanBody} body v2 request.body
   * @param {ExportArcSavedRequest} item ARC request object.
   * @return {string} Body value as string.
   */
  computePayload(body, item) {
    if (!body) {
      return '';
    }
    const def = body[body.mode];
    if (!def) {
      return '';
    }
    switch (body.mode) {
      case 'raw': return this.ensureVariablesSyntax(body.raw);
      case 'formdata': return this.formDataBody(def, item);
      case 'urlencoded': return this.urlEncodedBody(def);
      default: return '';
    }
  }

  /**
   * Computes body as a FormData data model.
   * This function sets `multipart` property on the item.
   *
   * @param {PostmanFormData[]} items List of `formdata` models.
   * @param {ExportArcSavedRequest} item ARC request object.
   * @return {string} Body value. Always empty string.
   */
  formDataBody(items, item) {
    if (!Array.isArray(items)) {
      return '';
    }
    const body = this.ensureVarsRecursively(items);
    item.multipart = body.map((data) => {
      const obj = {
        enabled: !data.disabled,
        name: data.key,
        isFile: data.type === 'file',
        value: data.type === 'file' ? '' : data.value
      };
      return obj;
    });
    return '';
  }

  /**
   * Computes body as a URL encoded data model.
   *
   * @param {PostmanUrlEncoded[]} items List of `urlencoded` models.
   * @return {string} Body value.
   */
  urlEncodedBody(items) {
    if (!Array.isArray(items)) {
      return '';
    }
    const result = [];
    const model = [];
    const body = this.ensureVarsRecursively(items);
    body.forEach((data) => {
      const name = paramValue(data.key);
      const value = paramValue(data.value);
      model.push({
        name,
        value,
        enabled: !data.disabled
      });
      if (!data.disabled) {
        result.push(`${name}=${value}`);
      }
    });
    return result.join('&');
  }
}
