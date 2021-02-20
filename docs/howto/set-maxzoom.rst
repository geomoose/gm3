How-to limit the Extent, Min and Max Zoom of the Map
====================================================

The map can be configured to limit the user's navigation by zoom level.
Map view constraints are defined using the application's configuration
object.

This is an example that sets all three constraints:

::

    var app = new gm3.Application({
        mapserver_url: CONFIG.mapserver_url,
        mapfile_root: CONFIG.mapfile_root,
        map: {
            view: {
                minZoom: 10,
                maxZoom: 15,
                extent: [
                    -14401959.121380,
                    2504688.542849,
                    -6887893.492834,
                    6613943.183460
                ],
            },
            scaleLine: {
                enabled: true,
                units: 'imperial'
            }
        }
    });
