How-to start a service (even at startup)
========================================

At times it is useful to have a service be the first thing a user sees
when the application loads.

To start a service, dispatch the start service action! This example will
start the identify service:

.. code:: javascript

    app.startService('identify');

Adding the above code at the end of the ``app.loadMapbook`` function
will have the effect of starting the service at startup.

Starting a service with default values
--------------------------------------

Field values can be passed into the service and can optionally
be executed automatically.

With detailed code comments:

.. code:: javascript

    app.startService(
        // the first parameter is the name of the service
        //  as it is registered in the
        'single-search',
        // second parameter is the startup options
        {
            // if `autoGo` is true the service will start
            autoGo: true,
            // these values will be mixed-in with the other defaults
            //  defined by the service.
            defaultValues: {
                TERM: 'smith'
            }
        }
    );

The short version:

.. code:: javascript

    app.startService('single-search', {autoGo: true, defaultValues: {TERM: 'smith'}});

Adding service-query parameters to startup
------------------------------------------

Add the following at the end of the `loadMapbook` handler:

.. code:: javascript

    app.startServiceFromQuery()

With this code in `app.js` it is possible to start a service from the URL
when GeoMoose is opened. The following example works with the simple search
service:

.. code:: javascript

    http://localhost:4000/examples/desktop/index.html?service=single-search&field:TERM=anders


