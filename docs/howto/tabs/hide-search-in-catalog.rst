How-to Hide the Search in the Catalog
=====================================

Sometimes catalogs are not long enough to require search, the search
field can be hidden.

Change app.js
-------------

From:

::

    app.add(gm3.components.Catalog, 'catalog');

To:

::

    app.add(gm3.components.Catalog, 'catalog', {showSearch: false});
