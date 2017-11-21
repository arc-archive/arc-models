[![Build Status](https://travis-ci.org/advanced-rest-client/arc-models.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/arc-models)  

# project-model

Events based access to projects datastore.

Note: **All events must be cancelable.** When the event is cancelled by an instance
of the element it won't be handled again by other instance that possibly exists
in the DOM.

Cancellable event is a request to models for change. Non-cancellable event
is a notification for views to update their values.
For example `project-object-changed` event notifies model to update object in
the datastore if the event is cancelable and to update views if it's not
cancellable.

Each handled event contains the `result` property on the `detail` object. It
contains a `Promise` object with a result of the operation. Also, for update / delete
events the same non-cancelable event is fired.

Events handled by this element are cancelled and propagation of the event is
stopped.

Supported operations:

-   Read project object (`project-read`)
-   Update name only (`project-name-changed`)
-   Update project object (`project-object-changed`)
-   Delete object (`project-object-deleted`)
-   Query for projects (`project-model-query`)

### Events description

#### `project-read` event

Reads a project object from the datastore.

##### Properties
-   `id` (String, required) ID of the datastore entry
-   `rev` (String, optional) Specific revision to retrieve from the datastore. Latest by default.

##### Example

```javascript
var event = new CustomEvent('project-read', {
  detail: { id: 'some-id' },
  bubbles: true,
  composed: true,
  cancelable: true
});
document.body.dispatchEvent(event);
if (event.defaultPrevented) {
  event.detail.result.then(project => console.log(project));
}
```

#### `project-name-changed` event

Changes name of a project. Promise result has updated name and `_rev` properties.

##### Properties
-   `id` (String, required if `project` is not set) ID of the datastore entry
-   `project` (Object, required if `id` is not set) The database entity
-   `name` (String, required) New name of the project. It doesn't matter if `project` property already has new name.

##### Example

```javascript
var event = new CustomEvent('project-name-changed', {
  detail: { id: 'some-id', name: 'new name' },
  bubbles: true,
  composed: true,
  cancelable: true
});
document.body.dispatchEvent(event);
if (event.defaultPrevented) {
  event.detail.result.then(project => console.log(project));
}
```

#### `project-object-changed` event

Updates / saves new object in the datastore.

##### Properties

-   `project` (Object, required) An object to store

##### Example

```javascript
var event = new CustomEvent('project-object-changed', {
  detail: { project: {...} },
  bubbles: true,
  composed: true,
  cancelable: true
});
document.body.dispatchEvent(event);
if (event.defaultPrevented) {
  event.detail.result.then(project => console.log(project));
}
```

#### `project-object-deleted` event

Deletes the object from the datastore. This operation fires `project-object-deleted`
custom event. Promise returns object's new `_rev` value.

##### Properties
-   `id` (String, required) ID of the datastore entry
-   `rev` (String, optional) The `_rev` property of the PouchDB datastore object. If not set it will use latest revision.

##### Example

```javascript
var event = new CustomEvent('project-object-deleted', {
  detail: { id: 'some-id' },
  bubbles: true,
  composed: true,
  cancelable: true
});
document.body.dispatchEvent(event);
if (event.defaultPrevented) {
  event.detail.result.then(newRev => console.log(newRev));
}
```

#### `project-model-query` event

Reads the list of all projects. Promise resolves to the list of projects.
This event doesn't requeire any properties but **the `details` object must be set**.

##### Example

```javascript
var event = new CustomEvent('project-model-query', {
  detail: {}, // THIS MUST BE SET
  bubbles: true,
  composed: true,
  cancelable: true
});
document.body.dispatchEvent(event);
if (event.defaultPrevented) {
  event.detail.result.then(list => console.log(list));
}
```



### Events
| Name | Description | Params |
| --- | --- | --- |
| project-object-changed | Fired when the project entity has been saved / updated in the datastore. | project **Object** - Project object with new `_rev`. |
oldRev **String** - Entity old `_rev` property. May be `undefined` when creating new entity. |
| project-object-deleted |  | id **String** - Removed project ID |
rev **String** - Updated `_rev` property of the object. |
oldRev **String** - Entity old `_rev` property (before delete). |
# request-model

Events based access to saved request datastore.

Note: **All events must be cancelable.** When the event is cancelled by an instance
of the element it won't be handled again by other instance that possibly exists
in the DOM.

Cancellable event is a request to models for change. Non-cancellable event
is a notification for views to update their values.
For example `request-object-changed` event notifies model to update object in
the datastore if the event is cancelable and to update views if it's not
cancellable.

Each handled event contains the `result` property on the `detail` object. It
contains a `Promise` object with a result of the operation. Also, for update / delete
events the same non-cancelable event is fired.

Events handled by this element are cancelled and propagation of the event is
stopped.

Supported operations:

-   Read request object (`request-object-read`)
-   Update name only (`request-name-changed`)
-   Update request object (`request-object-changed`)
-   Delete object (`request-object-deleted`)
-   Deletes list of request objects (`request-objects-deleted`)

## Request object types

There are two request object types: `saved-requests` and `history-requests`.
Each event must contain a `type` property to determine which database to query
for an object.

### Events description

#### `request-object-read` event

Reads a request object from the datastore.

##### Properties
-   `id` (String, required) ID of the datastore entry
-   `rev` (String, optional) Specific revision to retrieve from the datastore. Latest by default.
-   `type` {String, required} Request object type. Either `saved-requests` or `history-requests`

##### Example

```javascript
var event = new CustomEvent('request-object-read', {
  detail: { id: 'some-id', type: 'saved-requests' },
  bubbles: true,
  composed: true,
  cancelable: true
});
if (event.defaultPrevented) {
  event.detail.result.then(request => console.log(request));
}
```

#### `request-name-changed` Event

Changes name of a request. Promise result has updated `name` and `_rev` properties.
This operation deletes old object because it changes the `name` of the request
that is used to build the datastore key.

##### Properties
-   `id` (String, required if `project` is not set) ID of the datastore entry
-   `request` (Object, required if `id` is not set) The database entity
-   `name` (String, required) New name of the project. It doesn't matter if `project` property already has new name.
-   `type` {String, required} Request object type. Either `saved-requests` or `history-requests`

##### Example

```javascript
var event = new CustomEvent('request-name-changed', {
  detail: { id: 'some-id', name: 'new name', type: 'history-requests' },
  bubbles: true,
  composed: true,
  cancelable: true
});
if (event.defaultPrevented) {
  event.detail.result.then(request => console.log(request));
}
```

#### `request-object-changed` event

Updates / saves new object in the datastore.

##### Properties

-   `request` (Object, required) An object to store
-   `type` {String, required} Request object type. Either `saved-requests` or `history-requests`

##### Example

```javascript
var event = new CustomEvent('request-object-changed', {
  detail: { request: {...}, type: 'saved-requests' },
  bubbles: true,
  composed: true,
  cancelable: true
});
if (event.defaultPrevented) {
  event.detail.result.then(request => console.log(request));
}
```

#### `request-object-deleted` event

Deletes the object from the datastore. This operation fires `request-object-deleted`
custom event. Promise returns object's new `_rev` value.

##### Properties
-   `id` (String, required) ID of the datastore entry
-   `rev` (String, optional) The `_rev` property of the PouchDB datastore object. If not set it will use latest revision.
-   `type` {String, required} Request object type. Either `saved-requests` or `history-requests`

##### Example

```javascript
var event = new CustomEvent('request-object-deleted', {
  detail: { id: 'some-id', type: 'saved-requests' },
  bubbles: true,
  composed: true,
  cancelable: true
});
if (event.defaultPrevented) {
  event.detail.result.then(newRev => console.log(newRev));
}
```

#### `request-objects-deleted` event

Removes list of requests in batch operation. Promise results to the map where keys
are request ids and values are new revision hash.

##### Properties

-   `items` (Array, required) List of IDs to delete
-   `type` {String, required} Request object type. Either `saved-requests` or `history-requests`

##### Example

```javascript
var event = new CustomEvent('request-objects-deleted', {
  detail: {
    items: ['some-id', 'other-id'],
    type: 'saved-requests'
  },
  bubbles: true,
  composed: true,
  cancelable: true
});
if (event.defaultPrevented) {
  event.detail.result.then(deleted => console.log(deleted));
}
```

#### `request-objects-undeleted` event

Restores previously deleted requests from the history.
It searches in the revision history of each object to find a revision before
passed `_rev` and restores this object as a new one in the revision tree.

This operation fires `request-object-deleted` custom event. Promise returns
request objects with updated `_rev` value.

##### Properties

-   `items` (Array, required) List of requests to restore. It required `_id` and `_rev` properties to be set on each object. The `_rev` property must be a revision updated after the deletion of the object.
-   `type` {String, required} Request object type. Either `saved-requests` or `history-requests`

##### Example

```javascript
var event = new CustomEvent('request-objects-deleted', {
  detail: {
    items: [{_id: 'some-id', '_rev': '2-xyz'}],
    type: 'saved-requests'
  },
  bubbles: true,
  composed: true,
  cancelable: true
});
if (event.defaultPrevented) {
  event.detail.result.then(restored => console.log(restored));
}
```



### Events
| Name | Description | Params |
| --- | --- | --- |
| request-object-changed | Fired when the project entity has been saved / updated in the datastore. | request **Object** - Request object with new `_rev`. |
oldRev **String** - Entity old `_rev` property. May be `undefined` when creating new entity. |
oldId **String** - Entity old `_id` property. May be `undefined` when creating new entity. |
type **String** - Request object type. Can be either `saved-requests` or `history-requests` |
| request-object-deleted |  | id **String** - Removed request ID |
rev **String** - Updated `_rev` property of the object. |
oldRev **String** - Entity old `_rev` property (before delete). |
type **String** - Request object type. Can be either `saved-requests` or `history-requests` |
# websocket-url-history-model

Events based access to websockets URL history datastore.

Note: **All events must be cancelable.** When the event is cancelled by an instance
of the element it won't be handled again by other instance that possibly exists
in the DOM.

Cancellable event is a request to models for change. Non-cancellable event
is a notification for views to update their values.
For example `request-object-changed` event notifies model to update object in
the datastore if the event is cancelable and to update views if it's not
cancellable.

Each handled event contains the `result` property on the `detail` object. It
contains a `Promise` object with a result of the operation. Also, for update / delete
events the same non-cancelable event is fired.

Events handled by this element are cancelled and propagation of the event is
stopped.

# rest-api-model

Events based access to REST APIs datastore.

Note: **All events must be cancelable.** When the event is cancelled by an instance
of the element it won't be handled again by other instance that possibly exists
in the DOM.

`rest-api-index-updated`, `rest-api-data-updated` and `rest-api-deleted` events
are cancelable if a view requested to alter the data in the datastore. Only
models should handle cancelable events. This element fires an event with the same
type but non-cancelable when the operation has been commited to the datastore
and view shouls handle non-cancelable event to update their state.

## Index and data object

RAML can be a large object therefore iterating over each record when listing
or searching for APIs would not be efficient. This model creates separate object in
different data stores to keep listing (index) data separately from RAML data.
In most cases application should operate on index data. API data should be
read directly using record's data store ID which is the same as index id.

Index object contains following properties:

- `_id` `{String}` - The same ID as API data record ID
- `title` `{String}` - API title
- `version` `{String}` - API version number / string
- `baseUri` `{String}` - API base URI
- `order` `{Number}` - Order on the list. By default it's `0`
- `description` `{?String}` - API description. Can be undefined.

## Events API

### Create

Creates bothe api data and api index objects.

To create data fire cancelable `rest-api-create` with the raml data in detail object

```javascript
let event = new CustomEvent('rest-api-create', {
  detail: {
    raml: {...}
  },
  bubbles: true,
  cancelable: true
});
document.body.dispatchEvent(event);
console.log(event.defaultPrevented);
// prints "true"

event.detail.result(indexDoc => {
  console.log(indexDoc);
  // prints content of the index object
});
```

Optional property for create event is `order` which is used to order elements on the list.

### Read

Reads API data object form the datastore.

To access data fire cancelable `rest-api-read` with the ID in detail object

```javascript
let event = new CustomEvent('rest-api-read', {
  detail: {
    id: "api-datastore-id"
  },
  bubbles: true,
  cancelable: true
});
document.body.dispatchEvent(event);
console.log(event.defaultPrevented);
// prints "true"

event.detail.result(dataDoc => {
  console.log(dataDoc.raml);
  // prints API data
});
```

### Update index

Updates API index object in the datastore.

To update index data fire cancelable `rest-api-index-updated` with the PouchDB document in `detail` object

```javascript
let event = new CustomEvent('rest-api-index-updated', {
  detail: {
    doc: {_id: ...}
  },
  bubbles: true,
  cancelable: true
});
document.body.dispatchEvent(event);
console.log(event.defaultPrevented);
// prints "true"

event.detail.result(doc => {
  console.log(doc);
  // prints upadated document
});
```

### Update API data

Updates API data object in the datastore.

To update API data fire cancelable `rest-api-data-updated` with the PouchDB document in `detail` object

```javascript
let event = new CustomEvent('rest-api-data-updated', {
  detail: {
    doc: {_id: ...}
  },
  bubbles: true,
  cancelable: true
});
document.body.dispatchEvent(event);
console.log(event.defaultPrevented);
// prints "true"

event.detail.result(doc => {
  console.log(doc);
  // prints upadated document
});
```

### Delete

Deletes API index and API data object from the datastore.

To remove API data fire cancelable `rest-api-deleted` with the id of the document in `detail` object

```javascript
let event = new CustomEvent('rest-api-deleted', {
  detail: {
    id: "datastore-id"
  },
  bubbles: true,
  cancelable: true
});
document.body.dispatchEvent(event);
console.log(event.defaultPrevented);
// prints "true"

event.detail.result(() => {
  // Documents has been deleted
});
```

Note, delete operation marks object as deleted. It doesn't actually remove the data
from the datastore. If needed data can be restored as described in PouchDB
documentation.

### Update index data in batch

The same as create event but allows to update many index objects in one request.
This is faster than making series of individual requests.

```javascript
let event = new CustomEvent('rest-api-index-updated-batch', {
  detail: {
    docs: [{_id: ...}]
  },
  bubbles: true,
  cancelable: true
});
document.body.dispatchEvent(event);
console.log(event.defaultPrevented);
// prints "true"

event.detail.result(updated => {
  console.log(updated);
  // Array of updated documents
});
```

### List index data

List a page of index object. Each page contains a 100 of results.
It supports pagination using `nextPageToken` property returned with each call to this API.

Result object contains `nextPageToken` that should be used to pass to next
request to receive next page of results. Index listing data are in `items` property.

```javascript

var nextPageToken;
function queryPage() {
  var detail = {};
  if (nextPageToken) {
    detail.nextPageToken = nextPageToken;
  }
  let event = new CustomEvent('rest-api-index-list', {
    detail: detail,
    bubbles: true,
    cancelable: true
  });
  document.body.dispatchEvent(event);

  return event.detail.result
  .then(result => {
    nextPageToken = result.nextPageToken;
    return result.items;
  });
}
```




### Events
| Name | Description | Params |
| --- | --- | --- |
| rest-api-data-updated | Fired when RAML (API) data has been updated. The event is non cancelable which means that the change is commited to the datastore.  It sets a `result` property on event `detail` object which contains a return value from calling `updateData()` function. | doc **Object** - PouchDB document representing API data. |
| rest-api-deleted | Fired when data has been deleted. The event is non cancelable which means that the change is commited to the datastore.  It sets a `result` property on event `detail` object which contains a return value from calling `remove()` function. | id **String** - Datastore ID of deleted item. |
| rest-api-index-updated | Fired when index data has been updated. The event is non cancelable which means that the change is commited to the datastore.  It sets a `result` property on event `detail` object which contains a return value from calling `updateIndex()` function. | doc **Object** - PouchDB document representing index data. |
