How-to Change the Loading Indicator in the Super Tab
====================================================

Help users by customizing the loading state of the Super tab.

Set loadingHTML to HTML in the application config
-------------------------------------------------

In `app.js`:

::

  var app = new gm3.Application({
    ...
    serviceManager: {
      loadingHTML: '<i>This is now the empty text in the Super tab.</i>',
    },
  });

Set loadingHTML to an element's contents
----------------------------------------

In your HTML file you can add a hidden element such as:

::

  <div style="display: none" id="loading-message">
    <div style="background-color: teal; color: white; font-weight: bold;">
      You could have a very fancy loading indicator here. Or a neat GIF.
    </div>
  </div>

And in `app.js`:

::

  var app = new gm3.Application({
    ...
    serviceManager: {
      loadingHTML: '#loading-message',
    },
  });
