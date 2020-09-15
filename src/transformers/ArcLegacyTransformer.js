/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */

import { v4 } from '@advanced-rest-client/uuid-generator';
import { BaseTransformer, dataValue } from './BaseTransformer.js';

/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ArcExportObject} ArcExportObject */
/** @typedef {import('./ArcLegacyTransformer').LegacyExport} LegacyExport */
/** @typedef {import('./ArcLegacyTransformer').LegacyRequest} LegacyRequest */
/** @typedef {import('./ArcLegacyTransformer').LegacyProject} LegacyProject */
/** @typedef {import('./ArcLegacyTransformer').LegacyProjectProcessing} LegacyProjectProcessing */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcSavedRequest} ExportArcSavedRequest */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcProjects} ExportArcProjects */

/**
 * Tests if the data import is a single request export.
 *
 * @param {any} data Imported data
 * @return {boolean} True if `data` represents single request
 */
export function isSingleRequest(data) {
  if ('requests' in data || 'projects' in data) {
    return false;
  }
  return true;
}


/**
 * Transforms the first ARC data object to curent schema.
 */
export class ArcLegacyTransformer extends BaseTransformer {
  /**
   * Transforms legacy ARC export object into current export data model.
   *
   * @return {Promise<ArcExportObject>} New data model object.
   */
  async transform() {
    const raw = /** @type any */ (this[dataValue]);

    let projects;
    let requests;
    if (isSingleRequest(raw)) {
      const item = /** @type LegacyRequest */ (raw);
      projects = [];
      requests = [this.transformRequest(item)];
    } else {
      const data = /** @type LegacyExport */ (raw);
      projects = this.transformProjects(data.projects);
      requests = this.transformRequests(data.requests, projects);
      projects = projects.map((item) => {
        delete item.originId;
        return item;
      });
    }

    const result = {
      createdAt: new Date().toISOString(),
      version: 'unknown',
      kind: 'ARC#Import',
      requests,
      projects,
    };

    return result;
  }

  /**
   * Returns a list of projects from a legacy export file.
   *
   * Each project will have nevely generated ID to not make conflicts with
   * existing projects. Old project id is moved to the `originId` property.
   *
   * @param {LegacyProject[]} projects List of legacy project objects
   * @return {LegacyProjectProcessing[]} List of project object in current data model. It can be
   * empty array.
   */
  transformProjects(projects) {
    if (!projects || !(projects instanceof Array) || !projects.length) {
      return [];
    }
    return projects.map((item) => {
      let created = Number(item.created);
      if (Number.isNaN(created)) {
        created = Date.now();
      }
      return {
        kind: 'ARC#ProjectData',
        key: v4(),
        created,
        name: item.name || 'unnamed',
        order: 0,
        updated: Date.now(),
        originId: item.id,
      };
    });
  }

  /**
   * Transform the list of requests into new data model.
   *
   * @param {LegacyRequest[]} requests
   * @param {LegacyProjectProcessing[]} projects
   * @return {ExportArcSavedRequest[]}
   */
  transformRequests(requests, projects) {
    if (!requests || !(requests instanceof Array) || !requests.length) {
      return [];
    }
    return requests.map((item) => this.transformRequest(item, projects));
  }

  /**
   * Transforms a single request object into current data model.
   *
   * Note that required properties will be default to the following:
   * -   `name` - "unnamed"
   * -   `url` - "http://"
   * -   `method` - "GET"
   *
   * @param {LegacyRequest} item Legacy request definition
   * @param {LegacyProjectProcessing[]=} projects List of projects in the import file.
   * @return {ExportArcSavedRequest} Current model of the request object.
   */
  transformRequest(item, projects) {
    // LegacyRequest may have `null` values.
    item.name = item.name || 'unnamed';
    item.url = item.url || 'http://';
    item.method = item.method || 'GET';

    const project = this.findProject(item.project, projects);
    const projectId = project ? project.key : undefined;
    const id = v4();
    let created = Number(item.time);
    if (Number.isNaN(created)) {
      created = Date.now();
    }
    const result = {
      kind: 'ARC#RequestData',
      key: id,
      created,
      updated: Date.now(),
      headers: item.headers || '',
      method: item.method,
      name: item.name,
      payload: item.payload || '',
      type: 'saved',
      url: item.url,
    };
    if (projectId) {
      result.projects = [projectId];
      this.addRequestReference(project, id);
    }
    if (item.driveId) {
      result.driveId = item.driveId;
    }
    return result;
  }

  /**
   * Finds a project in the list of projects.
   *
   * @param {number} projectId A project ID to search for
   * @param {LegacyProjectProcessing[]=} projects List of project to look into. It compares the
   * `originId` property of the list items.
   * @return {LegacyProjectProcessing|undefined} A project object or null if not found.
   */
  findProject(projectId, projects) {
    if (!projectId || !Array.isArray(projects)) {
      return undefined;
    }
    return projects.find((p) => p.originId === projectId);
  }
}
