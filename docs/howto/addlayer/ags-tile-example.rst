How-to add an AGS Tile Layer
============================

By example!
-----------

Here is a small example on how to add the world map from Arc-Online
using the XYZ layer type:

::

    <map-source name="ags-tile-example" type="xyz">
        <layer name="imagery"/>
        <url>https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}</url>
    </map-source>
