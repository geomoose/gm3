How-to add Identify
===================

If you would like to have your map users to be able to get information
on specific features using the Identify tool, you must: \* ensure the
``<map-source>`` type is one of: ``wms``, ``mapserver``, ``wfs``,
``mapserver-wfs``, or ``ags-vector`` \* add an identify template to the
layer in the ``<map-source>`` (see below) \* have the user display the
layer in the Catalog

Add a ``<template name="identify">`` to the ``<layer ...>``. An easy way
to do this is to add ``<template name="identify" auto="true" />``. For
example, to add identify to the desktop demo's "borders"
``<map-source>`` (titled "City and County Boundaries" in the Catalog),
change the ``<map-source>`` to be:

.. code:: xml

        <map-source name="borders" type="mapserver" title="City and County Borders">
            <file>./demo/statedata/basemap.map</file>
            <layer name="city_poly" status="off"/>
            <layer name="county_borders" status="on">
                <template name="identify" auto="true" />
            </layer>
        </map-source>

When the user turns on the layer in the Catalog, clicks Identify, then
clicks inside a county polygon, the details for that polygon will be
shown in the Super Tab, something like:

::

    City and County Borders
    boundedBy: -10443124.4532125805088.070692-10358662.5561045947016.049725
    AREA: 5163166424.00009
    PERIMETER: 309931.11344
    COUNTY_: 84
    COUNTY_ID: 21
    COUNTY_NUM: 1
    COUNTYNAME: Aitkin
    COUNTYFIPS: 001
    FIPS: 27001

Since the template you just added has ``auto="true"``, GeoMoose renders
all the feature's properties names and values (including the calculated
"boundedBy" bounding box for the feature). The above result is not very
pretty, but fortunately you can customize the look of the result by
writing a custom template for the data. Instead of an "auto" generated
template, change the template to be:

.. code:: xml

            <layer name="county_borders" status="on">
                <template name="identify"><![CDATA[
                <div>
                    <div class="feature-class county_borders">
                    County
                    </div>
                    <div class="item">
                        <label>Name:</label>{{properties.COUNTYNAME}}
                    </div>
                </div>
                ]]>
                </template>
            </layer>

In the example above, there are a few things to note: \* Customizing the
look of the results is done using HTML syntax \* GeoMoose substitutes
values for references it knows about when encounters ``{{ }}`` \*
Referencing the feature's value is done using ``properties.COUNTYNAME``,
where the ``properties`` part is from the GeoJSON format of the query
results (so that is common to evert identify template), and the
``COUNTYNAME`` is the **case-sensitive** attribute name specific to the
layer

Because the template is HTML (and will be interpreted by the browser),
you can do things like adding a link based on a feature's values:

.. code:: xml

            <layer name="county_borders" status="on">
                <template name="identify"><![CDATA[
                <div>
                    <div class="feature-class county_borders">
                    County
                    </div>
                    <div class="item">
                        <label>Name:</label>
                        <a href="http://www.census.gov/quickfacts/table/PST045215/{{properties.FIPS}},{{properties.COUNTYFIPS}}" target="_blank">
                            {{properties.COUNTYNAME}}
                        </a>
                    </div>
                </div>
                ]]>
                </template>
            </layer>

And since it is interpreted by the browser, it can even contain
JavaScript:

.. code:: xml

                <template name="identify"><![CDATA[
                <div>
                    <div class="feature-class county_borders">
                    County
                    </div>
                    <div class="item">
                        <label>Name:</label>
                        <a href=""
                                onClick="window.open( 'http://www.census.gov/quickfacts/table/PST045215/{{properties.FIPS}},{{properties.COUNTYFIPS}}', 'Details','width=600,height=1000' ); return false"
                                target="_blank">
                            {{properties.COUNTYNAME}}</a>
                    </div>
                </div>
                ]]>
                </template>

The Firestations layer
----------------------

This section references the ``firestations`` source and
``fire_stations`` layer. For more information on setting those up in
your local demo, read the:doc:`./add-a-layer`
guide.

Adding identify to Firestations
-------------------------------

-  WMS has the GetFeatureInfo request which GeoMoose will use to fetch
   feature data.
-  GeoMoose will also use WFS and AGS FeatureServer for identify if a
   ``<map-source>`` is configured with ``wfs``, ``mapserver-wfs``, or
   ``ags-vector``.
-  For a layer to work with identify it needs to have a ``<template>``
   named ``identify``
-  In the ``mapbook.xml`` file update the ``firestations``
   ``<map-source>`` definition:

.. raw:: html

   <!-- {% raw %} -->

.. code:: xml

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

.. raw:: html

   <!-- {% endraw %} -->

-  This example uses GeoMoose's template system. GeoMoose has a rich
   template system provided by Mark.up. :ref:`More information on GeoMoose
   templates here. <templates>`
