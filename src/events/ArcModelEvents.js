import * as ProjectEvents from './ProjectEvents.js';
import * as RequestEvents from './RequestEvents.js';
import * as BaseEvents from './BaseEvents.js';
import * as UrlIndexerEvents from './UrlIndexerEvents.js';
import * as AuthDataEvents from './AuthDataEvents.js';
import * as HostRuleEvents from './HostRuleEvents.js';
import * as CertificatesEvents from './CertificatesEvents.js';
import * as WSUrlHistoryEvents from './WSUrlHistoryEvents.js';
import * as UrlHistoryEvents from './UrlHistoryEvents.js';

export const ArcModelEvents = {
  /**
   * Dispatches an event handled by the data store to destroy a data store.
   *
   * @param {EventTarget} target A node on which to dispatch the event.
   * @param {string[]} stores A list of store names to affect
   * @return {Promise<void>} List of promises resolved when each store is destroyed
   */
  destroy: async (target, stores) => {
    const e = new BaseEvents.ARCModelDeleteEvent(stores);
    target.dispatchEvent(e);
    if (Array.isArray(e.detail.result)) {
      await Promise.all(e.detail.result);
    }
  },
  /**
   * Dispatches an event information the app that a store has been destroyed.
   *
   * @param {EventTarget} target A node on which to dispatch the event.
   * @param {string} store The name of the deleted store
   */
  destroyed: (target, store) => {
    const e = new BaseEvents.ARCModelStateDeleteEvent(store);
    target.dispatchEvent(e);
  },
  Project: {
    read: ProjectEvents.readAction,
    update: ProjectEvents.updateAction,
    updateBulk: ProjectEvents.updateBulkAction,
    delete: ProjectEvents.deleteAction,
    query: ProjectEvents.queryAction,
    State: {
      update: ProjectEvents.updatedState,
      delete: ProjectEvents.deletedState,
    },
  },
  Request: {
    read: RequestEvents.readAction,
    readBulk: RequestEvents.readBulkAction,
    list: RequestEvents.listAction,
    update: RequestEvents.updateAction,
    updateBulk: RequestEvents.updateBulkAction,
    store: RequestEvents.storeAction,
    delete: RequestEvents.deleteAction,
    deleteBulk: RequestEvents.deleteBulkAction,
    undeleteBulk: RequestEvents.undeleteBulkAction,
    query: RequestEvents.queryAction,
    projectlist: RequestEvents.listProjectAction,
    State: {
      update: RequestEvents.updatedState,
      delete: RequestEvents.deletedState,
    },
  },
  UrlIndexer: {
    update: UrlIndexerEvents.updateAction,
    query: UrlIndexerEvents.queryAction,
    State: {
      finished: UrlIndexerEvents.finishedState,
    },
  },
  AuthData: {
    query: AuthDataEvents.queryAction,
    update: AuthDataEvents.updateAction,
    State: {
      update: AuthDataEvents.updatedState,
    },
  },
  HostRules: {
    update: HostRuleEvents.updateAction,
    updateBulk: HostRuleEvents.updateActionBulk,
    delete: HostRuleEvents.deleteAction,
    list: HostRuleEvents.listAction,
    // clear: HostRuleEvents.cle,
    State: {
      update: HostRuleEvents.updatedState,
      delete: HostRuleEvents.deletedState,
    },
  },
  ClientCertificate: {
    read: CertificatesEvents.readAction,
    list: CertificatesEvents.listAction,
    delete: CertificatesEvents.deleteAction,
    // update: 'modelclientcertificateupdate',
    insert: CertificatesEvents.insertAction,
    State: {
      update: CertificatesEvents.updatedState,
      delete: CertificatesEvents.deletedState,
    },
  },
  WSUrlHistory: {
    // read: 'modelwsurlhistoryread',
    list: WSUrlHistoryEvents.listAction,
    insert: WSUrlHistoryEvents.insertAction,
    query: WSUrlHistoryEvents.queryAction,
    State: {
      update: WSUrlHistoryEvents.updatedState,
    },
  },
  UrlHistory: {
    // read: 'modelwsurlhistoryread',
    list: UrlHistoryEvents.listAction,
    insert: UrlHistoryEvents.insertAction,
    query: UrlHistoryEvents.queryAction,
    State: {
      update: UrlHistoryEvents.updatedState,
    },
  },
};
Object.freeze(ArcModelEvents);
Object.freeze(ArcModelEvents.Project);
Object.freeze(ArcModelEvents.Project.State);
Object.freeze(ArcModelEvents.Request);
Object.freeze(ArcModelEvents.Request.State);
Object.freeze(ArcModelEvents.UrlIndexer);
Object.freeze(ArcModelEvents.UrlIndexer.State);
Object.freeze(ArcModelEvents.AuthData);
Object.freeze(ArcModelEvents.AuthData.State);
Object.freeze(ArcModelEvents.HostRules);
Object.freeze(ArcModelEvents.HostRules.State);
Object.freeze(ArcModelEvents.ClientCertificate);
Object.freeze(ArcModelEvents.ClientCertificate.State);
Object.freeze(ArcModelEvents.WSUrlHistory);
Object.freeze(ArcModelEvents.WSUrlHistory.State);
Object.freeze(ArcModelEvents.UrlHistory);
Object.freeze(ArcModelEvents.UrlHistory.State);
