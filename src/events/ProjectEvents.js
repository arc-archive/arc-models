/* eslint-disable max-classes-per-file */

import { ArcModelEventTypes } from './ArcModelEventTypes.js';

/** @typedef {import('./BaseEvents').ARCReadEventDetail} ARCReadEventDetail */
/** @typedef {import('../RequestTypes').ARCProject} ARCProject */

/**
 * An event to be dispatched to read an ARC project from the data store.
 */
export class ARCPRojectReadEvent extends CustomEvent {
  /**
   * @param {ARCReadEventDetail} detail Attribute read options.
   */
  constructor(detail) {
    super(ArcModelEventTypes.Project.read, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail
    });
  }
}
