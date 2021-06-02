/* eslint-disable class-methods-use-this */
/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */

import { v4 } from '@advanced-rest-client/uuid-generator';
import { BaseTransformer, dataValue } from './BaseTransformer.js';

/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ArcExportObject} ArcExportObject */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcProjects} ExportArcProjects */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcHistoryRequest} ExportArcHistoryRequest */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcSavedRequest} ExportArcSavedRequest */
/** @typedef {import('@advanced-rest-client/arc-types').Project} ARCProject */
/** @typedef {import('./ArcDexieTransformer').ProjectItem} ProjectItem */
/** @typedef {import('./ArcDexieTransformer').RequestProcessItem} RequestProcessItem */
/** @typedef {import('./ArcDexieTransformer').DexieExport} DexieExport */
/** @typedef {import('./ArcDexieTransformer').DexieRequest} DexieRequest */
/** @typedef {import('./ArcDexieTransformer').DexieProject} DexieProject */
/** @typedef {import('./ArcDexieTransformer').ProcessedRequests} ProcessedRequests */
/** @typedef {import('har-format').Header} Header */

/**
 * Transforms Dexie system (legacy system) into current data model.
 */
export class ArcDexieTransformer extends BaseTransformer {
  /**
   * Transforms legacy ARC export object based on Dexie data store
   * into current export data model.
   *
   * @return {Promise<ArcExportObject>} New data model object.
   */
  async transform() {
    const raw = /** @type DexieExport */ (this[dataValue]);

    const requests = await this.parseRequests(raw.requests);
    const pdata = this.processProjects(raw.projects);
    const data = this.associateProjects(requests, pdata);
    const result = {
      createdAt: new Date().toISOString(),
      version: 'unknown',
      kind: 'ARC#Import',
      requests: data.saved ? data.saved.map((item) => /** @type ExportArcSavedRequest */ (item.request)) : [],
      projects: pdata ? pdata.map((item) => /** @type ExportArcProjects */ (item.legacyProject)) : [],
      history: data.history ? data.history.map((item) => /** @type ExportArcHistoryRequest */ (item.request)) : []
    };
    // TODO: handle history data.
    return result;
  }

  /**
   * In new structure projects do not have a reference to request ids. It's
   * the other way around in previous system.
   * It's a bad pattern for object stores but it must suffice for now.
   *
   * @param {DexieProject[]} projects List of projects in the import.
   * @return {ProjectItem[]} Preprocessed projects array
   */
  processProjects(projects) {
    if (!projects || !projects.length) {
      return [];
    }
    const list = [];
    projects.forEach((item) => {
      const result = this.processProjectItem(item);
      if (result) {
        list.push(result);
      }
    });
    return list;
  }

  /**
   * Creates a pre-processed project data.
   *
   * @param {DexieProject} item Project object from the Dexie import.
   * @return {ProjectItem} Pre-processed project object with project store data
   * under the `legacyProject` property and list of requests IDs under
   * the `updateData` property.
   */
  processProjectItem(item) {
    if (!item.requestIds || !item.requestIds.length) {
      return undefined;
    }
    return {
      updateData: item.requestIds,
      legacyProject: {
        kind: 'ARC#Project',
        key: v4(),
        name: item.name,
        order: item.order,
        updated: item.updateTime,
        created: item.created,
      }
    };
  }

  /**
   * History is placed in its own store, saved items has own store.
   * Har data are not imported this way as user cannot actually use it.
   *
   * @param {DexieRequest[]} requests List of requests objects from the import file.
   * @return {Promise<ProcessedRequests>} A promise resolved when import is ready.
   */
  async parseRequests(requests) {
    const data = await this.parseRequestsDeffered(requests);
    // remove duplicates from the history.
    const ids = [];
    data.history = data.history.filter((item) => {
      if (ids.indexOf(item.request.key) === -1) {
        ids[ids.length] = item.request.key;
        return true;
      }
      return false;
    });
    return data;
  }

