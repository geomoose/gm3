.. _workshop-helper:

Workshop Helper
===============

Batteries are included with Firestations
----------------------------------------

::

    <map-source name="firestations" type="mapserver">
      <file>./demo/firestations/firestations.map</file>
      <layer name="fire_stations"/>
    </map-source>

Add Firestations to the catalog
-------------------------------

Find the ``<catalog>`` line in the mapbook and add this afterwards:

::

    <layer src="firestations/fire_stations" title="Firestations"/>

Adding Identify to Firestations
-------------------------------

::

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

Adding Select
-------------

::

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

Tweak the Firestations layer
----------------------------

::

    <layer name="fire_stations" query-as="firestations-wfs/fire_stations">

CSS
---

::

    .toolbar .tool.findme .label {
        display: none;
    }

::

    /* Remove the webfont icon */
    .toolbar .tool.findme .icon:before {
        content: '';
    }

    /* Add the moose! */
    .toolbar .tool.findme .icon {
        width: 1em;
        height: 1em;
        box-sizing: border-box;
        background-image: url(./logo-mini.png);
    }

::

    #header {
        background: linear-gradient(to right, lightgreen, grey);
    }

Adding a GeoJSON Layer
----------------------

::

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

Catalog layer
-------------

::

    <layer src="cities/all-cities" title="World Cities" />
