export const ArcModelEventTypes = {
  destroy: 'modeldestroy',
  destroyed: 'modeldestroyed',
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
    // updates metadata only
    update: 'modelrequestchange',
    updateBulk: 'modelrequestupdatebulk',
    // updates metadata, transforms body, takes care of dependencies
    store: 'modelrequeststore',
    delete: 'modelrequestdelete',
    deleteBulk: 'modelrequestdeletebulk',
    undeleteBulk: 'modelrequestsundelete',
    query: 'modelrequestquery',
    list:  'modelrequestlist',
    projectlist: 'modelrequestprojectlist',
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
