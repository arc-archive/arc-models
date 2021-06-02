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
