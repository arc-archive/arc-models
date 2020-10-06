/* eslint-disable class-methods-use-this */

/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportOptionsInternal} ExportOptionsInternal */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ArcExportObject} ArcExportObject */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcSavedRequest} ExportArcSavedRequest */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcHistoryRequest} ExportArcHistoryRequest */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcProjects} ExportArcProjects */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcWebsocketUrl} ExportArcWebsocketUrl */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcUrlHistory} ExportArcUrlHistory */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcHostRule} ExportArcHostRule */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcVariable} ExportArcVariable */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcAuthData} ExportArcAuthData */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ArcExportProcessedData} ArcExportProcessedData */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ArcNativeDataExport} ArcNativeDataExport */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ArcExportClientCertificateData} ArcExportClientCertificateData */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportArcClientCertificateData} ExportArcClientCertificateData */
/** @typedef {import('@advanced-rest-client/arc-types').Project.ARCProject} ARCProject */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ARCSavedRequest} ARCSavedRequest */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ARCHistoryRequest} ARCHistoryRequest */
/** @typedef {import('@advanced-rest-client/arc-types').AuthData.ARCAuthData} ARCAuthData */
/** @typedef {import('@advanced-rest-client/arc-types').UrlHistory.ARCWebsocketUrlHistory} ARCWebsocketUrlHistory */
/** @typedef {import('@advanced-rest-client/arc-types').UrlHistory.ARCUrlHistory} ARCUrlHistory */
/** @typedef {import('@advanced-rest-client/arc-types').HostRule.ARCHostRule} ARCHostRule */
/** @typedef {import('@advanced-rest-client/arc-types').Variable.ARCVariable} ARCVariable */

/**
 * A class that processes ARC data to create a standard export object.
 */
export class ExportProcessor {
  /**
   * @param {boolean} electronCookies True if the cookies were read from electron storage
   */
  constructor(electronCookies) {
    this.electronCookies = electronCookies;
  }

  /**
   * Creates an export object for the data.
   *
   * @param {ArcExportProcessedData[]} exportData
   * @param {ExportOptionsInternal} options Export configuration object
   * @return {ArcExportObject} ARC export object declaration.
   */
  createExportObject(exportData, options) {
    const result = /** @type ArcExportObject */ ({
      createdAt: new Date().toISOString(),
      version: options.appVersion,
      kind: options.kind,
      electronCookies: this.electronCookies,
    });
    if (options.skipImport) {
      result.loadToWorkspace = true;
    }
    exportData.forEach(({ key, data }) => {
      if (!data) {
        return;
      }
      result[key] = this.prepareItem(key, data);
    });
    return result;
  }

  /**
   * @param {keyof ArcNativeDataExport} key
   * @param {any[]} values
   * @return {any[]}
   */
  prepareItem(key, values) {
    switch (key) {
      case 'authdata': return this.prepareAuthData(values);
      case 'clientcertificates': return this.prepareClientCertData(values);
      case 'cookies': return this.prepareCookieData(values);
      case 'history': return this.prepareHistoryDataList(values);
      case 'hostrules': return this.prepareHostRulesData(values);
      case 'projects': return this.prepareProjectsList(values);
      case 'requests': return this.prepareRequestsList(values);
      case 'urlhistory': return this.prepareUrlHistoryData(values);
      case 'variables': return this.prepareVariablesData(values);
      case 'websocketurlhistory': return this.prepareWsUrlHistoryData(values);
      default: return undefined;
    }
  }

  /**
   * Maps list of request to the export object.
   * @param {ARCSavedRequest[]} requests The list of requests to process.
   * @return {ExportArcSavedRequest[]}
   */
  prepareRequestsList(requests) {
    const result = requests.map((item) => {
      const request = /** @type ExportArcSavedRequest */ (item);
      // @ts-ignore
      if (item.legacyProject) {
        if (item.projects) {
          // @ts-ignore
          request.projects[item.projects.length] = item.legacyProject;
        } else {
          // @ts-ignore
          request.projects = [request.legacyProject];
        }
        // @ts-ignore
        delete request.legacyProject;
      }
      request.kind = 'ARC#RequestData';
      request.key = item._id;
      delete request._rev;
      delete request._id;
      return request;
    });
    return result;
  }

