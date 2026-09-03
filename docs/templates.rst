.. _templates:

Templates in GeoMoose
=====================

GeoMoose uses Mark.up templates to handle the duties of converting
results to something more readable by users. More information on Mark.up
and its template syntax can be found
`here. <https://github.com/adammark/Markup.js/>`__

General concepts
----------------

Internally, GeoMoose uses `GeoJSON <http://geojson.org/>`__ to represent
features. For rendering results from services (Identify, Select, Search)
GeoMoose will take those features and use Mark.up to render them to
HTML. As seen here:

.. raw:: html

   <!-- {% raw %} -->

.. code:: xml

    <template name="search"><![CDATA[
        <div class="search-result">
            <div class="search-label">
                {{ properties.OWNER_NAME }}
            </div>
            <div class="search-action">
                <div style="padding: 2px">
                    <a onClick="app.zoomToExtent([{{ properties.boundedBy | join }}])" class="zoomto-link">
                        <i class="fa fa-search"></i>
                        {{ properties.PIN }}
                    </a>
                </div>
            </div>
        </div>
    ]]></template>

.. raw:: html

   <!-- {% endraw %} -->

The template above is named "search" and will be used by the search tool
in order to render any features it receives from the server.

Property names with dots
------------------------

Some datasets include feature property names that themselves contain dots,
for example ``Wetlands_CONUS_East.ATTRIBUTE``. In the GeoMoose template
system, dots are normally used to traverse nested objects, so those
property names cannot be accessed with the usual syntax:

.. code:: xml

    {{ properties.Wetlands_CONUS_East.ATTRIBUTE }}

In those cases, use the ``getattr`` pipe to retrieve the property by its
full name:

.. code:: xml

    {{ properties | getattr>Wetlands_CONUS_East.ATTRIBUTE }}

This is most useful for joined or enterprise datasets where attribute
names may be prefixed with a table or layer name.

Aliasing templates
------------------

It is sometimes preferred to have features render the same way no matter
which service is used to find them. GeoMoose supports this by using
template aliases. For example:

.. raw:: html

   <!-- {% raw %} -->

.. code:: xml

    <template name="search"><![CDATA[
        <div class="parcel">
            <div class="parcel-owner">{{ properties.OWNER_NAME }}</div>
        </div>
    ]]></template>
    <template name="identify" alias="search"/>

.. raw:: html

   <!-- {% endraw %} -->

Remote templates
----------------

When a Mapbook starts to grow, having all the templates inside of it can
make maintenance increasingly difficult. GeoMoose supports having
templates that can be downloaded only when they are needed:

.. raw:: html

   <!-- {% raw %} -->

.. code:: xml

    <template name="search" src="./templates/parcel-search.html"/>

.. raw:: html

   <!-- {% endraw %} -->

Then a ``./templates/parcel-search.html`` file would be needed which
contains the same style Mark.up template that would have otherwise been
directly in the mapbook:

.. raw:: html

   <!-- {% raw %} -->

.. code:: html

    <div class="search-result">
        <div class="search-label">
            {{ properties.OWNER_NAME }}
        </div>
        <div class="search-action">
            <div style="padding: 2px">
                <a onClick="app.zoomToExtent([{{ properties.boundedBy | join }}])" class="zoomto-link">
                    <i class="fa fa-search"></i>
                    {{ properties.PIN }}
                </a>
            </div>
        </div>
    </div>

.. raw:: html

   <!-- {% endraw %} -->
