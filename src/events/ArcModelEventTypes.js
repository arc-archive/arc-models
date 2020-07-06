export const ArcModelEventTypes = {
  Project: {
    read: 'modelprojectread',
    update: 'modelprojectchange',
    updateBulk: 'modelprojectupdatebulk',
    delete: 'modelprojectdelete',
    query: 'modelprojectquery',
    State: {
      update: 'modelstateprojectchange',
      delete: 'modelstateprojectdelete',
    }
  },
  Request: {
    read: 'modelrequestread',
    readBulk: 'modelrequestreadbulk',
    update: 'modelrequestchange',
    updateBulk: 'modelrequestupdatebulk',
    store: 'modelrequeststore',
    delete: 'modelrequestdelete',
    query: 'modelrequestquery',
    State: {
      update: 'modelstaterequestchange',
      delete: 'modelstaterequestdelete',
    },
  },
};
Object.freeze(ArcModelEventTypes);
Object.freeze(ArcModelEventTypes.Project);
Object.freeze(ArcModelEventTypes.Project.State);
Object.freeze(ArcModelEventTypes.Project);
Object.freeze(ArcModelEventTypes.Request.State);
