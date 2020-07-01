import { ARCModelReadEventDetail, ARCModelUpdateEventDetail, ARCModelDeleteEventDetail, ARCEntityChangeRecord } from './BaseEvents';
import { ARCProject } from '../RequestTypes';
/**
 * Project read event
 */
export declare class ARCPRojectReadEvent extends CustomEvent<ARCModelReadEventDetail<ARCProject>> {
  constructor(detail: ARCModelReadEventDetail<ARCProject>);
}

/**
 * An event dispatched to the store to update a project.
 */
export declare class ARCProjectUpdateEvent extends CustomEvent<ARCModelUpdateEventDetail<ARCProject>> {
  constructor(detail: ARCModelUpdateEventDetail<ARCProject>);
}

/**
 * An event dispatched to the store to delete a project.
 */
export declare class ARCProjectDeleteEvent extends CustomEvent<ARCModelDeleteEventDetail> {
  constructor(detail: ARCModelDeleteEventDetail);
}

/**
 * Dispatches an event handled by the data store to read the project metadata.
 *
 * @param target A node on which to dispatch the event.
 * @param id The ID of the project
 * @param rev The revision of the project. If not set then the latest revision is used.
 * @returns Promise resolved to a Project model.
 */
export declare function readAction(target: EventTarget, id: string, rev?: string): Promise<ARCProject>;
/**
 * Dispatches an event handled by the data store to update a project metadata.
 *
 * @param target A node on which to dispatch the event.
 * @param item The project object to update.
 * @returns Promise resolved to a Project model.
 */
export declare function updateAction(target: EventTarget, item: ARCProject): Promise<ARCEntityChangeRecord<ARCProject>>;

/**
 * Dispatches an event handled by the data store to delete a project metadata.
 *
 * @param target A node on which to dispatch the event.
 * @param id The id of the project to delete.
 * @param rev The revision of the project. If not set then the latest revision is used.
 * @returns Promise resolved to a new revision after delete.
 */
export declare function deleteAction(target: EventTarget, id: string, rev?: string): Promise<string>;
