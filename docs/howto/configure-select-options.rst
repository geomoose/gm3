How-to configure select options
===============================

This how-to provides instructions to configure the options that users
have to select features. This assumes that select has already been added
to a layer.

Modifying the default settings
------------------------------

By default, users can select by box, point, multipoint, linestring, and
polygon. To change this find this line in ``select.js``:

.. code:: html

        /** Limit the number of selection tools available */
        this.tools = {
            'Box': true,
            'Point': true,
            'MultiPoint': true,
            'Polygon': true,
            'LineString': true,
            'Select': true,
            'Modify': true,
            'default': 'Polygon',
            'buffer': true
        };

In order to remove specific options, simply switch true to false for the
specific options you'd like to change. You can also modify which option
is the default when users initiate a selection by changing the
``'default'`` parameter. For example, if you wish to turn off selecting
by a line, and wish to change the default selection to a box, modify the
code as so:

.. code:: html

        /** Limit the number of selection tools available */
        this.tools = {
            'Box': true,
            'Point': true,
            'MultiPoint': true,
            'Polygon': true,
            'LineString': false,
            'Select': true,
            'Modify': true,
            'default': 'Box',
            'buffer': true
        };

Configuring Auto-go
-------------------

The select tool can also be configured to automatically select after
entering a selection geometry, without requiring users to click GO. This
option is only compatible with selection options that don't require
additional user input. These options are Box, Point, Line, and Polygon.

To configure auto-go, modify autoGo to true in ``select.js``:

.. code:: html

        this.autoGo = true;

Selection options that are not compatible with autoGo need to be turned
off:

.. code:: html

        /** Limit the number of selection tools available */
        this.tools = {
            'Box': true,
            'Point': true,
            'MultiPoint': false,
            'Polygon': true,
            'LineString': true,
            'Select': false,
            'Modify': false,
            'default': 'Polygon',
            'buffer': false
        };

Buffer also needs to specifically be turned off in ``select.js``:

.. code:: html

        this.bufferAvailable = false;
