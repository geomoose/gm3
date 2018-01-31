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

function OSMGeocoder(Application, options) {
    /** Define the title of the service. */
    this.title = options.title ? options.title : 'Search address';

    /** Title to show at the top of the results. */
    this.resultsTitle = options.resultsTitle ? options.resultsTitle : 'Address search results';

    /** There are no tools for the geocoder, just the search field. */
    this.tools = {};

    /** Aaand the search field. */
    this.fields = [{
        name: 'address', type: 'text', label: 'Address'
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
                    '<a onClick="app.zoomTo({{ properties.lon }}, {{ properties.lat }}, 18)" class="zoomto-link">' +
                        '<i class="fa fa-search"></i>' +
                        '{{ properties.display_name }}' +
                    '</a>' +
                    '</div>';

    this.resultsAsHtml = function(queryid, query) {
        var html = '';

        // TODO: Handle errors from the GeoCoder service better.
        if(true) {
            // get the addresses from the results set.
            html += Application.renderFeaturesWithTemplate(query, 'geocoder', this.template);
        }

        return html;
    };

    this.runQuery = function(queryId, query) {
        var osm_url = 'https://nominatim.openstreetmap.org/search/';
        // boom kick this off.
        var target_layer = this.targetLayer;
        var map_proj = this.mapProjection;
        gm3.util.xhr({
            url: osm_url,
            type: 'json',
            data: {
                format: 'json',
                q: query.fields[0].value
            },
            success: function(results) {
                // convert the results into GeoJSON features
                var features = [];
                for(var i = 0, ii = results.length; i < ii; i++) {
                    var r = results[i];
                    features.push({
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [parseFloat(r.lon), parseFloat(r.lat)]
                        },
                        properties: r
                    });
                }

                // put the feature in map projection.
                features = gm3.util.projectFeatures(features, 'EPSG:4326', map_proj);

                // populate the results
                Application.dispatch({
                    id: queryId,
                    type: 'MAP_QUERY_RESULTS',
                    failed: false,
                    // this is a bit of a cheat as there is no real 'geocoder' layer.
                    // However, 'geocoder' is the path used to render the results.
                    layer: 'geocoder', features: features
                });

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
            }
        });
    };

    /** Query the OSM Geocoder Service/.
     */
    this.query = function(selection, fields) {
        Application.dispatchQuery(this.name, selection, fields, ['geocoder']);
    };
}

if(typeof(module) !== 'undefined') { module.exports = OSMGeocoder; }
