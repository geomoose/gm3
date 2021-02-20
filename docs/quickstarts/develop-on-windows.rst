.. _develop-on-windows:

Developer Quickstart for Windows
================================

1. Install Node with npm
------------------------

Travel to the official `NodeJS site <https://nodejs.org/en/>`__ and
download the latest LTS release of NodeJS.

It is fine to install Node with all of the defaults. That will put the
node command line in the PATH and install the NPM package manager.

2. Create a Folder for GeoMoose
-------------------------------

These examples will use ``\GeoMoose`` as the target folder.

3. Install Git
--------------

I would suggest `GitHub Desktop <https://desktop.github.com/>`__. It's a
nice clean interface. Any Git client will work fine.

4. Clone the GeoMoose3 Repository
---------------------------------

Upon installation GitHub Desktop the GUI will ask prompt the user if
they wish to Add, Create, or Clone a repository. The GeoMoose/gm3
repository will not be immediately available unless you are a member of
the geomoose GitHub organization.

If it is not available then double click on 'Git shell' and execute the
following:

::

    cd c:\GeoMoose
    git clone https://github.com/geomoose/gm3.git

5. Install Packages
-------------------

The best way to do this is using the command line. Upon up a shell
(command, PowerShell, Git Shell) and run the following:

::

    cd c:\GeoMoose\gm3
    npm install

6. Run Tests (Optional)
-----------------------

From the command prompt:

::

    cd c:\GeoMoose\gm3
    npm test

Note: There are a couple of node modules (only required for some tests,
not for building GeoMoose) that are somewhat difficult to install on
Windows because they require compiling C/C++ code to install. These
tests will be skipped if those modules aren't installed. The remainder
of the tests will run (and should pass).

7. Do an initial build and startup the application
--------------------------------------------------

Copy ``gm3\examples\config.js.example`` to
``gm3\examples\desktop\config.js`` and edit it to match your machine's
configuration for mapserver and the demo dataset for GeoMoose. For
example, if you have already installed MS4W (contains mapserver and
Apache web server), and the demo dataset for GeoMoose:

::

    CONFIG = {
       mapserver_url: 'http://localhost/cgi-bin/mapserv.exe',
       mapfile_root: 'C:/ms4w/apps/gm3-demo-data/'
    };

From the command prompt:

::

    cd c:\GeoMoose\gm3
    npm run build
    npm start

Open GeoMoose in a browser:
http://localhost:4000/examples/desktop/index.html

If you have a problem displaying demo map content in your browser, it
could be due to using MS4W's Apache server on port 80 and Webpack
serving GeoMoose files on port 4000. This can be caused by a Cross
Origin Resource Sharing (CORS) restriction in your Apache configuration.
You can remove the restriction by editing the
``C:\ms4w\Apache\conf\httpd.conf`` file and adding the lines starting
with ``Header``:

::

    #
    # Configure MS4W locations and directories
    #
    <Location "/cgi-bin">
        Options None
        Require all granted

        Header always set Access-Control-Allow-Origin "*"
        Header always set Access-Control-Allow-Methods "POST, GET, OPTIONS, DELETE, PUT"
        Header always set Access-Control-Max-Age "1000"
        Header always set Access-Control-Allow-Headers "x-requested-with, Content-Type, origin, authorization, accept, client-security-token"
    </Location>

8. Troubleshooting
------------------

If tests or the build unexpectedly fail, make sure your ``node_modules``
directory is up to date. First, check that the ``package-lock.json``
file is up to date with the repo (some npm commands will modify this
file and that may cause issues if that gets out of step with the main
code). Then delete the ``node_modules`` directory and re-run
``npm install``.

And feel free to ask questions on the geomoose-users `mailing
list <https://www.geomoose.org/info/mailing_lists.html>`__
