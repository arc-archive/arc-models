/* eslint-disable max-classes-per-file */
export const idValue = Symbol('idValue');
export const revisionValue = Symbol('revisionValue');
export const limitValue = Symbol('limitValue');
export const nextPageTokenValue = Symbol('nextPageTokenValue');

/** @typedef {import('../types').ARCModelQueryOptions} ARCModelQueryOptions */

/**
 * An event dispatched by the store after deleting an entity.
 * Chect the event type to learn which type of an entity was deleted.
 */
export class ARCEntityDeletedEvent extends Event {
  /**
   * @param {string} type The event type
   * @param {string} id Entity id
   * @param {string} rev Entity updated revision id
   */
  constructor(type, id, rev) {
    super(type, {
      bubbles: true,
      composed: true,
    });
    this[idValue] = id;
    this[revisionValue] = rev;
  }

  /**
   * @return {string} The id of the deleted entity
   */
  get id() {
    return this[idValue];
  }

  /**
   * @return {string} New revision id.
   */
  get rev() {
    return this[revisionValue];
  }
}

/**
 * A base class for data store query events.
 */
export class ARCEntityQueryEvent extends CustomEvent {
  /**
   * @return {number|null} The number of results per the page.
   */
  get limit() {
    return this[limitValue];
  }

  /**
   * @return {string|null} A string that should be used with pagination.
   */
  get nextPageToken() {
    return this[nextPageTokenValue];
  }

  /**
   * @param {string} type The event type
   * @param {ARCModelQueryOptions=} [opts={}] Query options.
   */
  constructor(type, opts={}) {
    super(type, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {},
    });

    this[limitValue] = opts.limit;
    this[nextPageTokenValue] = opts.nextPageToken;
  }
}
