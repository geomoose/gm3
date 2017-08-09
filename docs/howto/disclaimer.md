# How-to add a disclaimer

In GeoMoose 2.x, there was a dedicated extension for adding a disclaimer to the application at startup. GeoMoose 3.X does not need a specific extension as it provides the ability to add a dedicated Modal dialog to the application at startup.

To create a disclaimer dialog:

1. Open your `app.js` file.
2. After `app.loadMapbook` there is a call to the `then` function which is passed
   an anonymous function.  In the anonymous function add:
   ```javascript
   app.alert('disclaimer', 'This page is protected by a lot of legal stuff. Seriously.');
   ```

   This line is best added at the end of the anonymous function, so if using the desktop example it would follow the call to `showTab('catalog');`.

