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

/** In GeoMoose, the 'Applicaiton' class is the main 'component'
 *
 *  It provides a ES5 API to normalize all the underlaying libraries.
 *
 */

import Request from 'reqwest';

import { createStore, combineReducers } from 'redux';
import Proj from 'ol/proj';

import * as mapSourceActions from './actions/mapSource';
import * as mapActions from './actions/map';
import * as uiActions from './actions/ui';
import * as serviceActions from './actions/service';

import { parseCatalog } from './actions/catalog';
import { parseToolbar } from './actions/toolbar';

import catalogReducer from './reducers/catalog';
import msReducer from './reducers/mapSource';
import mapReducer from './reducers/map';
import toolbarReducer from './reducers/toolbar';
import queryReducer from './reducers/query';
import uiReducer from './reducers/ui';
import cursorReducer from './reducers/cursor';
import printReducer from './reducers/print';

import Modal from './components/modal';

import React from 'react';
import ReactDOM from 'react-dom';
import proj4 from 'proj4';

import { getLayerFromPath, getVisibleLayers, getQueryableLayers, getActiveMapSources } from './actions/mapSource';

import Mark from 'markup-js';

import * as util from './util';

class Application {

    constructor(config = {}) {
        this.elements = [];

        this.services = {};

        this.actions = {};

        this.config = config;

        // TODO: Combine Reducers here
        this.store = createStore(combineReducers({
            'mapSources': msReducer,
            'catalog': catalogReducer,
            'map': mapReducer,
            'toolbar': toolbarReducer,
            'query': queryReducer,
            'ui': uiReducer,
            'cursor': cursorReducer,
            'print': printReducer
        }));

        this.state = {};

        this.store.subscribe(() => { this.shouldUiUpdate(); });

        this.dialogs = {};

        this.showWarnings = (config.showWarnings === true);
    }

    registerService(serviceName, serviceClass, options) {
        // when options are not an object, then default it to be
        //  an object.
        if(typeof(options) != 'object') { options = {}; }
        // "serviceClass" should be a class that can be created,
        //  the only parameter to the constructor should be the application,
        //  which it uses to tie back to the 'react' environment.
        this.services[serviceName] = new serviceClass(this, options);
        // set the service name to whatever it was registered as.
        this.services[serviceName].name = serviceName;
    }

    /** Actions are classes with a "run" method which the application
     *  will run when they are a clicked.
     */
    registerAction(actionName, actionClass, options) {
        if(typeof(options) != 'object') { options = {}; }
        this.actions[actionName] = new actionClass(this, options);
    }

    /** Configure the default results layer.
     *
     *  This layer needs to exist so the map will properly render
     *  query reuslts.
     *
     */
    configureResultsLayer() {
        // add a layer that listens for changes
        //  to the query results.  This hs
        this.store.dispatch(mapSourceActions.add({
            name: 'results',
            urls: [],
            type: 'vector',
            label: 'Results',
            opacity: 1.0,
            queryable: false,
            refresh: null,
            options: {
                'always-on': true,
            },
            params: {},
            // stupid high z-index to ensure results are
            //  on top of everything else.
            zIndex: 200001,
        }));
        this.store.dispatch(mapSourceActions.addLayer('results', {
            name: 'results',
            on: true,
            label: 'Results',
            selectable: true,
            style: {
                'circle-radius': 4,
                'circle-color': '#ffff00',
                'circle-stroke-color': '#ffff00',
                'line-color': '#ffff00',
                'line-width': 4,
                'fill-color': '#ffff00',
                'fill-opacity': 0.25,
                'line-opacity': 0.25,
            },
            filter: null,
        }));
        // the "hot" layer shows the features as red on the map,
        //  namely useful for hover-over functionality.
        this.store.dispatch(mapSourceActions.addLayer('results', {
            name: 'results-hot',
            on: true,
            style: {
                'circle-radius': 4,
                'circle-color': '#ff0000',
                'circle-stroke-color': '#ff0000',
                'line-color': '#ff0000',
                'line-width': 4,
                'fill-color': '#ff0000',
                'fill-opacity': 0.50,
                'line-opacity': 0.50,
            },
            filter: ['==', 'displayClass', 'hot']
        }));

    }

