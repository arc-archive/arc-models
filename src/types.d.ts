import { Model } from "@advanced-rest-client/events";
import { ARCProject } from '@advanced-rest-client/events/src/models/Project';
import { ARCSavedRequest } from '@advanced-rest-client/events/src/request/ArcRequest';

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

export declare interface InsertSavedResult {
  projects: PouchDB.Core.ExistingDocument<ARCProject>[];
  requests: PouchDB.Core.ExistingDocument<ARCSavedRequest>[];
}
