import * as ProjectEvents from './ProjectEvents.js';

export const ArcModelEvents = {
  Project: {
    read: ProjectEvents.readAction,
    update: ProjectEvents.updateAction,
    delete: ProjectEvents.deleteAction,
  }
};
Object.freeze(ArcModelEvents);
Object.freeze(ArcModelEvents.Project);
