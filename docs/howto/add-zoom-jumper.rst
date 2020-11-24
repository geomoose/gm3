How-to Add a Zoom-Level Jumper
==============================

Add it to the map config!

Example:

::

    var app = new gm3.Application({
        mapserver_url: CONFIG.mapserver_url,
        mapfile_root: CONFIG.mapfile_root,
        map: {
            enableZoomJump: true
        }
    });

