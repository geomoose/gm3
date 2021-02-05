How-to add a langauge
=====================

Languages are stored as JSON files in GeoMoose. Each language is given
its own JSON file and a local JSON file can be used for translating.

1. Start by making a copy of the current English file.
------------------------------------------------------

The English file is the most up to date. The Spanish version of the
language file may still have unreviewed machine translations.

Copy the English file to your own (such as ``pirate.json``).

2. Translate the file.
----------------------

In the case of ``pirate.json`` all *R*\ s should be replaced with
*AAARRRRGGGGHHH*\ s.

3. Add the language to GeoMoose
-------------------------------

This is done by passing the language definition into the application's
configuration:

::

    var app = new gm3.Application({
        mapserver_url: CONFIG.mapserver_url,
        mapfile_root: CONFIG.mapfile_root,
        map: {
            scaleLine: {
                enabled: true,
                units: 'imperial'
            }
        },
        lang: {
            pirate: './pirate.json',
        },
    });

4. Test your language in the application
----------------------------------------

Any language can be tested regardless of browser settings. Between
``.html`` and ``#`` add ``?lng=[language code]``. For our example the
URL would look like the following:

::

    .../desktop.index.html?lng=pirate#on=sketch/on....
