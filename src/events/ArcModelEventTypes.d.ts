interface ProjectStateEvents {
  read: string;
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

declare interface ArcModelEventTypes {
  Project: ProjectEvents;
}

export const ArcModelEventTypes: ArcModelEventTypes;
