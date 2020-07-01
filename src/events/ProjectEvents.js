/* eslint-disable max-classes-per-file */

import { ArcModelEventTypes } from './ArcModelEventTypes.js';

/** @typedef {import('./BaseEvents').ARCModelReadEventDetail} ARCModelReadEventDetail */
/** @typedef {import('./BaseEvents').ARCModelUpdateEventDetail} ARCModelUpdateEventDetail */
/** @typedef {import('./BaseEvents').ARCModelDeleteEventDetail} ARCModelDeleteEventDetail */
/** @typedef {import('./BaseEvents').ARCEntityChangeRecord} ARCEntityChangeRecord */
/** @typedef {import('../RequestTypes').ARCProject} ARCProject */

/**
 * An event to be dispatched to read an ARC project from the data store.
 */
export class ARCPRojectReadEvent extends CustomEvent {
  /**
   * @param {ARCModelReadEventDetail} detail Project read options.
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

/**
 * An event dispatched to the store to update a project.
 */
export class ARCProjectUpdateEvent extends CustomEvent {
  /**
   * @param {ARCModelUpdateEventDetail} detail Project update options
   */
  constructor(detail) {
    super(ArcModelEventTypes.Project.update, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail
    });
  }
}

/**
 * An event dispatched to the store to delete a project.
 */
export class ARCProjectDeleteEvent extends CustomEvent {
  /**
   * @param {ARCModelDeleteEventDetail} detail Project delete options
   */
  constructor(detail) {
    super(ArcModelEventTypes.Project.delete, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail
    });
  }
}

/**
 * Dispatches an event handled by the data store to read the project metadata.
 *
 * @param {EventTarget} target A node on which to dispatch the event.
 * @param {string} id The ID of the project
 * @param {string=} rev The revision of the project. If not set then the latest revision is used.
 * @return {Promise<ARCProject>} Promise resolved to a Project model.
 */
export async function readAction(target, id, rev) {
  const e = new ARCPRojectReadEvent({
    id,
    rev,
  });
  target.dispatchEvent(e);
  return e.detail.result;
}

/**
 * Dispatches an event handled by the data store to update a project metadata.
 *
 * @param {EventTarget} target A node on which to dispatch the event.
 * @param {ARCProject} item The project object to update.
 * @return {Promise<ARCEntityChangeRecord>} Promise resolved to a Project model.
 */
export async function updateAction(target, item) {
  const e = new ARCProjectUpdateEvent({
    item,
  });
  target.dispatchEvent(e);
  return e.detail.result;
}

/**
 * Dispatches an event handled by the data store to delete a project metadata.
 *
 * @param {EventTarget} target A node on which to dispatch the event.
 * @param {string} id The id of the project to delete.
 * @param {string=} rev The revision of the project. If not set then the latest revision is used.
 * @return {Promise<string>} Promise resolved to a new revision after delete.
 */
export async function deleteAction(target, id, rev) {
  const e = new ARCProjectDeleteEvent({
    id,
    rev,
  });
  target.dispatchEvent(e);
  return e.detail.result;
}

export async function queryAction() {
  return null;
}
export async function updateBulkAction() {
  return null;
}
