/**
@license
Copyright 2016 The Advanced REST client authors <arc@mulesoft.com>
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
import { ArcBaseModel, deletemodelHandler } from './ArcBaseModel.js';
import { ArcModelEventTypes } from './events/ArcModelEventTypes.js';
import { ArcModelEvents } from './events/ArcModelEvents.js';

/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */

/** @typedef {import('./RestApiModel').ARCRestApiIndex} ARCRestApiIndex */
/** @typedef {import('./RestApiModel').ARCRestApi} ARCRestApi */
/** @typedef {import('./events/RestApiEvents').ARCRestApiReadEvent} ARCRestApiReadEvent */
/** @typedef {import('./events/RestApiEvents').ARCRestApiUpdateEvent} ARCRestApiUpdateEvent */
/** @typedef {import('./events/RestApiEvents').ARCRestApiUpdateBulkEvent} ARCRestApiUpdateBulkEvent */
/** @typedef {import('./events/RestApiEvents').ARCRestApiUpdatedEvent} ARCRestApiUpdatedEvent */
/** @typedef {import('./events/RestApiEvents').ARCRestApiDeleteEvent} ARCRestApiDeleteEvent */
/** @typedef {import('./events/RestApiEvents').ARCRestApiDeletedEvent} ARCRestApiDeletedEvent */
/** @typedef {import('./events/RestApiEvents').ARCRestApiListEvent} ARCRestApiListEvent */
/** @typedef {import('./events/RestApiEvents').ARCRestApiDataReadEvent} ARCRestApiDataReadEvent */
/** @typedef {import('./events/RestApiEvents').ARCRestApiDataUpdateEvent} ARCRestApiDataUpdateEvent */
/** @typedef {import('./events/RestApiEvents').ARCRestApiDataUpdatedEvent} ARCRestApiDataUpdatedEvent */
/** @typedef {import('./events/RestApiEvents').ARCRestApiVersionDeleteEvent} ARCRestApiVersionDeleteEvent */
/** @typedef {import('./events/RestApiEvents').ARCRestApiVersionDeletedEvent} ARCRestApiVersionDeletedEvent */
/** @typedef {import('./events/BaseEvents').ARCModelDeleteEvent} ARCModelDeleteEvent */
/** @typedef {import('./types').ARCEntityChangeRecord} ARCEntityChangeRecord */
/** @typedef {import('./types').DeletedEntity} DeletedEntity */
/** @typedef {import('./types').ARCModelListResult} ARCModelListResult */
/** @typedef {import('./types').ARCModelListOptions} ARCModelListOptions */

export const readHandler = Symbol('readHandler');
export const updateHandler = Symbol('updateHandler');
export const updatebulkHandler = Symbol('updatebulkHandler');
export const deleteHandler = Symbol('deleteHandler');
export const listHandler = Symbol('listHandler');
export const datareadHandler = Symbol('datareadHandler');
export const dataupdateHandler = Symbol('dataupdateHandler');
export const versionDeleteHandler = Symbol('versionDeleteHandler');
export const removeVersion = Symbol('removeVersion');
export const removeVersions = Symbol('removeVersions');
export const deleteIndexModel = Symbol('deleteIndexModel');
export const deleteDataModel = Symbol('deleteDataModel');

/**
 * REST APIs model.
 */
export class RestApiModel extends ArcBaseModel {
  /**
   * A handler to the datastore. Contains listing data.
   */
  get indexDb() {
    /* global PouchDB */
    return new PouchDB('api-index');
  }

  /**
   * A handler to the datastore containing REST API data
   * (AMF model).
   */
  get dataDb() {
    return new PouchDB('api-data');
  }

  constructor() {
    super();
    this[readHandler] = this[readHandler].bind(this);
    this[updateHandler] = this[updateHandler].bind(this);
    this[updatebulkHandler] = this[updatebulkHandler].bind(this);
    this[deleteHandler] = this[deleteHandler].bind(this);
    this[listHandler] = this[listHandler].bind(this);
    this[datareadHandler] = this[datareadHandler].bind(this);
    this[dataupdateHandler] = this[dataupdateHandler].bind(this);
    this[versionDeleteHandler] = this[versionDeleteHandler].bind(this);
  }

  /**
   * Reads an entry from the index datastore.
   *
   * @param {string} id The ID of the datastore entry.
   * @param {string=} rev Specific revision to read. Defaults to latest revision.
   * @return {Promise<ARCRestApiIndex>} Promise resolved to an index object.
   */
  readIndex(id, rev) {
    const opts = {};
    if (rev) {
      opts.rev = rev;
    }
    return this.indexDb.get(id, opts);
  }

