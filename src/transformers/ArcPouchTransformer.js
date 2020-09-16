/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */

import { v4 } from '@advanced-rest-client/uuid-generator';
import { BaseTransformer, dataValue } from './BaseTransformer.js';

/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ArcExportObject} ArcExportObject */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcSavedRequest} ExportArcSavedRequest */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcHistoryRequest} ExportArcHistoryRequest */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcProjects} ExportArcProjects */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcWebsocketUrl} ExportArcWebsocketUrl */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcUrlHistory} ExportArcUrlHistory */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcHostRule} ExportArcHostRule */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcVariable} ExportArcVariable */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcAuthData} ExportArcAuthData */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcClientCertificateData} ExportArcClientCertificateData */

/**
 * Updates `updated` property and ensures `created` property
 * @param {object} item An item to updated
 * @return {object} Shallow copy of the passed item.
 */
export function updateItemTimings(item) {
  const data = { ...item };
  if (!data.updated || Number.isNaN(data.updated)) {
    data.updated = Date.now();
  }
  if (!data.created) {
    data.created = data.updated;
  }
  return data;
}

/**
 * Transforms data exported by the PouchDB (the current system).
 */
export class ArcPouchTransformer extends BaseTransformer {
  /**
   * Transforms PouchDB ARC export object based into current export data model.
   *
   * @return {Promise<ArcExportObject>} New data model object.
   */
  async transform() {
    const data = /** @type ArcExportObject */ (this[dataValue]);
    if (data.projects && data.projects.length) {
      data.projects = this.transformProjects(data.projects);
    }
    if (data.requests && data.requests.length) {
      data.requests = this.transformRequests(data.requests, data.projects);
    }
    if (data.projects && data.projects.length) {
      data.projects.forEach((item) => {
        // @ts-ignore
        delete item._referenceId;
      });
    }
    if (data.history && data.history.length) {
      data.history = this.transformHistory(data.history);
    }
    const socketUrls = /** @type ExportArcWebsocketUrl[] */ (data['websocket-url-history'] || data.websocketurlhistory);
    if (socketUrls && socketUrls.length) {
      data.websocketurlhistory = socketUrls;
    }
    const urls = /** @type ExportArcUrlHistory[] */ (data['url-history'] || data.urlhistory);
    if (urls && urls.length) {
      data.urlhistory = urls;
    }
    const authData = /** @type ExportArcAuthData[] */ (data['auth-data'] || data.authdata);
    if (authData && authData.length) {
      data.authdata = authData;
    }
    const hostRules = /** @type ExportArcHostRule[] */ (data['host-rules'] || data.hostrules);
    if (hostRules && hostRules.length) {
      data.hostrules = hostRules;
    }
    if (!data.loadToWorkspace) {
      data.kind = 'ARC#Import';
    }
    const ccs = /** @type ExportArcClientCertificateData[] */ (data['client-certificates'] || data.clientcertificates);
    if (ccs && ccs.length) {
      data.clientcertificates = this.transformClientCertificates(ccs);
    }
    return data;
  }

  /**
   * Transforms the projects array.
   *
   * @param {ExportArcProjects[]} projects Projects list to upgrade
   * @return {ExportArcProjects[]} Processed list
   */
  transformProjects(projects) {
    return projects.map((project) => {
      if (!project.key) {
        project.key = v4();
      }
      return updateItemTimings(project);
    });
  }

  /**
   * @param {ExportArcSavedRequest[]} requests The list of requests to process
   * @param {ExportArcProjects[]=} projects List of projects
   * @return {ExportArcSavedRequest[]} Processed requests.
   */
  transformRequests(requests, projects=[]) {
    return requests.map((request) => {
      if (!request.key) {
        // @ts-ignore
        const refId = request._referenceLegacyProject || request.legacyProject;
        request.key = this.generateRequestId(request, refId);
      }
      // @ts-ignore
      const refId = request._referenceLegacyProject || request.legacyProject;
      if (refId) {
        // @ts-ignore
        delete request._referenceLegacyProject;
        // @ts-ignore
        delete request.legacyProject;
        // @ts-ignore
        const project = projects.find((item) => item.key === refId || item._referenceId === refId);
        if (project) {
          this.addProjectReference(request, project.key);
          this.addRequestReference(project, request.key);
        }
      }
      request.name = request.name || 'unnamed';
      request.url = request.url || 'http://';
      request.method = request.method || 'GET';
      request.headers = request.headers || '';
      request.payload = request.payload || '';
      return updateItemTimings(request);
    });
  }

  /**
   * @param {ExportArcHistoryRequest[]} history
   * @return {ExportArcHistoryRequest[]}
   */
  transformHistory(history) {
    return history.map((item) => {
      const result = updateItemTimings(item);
      result.url = item.url || 'http://';
      result.method = item.method || 'GET';
      result.headers = item.headers || '';
      result.payload = item.payload || '';
      if (!result.key) {
        result.key = this.generateHistoryId(item.created, item);
      }
      return result;
    });
  }

  /**
   * Transforms ARC's client certificate export object into intermediate structure
   * used by the import panel.
   *
   * @param {ExportArcClientCertificateData[]} items [description]
   * @return {ExportArcClientCertificateData[]} A list of certificates to import. In each element
   * first item is the index data and the second is the certificates data.
   */
  transformClientCertificates(items) {
    const result = [];
    items.forEach((item) => {
      if (item.kind !== 'ARC#ClientCertificate') {
        return;
      }
      const data = updateItemTimings(item);
      result[result.length] = data;
    });
    return result;
  }
}
