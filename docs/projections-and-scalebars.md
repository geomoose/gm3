# Projections, Measurement, and Scalebars

GeoMoose uses the EPSG:3857 projection for displaying maps.
This choice was made to ensure that users could use OpenStreetMap,
Bing, and other popular basemap layers. This is the same projection
that is used by other popular web mapping applications.

Problematically, this Mercator projection can show a number of artifacts
in daily use.

## Measurements

Measuring between two points on the screen will not necessarily yield
an accurate measurement.  As the map goes north to south measuring points
will yield decreasing accuracy.  GeoMoose accounts for this fact and will
perform the necessary re-projection in order to provide the user with
meaningful numbers.

## Scalebars

The scalebars included with the demo are rendered by MapServer.  MapServer
does not perform the same transformations as GeoMoose. It will base the
scale rendering on the projection as given.  EPSG:3857 does not provide
"square" pixels.  Meaning the amount of 'distance' in the width of a pixel
will be different than the height of the pixel.  This means the scalebars
will not be consistent with the measurements in GeoMoose.


