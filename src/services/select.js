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

/** Select Service.
 *
 *  Used to select a set of features using a given geometry.
 *
 */
function SelectService(Application, options) {
    /** Define the title of the service. */
    this.title = options.title ? options.title : 'Select';

    /** Title to show at the top of the results. */
    this.resultsTitle = options.resultsTitle ? options.resultsTitle : 'Select Results';

    /** Template to use for rendering returned features. */
    this.template = options.template ? options.template : '@select';

    /** Name will be set by the application when the service is registered. */
    this.name = '';

    /** Define the highlight layer */
    this.highlightPath = options.highlightPath ? options.highlightPath : 'highlight/highlight';

    /** Limit the number of selection tools available */
    this.tools = {
        'Point': true,
        'MultiPoint': true,
        'Polygon': true,
        'LineString': true,
        'Select': true,
        'Modify': true,
        'default': 'Polygon',
        'buffer': true
    };

    /** autoGo = true instructs the service to query whenever
     *                the geometry has changed.
     */
    this.autoGo = false;

    /** keepAlive = true will keep the service in 'query mode'
     *                   in the background, until it is explictly turned off.
     */
    this.keepAlive = false;

    /** User input fields, select allows choosing a layer */
    this.fields = [{
        type: 'select',
        name: 'layer',
        label: 'Query Layer',
        default: options.queryLayers ? options.queryLayers[0].value : '',
        options: options.queryLayers ? options.queryLayers : []
    }];

    /** Alow shapes to be buffered. */
    this.bufferAvailable = true;

    /** This function is called everytime there is an select query.
     *
     *  @param selection contains a GeoJSON feature describing the
     *                   geography to be used for the query.
     *
     *  @param fields    is an array containing any user-input
     *                   given to the service.
     */
    this.query = function(selection, fields) {
        if(typeof(selection) === 'undefined') {
            // throw up this handy dialog.
            var msg = 'A selection geometry is required for this query.';
            var service_name = this.name;
            var on_close = function() {
                Application.startService(service_name);
            };

            Application.alert('selection-required', msg, on_close);
        } else {
            // get the query layer.
            var query_layer = fields[0].value;
            // dispatch the query against on the query layer!
            Application.dispatchQuery(this.name, selection, [], [query_layer], [this.template]);
        }
    }


    /** resultsAsHtml is the function used to populate the Service Tab
     *                after the service has finished querying.
     */
    this.resultsAsHtml = function(queryId, query) {
        // initialize empty html content.
        var html = '';
        // iterate through each layer that was queried by the service.
        for(var i = 0, ii = query.layers.length; i < ii; i++) {
            // short-handing the item in the loop.
            var path = query.layers[i];

            // check to see that the layer has results and features were returned.
            if(query.results[path] && !query.results[path].failed) {
                html += Application.renderFeaturesWithTemplate(query, path, this.template);
            }
        }

        // return the html for rendering.
        return html;
    }


    /** hasRendered is an object which tells renderQueryResults to ignore
     *              queries which have already been rendered.
     */
    this.hasRendered = {};

    /** renderQueryResults is the function called to let the service
     *                     run basically any code it needs to execute after
     *                     the query has been set to finish.
     *
     *  WARNING! This will be called multiple times. It is best to ensure
     *           there is some sort of flag to prevent multiple renderings.
     */
    this.renderQueryResults = function(queryId, query) {
        // This is an ugly short circuit.
        if(this.hasRendered[queryId]) {
            // do nothing.
            return;
        }
        // flag the query as rendered even though code below
        //  this line has not finished, this prevents an accidental
        //  double-rendering.
        this.hasRendered[queryId] = true;
    }
}

if(typeof(module) !== 'undefined') { module.exports = SelectService; }