    configureSelectionLayer() {
        // add a layer that listens for changes
        //  to the query results.  This hs
        this.store.dispatch(mapSourceActions.add({
            name: 'selection',
            urls: [],
            type: 'vector',
            label: 'Selection',
            opacity: 1.0,
            queryable: false,
            refresh: null,
            layers: [],
            options: {
                'always-on': true,
            },
            params: {},
            // stupid high z-index to ensure results are
            //  on top of everything else.
            zIndex: 200002,
        }));
        this.store.dispatch(mapSourceActions.addLayer('selection', {
            name: 'selection',
            on: true,
            style: {
                'circle-radius': 4,
                'circle-color': '#8470ff',
                'circle-stroke-color': '#8470ff',
                'line-color': '#8470ff',
                'line-width': 4,
                'fill-color': '#8470ff',
                'fill-opacity': 0.50,
                'line-opacity': 0.50,
            },
            filter: null,
        }));
    }

    populateMapbook(mapbookXml) {
        this.configureSelectionLayer();
        this.configureResultsLayer();

        // load the map-sources
        let sources = mapbookXml.getElementsByTagName('map-source');
        for(let i = 0, ii = sources.length; i < ii; i++) {
            let ms = sources[i];
            let map_source_actions = mapSourceActions.addFromXml(ms, this.config);
            for(let action of map_source_actions) {
                this.store.dispatch(action);
            }
        }

        let catalog_actions = parseCatalog(this.store, mapbookXml.getElementsByTagName('catalog')[0]);
        for(let action of catalog_actions) {
            this.store.dispatch(action);
        }

        let toolbar_actions = parseToolbar(mapbookXml.getElementsByTagName('toolbar')[0]);
        for(let action of toolbar_actions) {
            this.store.dispatch(action);
        }
    }

    loadMapbook(options) {
        if(options.url) {
            // load mapbook content from a URL,
            //  return the promise in case the user
            //  wants to do something after the mapbook has loaded.
            return Request({
                url: options.url,
                type: 'xml',
                success: (response) => {
                    this.populateMapbook(response);
                }
            });

        } else if(options.content) {
            // this is just straight mapbook xml
            //  TODO: Maybe it needs parsed?!?
            const populate_promise = new Promise((resolve, reject) => {
                this.populateMapbook(options.content);
                resolve(options.content);
            });
            return populate_promise;
        }
    }

    add(component, domId, inProps = {}) {
        let props = Object.assign({
            store: this.store
        }, inProps);

        if(inProps.services) {
            props.services = this.services;
        }

        const e = React.createElement(component, props);
        const elem = ReactDOM.render(e, document.getElementById(domId));
        return elem;
    }


    /** Run a query against the listed map-sources.
     *
     *  @param service   The registered service handling the query.
     *  @param selection A GeoMoose selection description
     *  @param fields    Array of {name:, value:, operation: } of fields to query.
     *  @param layers    Array of layer paths to query against.
     *  @param templatesIn Template name or Array of template names that should be ready.
     *
     */
    dispatchQuery(service, selection, fields, layers, templatesIn = []) {
        const single_query = this.config.multipleQuery ? false : true;
        const template_promises = [];

        // convert the "templatesIn" to an array.
        let templates = templatesIn;
        if(typeof(templatesIn) === 'string') {
            templates = [templatesIn];
        }

        // iterate through the layer and the templates.
        for(const layer of layers) {
            for(const template of templates) {
                // gang the promises together.
                template_promises.push(this.getTemplate(layer, template));
            }
        }

        // require all the promises complete,
        //  then dispatch the store.
        Promise.all(template_promises).then(() => {
            this.store.dispatch(mapActions.createQuery(service, selection, fields, layers, single_query));
        });
    }

