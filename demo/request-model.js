import { html } from 'lit-html';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator/arc-data-generator.js';
import { DemoPageBase } from './lib/common.js';
import '../request-model.js';
import '../project-model.js';
import '../url-indexer.js';
import '@api-components/http-method-label/http-method-label.js';

export class DemoPage extends DemoPageBase {
  constructor() {
    super();
    this.componentName = 'arc-models/request-model';

    this.initObservableProperties([
      'hasResults', 'editRequest', 'requests', 'queryHistoryType', 'projects',
      'generateType', 'hasNoFormAssociation'
    ]);

    this.editRequest = {
      method: 'GET',
      url: 'https://api.domain.com',
      headers: 'Accept: */*',
      name: ''
    };
    this.queryHistoryType = 'history';
    this.generateType = 'history';
    this.hasNoFormAssociation = false;

    this._indexFinished = this._indexFinished.bind(this);
    this._queryRequests = this._queryRequests.bind(this);
    this._loadRequest = this._loadRequest.bind(this);
    this._deleteRequest = this._deleteRequest.bind(this);
    this._saveRequest = this._saveRequest.bind(this);
    this._generateTypeHandler = this._generateTypeHandler.bind(this);
    this.deleteData = this.deleteData.bind(this);
    this.generateData = this.generateData.bind(this);
  }

  get requestModel() {
    return document.getElementById('rModel');
  }

  get projectModel() {
    return document.getElementById('pModel');
  }

  get editForm() {
    return document.getElementById('editForm');
  }

  firstRender() {
    super.firstRender();
    const { editForm } = this;
    if (!editForm.elements.length) {
      this.hasNoFormAssociation = true;
    }
  }

  async getData(type) {
    this.hasResults = false;
    this.requests = undefined;
    const { requestModel } = this;
    performance.mark('requests-list');
    try {
      const data = await requestModel.list(type, {
        include_docs: true
      });
      performance.mark('requests-list-end');
      performance.measure('requests-list-end', 'requests-list');
      this._dumpMeasurements();
      console.log('Query result', data);
      this.requests = data.rows.map((item) => item.doc);
      this.hasResults = true;
    } catch (e) {
      console.error(e);
      this._dumpMeasurements();
    }
  }

  async refreshProjects() {
    const e = new CustomEvent('project-model-query', {
      cancelable: true,
      bubbles: true,
      detail: {}
    });
    performance.mark('projects-query');
    document.body.dispatchEvent(e);
    try {
      const data = await e.detail.result;
      performance.mark('projects-query-end');
      performance.measure('projects-query-end', 'projects-query');
      this._dumpMeasurements();
      console.log('Query result', data);
      this.projects = data;
    } catch (e) {
      console.error(e);
      this._dumpMeasurements();
    }
  }

  async deleteData() {
    const { requestModel } = this;
    performance.mark('history-delete-start');
    await requestModel.deleteModel('history');
    performance.mark('history-delete-end');
    performance.mark('saved-delete-start');
    await requestModel.deleteModel('saved');
    performance.mark('saved-delete-end');
    performance.measure('saved-delete-end', 'saved-delete-start');
    performance.measure('history-delete-end', 'history-delete-start');
    this._dumpMeasurements();
    console.log('Delete complete');
    if (this.editRequest && this.editRequest._id) {
      this.editRequest = {};
    }
    this.requests = undefined;
    this.hasResults = false;
  }

  async generateData() {
    console.log('Generating data.');
    const { generateType } = this;
    if (generateType === 'history') {
      await this.generateHistory();
    } else {
      await this.generateSaved();
    }
  }

  async generateHistory() {
    const { requestModel } = this;
    const data = DataGenerator.generateHistoryRequestsData({
      requestsSize: 100
    });
    console.log('Inserting Requests.');
    performance.mark('requests-inserts-start');

    try {
      await requestModel.updateBulk('history', data);
      performance.mark('indexing-start');
      console.log('Data inserted');
      performance.mark('requests-inserts-end');
      performance.measure('requests-inserts-end', 'requests-inserts-start');
      this._dumpMeasurements();
    } catch (e) {
      console.error(e);
      this._dumpMeasurements();
    }
  }

