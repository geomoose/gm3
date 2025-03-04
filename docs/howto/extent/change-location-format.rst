How-to Change the Location Format
=================================

GeoMoose allows three different types of location formats.

- xyz - the default GeoMoose format, which is really map resolution;center x;center y.
- lonlat - Which is formatted as zoom/lon/lat.
- bbox - Which is formatted as west;south;east;north in EPSG:4326.

Replace the example hashtracker in App.js
-----------------------------------------

Remove the following lines:

::

    var hash_tracker = new gm3.trackers.HashTracker(app.store);



Replace it with a custom location format
----------------------------------------

Valid location format options are xyz, latlon, and bbox.

::

    var hash_tracker = new gm3.trackers.HashTracker(app.store, {
        locationFormat: 'bbox'
    });
