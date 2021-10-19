/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */

import { v4 } from '@advanced-rest-client/uuid';
import { dataValue } from './BaseTransformer.js';
import { PostmanTransformer } from './PostmanTransformer.js';

/** @typedef {import('@advanced-rest-client/events').DataExport.ExportArcSavedRequest} ExportArcSavedRequest */
/** @typedef {import('@advanced-rest-client/events').DataExport.ExportArcProjects} ExportArcProjects */
/** @typedef {import('@advanced-rest-client/events').DataExport.ArcExportObject} ArcExportObject */
/** @typedef {import('@advanced-rest-client/events').DataExport.ExportArcVariable} ExportArcVariable */
/** @typedef {import('./PostmanBackupTransformer').PostmanBackupV1} PostmanBackupV1 */
/** @typedef {import('./PostmanBackupTransformer').PostmanCollection} PostmanCollection */
/** @typedef {import('./PostmanBackupTransformer').PostmanArcRequestData} PostmanArcRequestData */
/** @typedef {import('./PostmanBackupTransformer').PostmanArcCollection} PostmanArcCollection */
/** @typedef {import('./PostmanBackupTransformer').PostmanFolder} PostmanFolder */
/** @typedef {import('./PostmanBackupTransformer').PostmanRequest} PostmanRequest */
/** @typedef {import('./PostmanBackupTransformer').PostmanVariable} PostmanVariable */

/**
 * Transformer for Postman backup file.
 */
export class PostmanBackupTransformer extends PostmanTransformer {
  /**
   * Transforms `_data` into ARC data model.
   * @return {Promise} Promise resolved when data are transformed.
   */
  transform() {
    const raw = /** @type PostmanBackupV1 */ (this[dataValue]);

    const collections = this.readRequestsData(raw.collections);
    const result = {
      createdAt: new Date().toISOString(),
      version: 'postman-backup',
      kind: 'ARC#Import',
      requests: collections.requests,
      projects: collections.projects,
    };
    const variables = this.computeVariables(raw);
    if (variables && variables.length) {
      result.variables = variables;
    }
    return Promise.resolve(result);
  }

  /**
   * Iterates over collection requests array and transforms objects
   * to ARC requests.
   *
   * @param {PostmanCollection[]} data
   * @return {PostmanArcRequestData} List of ARC request objects.
   */
  readRequestsData(data) {
    const result = {
      projects: [],
      requests: [],
    };
    if (!data || !data.length) {
      return result;
    }
    const parts = data.map((item, index) => this.readCollectionData(item, index));
    parts.forEach((part) => {
      result.projects.push(part.project);
      result.requests = result.requests.concat(part.requests);
    });
    return result;
  }

  /**
   * Reads collections data.
   *
   * @param {PostmanCollection} collection
   * @param {Number} index
   * @return {PostmanArcCollection} Map of projects and requests.
   */
  readCollectionData(collection, index) {
    const project = /** @type ExportArcProjects */ ({
      kind: 'ARC#ProjectData',
      key: collection.id,
      name: collection.name,
      description: collection.description,
      order: index,
      created: collection.createdAt,
      updated: collection.updatedAt,
    });
    const requests = this.computeRequestsOrder(collection);
    const result = {
      project,
      requests: requests.map((item) => this.createRequestObject(item, project)),
    };
    return result;
  }

  /**
   * Creates ordered list of requests as defined in collection order property.
   * This creates a flat structure of requests and order assumes ARC's flat
   * structure.
   *
   * @param {PostmanCollection} collection
   * @return {PostmanRequest[]} List of ordered Postman requests
   */
  computeRequestsOrder(collection) {
    let ordered = [];
    if (collection.order && collection.order.length) {
      ordered = ordered.concat(collection.order);
    }
    const folders = this.computeOrderedFolders(collection.folders, collection.folders_order);
    if (folders) {
      folders.forEach((folder) => {
        if (folder.order && folder.order.length) {
          ordered = ordered.concat(folder.order);
        }
      });
    }
    const { requests } = collection;
    let result = ordered.map((id) => requests.find((request) => request.id === id));
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
      return undefined;
    }
    if (!orderIds || !orderIds.length) {
      return folders;
    }
    let result = orderIds.map((id) => folders.find((folder) => folder.id === id));
    result = result.filter((item) => !!item);
    return result;
  }

  /**
   * Transforms postman request to ARC request
   * @param {PostmanRequest} item Postman request object
   * @param {ExportArcProjects} project Project object
   * @return {ExportArcSavedRequest} ARC request object
   */
  createRequestObject(item, project) {
    const name = item.name || 'unnamed';
    let url = item.url || 'http://';
    url = this.ensureVariablesSyntax(url);
    let method = item.method || 'GET';
    method = this.ensureVariablesSyntax(method);
    let headers = item.headers || '';
    headers = this.ensureVariablesSyntax(headers);
    const body = this.computeBodyOld(item);

    let created = Number(item.time);
    if (Number.isNaN(created)) {
      created = Date.now();
    }
    const result = /** @type ExportArcSavedRequest */ ({
      key: undefined,
      created,
      updated: Date.now(),
      headers,
      method,
      name,
      payload: body,
      type: 'saved',
      url
    });
    const id = this.generateRequestId(result, project && project.key);
    result.key = id;
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

  /**
   * Computes list of variables to import.
   *
   * @param {PostmanBackupV1} data Postman import object
   * @return {ExportArcVariable[]|undefined} List of variables or undefined if no variables
   * found.
   */
  computeVariables(data) {
    const result = [];
    if (data.globals && data.globals.length) {
      data.globals.forEach((item) => {
        const obj = this.computeVariableObject(item, 'default');
        result.push(obj);
      });
    }

    if (data.environments && data.environments.length) {
      data.environments.forEach((env) => {
        if (!env.values || !env.values.length) {
          return;
        }
        const name = env.name || 'Unnamed';
        env.values.forEach((item) => {
          const obj = this.computeVariableObject(item, name);
          result.push(obj);
        });
      });
    }
    return result.length ? result : undefined;
  }

  /**
   * Creates a variable object item.
   *
   * @param {PostmanVariable} item Postman's variable definition.
   * @param {string} environment Environment name
   * @return {ExportArcVariable} ARC's variable definition.
   */
  computeVariableObject(item, environment) {
    const result = {
      kind: 'ARC#VariableData',
      key: v4(),
      enabled: item.enabled || true,
      environment,
      value: this.ensureVariablesSyntax(item.value),
      name: item.key,
    };
    return result;
  }
}
