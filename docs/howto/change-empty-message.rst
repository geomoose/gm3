How-to Change the Empty Super Tab Message
=========================================

Help users by customizing the empty state of the Super tab.

Set emptyHTML to HTML in the application config
-----------------------------------------------

In `app.js`:

::

  var app = new gm3.Application({
    ...
    serviceManager: {
      emptyHTML: '<i>This is now the empty text in the Super tab.</i>',
    },
  });

Set emptyHTML to an element's contents
--------------------------------------

In your HTML file you can add a hidden element such as:

::

  <div style="display: none" id="empty-message">
    <div style="background-color: teal; color: white; font-weight: bold;">
      This is a fancy HTML empty state.
    </div>
  </div>

And in `app.js`:

::

  var app = new gm3.Application({
    ...
    serviceManager: {
      emptyHTML: '#empty-message',
    },
  });
