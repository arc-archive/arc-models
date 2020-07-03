export declare interface Entity {
  /**
   * Pouch DB datastore `_id`
   */
  _id?: string;
  /**
   * Pouch DB datastore `_rev` as a revision of the object
   */
  _rev?: string;
}

/**
 * An entity change record base definition
 */
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

/**
 * Request object change record
 */
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
 * Base query options for the data store.
 */
export declare interface ARCModelQueryOptions {
  /**
   * The number of results per the page.
   */
  limit?: number;
  /**
   * A string that should be used with pagination.
   */
  nextPageToken?: string;
}

/**
 * Data store query result object.
 */
export declare interface ARCModelQueryResult<T> {
  /**
   * Next page token to be used with pagination.
   * It is not set when the query has not returned any results.
   */
  nextPageToken?: string;
  /**
   * The list of items in the response.
   * May be empty array when there was no more results.
   */
  items: T[];
}

/**
 * Event detail ovject for data store query result object.
 */
export declare interface ARCModelQueryResultDetail<T> {
  result: Promise<ARCModelQueryResult<T>>;
}
