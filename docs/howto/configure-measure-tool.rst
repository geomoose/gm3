How-to configure the Measure tool
=================================

The measure tool is configured in two places:

#. The application-level ``measure`` configuration object controls which
   units are offered and whether the on-map annotations start on or off.
#. The ServiceManager component's ``measureToolOptions`` control the
   point-coordinate projections and the initially selected units.

Application measure configuration
---------------------------------

Pass a ``measure`` object when creating the application to control the
units offered in the tool and the default annotation behavior:

.. code:: javascript

        var app = new gm3.Application({
            mapserver_url: CONFIG.mapserver_url,
            mapfile_root: CONFIG.mapfile_root,
            measure: {
                lengthUnits: ["m", "km", "ft", "mi", "ch", "r"],
                areaUnits: ["m", "km", "ft", "mi", "a", "h"],
                showMeasureLabels: true
            }
        });

-  ``lengthUnits`` is the list of length units offered in the tool. Valid
   values are:

   -  ``m`` for meters.
   -  ``km`` for kilometers.
   -  ``ft`` for feet.
   -  ``mi`` for miles.
   -  ``ch`` for chains.
   -  ``r`` for rods.

   The default is ``["m", "km", "ft", "mi", "ch"]``.

-  ``areaUnits`` is the list of area units offered in the tool. Valid
   values are:

   -  ``m`` for square meters.
   -  ``km`` for square kilometers.
   -  ``ft`` for square feet.
   -  ``mi`` for square miles.
   -  ``a`` for acres.
   -  ``h`` for hectares.

   The default is ``["m", "km", "ft", "mi", "a", "h"]``.

-  ``showMeasureLabels`` is a boolean that sets the *initial* state of
   the on-map measure annotations. ``true`` (the default) shows them,
   ``false`` hides them until the user turns them on with the labels
   button. See :doc:`Turning off measure annotations by default
   <disable-measure-labels>` for details.

.. note::

    Length and area units are paired: selecting a length unit
    automatically selects a complementary area unit (and vice versa).
    Chains and rods both pair with acres, following surveyor convention.

ServiceManager options
----------------------

The measure tool is rendered by the ServiceManager component, so the
point-coordinate and initial-unit options are passed in as
``measureToolOptions`` when the ServiceManager is added to the
application.

Here's the example from the demo:

.. code:: javascript

        app.add(gm3.components.ServiceManager, 'service-tab', {
            services: true,
            measureToolOptions: {
                pointProjections: point_projections
            }
        });

-  ``pointProjections`` is an array of projection and label definitions,
   that is defined the same as with the :doc:`Coordinate
   Display <coordinate-display>`. When a user clicks on a point on
   the map, the point will be shown in all of the defined projections.
-  ``initialUnits`` overrides the initially selected length and area
   units when the tool opens. It is a single unit code from the
   ``lengthUnits``/``areaUnits`` lists above (for example ``m``, ``ft``,
   or ``ch``).

Example of setting the default units to meters
----------------------------------------------

The code below will set the default the measurement units to meters
instead of feet.

.. code:: javascript

        app.add(gm3.components.ServiceManager, 'service-tab', {
            services: true,
            measureToolOptions: {
                pointProjections: point_projections,
                initialUnits: 'm'
            }
        });
