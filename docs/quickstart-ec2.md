# GeoMoose on EC2 Quickstart

## Create an Ubuntu Virtual Machine in EC2

1. Click 'EC2' from the list of services.
2. Click 'Launch Instance'
3. Select Ubuntu 16.04 LTS
4. For purposes of this tutorial, a 't2.micro' instance is fine
   but if you plan to serve other users from this instance start with
   a 't2.large' instance.
5. Click 'Review nad Launch'
6. Congiure a new security group with access to SSH and HTTP.
7. Choose or create an appropriate key-pair.

Wait until the instance launches. Click on the instance in the table and note the IP
address. The IP address and then connect using ssh.

Use ssh to connect to the instance

```
ssh -i [path to your key] ubuntu@[ip address]
```

## Once you're in...

### Add the UbuntuGIS PPA

These commands will add the Ubuntu open-source GIS personal-package archive.
This provides known working version of common open-source applications include
GDAL and MapServer.

```bash
sudo add-apt-repository ppa:ubuntugis/ppa
sudo apt-get update
```

### GeoMoose Runtime Deps

The GeoMoose demos assume MapServer is installed on the server. The next step
will install Apache, MapServer, and the GDAL command line tools.

```
sudo apt-get install -y \
    apache2 \
    mapserver-bin cgi-mapserver gdal-bin
```

### GeoMoose Install Dependencies

GeoMoose can be installed either via Git or through its ZIP packages.
This will install both the `unzip` and `git` command line tools.

```
sudo apt-get install -y \
    git-core \
    unzip
```

### Install GeoMoose

For the purposes of this tutorial GeoMoose's examples and demonstration data
will be installed into `/srv/geomoose`.

```
sudo mkdir /srv/geomoose
sudo chown ubuntu:ubuntu /srv/geomoose
cd /srv/geomoose
```

Download and unzip the GeoMoose examples and demo data. The examples zip file also includes
the GeoMoose library.

```
wget https://www.geomoose.org/downloads/gm3-examples-3.0.1.zip
wget https://www.geomoose.org/downloads/gm3-demo-data-3.0.1.zip

unzip gm3-examples-3.0.1.zip
unzip gm3-demo-data-3.0.1.zip
```

### Make things availabe in the apache document root

```
sudo ln -s /srv/geomoose/gm3-examples/htdocs /var/www/html/geomoose
sudo a2enmod cgi
sudo apachectl restart
```

### Setup the config.js

Create a new `config.js` file in `/srv/geomoose/gm3-examples/htdocs/desktop`.
Put the followings into `config.js`:

```
CONFIG = {
    mapserver_url: "/cgi-bin/mapserv",
    mapfile_root: "/srv/geomoose/gm3-demo-data/"
};
```

### GeoMoose should be up and running!

Open your web-browser to `http://[the ip address you found before]/geomoose/desktop/`.

