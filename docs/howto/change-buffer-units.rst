How-to change the default buffer units
======================================

The buffer tool defaults to using feet. This can be changed with the map
configuration when initializing the application by changing the
``defaultUnits`` settings.

In ``app.js``:

::

    var app = new gm3.Application({
        mapserver_url: CONFIG.mapserver_url,
        mapfile_root: CONFIG.mapfile_root,
        map: {
            scaleLine: {
                enabled: true,
                units: 'imperial'
            },
            defaultUnits: 'm'
        }
    });