    /** Get a template's contents on promise.
     *
     *  @param path     The layer path.
     *  @param template The name of the template.
     *
     * @returns A promise for when the contents of the template is resolved.
     */
    getTemplate(path, template) {
        const template_promise = new Promise((resolve, reject) => {
            if(template.substring(0, 1) === '@') {
                let template_name = template.substring(1);
                let layer = getLayerFromPath(this.store, path);
                let layer_template = layer.templates[template_name];

                if(layer_template) {
                    if(layer_template.type === 'alias') {
                        // TODO: Someone is likely to think it's funny to do multiple
                        //       levels of aliasing, this should probably look through that
                        //       possibility.
                        resolve(layer.templates[layer_template.alias].contents);
                    } else if(layer_template.type === 'remote') {
                        const ms_name = util.getMapSourceName(path);
                        const layer_name = util.getLayerName(path);

                        // fetch the contents of the template
                        util.xhr({
                            url: layer_template.src,
                            success: (content) => {
                                // convert the "remote" template to a local one
                                this.store.dispatch(
                                    mapSourceActions.setLayerTemplate(
                                        ms_name, layer_name,
                                        template_name, {
                                            type: 'local',
                                            contents: content
                                        }
                                    )
                                );
                                // resolve this promise with the content
                                resolve(content);
                            },
                            // when there is an error fetching the template,
                            // 404 or whatever, return a blank template.
                            error: function() {
                                resolve('');
                            },
                        });
                    } else {
                        resolve(layer.templates[template_name].contents);
                    }
                } else {
                    // TODO: It may be wiser to allow services to specify
                    //       how failure to find a template should be handled.
                    //       - Identify will simply not render features.
                    //       - Select could have a critical failure without
                    //          an appropriate template.

                    // commented this out because it was causing identify on layers
                    //  without an identify template to fail the entire query.

                    // console.info('Failed to find template.', path, template_name);
                    // reject('Failed to find template. ' + path + '@' + template_name);

                    // resolve this as an empty template.
                    resolve('');
                }
            }
        });

        return template_promise;
    }

    /** Render feeatures from a query using a specified template.
     *
     *  @param query The query.
     *  @param template "Template like", "@..." will refer to a layer predefined
     *                                   template but a raw template string can
     *                                   be passed in that will be used for all layers.
     *
     * @returns HTML String.
     */
    renderFeaturesWithTemplate(query, path, template) {
        let template_contents = template;
        let html_contents = '';

        if(query.results[path]) {
            if(query.results[path].failed === true) {
                html_contents = `
                    <div class="query-error">
                        <div class="error-header">Error</div>
                        <div class="error-contents">
                        ${ query.results[path].failureMessage }
                        </div>
                    </div>
                `;
            } else if(template.substring(0, 1) === '@') {
                let template_name = template.substring(1);
                let layer = getLayerFromPath(this.store, path);
                let layer_template = layer.templates[template_name];

                if(layer_template) {
                    if(layer_template.type === 'alias') {
                        // TODO: Someone is likely to think it's funny to do multiple
                        //       levels of aliasing, this should probably look through that
                        //       possibility.
                        template_contents = layer.templates[layer_template.alias].contents;
                    } else {
                        template_contents = layer.templates[template_name].contents;
                    }
                } else {
                    template_contents = null;
                    // only show warnings when the application is
                    //  configured to do so.
                    if(this.showWarnings) {
                        console.info('Failed to find template.', path, template_name);
                    }
                }

                // do not try to iterate through the features if
                //  the template does not exist.
                if(template_contents) {
                    for(let feature of query.results[path]) {
                        // TODO: Make this plugable, check by template "type"?!?
                        html_contents += Mark.up(template_contents, feature, util.FORMAT_OPTIONS);
                    }
                } else if(layer_template && layer_template.type === 'auto') {
                    const features = query.results[path];
                    for(let i = 0, ii = features.length; i < ii; i++) {
                        const feature = features[i];
                        const properties = Object.keys(feature.properties);

                        html_contents += '<div class="result">';
                        html_contents += '<div class="feature-class">'
                        html_contents += layer.label;
                        html_contents += '</div>';
                        for(let k = 0, kk = properties.length; k < kk; k++) {
                            const key = properties[k];
                            if(key !== '_uuid') {
                                const value = feature.properties[key];
                                html_contents += Mark.up('<b>{{ key }}:</b> {{ value }} <br/>', {
                                    key, value,
                                }, util.FORMAT_OPTIONS);
                            }
                        }
                        html_contents += '</div>';
                    }

                }
            }
        }

        return html_contents;
    }

