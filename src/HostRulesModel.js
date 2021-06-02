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
import { ArcModelEventTypes, ArcModelEvents } from '@advanced-rest-client/arc-events';
import { ArcBaseModel } from './ArcBaseModel.js';

/* eslint-disable require-atomic-updates */
/* eslint-disable no-plusplus */
/* eslint-disable no-continue */
/* eslint-disable no-param-reassign */

/** @typedef {import('@advanced-rest-client/arc-types').HostRule.ARCHostRule} ARCHostRule */
/** @typedef {import('@advanced-rest-client/arc-types').Model.ARCEntityChangeRecord} ARCEntityChangeRecord */
/** @typedef {import('@advanced-rest-client/arc-types').Model.ARCModelListOptions} ARCModelListOptions */
/** @typedef {import('@advanced-rest-client/arc-types').Model.ARCModelListResult} ARCModelListResult */
/** @typedef {import('@advanced-rest-client/arc-types').Model.DeletedEntity} DeletedEntity */
/** @typedef {import('@advanced-rest-client/arc-events').ARCHostRuleUpdateEvent} ARCHostRuleUpdateEvent */
/** @typedef {import('@advanced-rest-client/arc-events').ARCHostRuleUpdateBulkEvent} ARCHostRuleUpdateBulkEvent */
/** @typedef {import('@advanced-rest-client/arc-events').ARCHostRuleDeleteEvent} ARCHostRuleDeleteEvent */
/** @typedef {import('@advanced-rest-client/arc-events').ARCHostRulesListEvent} ARCHostRulesListEvent */

export const updateHandler = Symbol('updateHandler');
export const updateBulkHandler = Symbol('updateBulkHandler');
export const deleteHandler = Symbol('deleteHandler');
export const listHandler = Symbol('listHandler');

/**
 * Model for host rules.
 *
 * Available events:
 *
 * - `host-rules-insert` Bulk add hosts
 * - `host-rules-changed` Change / add record
 * - `host-rules-deleted` Remove record
 * - `host-rules-list` Lists all rules
 * - `host-rules-clear` Clears hosts datastore
 *
 * Each event must be cancelable or it will be ignored.
 * The insert, change and delete events dispatches non cancelable update/delete
 * events. Application should listen for this events to update it's state.
 */
export class HostRulesModel extends ArcBaseModel {
  constructor() {
    super('host-rules');
    this[updateHandler] = this[updateHandler].bind(this);
    this[deleteHandler] = this[deleteHandler].bind(this);
    this[listHandler] = this[listHandler].bind(this);
    this[updateBulkHandler] = this[updateBulkHandler].bind(this);
  }

  _attachListeners(node) {
    super._attachListeners(node);
    node.addEventListener(ArcModelEventTypes.HostRules.update, this[updateHandler]);
    node.addEventListener(ArcModelEventTypes.HostRules.updateBulk, this[updateBulkHandler]);
    node.addEventListener(ArcModelEventTypes.HostRules.delete, this[deleteHandler]);
    node.addEventListener(ArcModelEventTypes.HostRules.list, this[listHandler]);
  }

  _detachListeners(node) {
    super._detachListeners(node);
    node.removeEventListener(ArcModelEventTypes.HostRules.update, this[updateHandler]);
    node.removeEventListener(ArcModelEventTypes.HostRules.updateBulk, this[updateBulkHandler]);
    node.removeEventListener(ArcModelEventTypes.HostRules.delete, this[deleteHandler]);
    node.removeEventListener(ArcModelEventTypes.HostRules.list, this[listHandler]);
  }

  /**
   * Updates / saves the host rule object in the datastore.
   * This function fires `host-rules-changed` event.
   *
   * @param {ARCHostRule} info A rule object to save / update
   * @return {Promise<ARCEntityChangeRecord>} Resolved promise to updated object with updated `_rev`
   */
  async update(info) {
    if (!info) {
      throw new Error('The "rule" property is missing');
    }

    const rule = { ...info };
    rule.updated = Date.now();
    const { db } = this;
    if (!rule._rev) {
      try {
        const doc = await db.get(rule._id);
        rule._rev = doc._rev;
      } catch (e) {
        /* istanbul ignore if */
        if (e.status !== 404) {
          this._handleException(e);
        }
      }
    }
    const oldRev = rule._rev;
    const result = await this.db.put(rule);
    rule._rev = result.rev;
    const record = {
      id: rule._id,
      rev: result.rev,
      item: rule,
      oldRev,
    };
    ArcModelEvents.HostRules.State.update(this, record);
    return record;
  }

  /**
   * Updates / saves the host rule object in the datastore.
   * This function fires `host-rules-changed` event.
   *
   * @param {ARCHostRule[]} items List of rules to save / update
   * @return {Promise<ARCEntityChangeRecord[]>} Resolved promise to the result of Pouch DB operation
   */
  async updateBulk(items) {
    const rules = items.map((item) => ({ ...item, updated: Date.now() }));
    const response = await this.db.bulkDocs(rules);
    const result = [];
    for (let i = 0, len = response.length; i < len; i++) {
      const r = response[i];
      const typedError = /** @type PouchDB.Core.Error */ (r);
      /* istanbul ignore if */
      if (typedError.error) {
        this._handleException(typedError, true);
        continue;
      }
      const rule = rules[i];
      const oldRev = rule._rev;
      rule._rev = r.rev;
      /* istanbul ignore if */
      if (!rule._id) {
        rule._id = r.id;
      }
      const record = {
        id: rule._id,
        rev: r.rev,
        item: rule,
        oldRev,
      };
      result.push(record);
      ArcModelEvents.HostRules.State.update(this, record);
    }
    return result;
  }

  /**
   * Removed an object from the datastore.
   *
   * @param {string} id The ID of the datastore entry.
   * @param {string=} rev Specific revision to read. Defaults to latest revision.
   * @return {Promise<DeletedEntity>} Promise resolved to a new `_rev` property of deleted object.
   */
  async delete(id, rev) {
    if (!rev) {
      const obj = /** @type ARCHostRule */ (await this.read(id));
      rev = obj._rev;
    }
    const response = await this.db.remove(id, rev);
    const result = {
      id,
      rev: response.rev,
    };
    ArcModelEvents.HostRules.State.delete(this, id, response.rev);
    return result;
  }

  /**
   * Lists all host rules in pagination
   *
   * @param {ARCModelListOptions=} opts Query options.
   * @return {Promise<ARCModelListResult>} A promise resolved to a list of rules.
   */
  async list(opts={}) {
    return this.listEntities(this.db, opts);
  }

  /**
   * Handler for `host-rules-insert` custom event. Creates rules in bulk.
   * It sets `result` property on event detail object with a result of calling
   * `updateBulk()` function.
   *
   * @param {ARCHostRuleUpdateBulkEvent} e
   */
  [updateBulkHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const { rules } = e;
    if (!rules) {
      e.detail.result = Promise.reject(
        new Error('The "rules" property is missing')
      );
      return;
    }
    e.detail.result = this.updateBulk(rules);
  }

  /**
   * @param {ARCHostRuleUpdateEvent} e
   */
  [updateHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const { rule } = e;
    e.detail.result = this.update(rule);
  }

  /**
   * @param {ARCHostRuleDeleteEvent} e
   */
  [deleteHandler](e) {
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const { id, rev } = e;
    if (!id) {
      e.detail.result = Promise.reject(new Error('Missing "id" property.'));
      return;
    }

    e.detail.result = this.delete(id, rev);
  }

  /**
   * @param {ARCHostRulesListEvent} e
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
}