  /**
   * Parses the request data.
   * It takes only portion of the data to parse so the script release the
   * event loop and ANR screen won't appear.
   *
   * @param {DexieRequest[]} requests List of requests from the import.
   * @param {RequestProcessItem[]=} saved Final list of saved requests
   * @param {RequestProcessItem[]=} history Final list of history items.
   * @return {Promise<ProcessedRequests>}
   */
  async parseRequestsDeffered(requests, saved=[], history=[]) {
    if (requests.length === 0) {
      return {
        saved,
        history,
      };
    }
    const len = Math.min(requests.length, 200);
    // Up to 200 loop iteration at once.
    // Then the function return and release main loop.
    for (let i = 0; i < len; i++) {
      const item = requests[i];
      if (item.type === 'history') {
        const result = this.parseHistoryItem(item);
        history.push(result);
      } else if (item.type === 'saved') {
        const result = this.parseSavedItem(item);
        saved.push(result);
      } else if (item.type === 'drive') {
        const result = this.parseDriveItem(item);
        saved.push(result);
      }
    }
    requests.splice(0, len);
    return this.parseRequestsDeffered(requests, saved, history);
  }

  /**
   * @param {DexieRequest} item [description]
   * @return {RequestProcessItem}
   */
  parseHistoryItem(item) {
    const updated = { ...item };
    updated.updateTime = updated.updateTime || Date.now();
    const obj = /** @type ExportArcHistoryRequest */ ({
      key: v4(),
      method: updated.method,
      url: updated.url,
      updated: new Date(updated.updateTime).getTime()
    });
    // payload and headers
    const har = updated._har || updated.har;
    const {entries} = har;
    const entry = entries[entries.length - 1];
    if (entry) {
      const harRequest = entry.request;
      obj.headers = this.parseHarHeaders(harRequest.headers);
      obj.payload = harRequest.postData.text;
      let t = new Date(entry.startedDateTime).getTime();
      if (Number.isNaN(t)) {
        t = Date.now();
      }
      obj.created = t;
    } else {
      obj.created = obj.updated;
    }
    obj.updated = Date.now();
    return {
      origin: updated.id,
      request: obj
    };
  }

  /**
   * @param {DexieRequest} item [description]
   * @return {RequestProcessItem}
   */
  parseSavedItem(item) {
    const requestName = item.name || item._name;
    let keyName = requestName;
    if (keyName && keyName[0] === '_') {
      keyName = keyName.substr(1);
    }
    const obj = /** @type ExportArcSavedRequest */ ({
      name: requestName,
      method: item.method,
      url: item.url,
      type: 'saved',
      kind: 'ARC#HttpRequest',
      key: v4(),
    });
    // payload and headers
    const harIndex = item.referenceEntry || 0;
    const har = item._har || item.har;
    if (har) {
      const {entries} = har;
      let entry;
      if (harIndex || harIndex === 0) {
        entry = entries[harIndex];
      } else {
        [entry] = entries;
      }
      if (entry) {
        const harRequest = entry.request;
        obj.headers = this.parseHarHeaders(harRequest.headers);
        obj.payload = harRequest.postData.text;
        let t = new Date(entry.startedDateTime).getTime();
        if (Number.isNaN(t)) {
          t = Date.now();
        }
        obj.created = t;
      }
    }
    obj.updated = Date.now();

    return {
      origin: item.id,
      request: obj
    };
  }

  /**
   * @param {DexieRequest} item
   * @return {RequestProcessItem}
   */
  parseDriveItem(item) {
    const result = this.parseSavedItem(item);
    result.request.driveId = item.driveId;
    return result;
  }

  /**
   * @param {Header[]} arr
   * @return {string}
   */
  parseHarHeaders(arr) {
    if (!arr || !arr.length) {
      return '';
    }
    return arr.map((item) => `${item.name}: ${item.value}`).join('\n');
  }

  /**
   * Associate requests with project data.
   *
   * @param {ProcessedRequests} data Parsed requests object
   * @param {ProjectItem[]} projects List of projects
   * @return {ProcessedRequests} Parsed requests object
   */
  associateProjects(data, projects) {
    if (!projects || !projects.length) {
      return data;
    }
    if (!data.saved) {
      data.saved = [];
    }
    const savedLen = data.saved.length;
    const projectsLen = projects.length;
    for (let i = 0; i < projectsLen; i++) {
      const project = projects[i];
      const newProjectId = project.legacyProject.key;
      for (let j = 0, rLen = project.updateData.length; j < rLen; j++) {
        const rId = project.updateData[j];
        for (let k = 0; k < savedLen; k++) {
          if (data.saved[k].origin === rId) {
            const {request} = data.saved[k];
            request.key += `/${newProjectId}`;
            this.addProjectReference(request, newProjectId);
            this.addRequestReference(project.legacyProject, request.key);
            break;
          }
        }
      }
    }
    return data;
  }
}
