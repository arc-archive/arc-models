import * as ProjectEvents from './ProjectEvents.js';
import * as RequestEvents from './RequestEvents.js';

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
  },
  Request: {
    read: RequestEvents.readAction,
    // readBulk: 'modelrequestreadbulk',
    update: RequestEvents.updateAction,
    updateBulk: RequestEvents.updateBulkAction,
    store: RequestEvents.storeAction,
    delete: RequestEvents.deleteAction,
    // query: 'modelrequestquery',
    State: {
      update: RequestEvents.updatedState,
      delete: RequestEvents.deletedState,
    },
  },
};
Object.freeze(ArcModelEvents);
Object.freeze(ArcModelEvents.Project);
Object.freeze(ArcModelEvents.Project.State);
Object.freeze(ArcModelEvents.Request);
Object.freeze(ArcModelEvents.Request.State);