  /**
   * @param {ARCProject[]} projects
   * @return {ExportArcProjects[]}
   */
  prepareProjectsList(projects) {
    return projects.map((item) => {
      const project = /** @type ExportArcProjects */ (item);
      project.kind = 'ARC#ProjectData';
      project.key = item._id;
      delete project._rev;
      delete project._id;
      return project;
    });
  }

  /**
   * @param {ARCHistoryRequest[]} history The list of requests to process.
   * @return {ExportArcHistoryRequest[]}
   */
  prepareHistoryDataList(history) {
    const result = history.map((item) => {
      const request = /** @type ExportArcHistoryRequest */ (item);
      request.kind = 'ARC#HistoryData';
      request.key = item._id;
      delete request._rev;
      delete request._id;
      return request;
    });
    return result;
  }

  /**
   * @param {ARCWebsocketUrlHistory[]} data
   * @return {ExportArcWebsocketUrl[]}
   */
  prepareWsUrlHistoryData(data) {
    const result = data.map((item) => {
      const history = /** @type ExportArcWebsocketUrl */ (item);
      history.key = item._id;
      delete history._rev;
      delete history._id;
      history.kind = 'ARC#WebsocketHistoryData';
      return history;
    });
    return result;
  }

  /**
   * @param {ARCUrlHistory[]} data
   * @return {ExportArcUrlHistory[]}
   */
  prepareUrlHistoryData(data) {
    const result = data.map((item) => {
      const history = /** @type ExportArcUrlHistory */ (item);
      history.key = item._id;
      delete history._rev;
      delete history._id;
      history.kind = 'ARC#UrlHistoryData';
      return history;
    });
    return result;
  }

  /**
   * @param {ARCVariable[]} data
   * @return {ExportArcVariable[]}
   */
  prepareVariablesData(data) {
    const result = [];
    data.forEach((item) => {
      const value = /** @type ExportArcVariable */ (item);
      if (!value.environment) {
        // PouchDB creates some views in the main datastore and it is added to
        // get all docs function without any reason. It should be eliminated
        return;
      }
      if (value.variable) {
        value.name = value.variable;
        delete value.variable;
      }
      value.key = item._id;
      delete value._rev;
      delete value._id;
      value.kind = 'ARC#Variable';
      result.push(value);
    });
    return result;
  }

  /**
   * @param {ARCAuthData[]} authData
   * @return {ExportArcAuthData[]}
   */
  prepareAuthData(authData) {
    const result = authData.map((item) => {
      const value = /** @type ExportArcAuthData */ (item);
      value.key = item._id;
      delete value._rev;
      delete value._id;
      value.kind = 'ARC#AuthData';
      return value;
    });
    return result;
  }

  /**
   * @param {any[]} cookies
   * @return {any[]}
   */
  prepareCookieData(cookies) {
    const isElectron = this.electronCookies;
    const result = cookies.map((item) => {
      const value = /** @type any */ (item);
      if (!isElectron) {
        value.key = item._id;
        delete value._rev;
        delete value._id;
      }
      value.kind = 'ARC#Cookie';
      return item;
    });
    return result;
  }

  /**
   * @param {ARCHostRule[]} hostRules
   * @return {ExportArcHostRule[]}
   */
  prepareHostRulesData(hostRules) {
    return hostRules.map((item) => {
      const value = /** @type ExportArcHostRule */ (item);
      value.key = value._id;
      delete value._rev;
      delete value._id;
      value.kind = 'ARC#HostRule';
      return value;
    });
  }

  /**
   * @param {ArcExportClientCertificateData[]} items
   * @return {ExportArcClientCertificateData[]}
   */
  prepareClientCertData(items) {
    return items.map(({ item, data }) => {
      const value = /** @type ExportArcClientCertificateData */ (item);
      value.key = item._id;
      delete value._rev;
      delete value._id;
      value.kind = 'ARC#ClientCertificate';
      value.cert = data.cert;
      if (data.key) {
        value.pKey = data.key;
      }
      return value;
    });
  }
}
