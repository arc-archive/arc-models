import { ARCProject } from '../RequestTypes';
import {
  ARCEntityChangeRecord,
  ARCModelQueryOptions,
  ARCModelQueryResult,
} from '../types';

declare interface ProjectStateFunctions {
  /**
   * Dispatches an event after a project was updated
   *
   * @param target A node on which to dispatch the event.
   * @param record Change record
   */
  update(target: EventTarget, record: ARCEntityChangeRecord<ARCProject>): void;
  /**
   * Dispatches an event after a project was deleted
   *
   * @param target A node on which to dispatch the event.
   * @param id Deleted project ID.
   * @param rev Updated revision of the project.
   */
  delete(target: EventTarget, id: string, rev: string): void;
}

declare interface ProjectFunctions {
  /**
   * Dispatches an event handled by the data store to read the project metadata.
   *
   * @param target A node on which to dispatch the event.
   * @param id The ID of the project
   * @param rev The revision of the project. If not set then the latest revision is used.
   * @returns Promise resolved to a Project model.
   */
  read(target: EventTarget, id: string, rev?: string): Promise<ARCProject>;
  /**
   * Dispatches an event handled by the data store to update a project metadata.
   *
   * @param target A node on which to dispatch the event.
   * @param item The project object to update.
   * @returns Promise resolved to a Project model.
   */
  update(target: EventTarget, item: ARCProject): Promise<ARCEntityChangeRecord<ARCProject>>;

  /**
   * Dispatches an event handled by the data store to update a list of project metadata.
   *
   * @param target A node on which to dispatch the event.
   * @param projects The list of project objects to update.
   * @return Promise resolved to a list of change records
   */
  updateBulk(target: EventTarget, projects: ARCProject[]): Promise<ARCEntityChangeRecord<ARCProject>[]>;
  /**
   * Dispatches an event handled by the data store to delete a project metadata.
   *
   * @param target A node on which to dispatch the event.
   * @param id The id of the project to delete.
   * @param rev The revision of the project. If not set then the latest revision is used.
   * @returns Promise resolved to a new revision after delete.
   */
  delete(target: EventTarget, id: string, rev?: string): Promise<string>;

  /**
   * Dispatches an event to list the project data.
   *
   * @param target A node on which to dispatch the event.
   * @param opts Query options.
   * @returns Project query result.
   */
  query(target: EventTarget, opts?: ARCModelQueryOptions): Promise<ARCModelQueryResult<ARCProject>>;

  State: ProjectStateFunctions;
}

declare interface ArcModelEvents {
  Project: ProjectFunctions;
}

declare const events: ArcModelEvents;
export { events as  ArcModelEvents };
