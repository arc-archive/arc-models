import {ArcBaseModel} from './ArcBaseModel.js';
import {
  Entity,
  ARCEntityChangeRecord,
  DeletedEntity,
  ARCModelListOptions,
  ARCModelListResult,
} from './types';

export declare interface ARCHostRuleCreate extends Entity {
  /**
   * A source host
   */
  from: string;
  /**
   * A destination host
   */
  to: string;
  /**
   * Whether the rule is enabled
   */
  enabled: boolean;
  /**
   * Optional comment to the rule
   */
  comment?: string;
}

export declare interface ARCHostRule extends ARCHostRuleCreate {
  /**
   * The timestamp when the rule was updated the last time.
   * This value is created by the model. Not accepted when creating an entity.
   */
  updated?: number;
}

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
  _attachListeners(node: EventTarget): void;
  _detachListeners(node: EventTarget): void;

  /**
   * Reads an entry from the datastore.
   *
   * @param id The ID of the datastore entry.
   * @param rev Specific revision to read. Defaults to latest revision.
   * @returns Promise resolved to a datastore object.
   */
  read(id: string, rev?: string): Promise<ARCHostRule>;

  /**
   * Updates / saves the host rule object in the datastore.
   * This function fires `host-rules-changed` event.
   *
   * @param rule A rule object to save / update
   * @returns Resolved promise to updated object with updated `_rev`
   */
  update(rule: ARCHostRule): Promise<ARCEntityChangeRecord<ARCHostRule>>;

  /**
   * Updates / saves the host rule object in the datastore.
   * This function fires `host-rules-changed` event.
   *
   * @param rules List of rules to save / update
   * @returns Resolved promise to the result of Pouch DB operation
   */
  updateBulk(rules: ARCHostRule[]): Promise<ARCEntityChangeRecord<ARCHostRule>[]>;

  /**
   * Removed an object from the datastore.
   * This function fires `host-rules-deleted` event.
   *
   * @param id The ID of the datastore entry.
   * @param rev Specific revision to read. Defaults to latest revision.
   * @returns Promise resolved to a new `_rev` property of deleted object.
   */
  delete(id: string, rev?: string): Promise<DeletedEntity>;

  /**
   * Lists all existing host rules
   *
   * @returns Promise resolved to list of the host rules
   */
  list(opts?: ARCModelListOptions): Promise<ARCModelListResult<ARCHostRule>>;
}
