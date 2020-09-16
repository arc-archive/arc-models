/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */

/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcSavedRequest} ExportArcSavedRequest */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcHistoryRequest} ExportArcHistoryRequest */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcProjects} ExportArcProjects */

export const dataValue = Symbol('dataValue');

/**
 * Base class for all transformers.
 * Has common functions for the transformers.
 */
export class BaseTransformer {
  /**
   * @param {object} data Data to be transformed.
   */
  constructor(data) {
    this[dataValue] = data;
  }

  /**
   * Generates request's datastore ID value.
   *
   * @param {ExportArcSavedRequest | ExportArcHistoryRequest} item A request object property.
   * @param {string=} projectId If set it adds project information to the ID.
   * @return {string} Request ID value.
   */
  generateRequestId(item, projectId) {
    const assumed = /** @type ExportArcSavedRequest */ (item);
    const name = (assumed.name || 'unknown name').toLowerCase();
    const url = (item.url || 'https://').toLowerCase();
    const method = (item.method || 'GET').toLowerCase();

    const eName = encodeURIComponent(name);
    const eUrl = encodeURIComponent(url);

    let id = `${eName}/${eUrl}/${method}`;
    if (projectId) {
      id += `/${projectId}`;
    }
    return id;
  }

  /**
   * Computes history item ID
   *
   * @param {number} timestamp The timestamp to use
   * @param {ExportArcHistoryRequest} item History item
   * @return {string} Datastore ID
   */
  generateHistoryId(timestamp, item) {
    const url = item.url.toLowerCase();
    const method = item.method.toLowerCase();
    let today;
    try {
      today = this.getDayToday(timestamp);
    } catch (e) {
      today = this.getDayToday(Date.now());
    }
    return `${today}/${encodeURIComponent(url)}/${method}`;
  }

  /**
   * Sets hours, minutes, seconds and ms to 0 and returns timestamp.
   *
   * @param {number} timestamp Day's timestamp.
   * @return {number} Timestamp to the day.
   */
  getDayToday(timestamp) {
    const d = new Date(timestamp);
    const tCheck = d.getTime();
    if (Number.isNaN(tCheck)) {
      throw new Error(`Invalid timestamp: ${  timestamp}`);
    }
    d.setMilliseconds(0);
    d.setSeconds(0);
    d.setMinutes(0);
    d.setHours(0);
    return d.getTime();
  }

  /**
   * Adds project reference to a request object.
   * @param {ExportArcSavedRequest} request Request object to alter
   * @param {string} id Project id
   */
  addProjectReference(request, id) {
    if (!id) {
      return;
    }
    if (!request.projects) {
      request.projects = [];
    }
    if (request.projects.indexOf(id) === -1) {
      request.projects.push(id);
    }
  }

  /**
   * Adds request reference to a project object.
   * @param {ExportArcProjects} project Project object to alter
   * @param {string} id Request id
   */
  addRequestReference(project, id) {
    if (!id) {
      return;
    }
    if (!project.requests) {
      project.requests = [];
    }
    if (project.requests.indexOf(id) === -1) {
      project.requests.push(id);
    }
  }
}
