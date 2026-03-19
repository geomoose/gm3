How-to hide the catalog tab
============================

Sometimes administrators of a site may want the catalog tab to be minimized by 
default. This can be useful for both small screens and for embedding your
map in other websites. This can easily be done by making a simple edit to the
``index.html`` file.

Change index.html
------------------------------------------

In ``index.html``, find the body tag and add a tabs-closed class to it.

Default site configuration with the catalog tab open by default:

.. code:: html

    <body>
        <div id="main">
            <div id="header">
                <img height="50" src="logo.png">
                <div id="toolbar"></div>
            </div>
            ...

Site configuration with the catalog tab minimized. Note that there is a 
space before tabs-closed (without the space the catalog tab is minimized
by default, but you can't unminimize it):

.. code:: html

    <body class=" tabs-closed">
        <div id="main">
            <div id="header">
                <img height="50" src="logo.png">
                <div id="toolbar"></div>
            </div>
            ...


