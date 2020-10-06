# ARC data models

Data models for Advanced REST Client application. This module contains the logic used by the application to store and restore data to the UI.

It also provides DOM events based access to the API. Each operation has corresponding event that can be used to access the data.
A convenient way of using the events API is to by using the `ArcModelEvents` and `ArcModelEventTypes` interfaces.
The first provides access to function which call creates and dispatches events on a given node. The later provides the definition of the event types for manual handling.

It is highly recommended to use this models with the support of typescript. The library and each component has types definition with documentation for convenient use. Types are declared in `@advanced-rest-client/arc-types` module.

[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/arc-models.svg)](https://www.npmjs.com/package/@advanced-rest-client/arc-models)

[![Build Status](https://travis-ci.com/advanced-rest-client/arc-models.svg)](https://travis-ci.com/advanced-rest-client/arc-models)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/arc-models)

## Usage

The models are modularized so the ARC application can easily replace each interface depending on the interface. It also allows to extract part of the application logic to the outside the application
and use the same models to add storage support.

### Installation

```sh
npm install --save @advanced-rest-client/arc-models
```

### Working with the events

Each model has a corresponding to (almost) each public method an event that can be used instead of directly accessing the model instance.
It is more convenient than direct use of the library in each component as it's easier to manage API changes if the components are using an abstract layer instead of the direct API. This way it's a much simpler task to change the data store implementation that when the components would use the library directly.

Say, you want to list ARC requests data stored in the application. This is supported by the `request-model`. You can access the data by dispatching the list event:

```javascript
import '@advanced-rest-client/arc-models/request-model.js';
import { ArcModelEvents } '@advanced-rest-client/arc-models';

const result = await ArcModelEvents.Request.list(document.body, 'saved', {
  limit: 25,
});
const { items } = result;
```

### Pagination

All components uses the same interface to list the data. When calling `list()` function (or the corresponding event) an the model
it always accept an object with the `limit` and `nextPageToken` property. Both are optional.
The limit tells the model how many entities to return with the response. Then next page token is returned with each list result and contains hashed data about the current position in the pagination.

```javascript
import '@advanced-rest-client/arc-models/request-model.js';
import { ArcModelEvents } '@advanced-rest-client/arc-models';

const result = await ArcModelEvents.Request.list(document.body, 'saved', {
  limit: 25,
});
const { items, nextPageToken } = result;
```

The `items` array contains a list of `ARCSavedRequest` entities. The second property returned by the query is the `nextPageToken` that now can be passed to the next list request to request the next page of the results.

```javascript
const next = await ArcModelEvents.Request.list(document.body, 'saved', {
  limit: 25,
  nextPageToken,
});
```

Note that limit has to be defined for each call as the page cursor does not  store this information.


### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@advanced-rest-client/arc-models/auth-data-model.js';
      import '@advanced-rest-client/arc-models/host-rules-model.js';
      import '@advanced-rest-client/arc-models/project-model.js';
      import '@advanced-rest-client/arc-models/request-model.js';
      import '@advanced-rest-client/arc-models/rest-api-model.js';
      import '@advanced-rest-client/arc-models/url-indexer.js';
      import '@advanced-rest-client/arc-models/variables-model.js';
      import '@advanced-rest-client/arc-models/websocket-url-history-model.js';
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

### In a LitElement template

```javascript
import { LitElement, html } from 'lit-element';
import '@advanced-rest-client/arc-models/auth-data-model.js';
import '@advanced-rest-client/arc-models/host-rules-model.js';
import '@advanced-rest-client/arc-models/project-model.js';
import '@advanced-rest-client/arc-models/request-model.js';
import '@advanced-rest-client/arc-models/rest-api-model.js';
import '@advanced-rest-client/arc-models/url-indexer.js';
import '@advanced-rest-client/arc-models/variables-model.js';
import '@advanced-rest-client/arc-models/websocket-url-history-model.js';

class SampleElement extends LitElement {
  render() { `
    <auth-data-model></auth-data-model>
    <host-rules-model></host-rules-model>
    <project-model></project-model>
    <request-model></request-model>
    <rest-api-model></rest-api-model>
    <url-indexer></url-indexer>
    <variables-model></variables-model>
    <websocket-url-history-model></websocket-url-history-model>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

### In a Polymer 3 element

```js
import {PolymerElement, html} from '@polymer/polymer';
import '@advanced-rest-client/arc-models/auth-data-model.js';
import '@advanced-rest-client/arc-models/host-rules-model.js';
import '@advanced-rest-client/arc-models/project-model.js';
import '@advanced-rest-client/arc-models/request-model.js';
import '@advanced-rest-client/arc-models/rest-api-model.js';
import '@advanced-rest-client/arc-models/url-indexer.js';
import '@advanced-rest-client/arc-models/variables-model.js';
import '@advanced-rest-client/arc-models/websocket-url-history-model.js';

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

## Development

```sh
git clone https://github.com/@advanced-rest-client/arc-models
cd arc-models
npm install
```

### Running the demo locally

```sh
npm start
```

### Running the tests

```sh
npm test
```