    /** Render a template from a layer.
     *
     *  WARNING! This does not check to ensure the template has been loaded.
     *  Templates are loaded as a part of the query cycle.  A remote template
     *  may not be fully hydrated if calling this function BEFORE the layer
     *  has been queried against.
     *
     */
    renderTemplate(path, template, params) {
        if(template.substring(0, 1) === '@') {
            let template_name = template.substring(1);
            let layer = getLayerFromPath(this.store, path);
            let layer_template = layer.templates[template_name];
            let template_contents = '';

            if(layer_template) {
                if(layer_template.type === 'alias') {
                    // TODO: Someone is likely to think it's funny to do multiple
                    //       levels of aliasing, this should probably look through that
                    //       possibility.
                    template_contents = layer.templates[layer_template.alias].contents;
                } else {
                    template_contents = layer.templates[template_name].contents;
                }
                return Mark.up(template_contents, params, util.FORMAT_OPTIONS);
            }
        }
        return '';
    }


    /** Map the active map-source function to the application.
     *
     *  @returns an array of active map-sources.
     */

    getActiveMapSources() {
        return getActiveMapSources(this.store);
    }

    /** Get a list of all visible paths.
     *
     *  @returns an array of layer paths.
     */
    getVisibleLayers() {
        return getVisibleLayers(this.store);
    }

    /** Return a list of queryable layers.
     *
     *  @returns an array of layer paths.
     */
    getQueryableLayers(filter) {
        return getQueryableLayers(this.store, filter);
    }

    /** zoom to an extent
     *
     * @param {Array} extent An array of [minx, miny, maxx, maxy]
     * @param {String} projCode A projection code if the bounding box is in
     *                          a projection other than the map.
     *
     */
    zoomToExtent(extent, projCode) {
        this.store.dispatch(mapActions.zoomToExtent(extent, projCode));
    }

    /** Move the map to a center point and a resolution.
     *
     */
    zoomTo(lon, lat, zoom) {
        // TODO: The destination projection should come
        //       from the map state.
        // convert the lon lat coordinates to map coordinates
        const xy = Proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857');
        // trigger a move.
        this.store.dispatch(mapActions.move(xy, zoom));
    }

    /** Generic bridge to the application's store's dispatch function.
     *
     */
    dispatch(action) {
        this.store.dispatch(action);
    }

    /** Remove all the features from a vector layer.
     */
    clearFeatures(path) {
        const ms_name = util.getMapSourceName(path);
        this.store.dispatch(mapSourceActions.clearFeatures(ms_name));
    }

    /** Add features to a vector layer.
     */
    addFeatures(path, features) {
        const ms_name = util.getMapSourceName(path);
        this.store.dispatch(mapSourceActions.addFeatures(ms_name, features));
    }

    /** Removes features from a query.
     */
    removeQueryResults(queryId, filter) {
        this.store.dispatch(mapActions.queryProgress(queryId));
        this.store.dispatch(mapActions.removeQueryResults(queryId, filter));
        this.store.dispatch(mapActions.finishQuery(queryId));
    }

    /** Remove features from a vector layer (with a filter)
     */
    removeFeatures(path, filter) {
        const ms_name = util.getMapSourceName(path);
        this.store.dispatch(mapSourceActions.removeFeatures(ms_name, filter));
    }

