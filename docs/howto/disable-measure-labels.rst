Turning off measure annotations by default
==========================================

When measuring a line or polygon, GeoMoose annotates each segment with
its length and each polygon with its area directly on the map. These
on-map annotations are **on by default**.

Users can always toggle the annotations on or off while measuring using
the labels button in the upper-left map controls.

To change the *default* so the annotations start **off**, set
``showMeasureLabels`` to ``false`` in the application's ``map``
configuration object.

Example:

::

    var app = new gm3.Application({
        mapserver_url: CONFIG.mapserver_url,
        mapfile_root: CONFIG.mapfile_root,
        map: {
            showMeasureLabels: false
        }
    });

Valid values:

* ``showMeasureLabels`` - Boolean. ``true`` (default) shows the
  annotations when measuring, ``false`` hides them until the user turns
  them on with the labels button.

.. note::

    This only changes the *initial* state. The labels button still lets
    a user turn the annotations back on (or off) at any time while the
    measure tool is active.
