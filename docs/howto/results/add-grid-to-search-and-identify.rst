How-to add a Grid to Search and Identify
========================================

Add template links in the mapbook
----------------------------------

-  For search the templates are named ``search-grid-columns`` and
   ``search-grid-row``.
-  For identify the templates are named ``identify-grid-columns`` and
   ``identify-grid-row``.

The search example is shown below:

::

        <template name="search-grid-columns" src="./templates/parcel-columns.json" />
        <template name="search-grid-row" src="./templates/parcel-row.html" />

Add a search alias to the service configuration
------------------------------------------------

Adding a search alias allows the ``search-grid-columns`` and ``search-grid-row``
templates to be used for search services that aren't named search, while still 
allowing you to point to different template files for the individual services.

To add an alias, allowing you to use the ``search`` templates for ``single-search``, make
the following changes to ``app.js``:

::

    app.registerService('single-search', SearchService, {
        ...
        // this tells GeoMoose to use "search" templates instead of "single-search"
        alias: 'search'
    });

Further customize the search service
------------------------------------------

You can also change some of the default search options, like overwriting the title,
zooming to results, or having the grid be minimized by default.

::

        app.registerService('single-search', SearchService, {
        ...
        // this overwrites the service title
        title: 'Simple Search'
        // this overwrites the results title
        resultsTitle: 'Simple Search Results'
        // this tells the service to zoom to the results by default
        zoomToResults: true,
        // this will enable the grid
        showGrid: true,
        // this tells GeoMoose to use "search" templates instead of "single-search"
        alias: 'search',
        // this tells the service that the grid results should be minimized by default
        gridMinimized: true
    });

You can find more examples of how to customize your results at :doc:`customize-results`.

