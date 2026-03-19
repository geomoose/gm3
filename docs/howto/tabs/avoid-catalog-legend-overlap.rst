How-to avoid catalog legend overlap
====================================

If your catalog has very long legends, or many legends open at once in a 
single group, the legends can overlap with layers beneath them, similar
to this example:

.. figure:: /howto/images/catalog-legend-overlap.png
   :alt: Catalog Legend Overlap

   Catalog Legend Overlap



If this happens, it can be avoided by changing the height of the
children element in the site's ``site.css`` file, from the default
height of 2000px, to whatever value is needed.

Change site.css
------------------------------------------

.. code:: css

    .group.gm-expand .children {
        max-height: 3000px;
    }




