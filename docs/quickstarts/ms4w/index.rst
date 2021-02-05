.. _quickstart-ms4w:

MS4W Quickstart
===============

Requirements
------------

-  A computer running Windows 7 or newer (Windows 10 is recommended).
-  Download the latest copy of MS4W `here <https://ms4w.com>`__.

Background
----------

The MS4W (MapServer for Windows) setup.exe installer includes an option
to install GeoMoose (software and demo data) through the installer (this
is `Option
1 <#option-1-install-mapserver-for-windows--geomoose-using-installer-1>`__
below). The official `GeoMoose
homepage <https://www.geomoose.org/download.html>`__ has a separate MS4W
package available for download, where one contains the software and the
other contains the demo data (this is `Option
2 <#option-2-install-the-geomoose-software--data-separately>`__ below).

Option 1: Install MapServer for Windows + GeoMoose using installer
------------------------------------------------------------------

MS4W will install the base files required by GeoMoose along with an
Apache service to actually serve GeoMoose, and you can select GeoMoose
inside the installer to install GeoMoose software and demo data (see
image below). Once installed, navigate to http://127.0.0.1 and look for
a "GeoMoose" section near the bottom of the page. You can find a full
description of the optional packages listed in the installer on
`ms4w.com <https://www.geomoose.org/download.html>`__.

.. figure:: ms4w-setup-1.png
    :alt: ms4w setup screen 1

    ms4w setup screen 1

MS4W may occasionally come with an older version of
GeoMoose, in which case you can head to `Option
2 <#option-2-install-the-geomoose-software--data-separately>`__
below to manually install the latest and greatest version for the
full Moose experience.

The MS4W installer will prompt for a path. GeoMoose is set up and
expects to run from the default path (``C:\ms4w\apps\gm3\htdocs\``), so
please leave it set to ``C:\``. This will also make all future updates
and enhancements to the application simpler.

.. figure:: ms4w-setup-2.png
   :alt: ms4w setup screen 2

   ms4w setup screen 2

Lastly, MS4W will ask to specify the Apache port. There is no reason to
change this unless port 80 is already in use. Also, if you install
another web service in the future that uses port 80, you may want to
reconfigure it to run a different port.

.. figure:: ms4w-setup-3.png
   :alt: ms4w setup screen 3

   ms4w setup screen 3

You can validate the MS4W installation by navigating to localhost
(http://127.0.0.1), where you will be greeted by the MS4W introduction
and features.

.. figure:: ms4w-success.png
   :alt: working ms4w

   working ms4w

GeoMoose will be listed on that MS4W localhost page under applications:

.. figure:: geomoose-success-1.png
   :alt: geomoose listing

   geomoose listing

You can now test your local GeoMoose application (as
`below <#test-your-local-geomoose-application>`__).

Option 2: Install the GeoMoose software + data separately
---------------------------------------------------------

The following assumes that you already have MS4W installed. You are also
required to download the following 2 files:

-  Download the latest version of the GeoMoose MS4W package (file named
   ``gm3-examples-x.x.x-ms4w.zip``)
   `here <https://www.geomoose.org/download.html>`__.
-  Download the latest copy of the GeoMoose Demo Data for MS4W (file
   named ``gm3-demo-data-x.x.x-ms4w.zip``)
   `here <https://www.geomoose.org/download.html>`__.

Install the GeoMoose Demo Data
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Extract the latest ``gm3-demo-data`` file (such as
``gm3-demo-data-3.6.0-ms4w.zip``) to the C directory. This will unzip
mapfiles and shapefiles used to power the GeoMoose examples.

.. figure:: geomoose-setup-1.png
   :alt: geomoose extract zip

   geomoose extract zip

Install GeoMoose
~~~~~~~~~~~~~~~~

Extract the latest ``gm3-examples`` file (such as
``gm3-examples-3.6.1-ms4w.zip``) to the C directory. Everything in it is
already set to install where needed within the MS4W subdirectories
including Apache, Apps, and httpd.d.

.. figure:: geomoose-setup-1.png
   :alt: geomoose extract zip

   geomoose extract zip

Once extracted, restart the Apache MS4W Service.

.. figure:: geomoose-setup-2.png
   :alt: restart windows apache service

   restart windows apache service

Test your local GeoMoose application
------------------------------------

GeoMoose will now show up on the MS4W localhost page under applications

.. figure:: geomoose-success-1.png
   :alt: geomoose listing

   geomoose listing

Click one of the links to launch the Desktop or Mobile version of
GeoMoose.

.. figure:: geomoose-success-2.png
   :alt: geomoose desktop

   geomoose desktop
