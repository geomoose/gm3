How-to configure the Measure tool
=================================

The measure tool is managed as a part of the ServiceManager component.
Therefore, all the options for the measure tool are passed in as options
to the ServiceManger component when it's added to the application.

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
-  ``initialUnits`` is one of:
-  ``m`` for meters.
-  ``km`` for kilometers.
-  ``ft`` for feet (this is the default).
-  ``mi`` for miles.
-  ``ch`` for chains.
-  ``a`` for acres.
-  ``h`` for hectares.

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
