/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */

import { dataValue } from './BaseTransformer.js';
import { PostmanTransformer } from './PostmanTransformer.js';

/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcSavedRequest} ExportArcSavedRequest */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcProjects} ExportArcProjects */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ArcExportObject} ArcExportObject */
/** @typedef {import('./PostmanV1Transformer').PostmanV1} PostmanV1 */
/** @typedef {import('./PostmanV1Transformer').PostmanRequest} PostmanRequest */
/** @typedef {import('./PostmanV1Transformer').PostmanFolder} PostmanFolder */

/**
 * Transforms Postamn v1 collections to ARC import object.
 */
export class PostmanV1Transformer extends PostmanTransformer {
  /**
   * Transforms `_data` into ARC data model.
   * @return {Promise<ArcExportObject>} Promise resolved when data are transformed.
   */
  async transform() {
    const project = this.readProjectInfo();
    const requests = this.readRequestsData(project);
    const result = {
      createdAt: new Date().toISOString(),
      version: 'postman-collection-v1',
      kind: 'ARC#Import',
      requests,
      projects: [project]
    };
    return result;
  }

  /**
   * Creates the project model baqsed on Postman collections
   *
   * @return {ExportArcProjects} Arc project data model.
   */
  readProjectInfo() {
    const raw = /** @type PostmanV1 */ (this[dataValue]);

    let time = Number(raw.timestamp);
    if (Number.isNaN(time)) {
      time = Date.now();
    }
    const result = {
      kind: 'ARC#ProjectData',
      key: raw.id,
      name: raw.name,
      description: raw.description,
      created: time,
      updated: time,
      order: 0
    };
    return result;
  }

  /**
   * Iterates over collection requests array and transforms objects to ARC requests.
   *
   * @param {ExportArcProjects} project Project object
   * @return {ExportArcSavedRequest[]} List of ARC request objects.
   */
  readRequestsData(project) {
    const raw = /** @type PostmanV1 */ (this[dataValue]);

    let result = [];
    if (!raw.requests || !raw.requests.length) {
      return result;
    }

    const requests = this.computeRequestsInOrder();
    result = requests.map((postmanRequest) =>
      this.postmanRequestToArc(postmanRequest, project));
    return result;
  }

  /**
   * Creates ordered list of requests as defined in collection order property.
   * This creates a flat structure of requests and order assumes ARC's flat
   * structure.
   *
   * @return {PostmanRequest[]} List of ordered Postman requests
   */
  computeRequestsInOrder() {
    const raw = /** @type PostmanV1 */ (this[dataValue]);

    let ordered = [];
    if (raw.order && raw.order.length) {
      ordered = ordered.concat(raw.order);
    }
    const folders = this.computeOrderedFolders(raw.folders, raw.folders_order);
    if (folders) {
      folders.forEach((folder) => {
        if (folder.order && folder.order.length) {
          ordered = ordered.concat(folder.order);
        }
      });
    }
    const {requests} = raw;
    let result = ordered.map((id) => {
      return requests.find((request) => request.id === id);
    });
    result = result.filter((item) => !!item);
    return result;
  }

  /**
   * Computes list of folders including sub-folders .
   *
   * @param {PostmanFolder[]} folders Collection folders definition
   * @param {string[]} orderIds Collection order info array
   * @return {PostmanFolder[]} Ordered list of folders.
   */
  computeOrderedFolders(folders, orderIds) {
    if (!folders || !folders.length) {
      return folders;
    }
    if (!orderIds || !orderIds.length) {
      return folders;
    }
    const result = [];
    const copy = Array.from(folders);
    orderIds.forEach((id) => {
      const i = copy.findIndex((item) => item.id === id);
      if (i === -1) {
        return;
      }
      result[result.length] = copy[i];
      copy.splice(i, 1);
    });
    return result;
  }

  /**
   * Transforms postman request to ARC request
   * @param {PostmanRequest} item Postman request object
   * @param {ExportArcProjects} project Project object
   * @return {ExportArcSavedRequest} ARC request object
   */
  postmanRequestToArc(item, project) {
    const raw = /** @type PostmanV1 */ (this[dataValue]);
    item.name = item.name || 'unnamed';
    let url = item.url || 'http://';
    url = this.ensureVariablesSyntax(url);
    let method = item.method || 'GET';
    method = this.ensureVariablesSyntax(method);
    let headers = item.headers || '';
    headers = this.ensureVariablesSyntax(headers);
    const body = this.computeBodyOld(item);
    const copy = {
      ...item,
      type: 'saved',
      kind: 'ARC#RequestData',
      key: undefined,
    }
    const id = this.generateRequestId(copy, raw.id);
    let created = Number(item.time);
    if (Number.isNaN(created)) {
      created = Date.now();
    }
    const result = /** @type ExportArcSavedRequest */({
      kind: 'ARC#RequestData',
      key: id,
      created,
      updated: Date.now(),
      headers: headers || '',
      method,
      name: item.name,
      payload: body,
      type: 'saved',
      url,
    });
    if (project) {
      this.addProjectReference(result, project.key);
      this.addRequestReference(project, id);
    }
    if (item.description) {
      result.description = item.description;
    }
    // @ts-ignore
    if (item.multipart) {
      // @ts-ignore
      result.multipart = item.multipart;
    }
    return result;
  }
}
