export const ArcModelEventTypes = {
  Project: {
    read: 'project-read',
    update: 'project-object-changed',
    delete: 'project-object-deleted',
    query: 'project-model-query',
    updateBulk: 'project-update-bulk',
    State: {
      read: 'project-read',
      update: 'project-object-changed',
      delete: 'project-object-deleted',
    }
  }
};
Object.freeze(ArcModelEventTypes);
Object.freeze(ArcModelEventTypes.Project);
Object.freeze(ArcModelEventTypes.Project.State);
