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

/** Search Service.
 *
 *  Used to do a drill-down single-point query of all visible layers.
 *
 *  The application will be passed into the service upon registration.
 *
 */
function SearchService(Application, options) {
    /** Define the title of the service. */
    this.title = options.title ? options.title : 'Search';

    /** Title to show at the top of the results. */
    this.resultsTitle = options.resultsTitle ? options.resultsTitle : 'Search Results';

    /** Header template for rendering before features. */
    this.headerTemplate = options.headerTemplate ? options.headerTemplate : '@search-header';

    /** Template to use for rendering returned features. */
    this.template = options.template ? options.template : '@search';

    /** Toggle whether the grid should attempt rendering. */
    this.showGrid = options.showGrid !== undefined ? options.showGrid : true;

    /** Footer template for rendering before features. */
    this.footerTemplate = options.footerTemplate ? options.footerTemplate : '@search-footer';

    /** Name will be set by the application when the service is registered. */
    this.name = '';

    /** Limit the number of selection tools available
     *  No geo selection tools are used for search
     * */
    this.tools = {};

    /** User input fields */
    this.fields = options.fields ? options.fields : [
    ];

    /** Define the layer(s) to be searched. */
    this.searchLayers = options.searchLayers ? options.searchLayers : [];

    /** Allow the user to programmatically change which
     *  layers are searched.
     */
    this.getSearchLayers = options.getSearchLayers ? options.getSearchLayers : function(searchLayers, fields) {
        return searchLayers;
    };

    /** Allow the user to programmatically validate form field values. */
    this.validateFieldValues = options.validateFieldValues ? options.validateFieldValues : function (fields) {
        return {
            valid: true,
            message: null
        };
    };

    /** Automatically zoom to results */
    this.zoomToResults = options.zoomToResults === true;

    /** Ensure that if a grid is configured, it's minimized */
    this.gridMinimized = options.gridMinimized === true;

    /** Field transfomation function. */
    this.prepareFields = options.prepareFields ? options.prepareFields : function(fields) {
        // reformat the fields for the query engine,
        //  "*stuff*" will do a case-ignored "contains" query.
        var query = [];
        for(var i = 0, ii = fields.length; i < ii; i++) {
            if(fields[i].value !== '' && fields[i].value !== undefined) {
                query.push({
                    comparitor: 'ilike',
                    name: fields[i].name,
                    value: '%' + fields[i].value + '%'
                });
            }
        }
        return query;
    };

    /** Define the results layer */
    this.resultsPath = options.resultsPath ? options.resultsPath : 'results/results';

    /** This function is called everytime a search is executed.
     *
     *  @param selection Always null in this instance as search does not require.
     *                   a spatial component.
     *
     *  @param fields    is an array containing any user-input
     *                   given to the service.
     */
    this.query = function(selection, fields) {
        // This will dispatch the query.
        // check which templates should try and load
        var templates = [this.template];
        if (this.showGrid) {
            templates.push('@search-grid-columns');
            templates.push('@search-grid-row');
        }

        // Application.dispatchQuery is used to query a set of map-sources
        //  as they are defined in the mapbook.  To perform other types of queries
        //  it would be necessary to put that code here and then manually tell
        //  the application when the query has finished, at which point resultsAsHtml()
        //  would be called by the service tab.
        Application.dispatchQuery(
            this.name,
            selection,
            this.prepareFields(fields),
            this.getSearchLayers(this.searchLayers, fields),
            templates
        );
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
                // renderFeaturesWithTemplate will take the query, the layer specified by path,
                //  and the specified template and render it. This example uses an inline
                //  template from the mapbook.
                // The layer in the mapbook should have a <template name='identify'>
                //  child which will be rendered here..
                html += Application.renderFeaturesWithTemplate(query, path, this.template);
            }

            // and footer contents.
            html += Application.renderTemplate(path, this.footerTemplate, query);

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

        // render a set of features on a layer.
        var all_features = [];
        for(var i = 0, ii = query.layers.length; i < ii; i++) {
            var path = query.layers[i];
            if(query.results[path]) {
                all_features = all_features.concat(query.results[path]);
            }
        }

        // when features have been returned, clear out the old features
        //  and put the new features on the results layer.
        if(all_features.length > 0) {
            Application.clearFeatures(this.resultsPath);
            Application.addFeatures(this.resultsPath, all_features);
        }
    }


}

if(typeof(module) !== 'undefined') { module.exports = SearchService; }
