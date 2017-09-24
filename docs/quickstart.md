# Quickstart

This is the quickstart to *development* guide. If you are looking for a quickstart guide for running GeoMoose then you should look at installing one of the GeoMoose examples. This quickstart utilizes the GeoMoose docker image for serving the demo data and MapServer.

## Other quickstarts

* [Quickstart for MS4W](./ms4w-quickstart/index.md)
* [For developers on Windows](./install_on_windows.md)

## Basic requirements

* Git
* Docker or MapServer 7.0+ or Newer
* [NodeJS with Npm](https://nodejs.org/) v6.10.2 or Newer

## Node Version Manager

Recent LTS versions of Linux do  not have a sufficiently modern version of Node for developing GeoMoose. As such, we [recommend using nvm.](https://github.com/creationix/nvm) NVM allows running multiple versions of Node, NPM, and allows installing "global" packages without requiring sudo or root access.

## Create your fork

GeoMoose contributions are done using Pull Requests.  You can read more about [pull requests on GitHub.](https://help.github.com/articles/about-pull-requests/)

<a target="_blank" class="github-button" href="https://github.com/geomoose/gm3/fork" aria-label="Fork geomoose/gm3 on GitHub">Click here to create your own Fork</a>

## Cloning the repositories

This will download all the data necessary to get started.

```
cd ~
mkdir geomoose
cd geomoose
git clone git@github.com:[YOUR_USER_NAME]/gm3.git
git clone git@github.com:geomoose/gm3-demo-data.git
```

## Starting the docker image

The Docker image is a quickstart way of setting up MapServer.

```
cd ~/geomoose/gm3-demo-data/docker
./build.sh
./run.sh
```

Next, test that the docker image is running correctly:

```
curl http://localhost:8000/cgi-bin/mapserv
```

If the message below appears then MapServer is running:
```
No query information to decode. QUERY_STRING is set, but empty.
```

## Getting GeoMoose started

This step installs all the dependencies for GeoMoose:
```
cd ~/geomoose/gm3
npm install
```

## Build the GeoMoose package

This will create the combined `geomoose.js` file.
```
grunt build
```

## Create a config.js file
To configure the example application, it needs to know where MapServer and the Mapfiles are on the server.

Add the following to `~/geomoose/gm3/examples/desktop/config.js`:
```
CONFIG = {
    mapserver_url: '/mapserver/cgi-bin/mapserv',
    mapfile_root: '/data/'
};
```

*Fun fact!* This is the same contents as `~/geomoose/gm3/examples/config.js.example`, so you could also `cp ../config.js.example config.js`.

## Running the tests

Then, let's see that all of the tests are working:
```
npm test
```

## Starting up the built-in web server

If the test are working then let's open up GeoMoose!
```
grunt serve
```

Open GeoMoose in a browser: [http://localhost:4000/examples/desktop/debug.html](http://localhost:4000/examples/desktop/debug.html)


