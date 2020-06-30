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
import { ArcBaseModel } from './ArcBaseModel.js';
/* eslint-disable require-atomic-updates */
/* eslint-disable no-plusplus */
/* eslint-disable no-continue */
/* eslint-disable no-param-reassign */

/** @typedef {import('./HostRulesModel').ARCHostRule} ARCHostRule */
/** @typedef {import('./HostRulesModel').ARCHostRuleCreate} ARCHostRuleCreate */

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
    super('host-rules', 10);
    this._updatedHandler = this._updatedHandler.bind(this);
    this._deletedHandler = this._deletedHandler.bind(this);
    this._listHandler = this._listHandler.bind(this);
    this._clearHandler = this._clearHandler.bind(this);
    this._insertHandler = this._insertHandler.bind(this);
  }

  _attachListeners(node) {
    super._attachListeners(node);
    node.addEventListener('host-rules-insert', this._insertHandler);
    node.addEventListener('host-rules-changed', this._updatedHandler);
    node.addEventListener('host-rules-deleted', this._deletedHandler);
    node.addEventListener('host-rules-list', this._listHandler);
    node.addEventListener('host-rules-clear', this._clearHandler);
  }

  _detachListeners(node) {
    super._detachListeners(node);
    node.removeEventListener('host-rules-insert', this._insertHandler);
    node.removeEventListener('host-rules-changed', this._updatedHandler);
    node.removeEventListener('host-rules-deleted', this._deletedHandler);
    node.removeEventListener('host-rules-list', this._listHandler);
    node.removeEventListener('host-rules-clear', this._clearHandler);
  }

  /**
   * Updates / saves the host rule object in the datastore.
   * This function fires `host-rules-changed` event.
   *
   * @param {ARCHostRule} info A rule object to save / update
   * @return {Promise<ARCHostRule>} Resolved promise to updated object with updated `_rev`
   */
  async update(info) {
    const rule = { ...info };
    rule.updated = Date.now();
    const { db } = this;
    if (!rule._rev) {
      try {
        const doc = await db.get(rule._id);
        rule._rev = doc._rev;
      } catch (e) {
        if (e.status !== 404) {
          this._handleException(e);
        }
      }
    }
    const oldRev = rule._rev;
    const result = await this.db.put(rule);
    rule._rev = result.rev;
    this._fireUpdated('host-rules-changed', {
      rule,
      oldRev,
    });
    return rule;
  }

  /**
   * Updates / saves the host rule object in the datastore.
   * This function fires `host-rules-changed` event.
   *
   * @param {ARCHostRule[]} items List of rules to save / update
   * @return {Promise<(PouchDB.Core.Response|PouchDB.Core.Error)[]>} Resolved promise to the result of Pouch DB operation
   */
  async updateBulk(items) {
    const rules = items.map((item) => {
      return { ...item, updated: Date.now() };
    });
    const response = await this.db.bulkDocs(rules);
    for (let i = 0, len = response.length; i < len; i++) {
      const r = response[i];
      const typedError = /** @type PouchDB.Core.Error */ (r);
      if (typedError.error) {
        this._handleException(typedError, true);
        continue;
      }
      const rule = rules[i];
      const oldRev = rule._rev;
      rule._rev = r.rev;
      if (!rule._id) {
        rule._id = r.id;
      }
      const detail = {
        rule,
        oldRev,
      };
      this._fireUpdated('host-rules-changed', detail);
    }
    return response;
  }

  /**
   * Removed an object from the datastore.
   * This function fires `host-rules-deleted` event.
   *
   * @param {string} id The ID of the datastore entry.
   * @param {string?} rev Specific revision to read. Defaults to latest revision.
   * @return {Promise<string>} Promise resolved to a new `_rev` property of deleted object.
   */
  async delete(id, rev) {
    if (!rev) {
      const obj = /** @type ARCHostRule */ (await this.read(id));
      rev = obj._rev;
    }
    const response = await this.db.remove(id, rev);
    const detail = {
      id,
      rev: response.rev,
      oldRev: rev,
    };
    this._fireUpdated('host-rules-deleted', detail);
    return response.rev;
  }

  /**
   * Lists all existing host rules
   *
   * @return {Promise<ARCHostRule[]>} Promise resolved to list of the host rules
   */
  async list() {
    const queryOptions = {
      include_docs: true,
    };
    const response = await this.db.allDocs(queryOptions);
    let data = [];
    if (response && response.rows.length > 0) {
      data = response.rows.map((item) => item.doc);
    }
    return data;
  }

  /**
   * Handler for `host-rules-insert` custom event. Creates rules in bulk.
   * It sets `result` property on event detail object with a result of calling
   * `updateBulk()` function.
   *
   * @param {CustomEvent} e
   */
  _insertHandler(e) {
    if (!e.cancelable) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const { rules } = e.detail;
    if (!rules) {
      e.detail.result = Promise.reject(
        new Error('The "rules" property is missing')
      );
      return;
    }
    e.detail.result = this.updateBulk(rules);
  }

  _updatedHandler(e) {
    if (!e.cancelable || e.composedPath()[0] === this) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const { rule } = e.detail;
    if (!rule || !rule._id) {
      e.detail.result = Promise.reject(
        new Error('The "rule" property is missing')
      );
      return;
    }
    e.detail.result = this.update(rule).catch((ex) =>
      this._handleException(ex)
    );
  }

  _deletedHandler(e) {
    if (!e.cancelable || e.composedPath()[0] === this) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const { id, rev } = e.detail;
    if (!id) {
      e.detail.result = Promise.reject(new Error('Missing "id" property.'));
      return;
    }

    e.detail.result = this.delete(id, rev).catch((ex) =>
      this._handleException(ex)
    );
  }

  _listHandler(e) {
    if (!e.cancelable || e.composedPath()[0] === this) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    e.detail.result = this.list().catch((ex) => this._handleException(ex));
  }

  _clearHandler(e) {
    if (!e.cancelable || e.composedPath()[0] === this) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    e.detail.result = this.db.destroy().then(() => {
      this._fireUpdated('host-rules-clear');
    });
  }
}
