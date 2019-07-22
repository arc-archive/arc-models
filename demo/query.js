import { html, render } from 'lit-html';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator/arc-data-generator.js';
import { DemoPageBase } from './lib/common.js';
import '../request-model.js';
import '../project-model.js';
import '../url-indexer.js';

export class DemoPage extends DemoPageBase {
  constructor() {
    super();
    this.generateData = this.generateData.bind(this);
    this.deleteData = this.deleteData.bind(this);
    this.forceIndex = this.forceIndex.bind(this);
    this._indexFinished = this._indexFinished.bind(this);
    this.search = this.search.bind(this);
    this._queryInputHandler = this._queryInputHandler.bind(this);
    this._requestTypeHandler = this._requestTypeHandler.bind(this);
    this._detailedHandler = this._detailedHandler.bind(this);

    this.q = 'api';
    this.requestType = 0;
    this.hasResults = false;
  }

  get results() {
    return this._results;
  }

  set results(value) {
    this._results = value;
    this.render();
  }

  _render() {
    const { hasResults, results, q } = this;
    render(html`
      <header>
        <h1>Query model demo</h1>
      </header>

      <request-model id="rModel"></request-model>
      <project-model id="pModel"></project-model>
      <url-indexer id="model" @request-indexing-finished="${this._indexFinished}"></url-indexer>

      <section class="card centered options">
        <h2>Data options</h2>
        <paper-button @click="${this.generateData}">Generate data</paper-button>
        <paper-button @click="${this.deleteData}">Destroy data</paper-button>
        <paper-button @click="${this.forceIndex}">Force PouchDB index</paper-button>
      </section>

      <section class="card centered options">
        <h2>Search options</h2>
        <paper-dropdown-menu label="Request type">
          <paper-listbox slot="dropdown-content" @selected-changed="${this._requestTypeHandler}">
            <paper-item>History and saved</paper-item>
            <paper-item>History only</paper-item>
            <paper-item>Saved only</paper-item>
          </paper-listbox>
        </paper-dropdown-menu>
        <div>
          <paper-checkbox @checked-changed="${this._detailedHandler}">Perform detailed search</paper-checkbox>
        </div>
      </section>

      <section class="centered card" role="main">
        <h2>Search data store</h2>
        <div class="search-box">
          <paper-input label="Search term" id="q" name="q" .value="${q}"
            @input="${this._queryInputHandler}"></paper-input>
          <paper-button @click="${this.search}">Search</paper-button>
        </div>
      </section>

      ${hasResults ? html`<section class="centered card" role="main">
        <h2>Search Results (${results.length})</h2>
        ${results.map((item, index) => html`<p>${index}: ${item._id}, ${item.type}</p>`)}
      </section>` : undefined}

      <paper-toast text="Data is indexed" id="indexOk"></paper-toast>
      <paper-toast text="Datastore cleared" id="deleteOk"></paper-toast>
      <paper-toast text="Datastore indexed" id="indexedOk"></paper-toast>`, document.querySelector('#demo'));
  }

  async generateData() {
    console.log('Generating data.');
    await this.generateHistory();
    await this.generateSaved();
  }

  async deleteData() {
    await DataGenerator.destroySavedRequestData();
    document.getElementById('deleteOk').opened = true;
  }

  async generateHistory() {
    const data = DataGenerator.generateHistoryRequestsData({
      requestsSize: 100
    });
    console.log('Inserting Requests.');
    performance.mark('requests-inserts-start');
    const rModel = document.getElementById('rModel');
    try {
      await rModel.updateBulk('history', data);
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
    const data = DataGenerator.generateSavedRequestData({
      projectsSize: 25,
      requestsSize: 100
    });

    performance.mark('projects-inserts-start');
    const rModel = document.getElementById('rModel');
    const pModel = document.getElementById('pModel');
    console.log('Inserting projects.');
    try {
      await pModel.updateBulk(data.projects);
      performance.mark('projects-inserts-end');
      performance.measure('projects-inserts-end', 'projects-inserts-start');
      console.log('Projects ready. Inserting Requests.');
      performance.mark('requests-inserts-start');
      await rModel.updateBulk('saved', data.requests);

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
    this.detailedSearch = e.detail.value;
  }

  async forceIndex() {
    const model = document.getElementById('model');
    performance.mark('index-history');
    await model.indexData('history');
    performance.mark('index-history-end');
    performance.measure('index-history-end', 'index-history');
    performance.mark('index-saved');
    await model.indexData('saved');
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
}
const instance = new DemoPage();
window._demo = instance;
instance.render();
