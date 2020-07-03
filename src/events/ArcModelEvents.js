import * as ProjectEvents from './ProjectEvents.js';

export const ArcModelEvents = {
  Project: {
    read: ProjectEvents.readAction,
    update: ProjectEvents.updateAction,
    updateBulk: ProjectEvents.updateBulkAction,
    delete: ProjectEvents.deleteAction,
    query: ProjectEvents.queryAction,
    State: {
      update: ProjectEvents.updatedState,
      delete: ProjectEvents.deletedState,
    }
  }
};
Object.freeze(ArcModelEvents);
Object.freeze(ArcModelEvents.Project);