    /** Change the features on a vectory layer with a filter.
     */
    changeFeatures(path, filter, properties) {
        const ms_name = util.getMapSourceName(path);
        this.store.dispatch(mapSourceActions.changeFeatures(ms_name, filter, properties));
    }

    /* Shorthand for manipulating result features.
     */
    changeResultFeatures(filter, properties) {
        this.changeFeatures('results/results', filter, properties);
    }

    /** Clears the UI hint.  Used by applications to indicate
     *  that the previous "hint" has been handled.
     */
    clearHint() {
        this.store.dispatch(uiActions.clearUiHint());
    }

    /** Check for UI updates and trigger a "uiUpdate" call.
     *
     */
    shouldUiUpdate() {
        let ui = this.store.getState().ui;
        if(ui.stateId !== this.state.stateId) {
            this.state.stateId = ui.stateId;
            this.runAction();
            this.uiUpdate(ui);
        }
    }

    /** Check to see if the state has an 'action'
     *  to be executed.  Run it and then clear the state.
     */
    runAction() {
        let ui = this.store.getState().ui;
        if(ui.action) {
            this.actions[ui.action].run();
            this.store.dispatch(uiActions.clearAction());
        }
    }

    /** Kick off an action by name.
     *
     */
    startAction(actionName) {
        this.store.dispatch(uiActions.runAction(actionName));
    }

    /** Kick off a service by name
     *
     */
    startService(serviceName, options) {
        this.store.dispatch(serviceActions.startService(serviceName));
    }

    /** Handle updating the UI, does nothing in vanilla form.
     */
    uiUpdate() {
        // pass
    }

    /* Show an alert type dialog
     */
    alert(signature, message, callback = null) {
        const options = [
            {label: 'Okay', value: 'dismiss'}
        ];
        this.showDialog(signature, 'Alert', message, options, callback);
    }

    confirm(signature, message, callback = null) {
        const options = [
            {label: 'Cancel', value: 'dismiss'},
            {label: 'Okay', value: 'confirm'}
        ];
        this.showDialog(signature, 'Confirm', message, options, callback);
    }

    showDialog(signature, title, message, options, callback = null) {
        // If the dialog does not exist, then create it.
        if(!this.dialogs[signature]) {
            // create a target div for the dialog.
            var body = document.getElementsByTagName('body')[0];
            var modal_div = document.createElement('div');
            body.appendChild(modal_div);

            // configure the new props.
            const props = {
                title: title,
                onClose: callback,
                options,
                message
            };

            // create the element
            const e = React.createElement(Modal, props);
            const elem = ReactDOM.render(e, modal_div);
            // registry the dialogs signature.
            this.dialogs[signature] = elem;
        }

        // open the dialog
        this.dialogs[signature].setState({open: true});
    }

    /* Set the view of the map
     *
     * @param view {Object} A view definition containing center and zoom or resolution
     *
     */
    setView(view) {
        this.store.dispatch(mapActions.setView(view));
    }

    /**
     * addProjection
     * - A function that can be called by the user to add a custom projection.
     * - Facade for adding a projection to the proj4 registry, which then allows its use
     *     when calling the proj4 or OpenLayers libraries.
     *
     * @param {Object} projDef - an object containing an ID and a definition for a projection
     * @param {string} projDef.ref - a string ID that will be used to refer to defined projection
     * @param {string} projDef.def - a string definition of the projection, in WKT/Proj format
     */
    addProjection(projDef) {
        util.addProjDef(proj4, projDef.ref, projDef.def);
    }

    /* Short hand for toggling the highlight of features.
     */
    highlightFeatures(filter, on) {
        const props = {displayClass: on ? 'hot' : ''};
        this.changeResultFeatures(filter, props);
    }

    /* Clear highlight features
     */
    clearHighlight() {
        this.highlightFeatures({displayClass: 'hot'}, false);
    }
};


export default Application;
