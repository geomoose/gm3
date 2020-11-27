.. _experimental-api:

Experimental APIs
=================

.. toctree::
    :maxdepth: 1

    basemap-toggle-plugin

GeoMoose contains an "experimental" API which is used as a testing
grounds for new improvements. Experimental APIs are meant to be useful,
reasonably vetted, but also subject to change. The goal is to present
new ideas to extend GeoMoose and get real world feedback before making
the API stable into the future.

addConnectedPlugin
------------------

Internally, GeoMoose uses React to render components and Redux to manage
state. ``addConnectedPlugin`` uses a new style of component to allow
deeper integration with that API. Plugins destined for
``addConnectedPlugin`` differ from the previous Plugin definition since
they require the mapping of the GeoMoose state to their props.

Below is a minimal example of the plug-in (saved as ``counter.js``):

::

    const CounterPlugin = {
        mapStateToProps: function(state) {
            return {
                mapSources: state.mapSources,
            }
        },

        render: function(React) {
            return function(props) {
                return React.createElement('div', {},
                    'There are ', Object.keys(props.mapSources).length, ' map sources defined.'
                );
            };
        }
    };

In ``index.html``:

Near the ``<script...>`` tags:

::

    <script type="text/javascript" src="./counter.js"></script>

Somewhere in the body:

::

    <div id="counter"></div>

In ``app.js``:

::

        app.experimental.addConnectedPlugin(CounterPlugin, 'counter', {});
