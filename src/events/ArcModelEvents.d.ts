import * as ProjectEvents from './ProjectEvents';

declare interface ProjectFunctions {
  read: ProjectEvents.readAction;
  update: ProjectEvents.updateAction;
  delete: ProjectEvents.deleteAction;
}

export declare interface ArcModelEvents {
  Project: ProjectFunctions;
}
