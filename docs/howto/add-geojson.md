# How-to add a GeoJSON file

## Getting a GeoJSON file

GeoJSON files are stored statically! No MapServer is involved in the serving
or rendering of a GeoJSON file with GeoMoose.

A great example is the `cities.geojson` file. [It can be downloaded from here](https://github.com/mahemoff/geodata/raw/master/cities.geojson) and placed in the the `workshop/` directory.

## Add the new map-source

In `mapbook.xml` after line 5 add:

<!-- {% raw %} -->
```
<map-source name="cities" type="geojson">
    <url>./cities.geojson</url>
    <layer name="all-cities">
        <style><![CDATA[
        {
            "circle-radius" : 5,
            "circle-color": "blue",
            "text-font": ["Arial", "Open Sans Regular"],
            "text-field": "{city}",
            "text-jusitfy": "right",
            "text-anchor": "right"
        }
        ]]></style>
    </layer>
</map-source>
```
<!-- {% endraw %} -->

## Add cities to the catalog

* Find `<catalog>` in the mapbook.
* After the `<catalog>` tag add:

    ```xml
    <layer src="cities/all-cities" title="World Cities" />
    ```

## Important notes on GeoJSON layers

1. They cannot yet be used for querying.
2. They are styled using a subset of [MapBox GL Styles](https://www.mapbox.com/mapbox-gl-js/style-spec/).

   The package used by GeoMoose to translate the MapBox GL styles to OpenLayers styles is
   actively being updated and GeoMoose will follow its progress.
