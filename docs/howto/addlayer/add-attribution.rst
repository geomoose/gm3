How-to Add Attribution to a layer
=================================

To add attribution info to the map for a given layer, use the
``<attribution>`` tag in the ``<map-source>``'s ``<layer>``.

Example Below:

.. code:: xml

        <map-source name="openstreetmap" type="xyz">
            <layer name="osm_mapnik">
                <attribution><![CDATA[
                    &copy; <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> Contributors.
                ]]></attribution>
            </layer>
            <url>https://a.tile.openstreetmap.org/{z}/{x}/{y}.png</url>
            <url>https://b.tile.openstreetmap.org/{z}/{x}/{y}.png</url>
            <url>https://c.tile.openstreetmap.org/{z}/{x}/{y}.png</url>

            <param name="cross-origin" value="anonymous"/>
        </map-source>
