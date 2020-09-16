/* eslint-disable max-classes-per-file */
import {
  ARCEntityDeletedEvent,
  ARCEntityListEvent,
  ARCModelDeleteEventDetail,
  ARCModelUpdateEventDetail,
  ARCModelUpdateBulkEventDetail,
} from './BaseEvents';
import {
  ARCEntityChangeRecord,
  ARCModelListOptions,
  ARCModelListResult,
  DeletedEntity,
} from '../types';
import {
  ARCHostRule,
} from '../HostRulesModel';

/**
 * An event dispatched to the store to update a host rule entity.
 */
export declare class ARCHostRuleUpdateEvent extends CustomEvent<ARCModelUpdateEventDetail<ARCHostRule>> {
  /**
   * The rule object to save / update
   */
  readonly rule: ARCHostRule;

  /**
   * @param rule The rule object to save / update
   */
  constructor(rule: ARCHostRule);
}

/**
 * An event dispatched to the store to update a host rule entities in a bulk operation
 */
export declare class ARCHostRuleUpdateBulkEvent extends CustomEvent<ARCModelUpdateBulkEventDetail<ARCHostRule>> {
  /**
   * @return {ARCHostRule[]} The rule object to save / update
   */
  readonly rules: ARCHostRule[];

  /**
   * @param {ARCHostRule[]} rules The rule object to save / update
   */
  constructor(rules: ARCHostRule[]);
}

/**
 * An event dispatched by the store after a host rule has been updated.
 */
export declare class ARCHostRuleUpdatedEvent extends Event {
  /**
   * @return {ARCEntityChangeRecord} Change record
   */
  readonly changeRecord: ARCEntityChangeRecord<ARCHostRule>;

  /**
   * @param {ARCEntityChangeRecord} record The rule change record
   */
  constructor(record: ARCEntityChangeRecord<ARCHostRule>);
}

/**
 * An event dispatched to the store to delete a host rule.
 */
export declare class ARCHostRuleDeleteEvent extends CustomEvent<ARCModelDeleteEventDetail> {
  /**
   * @return {string} Rule id used to initialize the event
   */
  readonly id: string;

  /**
   * @return {string|undefined} A revision ID to delete
   */
  readonly rev: string;

  /**
   * @param {string} id Request id
   * @param {string=} rev A revision ID to delete
   */
  constructor(id: string, rev?: string);
}

/**
 * An event dispatched by the data store when a host rule entity was deleted.
 */
export declare class ARCHostRuleDeletedEvent extends ARCEntityDeletedEvent {
  /**
   * @param {string} id Host rule id
   * @param {string} rev An updated revision ID of the deleted object.
   */
  constructor(id: string, rev: string);
}

/**
 * An event dispatched by the UI when requesting a list of host rules
 */
export declare class ARCHostRulesListEvent extends ARCEntityListEvent<ARCHostRule> {
  /**
   * @param {ARCModelListOptions=} opts Query options.
   */
  constructor(opts?: ARCModelListOptions);
}

/**
 * Dispatches an event handled by the data store to update a host rule entity
 *
 * @param target A node on which to dispatch the event.
 * @param rule The rule object to save / update
 * @returns Promise resolved to a the change record
 */
export declare function updateAction(target: EventTarget, rule: ARCHostRule): Promise<ARCEntityChangeRecord<ARCHostRule>>;

/**
 * Dispatches an event handled by the data store to update host rule entities in bulk
 *
 * @param target A node on which to dispatch the event.
 * @param rules The rules to save / update
 * @returns Promise resolved to a the list of a change record
 */
export declare function updateActionBulk(target: EventTarget, rules: ARCHostRule[]): Promise<ARCEntityChangeRecord<ARCHostRule>[]>;

/**
 * Dispatches an event informing about a change in the host rules model.
 *
 * @param {EventTarget} target A node on which to dispatch the event.
 * @param {ARCEntityChangeRecord} record Host rules change record.
 */
export declare function updatedState(target: EventTarget, record: ARCEntityChangeRecord<ARCHostRule>): void;

/**
 * Dispatches an event handled by the data store to read a host rules data.
 *
 * @param target A node on which to dispatch the event.
 * @param opts List options.
 * @returns Promise resolved to list of results
 */
export declare function listAction(target: EventTarget, opts?: ARCModelListOptions): Promise<ARCModelListResult<ARCHostRule>>;

/**
 * Dispatches an event handled by the data store to delete an ARC request from the store.
 *
 * @param target A node on which to dispatch the event.
 * @param id The host rule id
 * @param rev A revision ID to delete
 * @returns Delete record
 */
export declare function deleteAction(target: EventTarget, id: string, rev?: string): Promise<DeletedEntity>;

/**
 * Dispatches an event after a host rule was deleted
 *
 * @param target A node on which to dispatch the event.
 * @param id Deleted host rule id.
 * @param rev Updated revision of the deleted entity.
 */
export declare function deletedState(target: EventTarget, id: string, rev: string): void;
