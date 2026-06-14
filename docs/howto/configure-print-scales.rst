Configuring Print Scales
========================

The fixed scales offered in the print dialog can be set via the
application configuration's ``print.scales``. The "Scale to fit" options
are always available; when ``print.scales`` is omitted a built-in set of
common scales is used.

The configuration is passed to the ``gm3.Application`` constructor in your
``app.js``.

::

    var app = new gm3.Application({
        mapserver_url: CONFIG.mapserver_url,
        mapfile_root: CONFIG.mapfile_root,
        print: {
            scales: [
                {scale: 50},
                {scale: 1000},
                {scale: 24000},
                {label: "1000 ft / in", metersPerPt: 4.2333}
            ]
        }
    });

To offer only the "Scale to fit" options and no fixed scales, set
``scales`` to an empty array:

::

    var app = new gm3.Application({
        mapserver_url: CONFIG.mapserver_url,
        mapfile_root: CONFIG.mapfile_root,
        print: {
            scales: []
        }
    });

Each entry sets the scale one of two ways:

* ``scale`` - A ``1:N`` ratio (e.g. ``24000`` for ``1:24000``). Simplest,
  and the natural fit for metric printing.
* ``metersPerPt`` - The ground distance, in meters, that one PDF point of
  paper represents (72 points per inch). For "per inch" scales, divide the
  per-inch distance by 72: ``1000 ft / in`` is ``1000 * 0.3048 / 72``.

``label`` is optional; a ``1:N`` label is derived from the scale when
omitted.

The built-in scales
-------------------

When ``print.scales`` is omitted, the engineering scales below are
offered. They cover the US local-government use cases discussed in
`geomoose/gm3#999 <https://github.com/geomoose/gm3/pull/999>`_. Set
``print.scales`` to replace the list outright with your own -- for
metric printing, or to reach the regional scales (1 mile per inch,
1:100000) that the defaults stop short of.

Because a foot is exactly 12 inches, every "feet per inch" scale is an
exact ``1:N`` ratio, so each can be reproduced with the simpler
``scale`` form:

========================  ===========  ==================================================
Scale                     ``scale``    Typical use
========================  ===========  ==================================================
1 inch = 10 feet          ``120``      Septic evaluations and permits
1 inch = 20 feet          ``240``      Intersection layouts, utility alignments
1 inch = 40 feet          ``480``      Residential streets, general utility plans
1 inch = 50 feet          ``600``      Grading plans, larger parcels, subdivision layouts
1 inch = 100 feet         ``1200``     City-wide overviews, long right-of-way maps
1 inch = 200 feet         ``2400``     Planning and zoning maps
1 inch = 300 feet         ``3600``
1 inch = 400 feet         ``4800``
1 inch = 500 feet         ``6000``     USNG and fire maps (a 1 km square fits on letter)
1 inch = 600 feet         ``7200``
1 inch = 2000 feet        ``24000``    7.5 minute USGS topographic quadrangle
========================  ===========  ==================================================

.. note::

    Scales assume a basemap in meters (web mercator) and are true at the
    map center; like any web-mercator map, scale distorts toward the poles.