  async generateSaved() {
    const { requestModel, projectModel } = this;
    const data = DataGenerator.generateSavedRequestData({
      projectsSize: 25,
      requestsSize: 100
    });
    console.log('Inserting projects.');
    performance.mark('projects-inserts-start');

    try {
      await projectModel.updateBulk(data.projects);
      performance.mark('projects-inserts-end');
      performance.measure('projects-inserts-end', 'projects-inserts-start');
      console.log('Projects ready. Inserting Requests.');
      performance.mark('requests-inserts-start');
      await requestModel.updateBulk('saved', data.requests);
      performance.mark('indexing-start');
      console.log('Data inserted');
      performance.mark('requests-inserts-end');
      performance.measure('requests-inserts-end', 'requests-inserts-start');
      this._dumpMeasurements();
    } catch (e) {
      console.error(e);
      this._dumpMeasurements();
    }
  }

  _generateTypeHandler(e) {
    const { selected } = e.target;
    this.generateType = selected;
  }

  _queryRequests(e) {
    const type = e.detail.item.getAttribute('value');
    this.getData(type);
  }

  _loadRequest(e) {
    const index = Number(e.target.dataset.index);
    if (isNaN(index)) {
      return;
    }
    const item = this.requests[index];
    this.editRequest = item;
    this.queryHistoryType = item.type;
  };

  async _deleteRequest(e) {
    const index = Number(e.target.dataset.index);
    if (isNaN(index)) {
      return;
    }
    const item = this.requests[index];
    const { requestModel } = this;
    performance.mark('request-delete-start');
    try {
      await requestModel.remove(item.type, item._id, item._rev);
      performance.mark('request-delete-end');
      performance.measure('request-delete-end', 'request-delete-start');
      this._dumpMeasurements();
      const { requests } = this;
      requests.splice(index, 1);
      this.requests = [...requests];
    } catch (e) {
      console.error(e);
      this._dumpMeasurements();
    }
  }

  async _saveRequest() {
    const { editRequest, requestModel, editForm } = this;
    Array.from(editForm.elements).forEach((item) => {
      const { name, value } = item;
      editRequest[name] = value;
    });
    const type = editForm.elements[0].value;
    performance.mark('request-update-start');
    try {
      const result = await requestModel.update(type, editRequest);
      performance.mark('request-update-end');
      performance.measure('request-update-end', 'request-update-start');
      performance.mark('indexing-start');
      this._dumpMeasurements();
      this.editRequest = result;
      if (!this.requests) {
        this.requests = [];
      }
      const index = this.requests.findIndex((item) => item._id === result._id);
      if (index === -1) {
        this.requests.push(result);
      } else {
        this.requests[index] = result;
      }
      this.requests = [...this.requests];
    } catch (e) {
      console.error(e);
      this._dumpMeasurements();
    }
  }

  _indexFinished() {
    performance.mark('indexing-end');
    performance.measure('indexing-end', 'indexing-start');
    console.log('Indexing finished');
    this._dumpMeasurements();
    document.getElementById('indexOk').opened = true;
  }

  contentTemplate() {
    return html`
    <request-model id="rModel"></request-model>
    <project-model id="pModel"></project-model>
    <url-indexer @request-indexing-finished="${this._indexFinished}"></url-indexer>
    <paper-toast text="Data is indexed" id="indexOk"></paper-toast>
    <paper-toast text="Datastore cleared" id="deleteOk"></paper-toast>
    <paper-toast id="errorToast"></paper-toast>

    <h2>Arc models / request model</h2>
    ${this._demoTemplate()}
    `;
  }

