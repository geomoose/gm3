# Actions and Services

GeoMoose 3+ supports two different types of tools in the toolbar. In general the two can be described as follows:

 * `service`s are tools which query a set of layers and process the data.
 * `action`s do not use the data-query life-cycle and are mostly arbitrary
    bits of Javascript that can be executed.

## Actions

Actions do one thing, they execute the code in the `run` method when clicked from the toolbar.

### Example custom action
**alert.js**

```
function AlertAction(Application, config) {
    this.run = function() {
        alert(config.message);
    }
}
```

The application's **index.html** would then need to include **alert.js**:

```
<script type="text/javascript" src="alert.js"></script>
```

And the new action would then need to be registered with the application in the **app.js** file:

```
app.registerAction('say-hello', AlertAction, {message: 'Hello, World'});
```

Finally, the action needs to be linked to a tool in the toolbar. In **mapbook.xml**, 
in the `<toolbar>` section, the following would be added:

```
<tool type="action" name="say-hello" title="Say Hello"/>
```

When the application is reloaded, a new toolbar button will appear with the text "Say Hello,"
clicking on it will cause the action to execute the code in `this.run` -- alerting the contents
of config.message which was set to `'Hello, World'`.


## Services

Services are more complex. A service is used to collect information from the user and the map then
use that information to generate a query.  After the query has executed, the results are then rendered
into HTML.

Unlike an action, services require defining more members for them to function properly:

 * `title` - A title is required for rendering results in the Super tab. This title is
    placed at the top of the tab and is useful for recognizing what the service
    is attempting to render.
 * `tools` - This is an object that defines which types of drawing tools are available. 
    Options available:
    * `Point: true` - Allow the user to draw a single point for the query.
    * `MultiPoint: true` - Allow the user to draw multiple points for the query.
    * `LineString: true` - Allow the user to draw a line for the query.
    * `Polygon: true` - Allow the user to draw a polygon for the query.
    * `Select: true` - Let the user choose features from a different layer.
    * `Modify: true` - Allow the user to modify their previous selections.
    * `buffer: true` - Allow the user to buffer their drawn shapes.
    * `default: [Point|MultiPoint|Polygon|LineString]` - Specify the drawing tool
      that should be selected by default.
 * `fields` - This is a list of objects that defines the user input fields.
    See [Input types](input-types.md) for the types of input which are available.
 
 The `title`, `tools`, and `fields` definitions will be used to render a set of user inputs
 when the service is clicked in the toolbar.
 
 Services also have different methods which handle different phases of the query
 cycle:
 
  * `query(selection, fields)` - The `selection` parameter describes the 
    geographic selection made by the user. The `field` parameter is a list
    of field names and values which were derived from the `fields` object.
    The `query` method's job is to modify and normalize any inputs before 
    submitting them to `Application.dispatchQuery`. `Application.dispatchQuery`
    will start the next step in the service's life-cycle, either running the
    service's `runQuery` method or using the built-in querying mechanisms
    for the specified layer(s).
 * `resultsAsHtml(queryId, query)` - Returns HTML to render in the Super tab.

### Writing a custom query

The default behavior for a service is to query the chosen layer(s) for features.
For example, if a layer is on a WFS-type map-source, GeoMoose will dispatch a WFS 
GetFeatures query with the appropriate filters to get the relevant features
back to the user. However, there are time where this functionality is not desired.
The example included in GeoMoose's example desktop application is geocoding. When
running a geocode query the user will not query the underlying layers but call
a different script which will return features.  This requires defining
a different `runQuery` method. E.G.:

```
function MyCustomService(Application, config) {
  runQuery(queryId, query) {
    // Do some stuff...
  }
}
```

See `src/services/geocode-osm.js` for more details.
    
