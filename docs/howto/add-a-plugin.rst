How-to add a Plugin
===================

Plugins allow adding code into your GeoMoose application at a deeper
level. They require familiarity with React and Redux but expose many of
GeoMoose's inner-workings.

1. Write the plug-in
--------------------

Plugins are given the React, ReactDOM, and redux store. They are
expected to return a component. The following example uses a functional
component:

``examples/plugin/src/hello.js``:

::

    // If using the default settings for @babel/react-preset then
    //  keeping the names React and ReactDOM are important.
    const HelloWorldComponent = ({React, ReactDOM, store}) => (
        <div>
            This application has { Object.keys(store.getState().mapSources).length } map sources.
        </div>
    );

This example is written using ES6. It features the JSX syntax. It is not
the scope of this How-to describe those concepts, however, the GeoMoose
repository contains all the things we need to convert this to
browser-friendly ES6.

::

    cd examples/plugin
    npm install
    npm run build

This will create ``examples/plugin/hello.js``.

2. Adding it to the application
-------------------------------

``hello.js`` is a little informative panel to tell the user how many map
sources have been configured. The following changes will add a tab to
the application then add the plug-in to that tab.

Adding a tab
~~~~~~~~~~~~

1. Edit the ``index.html`` file of your application and find the *Super
   Tab*.
2. The following will add a new tab to the list of tabs:

``<span id="hello-tab-tab" class="tab" onclick="showTab('hello-tab', event)">Hello Tab</span>``

3. And add the new tab content:

   ::

       <div class="tab-content" id="hello-tab"></div>

Adding the plug-in
~~~~~~~~~~~~~~~~~~

1. The plug-in will need copied from where it was just built to your
   application's directory. In the demo this is ``examples/desktop`` but
   your apps directory may be different:

   ::

       cp examples/plugin/hello.js examples/desktop/

2. Include the plug-in in ``index.html`` before ``app.js`` is included.
   It is very important to include the ``<script>`` tag for the plug-in
   BEFORE the one for ``app.js``.

   ::

       <script type="text/javascript" src="hello.js"></script>
       <script type="text/javascript" src="app.js"></script>

3. Now in ``app.js`` the plug-in is configured. Before:

   ::

       app.add(gm3.components.Version, 'version');

   After:

   ::

       app.add(gm3.components.Version, 'version');

       app.addPlugin(HelloWorldComponent, 'hello-tab');
