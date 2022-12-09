.. _whatisGeomoose:

What Is GeoMoose?
=================

GeoMoose is a JavaScript library you can use to show mapping data in your browser. The great thing about GeoMoose is
that just by editing an XML file and tweaking a little JavaScript you can configure GeoMoose to show a full featured
web map interface with the layers you choose.

.. figure:: quickstarts/ms4w/geomoose-success-2.png
   :alt: GeoMoose GUI

   GeoMoose GUI

What can GeoMoose do?
---------------------

You can configure GeoMoose to:

    - show buttons for zooming, measuring, and printing
    - show attributes of geographical features by a single click
    - search features by attribute values
    - list and group layers in a catalog layer control
    - use a drop down list for zooming to specific locations
    - show cursor coordinates in Lat/Lon, projected, and USNG reference systems
    - draw features (with save and load) for marking up a map

What Do I need to Implement GeoMoose?
-------------------------------------

If you just want to play around with the included GeoMoose examples, you will need to:

    - have a computer (real or in the cloud) to act as web server for serving GeoMoose to browsers
    - know how to set up web server software such as Apache or MicroSoft's IIS
    - download GeoMoose either from MS4w's site, or from GitHub

If you want to go further and use your own spatial data, you will need to:

    - edit XML so you can change GeoMoose's mapbook.xml file
    - edit GeoMoose's app.js to expose the mapping tools you want

If you want to go even further and modify (or debug) GeoMoose. you will need to:

    - install NodeJS to run a local copy of GeoMoose
    - use git to install GeoMoose from GitHub
    - be comfortable using your browser's Developer Tools for debugging GeoMoose
