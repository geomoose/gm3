How-to add decluttering to a vector layer
=========================================

Decluttering is offered by OpenLayers and will create less crowded
maps by not rendering features which overlap. As of GeoMoose 3.8.0,
this is turned off by default. To restore decluttering, add it as a
``<config>`` to the ``<map-source>``.

::

    <map-source ...>
        <config name="declutter" value="true" />
    </map-source>
