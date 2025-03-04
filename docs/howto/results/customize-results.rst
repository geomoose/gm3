How-to customize result tools
#############################

GeoMoose can be configured to off the user additional
options for results in the Super Tab.

Service results configuration options
-------------------------------------

When adding a service, administrators can configure which tools
are available to a user using the ``results`` configuration object.

Here is an example adding buffer all and removing the count
of layers:

::

    app.registerService('select', SelectService, {
        // set the default layer
        defaultLayer: 'vector-parcels/parcels',
        keepAlive: true,
        results: {
            showBufferAll: true,
            showLayerCount: false
        }
    });

Available options
-----------------

  * ``showFeatureCount`` - Defaults to ``true``. Show the count of features.
  * ``showLayerCount`` - Defaults to ``true``. Show the number of layers queried.
  * ``showBufferAll`` - Defaults to ``false``. Tool to buffer all result features.
  * ``showZoomToAll`` - Defaults to ``true``. Tool to zoom to all result features.