  /**
   * Creates / updates API index object.
   *
   * @param {ARCRestApiIndex} doc PouchDB document.
   * @return {Promise<ARCEntityChangeRecord>} Promise resolved to a change record.
   */
  async updateIndex(doc) {
    const entity = { ...doc };
    const result = await this.indexDb.put(entity);
    if (!result.ok) {
      this._handleException(result);
      // this line is for linter only.
      return undefined;
    }
    const oldRev = entity._rev;
    entity._rev = result.rev;
    const record = {
      id: result.id,
      rev: result.rev,
      item: entity,
      oldRev,
    };
    ArcModelEvents.RestApi.State.update(this, record);
    return record;
  }

  /**
   * Updates many index objects in one request.
   *
   * @param {ARCRestApiIndex[]} docs List of PouchDB documents to update.
   * @return {Promise<ARCEntityChangeRecord[]>} Promise resolved to a list of the change records.
   */
  async updateIndexBatch(docs) {
    const copy = docs.map((item) => {
      return { ...item };
    });
    const result = await this.indexDb.bulkDocs(copy);
    const records = [];
    result.forEach((res, i) => {
      const response = /** @type PouchDB.Core.Response */ (res);
      if (response.ok) {
        const oldRev = copy[i]._rev;
        copy[i]._rev = res.rev;
        const record = {
          id: res.id,
          rev: res.rev,
          item: copy[i],
          oldRev,
        };
        ArcModelEvents.RestApi.State.update(this, record);
        records.push(record);
      }
    });
    return records;
  }

  /**
   * Removes all AMF and index data from datastores for given index id.
   *
   * @param {string} id Index entry ID to delete.
   * @return {Promise<DeletedEntity>} Promise resolved to a delete record
   */
  async delete(id) {
    const doc = await this.readIndex(id);
    // @ts-ignore This is PouchDB's internal property
    doc._deleted = true;
    await this.removeVersions(id, doc.versions);
    const result = await this.indexDb.put(doc);
    if (!result.ok) {
      throw result;
    }
    ArcModelEvents.RestApi.State.delete(this, id, result.rev);
    return {
      id,
      rev: result.rev,
    };
  }

  /**
   * Lists index data.
   *
   * @param {ARCModelListOptions=} opts Query options.
   * @return {Promise<ARCModelListResult>} A promise resolved to a list of REST APIs.
   */
  async list(opts = {}) {
    return this.listEntities(this.indexDb, opts);
  }

  /**
   * Reads an entry from the raml data datastore.
   *
   * @param {string} id The ID of the datastore entry.
   * @param {string=} rev Specific revision to read. Defaults to latest revision.
   * @return {Promise<ARCRestApi>} Promise resolved to a project object.
   */
  readData(id, rev) {
    const opts = {};
    if (rev) {
      opts.rev = rev;
    }
    return this.dataDb.get(id, opts);
  }

  /**
   * Creates / updates API data object.
   *
   * @param {ARCRestApi} entity The entity to update.
   * @return {Promise<ARCEntityChangeRecord>} Promise resolved to a change record.
   */
  async updateData(entity) {
    const { indexId, version, data, _rev: oldRev } = entity;
    const id = `${indexId}|${version}`;
    let object;
    try {
      object = await this.readData(id);
    } catch (reason) {
      if (reason.status === 404) {
        object = {
          indexId,
          version,
          _id: id,
          data: undefined,
        };
      } else {
        this._handleException(reason);
      }
    }
    object.data = data;
    const result = await this.dataDb.put(object);
    if (!result.ok) {
      this._handleException(result);
      // this line is for linter only.
      return undefined;
    }
    object._rev = result.rev;

    const record = {
      id: result.id,
      rev: result.rev,
      item: object,
      oldRev,
    };
    ArcModelEvents.RestApi.State.dataUpdate(this, record);
    return record;
  }

  /**
   * Removes information about version from ARC data datastore and from index
   * data.
   *
   * @param {string} id Index object ID
   * @param {string} version Version to remove.
   * @return {Promise<DeletedEntity>}
   */
  async removeVersion(id, version) {
    const doc = await this.readIndex(id);
    const vs = doc.versions;
    if (!Array.isArray(vs)) {
      return undefined;
    }
    const index = vs.indexOf(version);
    if (index === -1) {
      return undefined;
    }
    vs.splice(index, 1);
    if (vs.length === 0) {
      return this.delete(id);
    }
    doc.versions = vs;
    if (doc.latest === version) {
      doc.latest = vs[vs.length - 1];
    }
    await this.updateIndex(doc);
    return this[removeVersion](`${id}|${version}`);
  }

  /**
   * Removes versions of API data in a bulk operation.
   *
   * @param {string} indexId Index object ID
   * @param {string[]} versions List of versions to remove.
   * @return {Promise<void>}
   */
  async removeVersions(indexId, versions) {
    if (!indexId || !(versions instanceof Array)) {
      return;
    }
    const ids = versions.map((v) => `${indexId}|${v}`);
    await this[removeVersions](ids);
  }

