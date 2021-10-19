import { HostRule, Model } from '@advanced-rest-client/events';
import {ArcBaseModel} from './ArcBaseModel.js';

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
export declare class HostRulesModel extends ArcBaseModel {

  constructor();

  /**
   * Reads an entry from the datastore.
   *
   * @param id The ID of the datastore entry.
   * @param rev Specific revision to read. Defaults to latest revision.
   * @returns Promise resolved to a datastore object.
   */
  read(id: string, rev?: string): Promise<HostRule.ARCHostRule>;

  /**
   * Updates / saves the host rule object in the datastore.
   * This function fires `host-rules-changed` event.
   *
   * @param rule A rule object to save / update
   * @returns Resolved promise to updated object with updated `_rev`
   */
  update(rule: HostRule.ARCHostRule): Promise<Model.ARCEntityChangeRecord<HostRule.ARCHostRule>>;

  /**
   * Updates / saves the host rule object in the datastore.
   * This function fires `host-rules-changed` event.
   *
   * @param rules List of rules to save / update
   * @returns Resolved promise to the result of Pouch DB operation
   */
  updateBulk(rules: HostRule.ARCHostRule[]): Promise<Model.ARCEntityChangeRecord<HostRule.ARCHostRule>[]>;

  /**
   * Removed an object from the datastore.
   * This function fires `host-rules-deleted` event.
   *
   * @param id The ID of the datastore entry.
   * @param rev Specific revision to read. Defaults to latest revision.
   * @returns Promise resolved to a new `_rev` property of deleted object.
   */
  delete(id: string, rev?: string): Promise<Model.DeletedEntity>;

  /**
   * Lists all existing host rules
   *
   * @returns Promise resolved to list of the host rules
   */
  list(opts?: Model.ARCModelListOptions): Promise<Model.ARCModelListResult<HostRule.ARCHostRule>>;
}
