import { html } from 'lit-html';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator/arc-data-generator.js';
import { DemoPageBase } from './lib/common.js';
import '../request-model.js';
import '../project-model.js';

export class DemoPage extends DemoPageBase {
  constructor() {
    super();
    this.componentName = 'arc-models/project-model';

    this.initObservableProperties([
      'projectData', 'projects', 'results', 'hasResults'
    ]);

    this.genData = this.genData.bind(this);
    this.deleteData = this.deleteData.bind(this);
    this.refreshProjects = this.refreshProjects.bind(this);
    this.getProjectRequests = this.getProjectRequests.bind(this);
    this._selectedProjectHandler = this._selectedProjectHandler.bind(this);
  }

  get requestModel() {
    return document.getElementById('rModel');
  }

  get projectModel() {
    return document.getElementById('pModel');
  }

  async genData() {
    const data = DataGenerator.generateSavedRequestData({
      projectsSize: 25,
      requestsSize: 500
    });
    performance.mark('inserts-start');
    const { requestModel, projectModel } = this;
    await projectModel.updateBulk(data.projects);
    await requestModel.updateBulk('saved', data.requests);
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

  contentTemplate() {
    return html`
    <request-model id="rModel"></request-model>
    <project-model id="pModel"></project-model>
    <paper-toast text="Data is indexed" id="indexOk"></paper-toast>
    <paper-toast text="Datastore cleared" id="deleteOk"></paper-toast>
    <paper-toast id="errorToast"></paper-toast>

    <h2>Arc models / projects model</h2>
    ${this._demoTemplate()}
    `;
  }

  _demoTemplate() {
    return html`<section class="documentation-section">
      <h3>Interactive demo</h3>
      <p>
        This demo lets you preview the projects model.
      </p>

      ${this._dataOptsTemplate()}
      ${this._projectSelectorTemplate()}
      ${this._projectDetailsTemplate()}
      ${this._resultsTemplate()}

    </section>`;
  }

  _dataOptsTemplate() {
    return html`
    <section class="card centered options">
      <h4>Data options</h4>
      <anypoint-button @click="${this.genData}">Generate data</anypoint-button>
      <anypoint-button @click="${this.deleteData}">Destroy data</anypoint-button>
      <anypoint-button @click="${this.refreshProjects}">Refresh data</anypoint-button>
    </section>`;
  }

  _projectSelectorTemplate() {
    const { projects=[] } = this;
    return html`<section class="card centered options">
      <h4>Select project</h4>
      <anypoint-dropdown-menu>
        <label slot="label">Project name</label>
        <anypoint-listbox slot="dropdown-content" @selected-changed="${this._selectedProjectHandler}">
        ${projects.map((item) => html`<anypoint-item>${item.name}</anypoint-item>`)}
        </anypoint-listbox>
      </anypoint-dropdown-menu>
      <anypoint-button @click="${this.getProjectRequests}">Query requests in project</anypoint-button>
    </section>`;
  }

  _projectDetailsTemplate() {
    const { projectData: pd } = this;
    if (!pd) {
      return '';
    }
    return html`
    <section class="centered card" role="main">
      <h4>Project details</h4>
      <p>Name: ${pd.name}</p>
      <p>Description: ${pd.description}</p>
      <p>Created: ${pd.created}</p>
      <p>Updated: ${pd.updated}</p>
    </section>
    `;
  }

  _resultsTemplate() {
    if (!this.hasResults) {
      return '';
    }
    const { results } = this;
    return html`
    <section class="centered card" role="main">
      <h4>Project requests (${results.length})</h4>
      <ol>
      ${results.map((item) => html`<li>${item._id}, ${item.type}</li>`)}
      </ol>
    </section>
    `;
  }
}
const instance = new DemoPage();
window._demo = instance;
instance.render();

window.customElements.whenDefined('request-model')
.then(() => {
  setTimeout(() => instance.refreshProjects());
});
