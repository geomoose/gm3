/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 Dan "Ducky" Little
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

function USNGSearch(Application, options) {
    /** Define the title of the service. */
    this.title = options.title ? options.title : 'Search USNG';

    /** Title to show at the top of the results. */
    this.resultsTitle = options.resultsTitle ? options.resultsTitle : 'USNG Search Results';

    /** Name will be set by the application when the service is registered. */
    this.name = '';

    /** Optional select the start point for the search */
    this.tools = {
        'Point': true,
        'default': 'Point'
    };

    /** Aaand the search field. */
    this.fields = [{
        name: 'usng', type: 'text', label: 'USNG'
    }];

    /** Define the highlight layer */
    this.targetLayer = options.targetLayer ? options.targetLayer : 'results/results';

    // default the map projection to web-mercator
    this.mapProjection = options.mapProjection ? options.mapProjection : 'EPSG:3857';

    /** This template is specified in HTML instead of referring to a
     *  layer's set of named templates.  This also makes an assumption about the name
     *  of the application (app), and therefore would need overridden in something
     *  other than the demo application.
     */
    this.template = '<div class="search-result">' +
        '<a onClick="app.zoomToExtent([{{ properties.minx }}, {{ properties.miny }}, {{ properties.maxx }}, {{ properties.maxy }}], \'EPSG:4326\')" class="zoomto-link">' +
                        '<i class="fa fa-search"></i>' +
                        '{{ properties.usng }}' +
                    '</a>' +
                    '</div>';

    this.resultsAsHtml = function(queryid, query) {
        var html = '';

        if(true) {
            html += Application.renderFeaturesWithTemplate(query, 'usngsearch', this.template);
        }

        return html;
    };

    this.runQuery = function(queryId, query) {
        var target_layer = this.targetLayer;
        var map_proj = this.mapProjection;

        var features = [];

        try {
            // Make sure we have an input USNG value
            if(typeof(query.fields[0].value) === 'undefined') {
                throw('A USNG coordinate is required for this query');
            }

            // Get starting point for search, if supplied
            var selection = null;
            if(query.selection && query.selection.type && query.selection.type === 'Feature') {
                var point = gm3.util.projectFeatures([query.selection], map_proj, 'EPSG:4326')[0];
                selection = { lon: point.geometry.coordinates[0], lat: point.geometry.coordinates[1] };
            }

            // Attempt to convert USNG to a feature
            var u = new USNG2();
            var ll = u.toLonLatPoly(query.fields[0].value.toUpperCase(), selection);
            console.log(ll);
            features.push({
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [ll.coordinates]
                },
                properties: ll
            });

            // put the feature in map projection.
            features = gm3.util.projectFeatures(features, 'EPSG:4326', map_proj);

            // populate the results
            Application.dispatch({
                id: queryId,
                type: 'MAP_QUERY_RESULTS',
                failed: false,
                // this is a bit of a cheat as there is no real 'usngsearch' layer.
                // However, 'usngsearch' is the path used to render the results.
                layer: 'usngsearch', features: features
            });
        } catch(e) {
            // populate the results
            Application.dispatch({
                id: queryId,
                type: 'MAP_QUERY_RESULTS',
                failed: true,
                messageText: e.toString(),
                // this is a bit of a cheat as there is no real 'usngsearch' layer.
                // However, 'usngsearch' is the path used to render the results.
                layer: 'usngsearch', features: features
            });
        }

        // mark the query as finished.
        Application.dispatch({
            id: queryId,
            type: 'MAP_QUERY_FINISHED'
        });

        // remove features from the target_layer
        Application.clearFeatures(target_layer);

        if(features.length > 0) {
            Application.addFeatures(target_layer, features);
        }
    };

    /** Query the USNG Search Service/.
     */
    this.query = function(selection, fields) {
        Application.dispatchQuery(this.name, selection, fields, ['usngsearch']);
    };
}

if(typeof(module) !== 'undefined') { module.exports = USNGSearch; }
