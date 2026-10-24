Configure Number of Buffer-able Features
========================================

Update the `app` declaration in `app.js`. Include the `query` configuration object,
and set `bufferMaxFeatures` to the largest number of features the user should
be allowed to buffer. The default is 1000.

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
            bufferMaxFeatures: 2500
        }
    });


What happens when a buffer fails
--------------------------------

The limit counts features; the cost of a buffer is set by their vertices.
Selections under the limit can still be too large for the browser, or hold a
feature whose geometry cannot be buffered exactly. When that happens GeoMoose
shows a dialog saying why, with two choices: *Close* keeps the selection so the
user can try a smaller distance, and *Start over* clears the selection and the
buffer. The messages are translated like any other string, under the
``geometry-error-*`` keys in ``src/gm3/lang``.

Behind the dialog, large selections are buffered in batches that are unioned
afterwards, so the memory a single call needs is bounded, and the geometry
library is reloaded after it runs out of memory so the page does not keep the
high-water mark.
