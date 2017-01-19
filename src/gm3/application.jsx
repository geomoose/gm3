/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 GeoMoose
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

import * as mapSourceActions from './actions/mapSource';
import * as mapActions from './actions/map';
import * as uiActions from './actions/ui';

import { parseCatalog } from './actions/catalog';
import { parseToolbar } from './actions/toolbar';

import catalogReducer from './reducers/catalog';
import msReducer from './reducers/mapSource';
import mapReducer from './reducers/map';
import toolbarReducer from './reducers/toolbar';
import queryReducer from './reducers/query';
import uiReducer from './reducers/ui';

import React from 'react';
import ReactDOM from 'react-dom';

import { getLayerFromPath, getVisibleLayers, getActiveMapSources } from './actions/mapSource';

import Mark from 'markup-js';

import * as util from './util';

class Application {

    constructor(config) {
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
            'ui': uiReducer
        }));

        this.state = {};

        this.store.subscribe(() => { this.shouldUiUpdate(); });
    }

    registerService(serviceName, serviceClass, options) {
        // when options are not an object, then default it to be
        //  an object.
        if(typeof(options) != Object) { options = {}; }
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
        if(typeof(options) != Object) { options = {}; }
        this.actions[actionName] = new actionClass(this, options);
    }

    populateMapbook(mapbookXml) {
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
        var self = this;

        if(options.url) {
            // load mapbook content from a URL,
            //  return the promise in case the user
            //  wants to do something after the mapbook has loaded.
            return Request({
                url: options.url,
                success: (response) => {
                    this.populateMapbook(response);
                }
            });

        } else if(options.content) {
            // this is just straight mapbook xml
            //  TODO: Maybe it needs parsed?!?

            this.populateMapbook(options.content);

        }
    }

    add(component, domId, hasServices) {
        let props = {
            store: this.store
        }
        if(hasServices) {
            props.services = this.services;
        }
        var e = React.createElement(component, props);
        ReactDOM.render(e, document.getElementById(domId));
        return e;
    }


    /** Run a query against the listed map-sources.
     *
     *  @param service   The registered service handling the query.
     *  @param selection A GeoMoose selection description
     *  @param fields    Array of {name:, value:, operation: } of fields to query.
     *  @param layers    Array of layer paths to query against.
     *
     */
    dispatchQuery(service, selection, fields, layers) {
        this.store.dispatch(mapActions.createQuery(service, selection, fields, layers));
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
            if(template.substring(0, 1) === '@') {
                let template_name = template.substring(1);
                let layer = getLayerFromPath(this.store, path);
                if(layer.templates[template_name]) {
                    template_contents = layer.templates[template_name];
                } else {
                    template_contents = null;
                    console.info('Failed to find template.', path, template_name);
                }

                // do not try to iterate through the features if
                //  the template does not exist.
                if(template_contents) {
                    for(let feature of query.results[path]) {
                        // TODO: Make this plugable, check by template "type"?!?
                        html_contents += Mark.up(template_contents, feature, util.FORMAT_OPTIONS);
                    }
                }
            }
        }

        return html_contents;
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

    /** zoom to an extent
     *
     * @param {Array} extent An array of [minx, miny, maxx, maxy]
     *
     */
    zoomToExtent(extent) {
        this.store.dispatch(mapActions.zoomToExtent(extent));
    }

    /** Move the map to a center point and a resolution.
     *
     */
    zoomTo(lon, lat, resolution) {
        this.store.dispatch(mapActions.move({lon, lat}, resolution));
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
        const layer_name = util.getLayerName(path);
        this.store.dispatch(mapSourceActions.clearFeatures(ms_name, layer_name));
    }

    /** Add features to a vector layer.
     */
    addFeatures(path, features) {
        const ms_name = util.getMapSourceName(path);
        const layer_name = util.getLayerName(path);
        this.store.dispatch(mapSourceActions.addFeatures(ms_name, layer_name, features));
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
        const layer_name = util.getLayerName(path);
        this.store.dispatch(mapSourceActions.removeFeatures(ms_name, layer_name, filter));
    }

    /** Change the features on a vectory layer with a filter.
     */
    changeFeatures(path, filter, properties) {
        console.log('changeFeatures', filter, properties);
        const ms_name = util.getMapSourceName(path);
        const layer_name = util.getLayerName(path);
        this.store.dispatch(mapSourceActions.changeFeatures(ms_name, layer_name, filter, properties));
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
        


    /** Handle updating the UI, does nothing in vanilla form.
     */
    uiUpdate() {
        // pass
    }
};


export default Application; 
