export const ArcModelEventTypes = {
  Project: {
    read: 'modelprojectread',
    update: 'modelprojectchange',
    delete: 'modelprojectdelete',
    query: 'modelprojectquery',
    updateBulk: 'modelprojectupdatebulk',
    State: {
      update: 'modelstateprojectchange',
      delete: 'modelstateprojectdelete',
    }
  }
};
Object.freeze(ArcModelEventTypes);
Object.freeze(ArcModelEventTypes.Project);
Object.freeze(ArcModelEventTypes.Project.State);
