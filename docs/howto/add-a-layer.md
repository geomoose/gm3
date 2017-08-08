# How-to add a layer

This how-to provides instructions to add the a Firestations layer to the 
GeoMoose demo.  These instructions are similar to those found in the 
GeoMoose Workshop. There is another similar how to on [adding a 
GeoJSON file to GeoMoose](./geojson.md).

## Including Firestations from the Demo.

* The firestations layer is included with the GeoMoose 3 Demo Data.
* Open the `mapbook.xml`

  For MS4W installs, the mapbook is located here: `C:\ms4w\apps\gm3\htdocs\examples\desktop\mapbook.xml`
  
* Add the following after line 5:

    ```xml
    <map-source name="firestations" type="mapserver">
        <file>./demo/firestations/firestations.map</file>
        <layer name="fire_stations"/>
    </map-source>
    ```
    
* The above XML adds the `firestations` source with a `fire_stations` layer.


## Add Firestations to the catalog

* GeoMoose separates the difference between the source-data with
  `<map-source />` es and presentation with the use of the `<catalog>`.
* In `mapbook.xml` find the `<catalog>` element, after it, add:
    ```xml
    <layer src="firestations/fire_stations" title="Firestations"/>
    ```
* This will add the `fire_stations` layer of the `firestations` source
  to the catalog with the label "Firestations".

* "Hard" Reload the Browser or clear-the-cache and reload.
  *Pro tip: Chrome can be very aggressive at caching AJAX loaded XML.*

* The catalog should now have a 'Firestations' layer at the top!

![Firestations in the catalog](../workshop/images/firestations-in-catalog.png)

## Using identify with Firestatations

The [How-to add identify to a layer](./add-identify.md) guide features the firestations layer.
And describes adding identify and how identify works.