  _demoTemplate() {
    return html`<section class="documentation-section">
      <h3>Interactive demo</h3>
      <p>
        This demo lets you preview the requests model.
      </p>

      ${this._dataOptsTemplate()}
      ${this._requestUpdateTemplate()}
      ${this._requestsDataTemplate()}

    </section>`;
  }

  _dataOptsTemplate() {
    const { generateType } = this;
    return html`
    <section class="card centered options">
      <h4>Data options</h4>
      <div class="">
        <anypoint-dropdown-menu>
          <label slot="label">Request type</label>
          <anypoint-listbox
            slot="dropdown-content"
            .selected="${generateType}"
            attrforselected="value"
            @select="${this._generateTypeHandler}"
          >
            <anypoint-item label="history" value="history">history</anypoint-item>
            <anypoint-item label="saved" value="saved">saved</anypoint-item>
          </anypoint-listbox>
        </anypoint-dropdown-menu>
        <anypoint-button @click="${this.generateData}">Generate request data</anypoint-button>
      </div>
      <anypoint-button @click="${this.deleteData}">Destroy all data</anypoint-button>
    </section>`;
  }

  _requestUpdateTemplate() {
    const { editRequest: er = {}, queryHistoryType, hasNoFormAssociation } = this;
    if (hasNoFormAssociation) {
      return html`Editing is disabled due to unsupported browser.`;
    }
    return html`
    <section class="card centered options">
      <h4>Update request</h4>
      <form method="post" id="editForm">
        <anypoint-dropdown-menu name="type">
          <label slot="label">Request type</label>
          <anypoint-listbox
            slot="dropdown-content"
            .selected="${queryHistoryType}"
            attrforselected="value"
            id="editorType"
          >
            <anypoint-item label="history" value="history">history</anypoint-item>
            <anypoint-item label="saved" value="saved">saved</anypoint-item>
          </anypoint-listbox>
        </anypoint-dropdown-menu>

        <anypoint-input name="method" value="${er.method || ''}">
          <label slot="label">Method</label>
        </anypoint-input>
        <anypoint-input name="url" value="${er.url || ''}">
          <label slot="label">URL</label>
        </anypoint-input>
        <anypoint-input name="headers" value="${er.headers || ''}">
          <label slot="label">Headers</label>
        </anypoint-input>
        <anypoint-input name="name" value="${er.name || ''}">
          <label slot="label">Name</label>
        </anypoint-input>

        ${er._id ? html`
          <p>ID: ${er._id}</p>
          <p>Rev: ${er._rev}</p>` : ''}
        <anypoint-button @click="${this._saveRequest}">Save</anypoint-button>
      </form>
    </section>
    `;
  }

  _requestsDataTemplate() {
    const { hasResults } = this;
    return html`
    <section class="card options">
      <h4>Stored requests data</h4>
      <anypoint-dropdown-menu>
        <label slot="label">Request type</label>
        <anypoint-listbox slot="dropdown-content" @select="${this._queryRequests}" attrforselected="value">
          <anypoint-item label="history" value="history">history</anypoint-item>
          <anypoint-item label="saved" value="saved">saved</anypoint-item>
        </anypoint-listbox>
      </anypoint-dropdown-menu>
      ${hasResults ? this._requestsListTemplate() : ''}
    </section>
    `;
  }

  _requestsListTemplate() {
    const { requests } = this;
    return requests.map((item, index) => html`
    <div class="list-item">
      <span class="request-details">
        <http-method-label method="${item.method}"></http-method-label>
        ${item.url}
      </span>
      <anypoint-button data-index="${index}" @click="${this._loadRequest}">Load</anypoint-button>
      <anypoint-button data-index="${index}" @click="${this._deleteRequest}">Delete</anypoint-button>
    </div>`);
  }
}
const instance = new DemoPage();
window._demo = instance;
instance.render();

window.customElements.whenDefined('project-model')
.then(() => {
  setTimeout(() => instance.refreshProjects());
});
