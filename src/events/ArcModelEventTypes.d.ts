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
  query: string;
  State: RequestStateEvents;
}

declare interface ArcModelEventTypes {
  Project: ProjectEvents;
  Request: RequestEvents;
}

export const ArcModelEventTypes: ArcModelEventTypes;
