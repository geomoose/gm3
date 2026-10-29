How-to configure Favorites
==========================

The Favorites component adds a tab that collects every catalog layer 
the user has starred. Stars appear as checkboxes next to each layer
in the Catalog.

Adding the Favorites tab
------------------------

The Favorites component is configured in the ``app.js`` file.

1. Add the component after ``app.loadMapbook`` resolves, alongside the
   other ``app.add`` calls:

   .. code:: javascript

       app.add(gm3.components.Favorites, 'favorites');

2. In your ``index.html``, add a container element for the component
   to render into:

   .. code:: html

       <div id="favorites"></div>

Both the desktop and mobile examples include this setup.

Stars without the Favorites tab
-------------------------------

The star checkboxes in the Catalog are always rendered, even when
``app.add(gm3.components.Favorites, 'favorites')`` is not present in
``app.js``. Without the Favorites tab the stars still toggle but there
is nowhere to see the starred layers, which can be confusing for end
users.

If your application does not use the Favorites component, the stars
will have no visible effect.
