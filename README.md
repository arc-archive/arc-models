[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/arc-models.svg)](https://www.npmjs.com/package/@advanced-rest-client/arc-models)

[![Build Status](https://travis-ci.org/advanced-rest-client/arc-models.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/arc-models)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/arc-models)

## &lt;arc-models&gt;

Event based access to ARC datastores.

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
    <script type="module">
      import '@advanced-rest-client/arc-models/request-model.js';
    </script>
  </head>
  <body>
    <request-model></request-model>
  </body>
</html>
```

### In a Polymer 3 element

```js
import {PolymerElement, html} from '@polymer/polymer';
import '@advanced-rest-client/arc-models/request-model.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
    <request-model></request-model>
    `;
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
