Configure the Basemap Toggle
============================

The Basemap Toggle provides a compact quick-switch control for a small set of
commonly used background layers. It is intended to complement the Catalog, not
replace it.

Add the component to your application and provide a list of layers. Each layer
needs a label, preview image, and map-source/layer path.

.. code-block:: javascript

    app.add(gm3.components.BasemapToggle, 'basemap-toggle', {
        layers: [
            {
                label: 'No background',
                src: 'blank-preview.png',
                path: 'blank/blank',
            },
            {
                label: 'OpenStreetMap',
                src: 'osm-preview.png',
                path: 'openstreetmap/osm_mapnik',
            },
            {
                label: 'Aerial',
                src: 'aerial-preview.png',
                path: 'lmic/mncomp',
            }
        ]
    });

Inactive state
--------------

The Basemap Toggle is configured with a specific list of quick-switch layers.
These layers are typically a subset of the basemap or background layers
available in the Catalog.

If a user selects a background layer from the Catalog that is not included in
the Basemap Toggle configuration, the toggle becomes inactive and displays an
informational indicator. This is expected behavior. The indicator's tooltip
says: "Basemap toggle inactive. Choose a quick-switch basemap from the Catalog
to reactivate it."

Clicking the informational indicator opens the configured quick-switch layers.
Selecting one of those layers reactivates normal toggle behavior. The same can
be done from the Catalog by selecting one of the configured quick-switch
basemap layers.

For best user experience, configure the Basemap Toggle with the most commonly
used background layers, such as:

* No background
* OpenStreetMap
* Current aerial imagery

Sites with many additional background layers, such as historical imagery, can
leave those layers available in the Catalog without adding them to the toggle.
