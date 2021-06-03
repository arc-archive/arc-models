import { Model } from "@advanced-rest-client/arc-types";

/**
 * Request object change record
 */
export declare interface ARCRequestEntityChangeRecord<T> extends Model.ARCEntityChangeRecord<T> {
  /**
   * Only set when updated request is a "saved" request and the request belongs to any project.
   */
  projects?: string[];
  /**
   * Request type.
   */
  type: string;
}
