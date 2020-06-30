/**
 * Detail definition for a read event.
 */
export declare interface ARCReadEventDetail<T> {
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
