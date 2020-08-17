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

    /** Header template for rendering before features. */
    this.headerTemplate = options.headerTemplate ? options.headerTemplate : '@select-header';

    /** Template to use for rendering returned features. */
    this.template = options.template ? options.template : '@select';

    /** Toggle whether the grid should attempt rendering. */
    this.showGrid = options.showGrid !== undefined ? options.showGrid : true;

    /** Footer template for rendering before features. */
    this.footerTemplate = options.footerTemplate ? options.footerTemplate : '@select-footer';

    /** Name will be set by the application when the service is registered. */
    this.name = '';

    /** Define the highlight layer */
    this.highlightPath = options.highlightPath ? options.highlightPath : 'highlight/highlight';

    /** Limit the number of selection tools available */
    this.tools = options.tools ? options.tools : {
        'Box': true,
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
    this.keepAlive = (options.keepAlive === true);

    /** Automatically zoom to results */
    this.zoomToResults = options.zoomToResults === true;

    /** Minimize the grid at results time */
    this.gridMinimized = options.gridMinimized === true;

    /** User input fields, select allows choosing a layer */
    this.fields = options.fields || [{
        type: 'layers-list',
        name: 'layer',
        label: 'Select from',
        default: options.defaultLayer,
        filter: {
            // ensure that the layer is visible to prevent confusion.
            requireVisible: true,
            // but require it have a select template.
            withTemplate: ['select', 'select-header', 'select-grid-columns', 'gridColumns']
        }
    }];

    /** When true, put the query fields above any drawing tools. */
    this.fieldsFirst = true;

    /** When defined, label the draw tools */
    this.drawToolsLabel = options.drawToolsLabel !== undefined ? options.drawToolsLabel : 'Using';

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
            var self = this;
            var on_close = function() {
                Application.startService(service_name, {changeTool: self.tools.default});
            };

            Application.alert('selection-required', msg, on_close);
        } else {
            // get the query layer.
            var query_layer = fields[0].value;
            // check which templates should try and load
            var templates = [this.template];
            if(this.showGrid) {
                templates.push('@select-grid-columns');
                templates.push('@select-grid-row');
                templates.push('@gridColumns');
                templates.push('@gridRow');
            }

            // dispatch the query against on the query layer!
            Application.dispatchQuery(this.name, selection, [], [query_layer], templates);
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

            // add the header contents
            html += Application.renderTemplate(path, this.headerTemplate, query);

            // check to see that the layer has results and features were returned.
            if(query.results[path]) {
                html += Application.renderFeaturesWithTemplate(query, path, this.template);
            }

            // and footer contents.
            html += Application.renderTemplate(path, this.footerTemplate, query);
        }


        // return the html for rendering.
        return html;
    }
}

if(typeof(module) !== 'undefined') { module.exports = SelectService; }
