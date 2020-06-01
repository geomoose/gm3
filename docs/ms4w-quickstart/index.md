# MS4W Quickstart

**TABLE OF CONTENTS**
* [Requirements](#req)
* [Background](#back)
* [Option1: Install MS4W + GeoMoose using installer](#option1)
* [Option2: Install the GeoMoose software + data separately](#option2)
* [Test your local GeoMoose application](#test)

## <a name="req"></a>Requirements

 * A computer running Windows 7 or newer (Windows 10 is recommended).
 * Download the latest copy of MS4W [here](https://ms4w.com).
 * Download the latest copy of the GeoMoose Demo Data (file named `gm3-demo-data`) [here](https://www.geomoose.org/downloads/).
 * Download the latest version of the GeoMoose MS4W package (file named `gm3-examples`) [here](https://www.geomoose.org/downloads/).

## <a name="back"></a>Background

The MS4W (MapServer for Windows) setup.exe installer includes an option to install GeoMoose (software and
demo data) through the installer (this is Option1 below).  The official [GeoMoose homepage](https://www.geomoose.org/download.html) 
has a separate MS4W package available for download, where one contains the software and the other contains 
the demo data (this is Option2 below). 

# <a name="option1">Option 1: Install MapServer for Windows + GeoMoose using installer :+1:

MS4W will install the base files required by GeoMoose along with an Apache service to actually serve GeoMoose, and
you can select GeoMoose inside the installer to install GeoMoose software and demo data (see image below). 
Once installed, navigate to http://127.0.0.1 and look for a "GeoMoose" section near the bottom of the page.
You can find a full description of the optional packages listed in the installer on [ms4w.com](https://www.geomoose.org/download.html).

![ms4w setup screen 1](ms4w-setup-1.png)

*MS4W may occasionally come with an older version of GeoMoose, in which case you can head to Option3 below to manually 
install the latest and greatest version for the full Moose experience.

The MS4W installer will prompt for a path. GeoMoose is set up and expects to run from the default path (`C:\ms4w\apps\gm3\htdocs\`), 
so please leave it set to `C:\`.  This will also make all future updates and enhancements to the 
application simpler.

![ms4w setup screen 2](ms4w-setup-2.png)

Lastly, MS4W will ask to specify the Apache port. There is no reason to change this unless port 80 is 
already in use. Also, if you install another web service in the future that uses port 80, you may want 
to reconfigure it to run a different port.

![ms4w setup screen 3](ms4w-setup-3.png)

You can validate the MS4W installation by navigating to localhost (http://127.0.0.1), where you will 
be greeted by the MS4W introduction and features.

![working ms4w](ms4w-success.png)

GeoMoose will be listed on that MS4W localhost page under applications:

![geomoose listing](geomoose-success-1.png)

You can now test your local GeoMoose application (as [below](#test)).

# <a name="option2">Option 2: Install the GeoMoose software + data separately

The following assumes that you already have MS4W installed.

## Install the GeoMoose Demo Data

Extract the latest `gm3-demo-data` file (such as `gm3-demo-data-3.6.0-ms4w.zip`) to the C directory. 
This will unzip mapfiles and shapefiles used to power the GeoMoose examples.

![geomoose extract zip](geomoose-setup-1.png)

## Install GeoMoose

Extract the latest `gm3-examples` file (such as `gm3-examples-3.6.1-ms4w.zip`) to the C directory. 
Everything in it is already set to install where needed within the MS4W subdirectories including 
Apache, Apps, and httpd.d.

![geomoose extract zip](geomoose-setup-1.png)

Once extracted, restart the Apache MS4W Service.

![restart windows apache service](geomoose-setup-2.png)

# <a name="test">Test your local GeoMoose application

GeoMoose will now show up on the MS4W localhost page under applications

![geomoose listing](geomoose-success-1.png)

Click one of the links to launch the Desktop or Mobile version of GeoMoose.

![geomoose desktop](geomoose-success-2.png)



