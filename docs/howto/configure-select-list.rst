How-to configure to select from list
====================================

This how-to provides instructions to configure the select tool to select
from a list of layers. By default users can select from any layer that
has been configured to be selectable in the ``mapbook.xml``
configuration. However, it may be useful to configure the select tool so
that users can select from groups related layers, or even create
separate select tools that can only select a single layer.

Add your layers to select
-------------------------

This how-to references both the source and layer for the fire stations
and parcels datasets. For more information on setting those up in your
local demo, read the:doc:`./add-a-layer` guide.

Add your select tool
--------------------

Now you need to add your new select service to your ``app.js``
configuration file. Add this code:

.. code:: javascript

        // specify service with list of available selections:
                app.registerService('select-list', SelectService, {
                
               // Uncomment title parameter if you wish to change the service title
               // title: 'Select Taxlots',
     
                  fields: [{
                    type: 'select',
                    // specify default layer
                    default: 'vector-parcels/parcels',
                    // specify and label list of layers
                    options: [
                      {value: 'vector-parcels/parcels', label: 'Parcels'},
                      {value: 'firestations-wfs/fire_stations', label: 'Fire Stations'},
                              ],
                          }]
                  });

Modify the 'map-source/layer' parameters and labels for your specific
datasets. You can add more layers by adding additional values and
labels, or you can remove layers if you wish to create a tool for
selecting a specific dataset.

Add your tool to the toolbar
----------------------------

Finally, add your new tool to the toolbar section in your
``mapbook.xml`` configuration file:

.. code:: xml

    <tool name="select-list" title="Select Features" type="service"/>
