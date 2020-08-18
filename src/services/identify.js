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

/** Identify Service.
 *
 *  Used to do a drill-down single-point query of all visible layers.
 *
 *  The application will be passed into the service upon registration.
 *
 */
function IdentifyService(Application, options) {
    /** Define the title of the service. */
    this.title = options.title ? options.title : 'Identify';

    /** Title to show at the top of the results. */
    this.resultsTitle = options.resultsTitle ? options.resultsTitle : 'Identify Results';

    /** Template to use for rendering returned features. */
    this.template = options.template ? options.template : '@identify';

    /** Toggle whether the grid should attempt rendering. */
    this.showGrid = options.showGrid !== undefined ? options.showGrid : true;

    /** Name will be set by the application when the service is registered. */
    this.name = '';

    /** Limit the number of selection tools available */
    this.tools = {'Point': true, 'default': 'Point'};

    /** autoGo = true instructs the service to query whenever
     *                the geometry has changed.
     */
    this.autoGo = true;

    /** keepAlive = true will keep the service in 'query mode'
     *                   in the background, until it is explictly turned off.
     */
    this.keepAlive = true;

    /** User input fields, there are none for identify */
    this.fields = [];

    /** This function is called everytime there is an identify query.
     *
     *  @param selection contains a GeoJSON feature describing the
     *                   geography to be used for the query.
     *
     *  @param fields    is an array containing any user-input
     *                   given to the service.
     */
    this.query = function(selection, fields) {
        // check which templates should try and load
        var templates = [this.template];
        if (this.showGrid) {
            templates.push('@identify-grid-columns');
            templates.push('@identify-grid-row');
        }

        // get the list of visible layers
        var visible_layers = Application.getQueryableLayers({withTemplate: templates});

        // This will dispatch the query.
        // Application.dispatchQuery is used to query a set of map-sources
        //  as they are defined in the mapbook.  To perform other types of queries
        //  it would be necessary to put that code here and then manually tell
        //  the application when the query has finished, at which point resultsAsHtml()
        //  would be called by the service tab.
        if(visible_layers.length > 0) {
            Application.dispatchQuery(this.name, selection, fields, visible_layers, templates);
        } else {
            Application.alert('no-identify-layers', 'No layers to identify!');
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
            if(query.results[path]) {
                // renderFeaturesWithTemplate will take the query, the layer specified by path,
                //  and the specified template and render it. This example uses an inline
                //  template from the mapbook.
                // The layer in the mapbook should have a <template name='identify'>
                //  child which will be rendered here..
                html += Application.renderFeaturesWithTemplate(query, path, this.template);
            }
        }

        // return the html for rendering.
        return html;
    }
}

if(typeof(module) !== 'undefined') { module.exports = IdentifyService; }
