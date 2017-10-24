# How-to display a raster layer and query as a vector layer

Raster services have limitataions. WMS can only support a point-based query
and not polygon or attribute based queries. However, vector layers can be
more complicated to style and less consistently displayed between different
clients.  GeoMoose provides a way to have services automatically refer to
a vector layer for query operations when using a raster layer.

## An example with parcels

This is a cut down example based on the layers in the desktop demo's mapbook:

```xml
    <!-- this is the WFS / Vector definition of the layer -->
    <map-source name="vector-parcels" type="mapserver-wfs">
        <file>./demo/parcels/parcels.map</file>
        <!-- this tells the WFS service to get parcel features -->
        <param name="typename" value="ms:parcels"/>
        <layer name="parcels" selectable="true">
            <!-- this is where the select template is set. -->
            <template name="select"><![CDATA[
                <div class="select-result">
                    <div class="select-label">
                        {{ properties.OWNER_NAME }}
                    </div>
                    <div class="select-action">
                        <div style="padding: 2px">
                            <a onClick="app.zoomToExtent([{{ properties.boundedBy | join }}])" class="zoomto-link">
                                <i class="fa fa-search"></i>
                                {{ properties.PIN }}
                            </a>
                        </div>
                    </div>
                </div>
            ]]></template>
        </layer>
    </map-source>

    <!-- This is the WMS version of the parcels layer. -->
    <map-source name="parcels" type="mapserver" up="true" down="true" title="Parcels">
        <file>./demo/parcels/parcels.map</file>

        <!-- this is where @query-as is set... -->
        <layer name="parcels" status="on" query-as="vector-parcels/parcels">
            <!-- here is the identify template -->
            <template name="identify" src="./templates/parcels.html" />
        </layer>
    </map-source>
```


### How this is processed internally

The parcels layer is served as WMS.  But if you look at the `<layer name="parcels">` it has a query-as attribute set to `vector-parcels/parcels`.  So a few things happen:
1. When the Select service goes to execute a query, it looks for layers with a template which has the name attribute set to `select`.  `parcels/parcels` will not have one but because the query-as attribute is set to `vector-parcels/parcels` it will look for a 'select' template there first.  It will find the template there and then use `vector-parcels/parcels` (WFS) instead of `parcels/parcels` (WMS) to execute the select query.
2. When the Identify service goes to execute a query, it will NOT find the identify template in `vector-parcels/parcels` but WILL find it in parcels/parcels and use WMS to execute that query.

Only `parcels/parcels` needs to be turned on! GeoMoose will automatically pick the best source with which to perform the query.

### Other notes

The query-as also accepts a list of paths like in the catalog.  It could be possible to refer to multiple vector sources for querying.  Or even other raster sources for identify-queries.
