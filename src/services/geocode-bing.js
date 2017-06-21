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

function BingGeocoder(Application, options) {
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
    this.highlightPath = options.highlightPath ? options.highlightPath : 'highlight/highlight';

    /** This template is specified in HTML instead of referring to a
     *  layer's set of named templates.  This also makes an assumption about the name
     *  of the application (app), and therefore would need overridden in something
     *  other than the demo application.
     */
    this.template = '<div class="search-result">' +
                    '<a onClick="app.zoomToExtent([{{ bbox.1 }}, {{ bbox.0 }}, {{ bbox.3 }}, {{ bbox.2 }}], \'EPSG:4326\')" class="zoomto-link">' +
                        '<i class="fa fa-search"></i>' +
                        '{{ name }}' +
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
        var bing_url = 'http://dev.virtualearth.net/REST/v1/Locations';
        // boom kick this off.
        var highlight_path = this.highlightPath;
        gm3.util.xhr({
            url: bing_url,
            type: 'jsonp',
            jsonp: 'jsonp',
            jsonpCallback: 'jsonp',
            data: {
                key: options.key,
                query: query.fields[0].value
            },
            success: function(results) {
                // populate the reuslts
                Application.dispatch({
                    id: queryId,
                    type: 'MAP_QUERY_RESULTS',
                    // this is a bit of a cheat.
                    layer: 'geocoder', features: results.resourceSets[0].resources,
                });
                // mark this as finished.
                Application.dispatch({
                    id: queryId,
                    type: 'MAP_QUERY_FINISHED'
                });


                // convert the Bing resource into a geojson feature.
                var features = [];
                var resources = results.resourceSets[0].resources;
                for(var i = 0, ii = resources.length; i < ii; i++) {
                    var r = resources[i];
                    features.push({
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [
                                r.point.coordinates[1],
                                r.point.coordinates[0]
                            ]
                        },
                        properties: {
                            id: 'address' + i
                        }
                    });
                }
                if(features.length > 0) {
                    Application.clearFeatures(highlight_path);
                    Application.addFeatures(highlight_path, features);
                }
            }
        });
    };

    /** Query the Bing Geocoder Service/.
     */
    this.query = function(selection, fields) {
        Application.dispatchQuery(this.name, selection, fields, []);
    };
}

if(typeof(module) !== 'undefined') { module.exports = BingGeocoder; }
