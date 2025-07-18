How-to Start at Extent
======================

Sometimes it is easier to start the application by framing a specific spatial
extent instead of a known center-point and zoom level.

Remove the example setView
--------------------------

Remove the following lines:

::

    app.setView({
        center: app.lonLatToMeters( -93.16, 44.55),
        zoom: 12
    });

Add zoomToExtent
----------------

The first parameter is an array of [minx, miny, maxx, maxy] and the
second parameter is an optional projection string. The default projection
is Web Mercator.

::

    app.zoomToExtent([-93.3,44.47,-93.0, 44.63], 'EPSG:4326');
