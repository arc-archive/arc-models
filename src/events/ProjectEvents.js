/* eslint-disable max-classes-per-file */
import { ArcModelEventTypes } from './ArcModelEventTypes.js';
import { ARCEntityDeletedEvent, ARCEntityQueryEvent } from './BaseEvents.js';

/** @typedef {import('./BaseEvents').ARCModelReadEventDetail} ARCModelReadEventDetail */
/** @typedef {import('./BaseEvents').ARCModelUpdateEventDetail} ARCModelUpdateEventDetail */
/** @typedef {import('./BaseEvents').ARCModelUpdateBulkEventDetail} ARCModelUpdateBulkEventDetail */
/** @typedef {import('./BaseEvents').ARCModelDeleteEventDetail} ARCModelDeleteEventDetail */
/** @typedef {import('../types').ARCEntityChangeRecord} ARCEntityChangeRecord */
/** @typedef {import('../types').ARCModelQueryOptions} ARCModelQueryOptions */
/** @typedef {import('../types').ARCModelQueryResult} ARCModelQueryResult */
/** @typedef {import('../RequestTypes').ARCProject} ARCProject */

export const projectValue = Symbol('projectValue');
export const projectIdValue = Symbol('projectIdValue');
export const revisionValue = Symbol('revisionValue');
export const changeRecordValue = Symbol('changeRecordValue');

/**
 * An event to be dispatched to read an ARC project from the data store.
 */
export class ARCPRojectReadEvent extends CustomEvent {
  /**
   * @param {string} id Project id
   * @param {string=} rev Project revision id
   */
  constructor(id, rev) {
    if (!id) {
      throw new Error('The ID must be set on the detail object.');
    }
    super(ArcModelEventTypes.Project.read, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {},
    });
    this[projectIdValue] = id;
    this[revisionValue] = rev;
  }

  /**
   * Requested project ID.
   * @return {string} Project ID used to initialize the event.
   */
  get id() {
    return this[projectIdValue];
  }

  /**
   * Requested project revision ID.
   * @return {string|null} Project revision ID used to initialize the event.
   */
  get rev() {
    return this[revisionValue] || null;
  }
}

/**
 * An event dispatched to the store to update a project.
 */
export class ARCProjectUpdateEvent extends CustomEvent {
  /**
   * @param {ARCProject} project A project to update.
   */
  constructor(project) {
    super(ArcModelEventTypes.Project.update, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {}
    });
    this[projectValue] = project;
  }

  /**
   * @return {ARCProject} A project that is being updated.
   */
  get project() {
    return this[projectValue];
  }
}

/**
 * An event dispatched to the store to update list of projects in a single transaction.
 */
export class ARCProjectUpdateBulkEvent extends CustomEvent {
  /**
   * @param {ARCProject[]} projects A list of projects to update.
   */
  constructor(projects) {
    super(ArcModelEventTypes.Project.updateBulk, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {}
    });
    this[projectValue] = projects;
  }

  /**
   * @return {ARCProject[]} A liost of projects that are being updated.
   */
  get projects() {
    return this[projectValue];
  }
}

/**
 * An event dispatched from the store after updating a project
 */
export class ARCProjectUpdatedEvent extends CustomEvent {
  /**
   * @param {ARCEntityChangeRecord} record Project change record.
   */
  constructor(record) {
    super(ArcModelEventTypes.Project.State.update, {
      bubbles: true,
      composed: true,
    });
    this[changeRecordValue] = record;
  }

  /**
   * @return {ARCEntityChangeRecord} Change record
   */
  get changeRecord() {
    return this[changeRecordValue];
  }
}

/**
 * An event dispatched to the store to delete a project.
 */
export class ARCProjectDeleteEvent extends CustomEvent {
  /**
   * @param {string} id Project id
   * @param {string=} rev Project revision id
   */
  constructor(id, rev) {
    super(ArcModelEventTypes.Project.delete, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {}
    });
    this[projectIdValue] = id;
    this[revisionValue] = rev;
  }

  /**
   * Requested project ID.
   * @return {string} Project ID used to initialize the event.
   */
  get id() {
    return this[projectIdValue];
  }

  /**
   * Requested project revision ID.
   * @return {string|null} Project revision ID used to initialize the event.
   */
  get rev() {
    return this[revisionValue] || null;
  }
}

/**
 * An event dispatched by the store after a project was deleted.
 */
export class ARCProjectDeletedEvent extends ARCEntityDeletedEvent {
  /**
   * @param {string} id Deleted project id
   * @param {string} rev Updated revision id
   */
  constructor(id, rev) {
    super(ArcModelEventTypes.Project.State.delete, id, rev);
  }
}

/**
 * An event to be dispatched to query for project data in the data store.
 */
export class ARCProjectQueryEvent extends ARCEntityQueryEvent {
  /**
   * @param {ARCModelQueryOptions=} opts Query options.
   */
  constructor(opts) {
    super(ArcModelEventTypes.Project.query, opts);
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
  const e = new ARCPRojectReadEvent(id, rev);
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
  const e = new ARCProjectUpdateEvent(item);
  target.dispatchEvent(e);
  return e.detail.result;
}

/**
 * Dispatches an event handled by the data store to update a list of project metadata.
 *
 * @param {EventTarget} target A node on which to dispatch the event.
 * @param {ARCProject[]} projects The list of project objects to update.
 * @return {Promise<ARCEntityChangeRecord[]>} Promise resolved to a list of change records
 */
export async function updateBulkAction(target, projects) {
  const e = new ARCProjectUpdateBulkEvent(projects);
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
  const e = new ARCProjectDeleteEvent(id, rev);
  target.dispatchEvent(e);
  return e.detail.result;
}

/**
 * Dispatches an event to list the project data.
 *
 * @param {EventTarget} target A node on which to dispatch the event.
 * @param {ARCModelQueryOptions=} opts Query options.
 * @return {Promise<ARCModelQueryResult>} Project query result.
 */
export async function queryAction(target, opts) {
  const e = new ARCProjectQueryEvent(opts);
  target.dispatchEvent(e);
  return e.detail.result;
}

//
// State events
//

/**
 * Dispatches an event after a project was updated
 *
 * @param {EventTarget} target A node on which to dispatch the event.
 * @param {ARCEntityChangeRecord} record Change record
 */
export function updatedState(target, record) {
  const e = new ARCProjectUpdatedEvent(record);
  target.dispatchEvent(e);
}

/**
 * Dispatches an event after a project was deleted
 *
 * @param {EventTarget} target A node on which to dispatch the event.
 * @param {string} id Deleted project ID.
 * @param {string} rev Updated revision of the project.
 */
export function deletedState(target, id, rev) {
  const e = new ARCProjectDeletedEvent(id, rev);
  target.dispatchEvent(e);
}
