# How-to let the user choose a search layer

Sometimes data is stored across multiple layers and writing
multiple instances of the Search service is too laborious for
both the administrator and the user. This is an example
configuration that will allow searching two different layers,
with two different field names, from the same text box.

## Code

This example refers to the `firestations-wfs` layer. This is used in other
tutorials and the data is included in the gm3-demo-data repository.

```xml
<map-source name="firestations-wfs" type="mapserver-wfs">
    <file>./demo/firestations/firestations.map</file>
    <param name="typename" value="ms:fire_stations" />
    <layer name="fire_stations" selectable="true" title="Firestations">
        <template name="select"><![CDATA[
        <div class="result-item">
            <div class="result-title">
            Firestation
            </div>
            <b>Station City:</b> {{ properties.Dak_GIS__4 }}<br>
            <b>Station Number:</b> {{ properties.Dak_GIS__5 }}<br>
        <div>
        ]]></template>
        <template name="search" alias="select" />
    </layer>
</map-source>
```

### In app.js

```javascript
    app.registerService('super-search', SearchService, {
        fields: [
            {
                type: 'select',
                name: 'layer',
                options: [
                    {value: 'vector-parcels/parcels', label: 'Parcel Owners'},
                    {value: 'firestations-wfs/fire_stations', label: 'Firestations'}
                ]
            }, {
                type: 'text',
                name: 'search-value',
            }
        ],
        prepareFields: function(fields) {
            var values = getFieldValues(fields);
            var field_name = {
                'vector-parcels/parcels' : 'OWNER_NAME',
                'firestations-wfs/fire_stations' : 'Dak_GIS__4'
            };
            return [{
                comparitor: 'ilike',
                name: field_name[values['layer']],
                value: values['search-value']
            }];
        },
        getSearchLayers: function(searchLayers, fields) {
            console.log(getFieldValues(fields));
            return [getFieldValues(fields)['layer']];
        }
    });
```

### In the catalog

```xml
    <toolbar>
        ...
            <tool name="super-search" title="Super Search" type="service"/>
        ...
    </toolbar>
```
