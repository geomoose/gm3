# How-to add Select to a layer

Select operations are only supported on `vector`, `geojson`, `ags-vector`, `wfs`,
and `mapserver-wfs` map-source types.

## Add a supported vector map-source

This how-to references the `firestations` source and `fire_stations` layer.
For more information on setting those up in your local demo, read the
[How-to add a layer](./add-a-layer.md) guide. This example creates a WFS-source
for the Firestations layer.

Add the following to `mapbook.xml`:

<!-- {% raw %} -->
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
    </layer>
</map-source>
```
<!-- {% endraw %} -->

## The important bits

The above defines the entire map-source but the following is what enables
the layer to be used for select:

1. In `<map-source ...> `, `type="mapserver-wfs"`: WFS is the OGC Web Feature Serice.

   WFS servers emit actual vector features definitions and not rendered maps.

   You must have a `<param name="typename" ...>` in the `<map-source ...>` for the wfs to be valid

2. In `<layer ...>`, `selectable="true"`: This tells GeoMoose the layer can
   be used for selections.

3. Inside of `<layer...>` there is a `<template name="select">`: This will be the template
   used by GeoMoose to render features that have been selected. If the template is not
   present then the layer will not make itself available to select.

