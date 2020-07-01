/**
 * Detail definition for a read event.
 */
export declare interface ARCModelReadEventDetail<T> {
  /**
   * The id of the object to read.
   */
  id: string;
  /**
   * The revision id of the object to read.
   */
  rev?: string;
  /**
   * This property is set by the models, a promise resolved to the
   * requested object.
   */
  result?: Promise<T>|null;
}

/**
 * Detail definition for a read event.
 */
export declare interface ARCModelReadBulkEventDetail<T> {
  /**
   * The list of ids of the entities to read.
   */
  ids: string[];
  /**
   * This property is set by the models, a promise resolved to the
   * list of requested object.
   */
  result?: Promise<T[]>|null;
}

export declare interface ARCEntityChangeRecord<T> {
  /**
   * The ID of the changed entity
   */
  id: string;
  /**
   * The revision of the updated entity.
   * It is not set when old revisison is unavailable (new entity is created).
   */
  oldRev?: string;
  /**
   * New revision id of updated entity
   */
  rev: string;
  /**
   * The updated entity.
   */
  item?: T;
}

export declare interface ARCRequestEntityChangeRecord<T> extends ARCEntityChangeRecord<T> {
  /**
   * Only set when updated request is a "saved" request and the request belongs to any project.
   */
  projects?: string[];
  /**
   * Request type.
   */
  type: string;
}

/**
 * Detail definition for an object create/update event.
 */
export declare interface ARCModelUpdateEventDetail<T> {
  /**
   * An entity to be updated/created.
   */
  item: T;
  /**
   * This property is set by the store, a promise resolved when a transaction finish.
   * The value if the same as the value of the change state event.
   */
  result?: Promise<ARCEntityChangeRecord<T>>;
}

/**
 * Detail definition for an entity delete event.
 */
export declare interface ARCModelDeleteEventDetail {
  /**
   * The id of the object to delete.
   */
  id: string;
  /**
   * The revision id of the object to delete.
   * If the revision is not set then it uses the lates revision.
   */
  rev?: string;
  /**
   * This property is set by the data store, a promise resolved to the
   * new revision of an entity.
   */
  result?: Promise<string>|null;
}
