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

/** Find Me Action.
 *
 *  Used to do locate a user on the map using the browser's navigator
 *   functionality.
 *
 */
function FindMeAction(Application, options) {

    // allow the targetting of a layer, but default to the highlight layer
    this.targetLayer = options.targetLayer ? options.targetLayer : 'results/results';

    // default the map projection to web-mercator
    this.mapProjection = options.mapProjection ? options.mapProjection : 'EPSG:3857';

    // Buffer is the distance in map coordinates to buffer around
    //  the points when zooming to it's extent, defaults to 100m
    this.buffer = options.buffer ? options.buffer : 100;

    /** This function is called everytime there is an identify query.
     *
     *  @param selection contains a GeoJSON feature describing the
     *                   geography to be used for the query.
     *
     *  @param fields    is an array containing any user-input
     *                   given to the service.
     */
    this.run = function(selection, fields) {
        if(navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this.gotoPosition.bind(this));
        } else {
            alert('Geolocation is not supported.');
        }
    }

    this.gotoPosition = function(loc) {
        var lat = loc.coords.latitude;
        var lon = loc.coords.longitude;
        var coord = [lon, lat];

        // turn the coordinate into a fake feature
        var fake_feature = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [lon, lat]
            },
            properties: {
                label: 'Location'
            }
        };

        // put the feature in map projection.
        var map_feature = gm3.util.projectFeatures([fake_feature], 'EPSG:4326', this.mapProjection)[0];

        Application.clearFeatures(this.targetLayer);

        // mark the location in the highlight layer
        Application.addFeatures(this.targetLayer, map_feature);

        var b = this.buffer;
        var x = map_feature.geometry.coordinates[0],
            y = map_feature.geometry.coordinates[1];

        Application.zoomToExtent([x - b, y - b, x + b, y + b], this.mapProjection);
    }
}

if(typeof(module) !== 'undefined') { module.exports = FindMeAction; }
