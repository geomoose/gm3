# How-to add a layer search

Search operations are only supported on `vector`, `geojson`, `ags-vector`, `wfs`,
and `mapserver-wfs` map-source types.

## Add a supported vector map-source

This how-to references the `firestations` source and `fire_stations` layer.
For more information on setting those up in your local demo, read the
[How-to add a layer](./add-a-layer.md) guide. This example creates a WFS-source
for the Firestations layer.

Add the following to `mapbook.xml`:

```
<map-source name="firestations-wfs" type="mapserver-wfs">
    <file>./demo/firestations/firestations.map</file>
    <param name="typename" value="ms:fire_stations" />
    <layer name="fire_stations" selectable="true" title="Firestations">
        <template name="search"><![CDATA[
        <div class="result-item">
            <div class="result-title">
            Firestation
            </div>
            <b>Station City:</b> {{ properties.Dak_GIS__4 }}<br>
            <b>Station Number:</b> {{ properties.Dak_GIS__5 }}<br>
        <div>
        ]]></template>
    </layer>
</map-source>
```

## Configure a search service

In `app.js`, a new search service needs configured for that layer:

```javascript
// Add a search service
app.registerService('search-firestations', SearchService, {
    // search only the firestations-wfs/fire_stations layer.
    searchLayers: ['firestations-wfs/fire_stations'],
    // Dak_GIS__4 stores the name of the Firestation's city.
    fields: [
        {type: 'text', label: 'Station city', name: 'Dak_GIS__4'}
    ]
});
```

## Add the search service to the toolbar

In the `mapbook.xml`:

1. Find the `<toolbar>` element.
2. Inside the `<toolbar>` element, add the follow entry for the new search service:

    ```xml
    <tool name="search-firestations" title="Search Firestations" type="service"/>
    ```
