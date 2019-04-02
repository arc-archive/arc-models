[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/arc-models.svg)](https://www.npmjs.com/package/@advanced-rest-client/arc-models)

[![Build Status](https://travis-ci.org/advanced-rest-client/arc-models.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/arc-models)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/arc-models)

## &lt;arc-models&gt;

Event based access to ARC datastores.

Note, request model requires `pouchdb.quick-search.min.js` script to be included into the document.

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)

## Usage

### Installation
```
npm install --save @advanced-rest-client/arc-models
```

### In an html file

```html
<html>
  <head>
    <!-- Quick search has to be included old fashon way otherwise it won't work. -->
    <script src="./node_modules/pouchdb-quick-search/dist/pouchdb.quick-search.min.js"></script>
    <script type="module">
      import './node_modules/@advanced-rest-client/arc-models/auth-data-model.js';
      import './node_modules/@advanced-rest-client/arc-models/host-rules-model.js';
      import './node_modules/@advanced-rest-client/arc-models/project-model.js';
      import './node_modules/@advanced-rest-client/arc-models/request-model.js';
      import './node_modules/@advanced-rest-client/arc-models/rest-api-model.js';
      import './node_modules/@advanced-rest-client/arc-models/url-indexer.js';
      import './node_modules/@advanced-rest-client/arc-models/variables-model.js';
      import './node_modules/@advanced-rest-client/arc-models/websocket-url-history-model.js';
    </script>
  </head>
  <body>
    <auth-data-model></auth-data-model>
    <host-rules-model></host-rules-model>
    <project-model></project-model>
    <request-model></request-model>
    <rest-api-model></rest-api-model>
    <url-indexer></url-indexer>
    <variables-model></variables-model>
    <websocket-url-history-model></websocket-url-history-model>
  </body>
</html>
```

### In a Polymer 3 element

```js
import {PolymerElement, html} from './node_modules/@polymer/polymer';
import './node_modules/@advanced-rest-client/arc-models/auth-data-model.js';
import './node_modules/@advanced-rest-client/arc-models/host-rules-model.js';
import './node_modules/@advanced-rest-client/arc-models/project-model.js';
import './node_modules/@advanced-rest-client/arc-models/request-model.js';
import './node_modules/@advanced-rest-client/arc-models/rest-api-model.js';
import './node_modules/@advanced-rest-client/arc-models/url-indexer.js';
import './node_modules/@advanced-rest-client/arc-models/variables-model.js';
import './node_modules/@advanced-rest-client/arc-models/websocket-url-history-model.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`<auth-data-model></auth-data-model>
    <host-rules-model></host-rules-model>
    <project-model></project-model>
    <request-model></request-model>
    <rest-api-model></rest-api-model>
    <url-indexer></url-indexer>
    <variables-model></variables-model>
    <websocket-url-history-model></websocket-url-history-model>`;
  }
}
customElements.define('sample-element', SampleElement);
```

### Installation

```sh
git clone https://github.com/advanced-rest-client/arc-models
cd api-url-editor
npm install
npm install -g polymer-cli
```

### Running the demo locally

```sh
polymer serve --npm
open http://127.0.0.1:<port>/demo/
```

### Running the tests
```sh
polymer test --npm
```
