import { ARCModelQueryOptions, ARCModelQueryResult } from './types';

export declare interface DefaultQueryOptions extends Object {
  limit: number;
  descending: boolean;
  include_docs: boolean;
}

/**
 * A base class for all models.
 */
export declare class ArcBaseModel extends HTMLElement {

  /**
   * Note, the element does not include PouchDB to the document!
   */
  readonly db: PouchDB.Database;
  readonly defaultQueryOptions: DefaultQueryOptions;
  eventsTarget: EventTarget;
  /**
   * Name of the data store
   */
  name?: string;
  /**
   * Limit number of revisions on the data store.
   */
  revsLimit?: number;

  /**
   * @param dbname Name of the data store
   * @param revsLimit Limit number of revisions on the data store.
   */
  constructor(dbname?: string, revsLimit?: number);

  connectedCallback(): void;
  disconnectedCallback(): void;

  _attachListeners(node: EventTarget): void;
  _detachListeners(node: EventTarget): void;

  /**
   * Removes old handlers (if any) and attaches listeners on new event
   * event target.
   *
   * @param eventsTarget Event target to set handlers on. If not set it
   * will set handlers on the `window` object.
   */
  _eventsTargetChanged(eventsTarget: EventTarget): void;

  /**
   * Reads an entry from the datastore.
   *
   * @param id The ID of the datastore entry.
   * @param rev Specific revision to read. Defaults to latest revision.
   * @returns Promise resolved to a datastore object.
   */
  read(id: string, rev?: string): Promise<object>;

  /**
   * Dispatches non-cancelable change event.
   *
   * @param type Event type
   * @param detail A detail object to dispatch.
   * @returns Created and dispatched event.
   */
  _fireUpdated(type: string, detail?: object): CustomEvent;

  /**
   * Handles any exception in the model in a unified way.
   *
   * @param e An error object
   * @param noThrow If set the function will not throw error.
   * This allow to do the logic without stopping program.
   */
  _handleException(e: Error|object, noThrow?: boolean): void;

  /**
   * Deletes current datastore.
   * Note that `name` property must be set before calling this function.
   */
  deleteModel(name?: string): Promise<void>;

  /**
   * Notifies the application that the model has been removed and data sestroyed.
   *
   * @param type Database name.
   * @returns Dispatched event
   */
  _notifyModelDestroyed(type: string): CustomEvent;

  /**
   * Handler for `destroy-model` custom event.
   * Deletes current data when scheduled for deletion.
   */
  _deleteModelHandler(e: CustomEvent): void;

  /**
   * Checks if event can be processed giving it's cancelation status or if
   * it was dispatched by current element.
   *
   * @param e Event to test
   * @returns True if event is already cancelled or dispatched by self.
   */
  _eventCancelled(e: Event|CustomEvent): boolean;

  /**
   * Decodes passed page token back to the passed parameters object.
   * @param token The page token value.
   * @returns Restored page query parameters or null if error
   */
  decodePageToken(token: string): object|null;

  /**
   * Encodes page parameters into a page token.
   * @param params Parameters to encode
   * @returns Page token
   */
  encodePageToken(params: object): string;

  /**
   * Lists all project objects.
   *
   * @param db Reference to a database
   * @param opts Query options.
   * @returns A promise resolved to a list of entities.
   */
  listEntities<T>(db: PouchDB.Database, opts?: ARCModelQueryOptions): Promise<ARCModelQueryResult<T>>;
}
