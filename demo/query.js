import { html } from 'lit-html';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator/arc-data-generator.js';
import { DemoPageBase } from './lib/common.js';
import '../request-model.js';
import '../project-model.js';
import '../url-indexer.js';

export class DemoPage extends DemoPageBase {
  constructor() {
    super();
    this.componentName = 'arc-models/request-model';

    this.initObservableProperties([
      'results', 'q', 'hasResults', 'requestType', 'detailedSearch', 'editRequest',
      'hasNoFormAssociation'
    ]);
    this.q = 'api';
    this.requestType = 0;
    this.hasResults = false;
    this.editRequest = {
      method: 'GET',
      url: 'https://178.1.2.5/api/test1',
      headers: 'Accept: */*',
      name: ''
    };

    this.generateData = this.generateData.bind(this);
    this.deleteData = this.deleteData.bind(this);
    this.forceIndex = this.forceIndex.bind(this);
    this._indexFinished = this._indexFinished.bind(this);
    this.search = this.search.bind(this);
    this._queryInputHandler = this._queryInputHandler.bind(this);
    this._requestTypeHandler = this._requestTypeHandler.bind(this);
    this._detailedHandler = this._detailedHandler.bind(this);
    this._saveRequest = this._saveRequest.bind(this);
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

  async generateData() {
    console.log('Generating data.');
    performance.mark('inserts-start');
    await this.generateHistory();
    await this.generateSaved();
  }

  async deleteData() {
    await DataGenerator.destroySavedRequestData();
    document.getElementById('deleteOk').opened = true;
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
      console.log(e);
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
      console.log(e);
      this._dumpMeasurements();
    }
  }

  _indexFinished() {
    performance.mark('inserts-end');
    performance.measure('inserts-end', 'inserts-start');
    console.log('Indexing finished');
    this._dumpMeasurements();
    document.getElementById('indexOk').opened = true;
  }

  _queryInputHandler(e) {
    this.q = e.target.value;
  }

  _requestTypeHandler(e) {
    this.requestType = e.detail.value;
  }

  _detailedHandler(e) {
    this.detailedSearch = e.target.checked;
  }

  async forceIndex() {
    const { requestModel } = this;
    performance.mark('index-history');
    await requestModel.indexData('history');
    performance.mark('index-history-end');
    performance.measure('index-history-end', 'index-history');
    performance.mark('index-saved');
    await requestModel.indexData('saved');
    performance.mark('index-saved-end');
    performance.measure('index-saved-end', 'index-saved');
    this._dumpMeasurements();
    document.getElementById('indexedOk').opened = true;
  }

  async search() {
    const detail = {
      q: this.q
    };
    switch (this.requestType) {
      case 1: detail.type = 'history'; break;
      case 2: detail.type = 'saved'; break;
    }
    if (this.detailedSearch) {
      detail.detailed = true;
    }
    const e = new CustomEvent('request-query', {
      cancelable: true,
      bubbles: true,
      detail
    });
    performance.mark('data-search');
    document.body.dispatchEvent(e);
    const data = await e.detail.result;
    performance.mark('data-search-end');
    performance.measure('data-search-end', 'data-search');
    this._dumpMeasurements();
    console.log('Query result', data);
    this.results = data;
    this.hasResults = true;
  }

  async _saveRequest() {
    const { editRequest, requestModel, editForm } = this;
    Array.from(editForm.elements).forEach((item) => {
      const { name, value } = item;
      editRequest[name] = value;
    });
    const type = editForm.elements[0].value;
    performance.mark('request-update-start');
    performance.mark('inserts-start');
    try {
      const result = await requestModel.update(type, editRequest);
      performance.mark('request-update-end');
      performance.measure('request-update-end', 'request-update-start');
      performance.mark('indexing-start');
      this._dumpMeasurements();
      this.editRequest = { ...result };
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

  contentTemplate() {
    return html`
    <request-model id="rModel"></request-model>
    <project-model id="pModel"></project-model>
    <url-indexer id="model" @request-indexing-finished="${this._indexFinished}"></url-indexer>

    <paper-toast text="Data is indexed" id="indexOk"></paper-toast>
    <paper-toast text="Datastore cleared" id="deleteOk"></paper-toast>
    <paper-toast text="Datastore indexed" id="indexedOk"></paper-toast>

    <h2>Arc models / request model / querying</h2>
    ${this._demoTemplate()}
    `;
  }

  _demoTemplate() {
    return html`<section class="documentation-section">
      <h3>Interactive demo</h3>
      <p>
        This demo lets you preview the URL indexer model.
      </p>

      ${this._dataOptsTemplate()}
      ${this._requestUpdateTemplate()}
      ${this._searchOptsTemplate()}
      ${this._searchTemplate()}
      ${this._resultsTemplate()}

    </section>`;
  }

  _dataOptsTemplate() {
    return html`
    <section class="card centered options">
      <h4>Data options</h4>
      <anypoint-button @click="${this.generateData}">Generate data</anypoint-button>
      <anypoint-button @click="${this.deleteData}">Destroy data</anypoint-button>
      <anypoint-button @click="${this.forceIndex}">Force PouchDB index</anypoint-button>
    </section>`;
  }

  _searchOptsTemplate() {
    return html`
    <section class="card centered options">
      <h4>Search options</h4>
      <anypoint-dropdown-menu>
        <label slot="label">Request type</label>
        <anypoint-listbox
          slot="dropdown-content"
          @selected-changed="${this._requestTypeHandler}"
        >
          <anypoint-item>History and saved</anypoint-item>
          <anypoint-item>History only</anypoint-item>
          <anypoint-item>Saved only</anypoint-item>
        </anypoint-listbox>
      </anypoint-dropdown-menu>
      <div>
        <anypoint-checkbox
          @checked-changed="${this._detailedHandler}"
        >Perform detailed search</anypoint-checkbox>
      </div>
    </section>
    `;
  }

  _searchTemplate() {
    const { q } = this;
    return html`
    <section class="centered card" role="main">
      <h4>Search data store</h4>
      <div class="search-box">
        <anypoint-input
          id="q"
          name="q"
          .value="${q}"
          @input="${this._queryInputHandler}"
        >
          <label slot="label">Search term</label>
        </anypoint-input>
        <anypoint-button @click="${this.search}">Search</anypoint-button>
      </div>
    </section>
    `;
  }

  _resultsTemplate() {
    const { hasResults, results } = this;
    if (!hasResults) {
      return '';
    }
    return html`<section class="centered card" role="main">
      <h4>Search Results (${results.length})</h4>
      <ol>
      ${results.map(this._listItemTemplate)}
      </ol>
    </section>`
  }

  _listItemTemplate(item) {
    const { _id, name, type } = item;
    return html`<li>${name ? name : _id}, ${type}</li>`;
  }

  _requestUpdateTemplate() {
    const { editRequest: er = {}, hasNoFormAssociation } = this;
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
            selected="history"
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
}
const instance = new DemoPage();
window._demo = instance;
instance.render();
