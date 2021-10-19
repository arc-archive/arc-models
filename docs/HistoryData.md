# HistoryDataModel

The model that stores requests history object (for the history menu and panel) and the HAR-like object for each request made with ARC.

The history request is stored when the `TransportEventTypes.response` event is handled. This event is dispatched by the ARC request logic after the response from the HTTP transport has been received.

The history-data object is stored in ARC local history to be used with history analysis.
This data has no UI surface (so far) in ARC. It meant to me be used to suggest API structure from request history data.

Both history requests and history data recording can be turned off by setting up `historyDisabled` and `dataDisabled` properties (not attributes!). This can be configured in ARC settings.

The element must be accompanied by the peer `<request-model>` as it uses events to store history data.

## Example

```html
<request-model></request-model>
<history-data></history-data>
```

## Type

The type is defined in `@advanced-rest-client/events` as `HistoryData.HistoryData`.
