How-to add a Grid to Search and Identify
========================================

Add show grid to the service configuration
------------------------------------------

::

        app.registerService('search', SearchService, {
            showGrid: true,
            ...
        });

Add template links in the mapbook.
----------------------------------

-  For search the templates are named ``search-grid-columns`` and
   ``search-row``.
-  For identify the templates are named ``identify-grid-columns`` and
   ``identify-row``.

The search example is shown below:

::

        <template name="search-grid-columns" src="./templates/parcel-columns.json" />
        <template name="search-grid-row" src="./templates/parcel-row.html" />
