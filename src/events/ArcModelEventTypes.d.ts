interface ProjectStateEvents {
  update: string;
  delete: string;
}

interface ProjectEvents {
  read: string;
  update: string;
  delete: string;
  query: string;
  updateBulk: string;
  State: ProjectStateEvents;
}

interface RequestStateEvents {
  update: string;
  delete: string;
}
interface RequestEvents {
  read: string;
  readBulk: string;
  update: string;
  updateBulk: string;
  store: string;
  delete: string;
  deleteBulk: string;
  undeleteBulk: string;
  query: string;
  list: string;
  projectlist: string;
  State: RequestStateEvents;
}

declare interface ArcModelEventTypes {
  destroy: string;
  destroyed: string;
  Project: ProjectEvents;
  Request: RequestEvents;
}

export const ArcModelEventTypes: ArcModelEventTypes;
