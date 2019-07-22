import { html, render } from 'lit-html';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator/arc-data-generator.js';
import { DemoPageBase } from './lib/common.js';
import '../request-model.js';
import '../project-model.js';

export class DemoPage extends DemoPageBase {
  constructor() {
    super();
    this.genData = this.genData.bind(this);
    this.deleteData = this.deleteData.bind(this);
    this.refreshProjects = this.refreshProjects.bind(this);
    this.getProjectRequests = this.getProjectRequests.bind(this);
    this._selectedProjectHandler = this._selectedProjectHandler.bind(this);
  }
  get projectData() {
    return this._projectData;
  }

  set projectData(value) {
    this._projectData = value;
    this.render();
  }

  get projects() {
    return this._projects;
  }

  set projects(value) {
    this._projects = value;
    this.render();
  }

  _render() {
    let { projects, projectData, hasResults, results } = this;
    if (!projects) {
      projects = [];
    }
    render(html`
      <header>
        <h1>Project model demo</h1>
      </header>

      <request-model id="rModel"></request-model>
      <project-model id="pModel"></project-model>

      <section class="card centered options">
        <h2>Data options</h2>
        <paper-button @click="${this.genData}">Generate data</paper-button>
        <paper-button @click="${this.deleteData}">Destroy data</paper-button>
        <paper-button @click="${this.refreshProjects}">Refresh data</paper-button>
      </section>

      <section class="card centered options">
        <h2>Select project</h2>
        <paper-dropdown-menu label="Project name">
          <paper-listbox slot="dropdown-content" @selected-changed="${this._selectedProjectHandler}">
          ${projects.map((item) => html`<paper-item>${item.name}</paper-item>`)}
          </paper-listbox>
        </paper-dropdown-menu>
        <paper-button @click="${this.getProjectRequests}">Query requests in project</paper-button>
      </section>

      ${projectData ? html`<section class="centered card" role="main">
        <h2>Project details</h2>
        <p>Name: ${projectData.name}</p>
        <p>Description: ${projectData.description}</p>
        <p>Created: ${projectData.created}</p>
        <p>Updated: ${projectData.updated}</p>
      </section>` : undefined}

      ${hasResults ? html`<section class="centered card" role="main">
        <h2>Project requests (${results.length})</h2>
        ${results.map((item, index) => html`<p>${index}: ${item._id}, ${item.type}</p>`)}
      </section>` : undefined}

      <paper-toast text="Data is indexed" id="indexOk"></paper-toast>
      <paper-toast text="Datastore cleared" id="deleteOk"></paper-toast>
      <paper-toast id="errorToast"></paper-toast>`, document.querySelector('#demo'));
  }

  async genData() {
    const data = DataGenerator.generateSavedRequestData({
      projectsSize: 25,
      requestsSize: 500
    });
    performance.mark('inserts-start');
    const rModel = document.getElementById('rModel');
    const pModel = document.getElementById('pModel');
    await pModel.updateBulk(data.projects);
    await rModel.updateBulk('saved', data.requests);
    await this.refreshProjects();
  }

  async deleteData() {
    await DataGenerator.destroySavedRequestData();
    document.getElementById('deleteOk').opened = true;
    await this.refreshProjects();
  }

  async refreshProjects() {
    this.projects = undefined;
    const e = new CustomEvent('project-model-query', {
      cancelable: true,
      bubbles: true,
      detail: {}
    });
    performance.mark('projects-query');
    document.body.dispatchEvent(e);
    this.projects = await e.detail.result;
    performance.mark('projects-query-end');
    performance.measure('projects-query-end', 'projects-query');
    this._dumpMeasurements();
    console.log('Query result', this.projects);
  }

  async getProjectRequests() {
    this.hasResults = false;
    const project = this.projects[this.project];
    if (!project) {
      return;
    }
    const detail = {
      id: project._id
    };
    const e = new CustomEvent('request-project-list', {
      cancelable: true,
      bubbles: true,
      detail
    });
    performance.mark('requests-list');
    document.body.dispatchEvent(e);
    const data = await e.detail.result;
    performance.mark('requests-list-end');
    performance.measure('requests-list-end', 'requests-list');
    this._dumpMeasurements();
    console.log('Query result', data);
    this.results = data;
    this.hasResults = true;
  }

  _selectedProjectHandler(e) {
    this.project = e.detail.value;
    if (e.target.selected === undefined || e.target.selected < 0) {
      return;
    }
    const project = this.projects[e.target.selected];
    if (!project) {
      return;
    }
    const id = project._id;
    const rev = project._rev;
    this.readProjectData(id, rev);
  }

  async readProjectData(id, rev) {
    this.projectData = undefined;
    const e = new CustomEvent('project-read', {
      bubbles: true,
      cancelable: true,
      detail: {
        id,
        rev
      }
    });
    document.body.dispatchEvent(e);
    try {
      this.projectData = await e.detail.result;
    } catch (e) {
      this.onError(e);
    }
  }

  onError(cause) {
    console.error(cause);
    const toast = document.getElementById('errorToast');
    toast.text = cause.message;
    toast.opened = true;
  }
}
const instance = new DemoPage();
window._demo = instance;
instance.render();
window.customElements.whenDefined('request-model')
    .then(() => {
      setTimeout(() => {
        instance.refreshProjects();
      });
    });
