Configuring the Scale Line
==========================

Configuring the scale line display is controlled via the application's
configuration object.

Example:

::

    var app = new gm3.Application({
        mapserver_url: CONFIG.mapserver_url,
        mapfile_root: CONFIG.mapfile_root,
        map: {
            scaleLine: {
                enabled: true,
                units: 'imperial'
            }
        }
    });

Valid values: \* ``enabled`` - Boolean. ``true`` or ``false`` \*
``units`` - String. ``'degrees'``, ``'imperial'``, ``'nautical'``,
``'metric'``, ``'us'``
