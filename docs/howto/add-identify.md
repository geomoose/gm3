# How-to add Identify

Identify is supported on `wms`, `mapserver`, `wfs`, `mapserver-wfs`, and `ags-vector` map-source types.

**TL;DR** Add a `<template name="identify">` to the `<layer ...>` which needs identify.

## The Firestations layer

This how-to references the `firestations` source and `fire_stations` layer.
For more information on setting those up in your local demo, read the
[How-to add a layer](./add-a-layer.md) guide.

## Adding identify to Firestations

* WMS has the GetFeatureInfo request which GeoMoose will use to fetch feature data.
* GeoMoose will also use WFS and AGS FeatureServer for identfiy if a `<map-source>` is
  configured with `wfs`, `mapserver-wfs`, or `ags-vector`.
* For a layer to work with identify it needs to have a `<template>` named `identify`
* In the `mapbook.xml` file update the `firstations` `<map-source>` definition:

<!-- {% raw %} -->
```xml
<map-source name="firestations" type="mapserver">
    <file>./demo/firestations/firestations.map</file>
    <layer name="fire_stations">
        <template name="identify"><![CDATA[
        <div class="result-item">
            <div class="result-title">
            Firestation
            </div>
            <b>Station City:</b> {{ properties.Dak_GIS__4 }}<br>
            <b>Station Number:</b> {{ properties.Dak_GIS__5 }}<br>
        </div>
        ]]></template>
    </layer>
</map-source>
```
<!-- {% endraw %} -->

* This example uses GeoMoose's template system.  GeoMoose has a rich template system provided by Mark.up.
  [More infoformation on GeoMoose templates here.](http://geomoose.github.io/gm3/templates.html)
