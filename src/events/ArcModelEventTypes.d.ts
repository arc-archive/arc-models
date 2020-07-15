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

interface UrlIndexerStateEvents {
  finished: string;
}

interface UrlIndexerEvents {
  update: string;
  query: string;
  State: UrlIndexerStateEvents;
}

interface AuthDataStateEvents {
  update: string;
}

interface AuthDataEvents {
  update: string;
  query: string;
  State: AuthDataStateEvents;
}

interface HostRulesStateEvents {
  update: string;
  delete: string;
}

interface HostRulesEvents {
  update: string;
  updateBulk: string;
  delete: string;
  list: string;
  clear: string;
  State: HostRulesStateEvents;
}

interface ClientCertificateStateEvents {
  update: string;
  delete: string;
}

interface ClientCertificateEvents {
  read: string;
  list: string;
  delete: string;
  update: string;
  insert: string;
  State: ClientCertificateStateEvents;
}

interface WSUrlHistoryStateEvents {
  update: string;
}

interface WSUrlHistoryEvents {
  // read: string;
  list: string;
  insert: string;
  query: string;
  State: WSUrlHistoryStateEvents;
}

declare interface ArcModelEventTypes {
  destroy: string;
  destroyed: string;
  Project: ProjectEvents;
  Request: RequestEvents;
  UrlIndexer: UrlIndexerEvents;
  AuthData: AuthDataEvents;
  HostRules: HostRulesEvents;
  ClientCertificate: ClientCertificateEvents;
  WSUrlHistory: WSUrlHistoryEvents;
}

export const ArcModelEventTypes: ArcModelEventTypes;
