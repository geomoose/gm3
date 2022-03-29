Configure Number of Buffer-able Features
========================================

Update the `app` declaration in `app.js`. Include the `query` configuration object,
and set `bufferMaxFeatures` to the largest number of features the user should
be allowed to buffer.

::

    var app = new gm3.Application({
        mapserver_url: CONFIG.mapserver_url,
        mapfile_root: CONFIG.mapfile_root,
        map: {
            scaleLine: {
                enabled: true,
                units: 'imperial'
            }
        },
        mapbooks: {
            'default': 'mapbook.xml',
            'editing': 'mapbook-editing.xml',
            'test': 'mapbook-test-servers.xml'
        },
        query: {
            bufferMaxFeatures: 1000
        }
    });

