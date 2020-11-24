Changing the selection and highlight colors
===========================================

Differences between GeoMoose 2.X and 3.X
----------------------------------------

In GeoMoose 2.X there was a layer called ``highlight`` that was defined
in the mapbook, occasionally users would remove this layer and services
would cease to function. To prevent that from happening GeoMoose 3+ will
automatically define a layer named ``results`` and ``results-hot``. The
``results-hot`` layer is used when the user has selected a subset of
results.

GeoMoose vector styles
----------------------

All vector styles are styled using the Mapbox GL Styles format. It is
Javascript/JSON friendly and well documented
(here)[https://docs.mapbox.com/mapbox-gl-js/style-spec/].

Change the highlight color
--------------------------

Pass ``resultsStyle.highlight`` into the ``Application`` constructor
options.

Example:

.. code:: javascript


    // use a pretty blue color instead of the default yellow
    const highlightColor = '#008080';
    const highlightStyle = {
        'circle-color': highlightColor,
        'circle-stroke-color': highlightColor,
        'line-color': highlightColor,
        'fill-color': highlightColor
    };

    var app = new gm3.Application({
        mapserver_url: CONFIG.mapserver_url,
        mapfile_root: CONFIG.mapfile_root,
        resultsStyle: {
            highlight: highlightStyle,
        }
    });

Change the 'hot' style
----------------------

This example include changing both the ``results-hot`` style and
``results``/highlight color:

.. code:: javascript

    const highlightColor = '#008080';
    const highlightStyle = {
        'circle-color': highlightColor,
        'circle-stroke-color': highlightColor,
        'line-color': highlightColor,
        'fill-color': highlightColor
    };

    const hotColor = '#FF9933';
    const hotStyle = {
        'circle-color': hotColor,
        'circle-stroke-color': hotColor,
        'line-color': hotColor,
        'fill-color': hotColor
    };

    var app = new gm3.Application({
        mapserver_url: CONFIG.mapserver_url,
        mapfile_root: CONFIG.mapfile_root,
        resultsStyle: {
            highlight: highlightStyle,
            hot: hotStyle
        }
    });

Change the selection style
--------------------------

It is also possible to change the styles for the selection layer in the
same manner as the results and 'hot' layers.

.. code:: javascript

    const selectionColor = '#00FFFF';
    const selectionStyle = {
        'circle-color': selectionColor,
        'circle-stroke-color': selectionColor,
        'line-color': selectionColor,
        'fill-color': selectionColor
    };

    var app = new gm3.Application({
        mapserver_url: CONFIG.mapserver_url,
        mapfile_root: CONFIG.mapfile_root,
        selectionStyle: selectionStyle
    });
