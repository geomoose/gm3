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

Re-using templates in other services
------------------------------------

It can be useful to use the same templates for different services. For example,
if the same data should be returned for two different types of search templates.

To add the grid results, using the ``search`` templates to ``single-search`` make
the following changes to ``app.js``:

::

    app.registerService('single-search', SearchService, {
        ...
        zoomToResults: true,
        // this will enable the grid
        showGrid: true,
        // this tells GeoMoose to use "search" templates instead of "single-search"
        alias: 'search'
    });


