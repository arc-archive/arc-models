import * as ProjectEvents from './ProjectEvents.js';

/** @typedef {import('../RequestTypes').ARCProject} ARCProject */

export const ArcModelEvents = {
  Project: {
    /**
     * Dispatches `domainprojectread` event.
     *
     * @param {HTMLElement} target A node on which to dispatch the event.
     * @param {string} id The ID of the project
     * @return {Promise<ARCProject>} Promise resolved to a Project model.
     */
    read: async (target, id, rev) => {
      const e = new ProjectEvents.ARCPRojectReadEvent({
        id,
        rev,
      });
      target.dispatchEvent(e);
      return e.detail.result;
    },
    change: 'project-object-changed',
    delete: 'project-object-deleted',
    query: 'project-model-query',
    updateBulk: 'project-update-bulk',
  }
};
Object.freeze(ArcModelEvents);
Object.freeze(ArcModelEvents.Project);
