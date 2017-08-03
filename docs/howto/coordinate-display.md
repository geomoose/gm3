# How-to configure the Coordinate Display

The CoordinateDisplay component shows the mouse position in various
projections as it moves across the map. This handy little function
can help users orient themselves to locations and assist in locating
features on the map.

Many GeoMoose applications utilize the "Web Mercator" projection. This 
is the projection made popular by Google Maps. However, users are generally
more comfortable in a local projection or even in WGS84 decimal degree 
coordinates. The CoordinateDisplay can be configured using any of these
projections.

## Adding a custom projection

EPSG:4326 (WGS84, Decimal Degrees) and EPSG:3857/EPSG:900913 are 'built in'
to GeoMoose.  But since GeoMoose uses Proj4JS, it can be be configured with
additional projections using the proj definition. To add UTM-15N, the following
is used in the demo:

```javascript
app.addProjection({
    ref: 'EPSG:26915',
    def: '+proj=utm +zone=15 +ellps=GRS80 +datum=NAD83 +units=m +no_defs'
});
```

* `ref` refers to the reference of the projection. In this case, UTM-15N which is
EPSG:26915.  
  Note: EPSG references a catalog of projection definitions 
  maintained by [www.epsg.org]. This catalog is significant 
  because of its use in the OGC WMS and WFS specifications 
  as a preferred way to communicate projection information. 
  Internally, GeoMoose just uses ref and an identifier and so could be 
  anything unique, but when talking to external servers `ref` matching
   what the server expects might matter.
* `def` is the [proj4](http://proj4.org/) definition string.
  Any projection can be added in this way and 
  [epsg.io](http://epsg.io/) can assist in finding
  the proj definition string for many different projections.

## Built-in custom projections

GeoMoose also honors two custom internal projections:

* `xy` - This is actually the unprojected coordinate from the map.
  The results of `xy` will be whatever the map projection happens to be.
* `usng` - Defines the coordinates place in the US National Grid.
  For more information on USNG, please visit 
  [The US National Grid Information Center](http://usngcenter.org/).
  
## Specifying the projections

When adding the CoordinateDisplay component to the application, it will
accept an array of objects which have a `ref` and a `label` member.
The `label` member will be the text prefixed before the coordinates.
The `ref` defines which output projection should be used whether a custom 
projection like `EPSG:26915` or a built-in such as `xy` or `usng`.

## Example

Below is an example of configuring the coordinate display to use
a US Albers projection and display the national grid coordinate:

```javascript

app.addProjection({
    ref: 'ESRI:102003',
    def: '+proj=aea +lat_1=29.5 +lat_2=45.5 +lat_0=37.5 +lon_0=-96 +x_0=0 +y_0=0 +ellps=GRS80 +datum=NAD83 +units=m +no_defs'
});

app.add(gm3.components.CoordinateDisplay, 'coordinate-display', {
    projections: [
        {
            label: 'Albers:',
            ref: 'ESRI:102003'
        },
        {
            label: 'USNG:',
            ref: 'usng'
        }
    ]
});
```
