# How-to use GeoJSON/WFS

By default GeoMoose will use GML to communicate with a WFS server.
To have GeoMoose use JSON, it needs to have the outputFormat `<param>` set
to a JSON mime-type:

```xml
<map-source name="my-wfs" type="wfs">
    ...
    <param name="outputFormat" value="application/json" />
    ...
</map-source>
```

