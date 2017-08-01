# How-to configure the Jump to Extent Drop Down

## Changing the defined extents

The JumpToExtent component is configured in the `app.js` file.

The JumpToExtent component's configuration offers the `locations` settings which
is an array of objects with a `label` and `extent` attribute. The `extent` is
an array of minx,maxx,miny,maxy in the map's coordinate system. The examples below
are in EPSG:3857.

From the example app:

```javascript
app.add(gm3.components.JumpToExtent, 'jump-to-extent', {
    locations:  [
        {
            label: 'Parcel Boundaries',
            extent: [-10384071.6,5538681.6,-10356783.6,5563600.1]
        },
        {
            label: 'Dakota County',
            extent: [-10381354,5545268,-10328765,5608252]
        },
        {
            label: 'Minnesota',
            extent: [-10807000,5440700,-9985100,6345700]
        }
    ]
});
```



## Getting the configuration from a JSON file

The component can be added asychronously as a part of a AJAX call. For example,
if there was a `locations.json` file it could be loaded using the Fetch API:

```javascript
fetch('locations.json').then(function(response) {
    return response.json();
}).then(function(locationsJson) {
    app.add(gm3.components.JumpToExtent, 'jump-to-extent', {
        locations: locationsJson
    });
});
```