  /**
   * Removes API versions from the store.
   * @param {string[]} ids A list of IDs to remove
   * @return {Promise<void>}
   */
  async [removeVersions](ids) {
    const copy = [...ids];
    const id = copy.shift();
    if (!id) {
      return;
    }
    await this[removeVersion](id);
    await this[removeVersions](copy);
  }

  /**
   * Removes a version from the data store.
   * @param {string} id Version id
   * @return {Promise<DeletedEntity>}
   */
  async [removeVersion](id) {
    let doc;
    try {
      doc = await this.readData(id);
    } catch (cause) {
      if (cause.status !== 404) {
        this._handleException(cause);
      }
    }
    if (!doc) {
      return undefined;
    }
    // @ts-ignore
    doc._deleted = true;
    const response = await this.dataDb.put(doc);
    const [indexId, version] = id.split('|');
    ArcModelEvents.RestApi.State.versionDelete(this, response.id, response.rev, indexId, version);
    return {
      id: response.id,
      rev: response.rev,
    };
  }

  _attachListeners(node) {
    super._attachListeners(node);
    node.addEventListener(ArcModelEventTypes.RestApi.read, this[readHandler]);
    node.addEventListener(ArcModelEventTypes.RestApi.update, this[updateHandler]);
    node.addEventListener(ArcModelEventTypes.RestApi.updateBulk, this[updatebulkHandler]);
    node.addEventListener(ArcModelEventTypes.RestApi.delete, this[deleteHandler]);
    node.addEventListener(ArcModelEventTypes.RestApi.list, this[listHandler]);
    node.addEventListener(ArcModelEventTypes.RestApi.dataRead, this[datareadHandler]);
    node.addEventListener(ArcModelEventTypes.RestApi.dataUpdate, this[dataupdateHandler]);
    node.addEventListener(ArcModelEventTypes.RestApi.versionDelete, this[versionDeleteHandler]);
  }

  _detachListeners(node) {
    super._detachListeners(node);
    node.removeEventListener(ArcModelEventTypes.RestApi.read, this[readHandler]);
    node.removeEventListener(ArcModelEventTypes.RestApi.update, this[updateHandler]);
    node.removeEventListener(ArcModelEventTypes.RestApi.updateBulk, this[updatebulkHandler]);
    node.removeEventListener(ArcModelEventTypes.RestApi.delete, this[deleteHandler]);
    node.removeEventListener(ArcModelEventTypes.RestApi.list, this[listHandler]);
    node.removeEventListener(ArcModelEventTypes.RestApi.dataRead, this[datareadHandler]);
    node.removeEventListener(ArcModelEventTypes.RestApi.dataUpdate, this[dataupdateHandler]);
    node.removeEventListener(ArcModelEventTypes.RestApi.versionDelete, this[versionDeleteHandler]);
  }

  /**
   * @param {ARCRestApiReadEvent} e
   */
  [readHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const { id, rev } = e;
    e.detail.result = this.readIndex(id, rev);
  }

  /**
   * @param {ARCRestApiUpdateEvent} e
   */
  [updateHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const { entity } = e;
    e.detail.result = this.updateIndex(entity);
  }

  /**
   * @param {ARCRestApiUpdateBulkEvent} e
   */
  [updatebulkHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const { entities } = e;
    e.detail.result = this.updateIndexBatch(entities);
  }

  /**
   * @param {ARCRestApiDeleteEvent} e
   */
  [deleteHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const { id } = e;
    e.detail.result = this.delete(id);
  }

  /**
   * @param {ARCRestApiListEvent} e
   */
  [listHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const { limit, nextPageToken } = e;
    e.detail.result = this.list({
      limit,
      nextPageToken,
    });
  }

  /**
   * @param {ARCRestApiDataReadEvent} e
   */
  [datareadHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const { id, rev } = e;
    e.detail.result = this.readData(id, rev);
  }

  /**
   * @param {ARCRestApiDataUpdateEvent} e
   */
  [dataupdateHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const { entity } = e;
    e.detail.result = this.updateData(entity);
  }

  /**
   * @param {ARCRestApiVersionDeleteEvent} e
   */
  [versionDeleteHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const { id, version } = e;
    e.detail.result = this.removeVersion(id, version);
  }

  /**
   * Overrides delete model handler.
   *
   * @param {ARCModelDeleteEvent} e
   */
  [deletemodelHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    const { stores, detail } = e;
    if (!stores || !stores.length) {
      return;
    }
    if (stores.indexOf('rest-apis') === -1 && stores.indexOf('all') === -1) {
      return;
    }

    /* istanbul ignore else */
    if (!Array.isArray(detail.result)) {
      detail.result = [];
    }
    e.detail.result.push(this[deleteIndexModel]());
    e.detail.result.push(this[deleteDataModel]());
  }

  async [deleteIndexModel]() {
    await this.indexDb.destroy();
    ArcModelEvents.destroyed(this, 'api-index');
  }

  async [deleteDataModel]() {
    await this.dataDb.destroy();
    ArcModelEvents.destroyed(this, 'api-data');
  }
}
