Configuring the Scale Line
==========================

Configuring the scale line display is controlled via the application's
configuration object.

Example:

::

    var app = new gm3.Application({
        mapserver_url: CONFIG.mapserver_url,
        mapfile_root: CONFIG.mapfile_root,
        map: {
            scaleLine: {
                enabled: true,
                units: 'imperial'
            }
        }
    });

Valid values: \* ``enabled`` - Boolean. ``true`` or ``false`` \*
``units`` - String. ``'degrees'``, ``'imperial'``, ``'nautical'``,
``'metric'``, ``'us'`` \* ``printMode`` - String. ``'none'``,
``'line-distance'``, ``'line-distance-scale'``

The scale line on printed maps
------------------------------

When the scale line is enabled, the print dialog gains a **Scale line**
option controlling what the printed map's scale indicator shows:

============================  ==========================================
Option                        Shows
============================  ==========================================
None                          No scale indicator at all
Line and Distance             The bar, labeled with the ground distance
                              it spans (e.g. ``300 ft``)
Line, Distance, and Scale     The above, captioned with the scale the
                              map was printed at (e.g. ``100 ft / in``)
============================  ==========================================

``printMode`` sets which of these a print starts on; the user can change
it for any individual print. It defaults to ``'line-distance-scale'``.

Once the user has seen the control, only the user moves it. If the
selected mode stops being possible -- picking a "Scale to fit" preset,
which names no scale to caption -- the dialog settles on the nearest
mode it can offer and stays there. It will not quietly restore the
caption later when a fixed scale is chosen again, because a print
should match what the dialog last showed.

One consequence is worth knowing: the print dialog opens on "Scale to
fit", where a caption is impossible, so a ``printMode`` of
``'line-distance-scale'`` settles to ``'line-distance'`` on open. The
caption is then something the user turns on after choosing a scale,
rather than something they have to notice and turn off.

::

    var app = new gm3.Application({
        map: {
            scaleLine: {
                enabled: true,
                units: 'us',
                printMode: 'line-distance'
            }
        }
    });

Choosing a default is worth a moment's thought, because the bar and the
caption fail differently once the PDF leaves your hands. A scale in
writing only holds for the page it was made for: a PDF exported at
``1 inch = 10 feet`` and then reprinted at another paper size, or with
the printer's "fit to printable area" on, carries a caption that is no
longer true. The bar is drawn on the page itself, so resizing the page
resizes the bar with it and it goes on describing the map correctly.

``'line-distance-scale'`` suits maps read on screen or printed at the
size they were made for. ``'line-distance'`` suits offices where PDFs
are circulated and reprinted freely, and is the safer default when you
cannot know how a map will be reproduced.

.. note::

    The "Scale" option is offered only when the print can honor a scale:
    the "Scale to fit" presets name no scale, and a scale the map's zoom
    limits cannot reach is left out rather than printed as a number the
    map does not honor. See :doc:`configure-print-scales`.

Setting ``enabled: false`` removes the scale line from printed maps
entirely, and the **Scale line** option does not appear in the dialog.
