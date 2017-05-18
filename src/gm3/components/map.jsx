/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Dan "Ducky" Little
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

/** The big bopper of all the GeoMoose Components, the Catalog.
 *
 *  This is the most exercised component of GeoMoose and serves
 *  as the 'dispatch' center to the map, presenting the layers
 *  of the mapbook in a nice tree format.
 */

import React, {Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import Request from 'reqwest';

import { connect } from 'react-redux';

import uuid from 'uuid';

import * as olMapboxStyle from 'ol-mapbox-style';

import * as mapSourceActions from '../actions/mapSource';
import * as mapActions from '../actions/map';

import * as util from '../util';

/* Import the various layer types */
import * as wmsLayer from './layers/wms';
import * as xyzLayer from './layers/xyz';
import * as agsLayer from './layers/ags';
import * as vectorLayer from './layers/vector';
import * as bingLayer from './layers/bing';


class Map extends Component {

    constructor() {
        super();

        // create a new map id for this component
        this.mapId = uuid.v4();

        // hash of mapsources
        this.olLayers = { };

        // the current 'active' interaction
        this.currentInteraction = null;
        this.activeSource = null;

        // a hash of interval timers for layers that
        //  are set to auto-refresh
        this.intervals = {};

        this.updateMapSize = this.updateMapSize.bind(this);

        // this is used when a feature isn't finished yet.
        this.sketchFeature = null;
    }

    /** Update a source's important bits.
     *
     *  @param sourceName The name of the mapsource to update.
     *
     */
    updateSource(sourceName) {
        var map_source = this.props.mapSources[sourceName];
        var ol_layer = this.olLayers[sourceName];
        switch(map_source.type) {
            case 'wms' :
                wmsLayer.updateLayer(this.map, ol_layer, map_source);
                break;
            case 'xyz' :
                xyzLayer.updateLayer(this.map, ol_layer, map_source);
                break;
            case 'ags' :
                agsLayer.updateLayer(this.map, ol_layer, map_source);
                break;
            case 'vector' :
            case 'wfs' :
                vectorLayer.updateLayer(this.map, ol_layer, map_source);
                break;
            case 'bing':
                bingLayer.updateLayer(this.map, ol_layer, map_source);
                break;
            default:
                console.info('Unhandled map-source type: ' + map_source.type);
        }
    }

    /** Adds vector feature events to a vector-type layer.
     *
     *  @param mapSourceName
     *  @param layerName
     *  @param {ol.source.Vector} source
     *
     */
    addFeatureEvents(mapSourceName, layerName, source) {

        // geojson -- the one true Javascript object representation.
        source.on('addfeature', (evt) => {
        });
    }

    /** Create an OL Layers based on a GM MapSource definition
     *
     *  @param mapSource
     *
     *  @returns OpenLayers Layer with its source set.
     */
    createLayer(mapSource) {
        switch(mapSource.type) {
            case 'wms':
                return wmsLayer.createLayer(mapSource);
            case 'xyz':
                return xyzLayer.createLayer(mapSource);
            case 'ags':
                return agsLayer.createLayer(mapSource);
            case 'vector':
            case 'wfs':
                return vectorLayer.createLayer(mapSource);
            case 'bing':
                return bingLayer.createLayer(mapSource);
            default:
                throw ('Unhandled creation of map-source type: ' + map_source.type);
        }
    }

    /** Make a WMS GetFeatureInfo query
     *
     *  @param queryId    The query id.
     *  @param selection  The selection section of the query.
     *  @param queryLayer The name of the layer being queried.
     *
     */
    wmsGetFeatureInfoQuery(queryId, selection, queryLayer) {
        // TODO: This should come from the store or the map.
        //       ol3 makes a lot of web-mercator assumptions.
        let projection = 'EPSG:3857';

        let geojson = new ol.format.GeoJSON();
        let view = this.props.mapView;

        // get the map source
        let ms_name = util.getMapSourceName(queryLayer);

        // GetFeatureInfo only supports point queries,
        // so if the shape isn't a point, skip it.
        let feature_type = selection.geometry.type;

        if(feature_type === 'Point') {
            let coords = selection.geometry.coordinates;
            let src = this.olLayers[ms_name].getSource();

            // TODO: Allow the configuration to specify GML vs GeoJSON,
            //       but GeoMoose needs a real feature returned.
            let params = {
                'QUERY_LAYERS': util.getLayerName(queryLayer),
                'INFO_FORMAT': 'application/vnd.ogc.gml'
            };

            let info_url = src.getGetFeatureInfoUrl(coords, view.resolution, projection, params);

            Request({
                url: info_url,
                success: (response) => {
                    // not all WMS services play nice and will return the
                    //  error message as a 200, so this still needs checked.
                    if(response) {
                        let gml_format = new ol.format.WMSGetFeatureInfo();
                        let features = gml_format.readFeatures(response.responseText);
                        let js_features = geojson.writeFeaturesObject(features).features;

                        this.props.store.dispatch(
                            mapActions.resultsForQuery(queryId, queryLayer, false, js_features)
                        );
                    }
                },
                error: () => {
                    // dispatch a message that the query has failed.
                    this.props.store.dispatch(
                        // true for 'failed', empty array to prevent looping side-effects.
                        mapActions.resultsForQuery(queryId, queryLayer, true, [])
                    );
                },
                complete: () => {
                    this.checkQueryForCompleteness(queryId, queryLayer);
                }
            });
        }
    }

    /** Iterate through the layers and ensure that they have all
     *  been completed.  The state may not have been updated yet,
     *  so if a layer has been recently completed then 'completedLayer'
     *  is passed in to assume it has been populated despite what the state
     *  says.
     *
     *  @param queryId  The id of the query to check for completeness.
     *  @param completedLayer The path of a layer which has been recently completed.
     *
     *  @returns Nothing, dispatches a finishQuery action if all layers have been completed.
     */
    checkQueryForCompleteness(queryId, completedLayer) {
        let query = this.props.queries[queryId];
        let all_completed = true;

        // check to see if there are results for all the layers.
        for(let layer of query.layers) {
            all_completed = all_completed && (query.results[layer] || (layer === completedLayer));
        }

        if(all_completed) {
            this.props.store.dispatch(mapActions.finishQuery(queryId));
        }
    }

    /** Create a WFS formatted query and send it
     *
     *  @param queryId
     *  @param query
     *
     */
    wfsGetFeatureQuery(queryId, query, queryLayer) {
        // TODO: This should come from the store or the map.
        //       ol3 makes a lot of web-mercator assumptions.
        let projection = this.map.getView().getProjection();
        let geom_field = 'geom';

        // get the map source
        let ms_name = util.getMapSourceName(queryLayer);
        let layer_name = util.getLayerName(queryLayer);

        let map_source = this.props.mapSources[ms_name];

        // the internal storage mechanism requires features
        //  returned from the query be stored in 4326 and then
        //  reprojected on render.
        let query_projection = projection;
        if(map_source.wgs84Hack) {
            query_projection = new ol.proj.get('EPSG:4326');
        }
        const geojson_format = new ol.format.GeoJSON({
            dataProjection: 'EPSG:4326',
            featureProjection: query_projection
        });

        let view = this.props.mapView;

        let ol_layer = this.olLayers[ms_name];
        if(!ol_layer) {
            ol_layer = this.createLayer(map_source);
        }

        // get the src
        let src = ol_layer.getSource();

        // map the functions from OpenLayers to the internal
        //  types
        let filter_mapping = {
            'like': ol.format.filter.like,
            'ilike': function(name, value) {
                return ol.format.filter.like(name, value, '*', '.', '!', false);
            },
            'eq': ol.format.filter.equalTo,
            'ge': ol.format.filter.greaterThanOrEqualTo,
            'gt': ol.format.filter.greaterThan,
            'le': ol.format.filter.lessThanOrEqualTo,
            'lt': ol.format.filter.lessThan
        };

        let filters = [];
        if(query.selection && query.selection.geometry) {
            // convert the geojson geometry into a ol geometry.
            let ol_geom = (new ol.format.GeoJSON()).readGeometry(query.selection.geometry);
            // convert the geometry to the query projection
            ol_geom.transform(projection, query_projection);
            // add the intersection filter to the filter stack.
            filters.push(ol.format.filter.intersects(geom_field, ol_geom));
        }

        for(let filter of query.fields) {
            // TODO: Catch "filter.type" and use internal conversion
            //       functions for specialty filters.
            filters.push(filter_mapping[filter.comparitor](filter.name, filter.value));
        }

        // when multiple filters are set then they need to be
        //  chained together to create the compound filter.
        let chained_filters = null;
        if(filters.length > 1) {
            chained_filters = ol.format.filter.and(filters[0], filters[1]);
            for(let i = 2, ii = filters.length; i < ii; i++) {
                chained_filters = ol.format.filter.and(chained_filters, filters[i]);
            }
        } else {
            chained_filters = filters[0];
        }

        // the OL formatter requires that the typename and the schema be
        //  broken apart in order to properly format the request.
        // TODO: If this gets used elsewhere, push to a util function.
        let type_parts = layer_name.split(':');

        // TinyOWS and GeoServer support GeoJSON, but MapServer
        //  only supports GML.
        let output_format = 'text/xml; subtype=gml/2.1.2';

        let feature_request = new ol.format.WFS().writeGetFeature({
            srsName: query_projection.getCode(),
            featurePrefix: type_parts[0],
            featureTypes: [type_parts[1]],
            outputFormat: output_format,
            filter: chained_filters
        });

        let wfs_query_xml = new XMLSerializer().serializeToString(feature_request);

        // Ensure all the extra URL params are attached to the
        //  layer.
        let wfs_url = map_source.urls[0] + '?' + util.formatUrlParameters(map_source.params);;

        const map = this.map;

        Request({
            url: wfs_url,
            method: 'post',
            contentType: 'text/xml',
            data: wfs_query_xml,
            success: (response) => {
                // not all WMS services play nice and will return the
                //  error message as a 200, so this still needs checked.
                if(response) {
                    let gml_format = new ol.format.GML2();

                    let features = gml_format.readFeatures(response);
                    for(const feature of features) {
                        feature.setGeometry(feature.getGeometry().transform(query_projection, projection));
                    }
                    let js_features = (new ol.format.GeoJSON()).writeFeaturesObject(features).features;

                    this.props.store.dispatch(
                        mapActions.resultsForQuery(queryId, queryLayer, false, js_features)
                    );
                }
            },
            error: () => {
                // dispatch a message that the query has failed.
                this.props.store.dispatch(
                    // true for 'failed', empty array to prevent looping side-effects.
                    mapActions.resultsForQuery(queryId, queryLayer, true, [])
                );
            },
            complete: () => {
                this.checkQueryForCompleteness(queryId, queryLayer);
            }
        });

    }

    /** Execute a query
     *
     *  @param query
     *
     */
    runQuery(queries, queryId) {
        let query = queries[queryId];

        for(let query_layer of query.layers) {
            // get the map source
            let ms_name = util.getMapSourceName(query_layer);
            let map_source = this.props.mapSources[ms_name];

            if(map_source.type === 'wms') {
                this.wmsGetFeatureInfoQuery(queryId, query.selection, query_layer);
            } else if(map_source.type === 'wfs') {
                // Query the WFS layer.
                this.wfsGetFeatureQuery(queryId, query, query_layer);
            }
        }
    }

    /** iterates through the queries and executes
     *  any query with a 'progress=new' state.
     *
     *  @param Queries Array of query ids.
     */
    checkQueries(queries) {
        for(let query_id in queries) {
            let query = queries[query_id];
            if(query && query.progress === 'new' && query.layers.length > 0) {
                // issue a 'started' modification so the query is
                //  not run twice.
                this.props.dispatch(mapActions.startQuery(query_id));
                // run the query.
                this.runQuery(queries, query_id);
            }
        }
    }

    sortOlLayers() {
        let layers = [];
        for(let ms_name in this.olLayers) {
            layers.push(this.olLayers[ms_name]);
        }

        layers.sort((a, b) => {
            return (a.zIndex < b.zIndex) ? -1 : 1;
        });

        layers.push(this.selectionLayer);

        let map_layers = this.map.getLayers();

        for(let i = 0, ii = layers.length; i < ii; i++) {
            map_layers.setAt(i, layers[i]);
        }
    }

    /** Remove an interval to prevent a layer from being repeatedly
     *  refreshed.
     *
     *  @param {String} msName The name of the map-source with refresh enabled.
     *
     */
    removeRefreshInterval(msName) {
        if(this.intervals[msName]) {
            clearInterval(this.intervals[msName]);
            delete this.intervals[msName];
        }
    }

    /** Forces a layer to refresh.
     *
     */
    refreshLayer(mapSource) {
        switch(mapSource.type) {
            case 'wms':
                let wms_src = this.olLayers[mapSource.name].getSource();
                let params = wms_src.getParams();
                // ".ck" = "cache killer"
                params['.ck'] = (new Date()).getMilliseconds();
                wms_src.updateParams(params);
                console.log('refreshed wms layer', mapSource.name);
                // this.olLayers[mapSource.name].getSource().refresh();
                break;
            default:
                // do nothing
        }
    }

    /** Create an interval that will refresh the layer's contents.
     *
     */
    createRefreshInterval(mapSource) {
        // prevent the creation of a pile of intervals
        if(!this.intervals.hasOwnProperty(mapSource.name)) {
            // refresh is stored in seconds, multiplying by 1000
            //  converts ito the milliseconds expected by setInterval.
            this.intervals[mapSource.name] = setInterval(() => {
                console.log('REFRESH', mapSource.name);
                this.refreshLayer(mapSource);
            }, mapSource.refresh * 1000);
        }
    }

    /** Refresh the map-sources in the map
     *
     */
    refreshMapSources() {
        // get the list of current active map-sources
        let active_map_sources = mapSourceActions.getActiveMapSources(this.props.store);

        // annoying O(n^2) iteration to see if the mapsource needs
        //  to be turned off.
        for(let ms_name in this.olLayers) {
            // if the ms_name is not active, turn the entire source off.
            if(active_map_sources.indexOf(ms_name) < 0) {
                this.olLayers[ms_name].setVisible(false);
                this.removeRefreshInterval(ms_name);
            }
        }

        // for each one of the active mapsources,
        //  determine if the olSource already exists, if not
        //   create it, if it does, turn it back on.
        for(let ms_name of active_map_sources) {
            let map_source = this.props.mapSources[ms_name];
            if(!this.olLayers[ms_name]) {
                // create the OL layer
                this.olLayers[ms_name] = this.createLayer(map_source);
                this.map.addLayer(this.olLayers[ms_name]);
            } else {
                this.updateSource(ms_name);
                this.olLayers[ms_name].setVisible(true);
            }
            this.olLayers[ms_name].setZIndex(map_source.zIndex);

            // if there is a refresh interval set then
            //  create an interval which refreshes the
            //  layer.
            if(map_source.refresh !== null) {
                // here's hoping this is an integer,
                //  thanks Javascript!
                this.createRefreshInterval(map_source);
            } else if(map_source.refresh === null && this.intervals[ms_name]) {
                this.removeRefreshInterval(ms_name);
            }

        }

        // this.sortOlLayers();
    }

    /** Create a selection layer for temporary selection features.
     *
     */
    configureSelectionLayer() {
        let src_selection = new ol.source.Vector();

        this.selectionLayer = new ol.layer.Vector({
            style: olMapboxStyle.getStyleFunction({
                'version': 8,
                'layers': [
                    {
                        'id': 'dummy',
                        'source': 'dummy-source',
                        'paint': {
                            'fill-color': '#ff0000',
                            'line-color': '#00ff00',
                            'circle-radius': 4,
                            'circle-color': '#ff00ff',
                            'circle-stroke-color': '#ff0000'
                        }
                    }
                ],
                'dummy-source': [
                    {
                        'type': 'vector'
                    }
                ]
            }, 'dummy-source'),
            source: src_selection
        });

        // geojson -- the one true Javascript object representation.
        src_selection.on('addfeature', (evt) => {
            let geojson = new ol.format.GeoJSON();
            let json_feature = geojson.writeFeatureObject(evt.feature);
            // assign the feature a UUID.
            json_feature.properties = {id: uuid.v4()};
            this.props.store.dispatch(mapActions.addSelectionFeature(json_feature));
        });
    }

    /** This is called after the first render.
     *  As state changes will not actually change the DOM according to
     *  React, this will establish the map.
     */
    componentDidMount() {
        // create the selection layer.
        this.configureSelectionLayer();

        const view_params = {};

        if(this.props.center) {
            view_params.center = this.props.center

            // check for a z-settings.
            if(this.props.zoom) {
                view_params.zoom = this.props.zoom;
            } else if(this.props.resolution) {
                view_params.resolution = this.props.resolution;
            }
        } else {
            view_params.center = this.props.mapView.center;
            if(this.props.mapView.zoom) {
                view_params.zoom = this.props.mapView.zoom;
            } else {
                view_params.resolution = this.props.mapView.resolution;
            }
        }

        // initialize the map.
        this.map = new ol.Map({
            target: this.mapId,
            layers: [this.selectionLayer],
            logo: false,
            view: new ol.View(view_params)
        });

        // when the map moves, dispatch an action
        this.map.on('moveend', () => {
            // get the view of the map
            let view = this.map.getView();
            // create a "mapAction" and dispatch it.
            // this.props.store.dispatch(mapActions.move(view.getCenter(), view.getResolution()));
            this.props.store.dispatch(mapActions.setView({
                center: view.getCenter(),
                resolution: view.getResolution(),
                zoom: view.getZoom()
            }));
        });

        // and when the cursor moves, dispatch an action
        //  there as well.
        this.map.on('pointermove', (event) => {
            var action = mapActions.cursor(event.coordinate);
            this.props.store.dispatch(action);

            if(this.sketchFeature) {
                // convert the sketch feature's geometry to JSON and kick it out
                // to the store.
                const json_geom = util.geomToJson(this.sketchFeature.getGeometry());
                this.props.store.dispatch(mapActions.updateSketchGeometry(json_geom));
            }
        });

        // call back for when the map has finished rendering.
        if(this.props.mapRenderedCallback) {
            this.map.on('postrender', this.props.mapRenderedCallback);
        }

        // once the map is created, kick off the initial startup.
        this.refreshMapSources();
    }

    /** Switch the drawing tool.
     *
     *  @param type The type of drawing tool (Point,LineString,Polygon)
     *  @param path The layer on which to mark.  null = "selection", the ephemeral layer.
     *  @param oneAtATime {Boolean} When true, only one feature will be allowed to be drawn
     *                              at a time.
     *
     */
    activateDrawTool(type, path, oneAtATime) {
        const is_selection = (path === null);
        const map_source_name = util.getMapSourceName(path);
        const layer_name = util.getLayerName(path);

        // normalize the input.
        if(typeof(type) === 'undefined') {
            type = null;
        }

        // when path is null, use the selection layer,
        //  else use the specified source.
        let source = this.selectionLayer.getSource();
        if(!is_selection) {
            console.log('MAP SOURCE', map_source_name);
            source = this.olLayers[map_source_name].getSource();
        }

        // stop the 'last' drawing tool.
        this.stopDrawing();

        // make sure the type is set.
        this.currentInteraction = type;
        this.activeSource = this.props.mapView.activeSource;

        // "null" interaction mean no more drawing.
        if(type !== null) {
            // switch to the new drawing tool.
            if(type === 'Select') {
                this.drawTool = new ol.interaction.Select({
                    layers: [this.olLayers[map_source_name]]
                });

                this.drawTool.on('select', (evt) => {
                    const selection_src = this.selectionLayer.getSource();
                    // clear out previously selected objects.
                    selection_src.clear();
                    // add the selected feature.
                    if(evt.selected.length > 0) {
                        selection_src.addFeature(evt.selected[0]);
                    }
                });
            } else {
                this.drawTool = new ol.interaction.Draw({
                    source: source,
                    type
                });

                if(oneAtATime === true && type !== 'MultiPoint') {
                    this.drawTool.on('drawstart', (evt) => {
                        // clear out the other features on the source.
                        source.clear();

                        this.sketchFeature = evt.feature;
                    });
                } else {
                    this.drawTool.on('drawstart', (evt) => {
                        this.sketchFeature = evt.feature;
                    });
                }

                if(!is_selection) {
                    this.drawTool.on('drawend', (evt) => {
                        let geojson = new ol.format.GeoJSON();
                        let json_feature = geojson.writeFeatureObject(evt.feature);
                        // assign the feature a UUID.
                        json_feature.properties = {_id: uuid.v4()};

                        this.props.store.dispatch(mapSourceActions.addFeatures(
                                                     map_source_name, layer_name, [json_feature]));

                        // drawing is finished, no longer sketching.
                        this.sketchFeature = null;
                        this.props.store.dispatch(mapActions.updateSketchGeometry(null));
                    });
                } else {
                    this.drawTool.on('drawend', (evt) => {
                        // drawing is finished, no longer sketching.
                        this.sketchFeature = null;
                        this.props.store.dispatch(mapActions.updateSketchGeometry(null));
                    });
                }
            }

            this.map.addInteraction(this.drawTool);
        }

    }

    /** Clear out any current draw tools.
     *
     */
    stopDrawing() {
        // only remove the draw tool if it exists.
        if(this.drawTool) {
            // off the map
            this.map.removeInteraction(this.drawTool);
            // null out for logic.
            this.drawTool = null;
        }
    }

    /** This is a hack for OpenLayers. It makes sure the map is
     *   properly sized under various conditions.
     *
     * @returns Boolean. True when the map sucessfully sized, false otherwise.
     */
    updateMapSize() {
        if(this.map) {
            this.map.updateSize();

            let map_div = document.getElementById(this.mapId);
            let canvas = map_div.getElementsByTagName('canvas');
            if(canvas[0] && canvas[0].style.display !== 'none') {
                return true;
            }
        }
        return false;
    }

    /** Intercept extent changes during a part of the render
     *  cycle where the state can get modified.
     */
    componentWillUpdate(nextProps, nextState) {
        if(nextProps && nextProps.mapView.extent) {
            let bbox = nextProps.mapView.extent.bbox;
            const bbox_code = nextProps.mapView.extent.projection;
            if(bbox_code) {
                const map_proj = this.map.getView().getProjection();
                bbox = ol.proj.transformExtent(bbox, ol.proj.get(bbox_code), map_proj);
            }
            // move the map to the new extent.
            this.map.getView().fit(bbox, this.map.getSize());
        }

        // check to see if the view has been altered.
        if(nextProps && nextProps.mapView) {
            const map_view = this.map.getView();
            const view = nextProps.mapView;

            const center = map_view.getCenter();
            const resolution = map_view.getResolution();

            if(center[0] !== view.center[0] || center[1] !== view.center[1]
                || resolution !== view.resolution) {

                this.map.getView().setCenter(view.center);
                this.map.getView().setResolution(view.resolution);
            }
        }

        // ensure that the selection features have been 'cleared'
        //  appropriately.
        if(nextProps && nextProps.mapView.selectionFeatures.length === 0) {
            if(this.selectionLayer) {
                this.selectionLayer.getSource().clear();
            }
        }

        // see if any queries need their results populated.
        this.checkQueries(nextProps.queries);
    }

    render() {
        // ensure the map is defined and ready.
        if(this.map) {
            // refresh all the map sources, as approriate.
            this.refreshMapSources();

            if(this.props.mapView.interactionType !== this.currentInteraction
               || this.props.mapView.activeSource !== this.activeSource) {
                // console.log('Change to ', nextState.mapView.interaction, ' interaction.');
                // "null" refers to the selection layer, "true" means only one feature
                //   at a time.
                let is_selection = (this.props.mapView.activeSource === null);
                this.activateDrawTool(this.props.mapView.interactionType,
                                      this.props.mapView.activeSource, is_selection);
            }

            // update the map size when data changes
            setTimeout(this.updateMapSize, 250);
        }

        // IE has some DOM sizing/display issues on startup
        //  when we're using react. This ensures the map is
        //  drawn correctly on startup.
        let update_map_size = this.updateMapSize;
        if(!update_map_size()) {
            let startup_interval = setInterval(function() {
                if(update_map_size()) {
                    clearInterval(startup_interval);
                }
            }, 250);
        }

        return (
            <div className="map" id={this.mapId}>
            </div>
        )
    }
}

const mapToProps = function(store) {
    return {
        mapSources: store.mapSources,
        mapView: store.map,
        queries: store.query
    }
}

export default connect(mapToProps)(Map);



export function getLegend(mapSource, mapView, layerName) {
    // see if the layer has a fixed legend.
    for(const layer of mapSource.layers) {
        if(layer.name === layerName && layer.legend !== null) {
            // translate from the store represenation to
            // what's used to render the legend.
            if(layer.legend.type === 'html') {
                return {
                    type: 'html', html: layer.legend.contents
                }
            } else if(layer.legend.type === 'img') {
                return {
                    type: 'img', images: [layer.legend.contents]
                }
            } else if(layer.legend.type === 'nolegend') {
                return {
                    type: 'nolegend'
                }
            }
        }
    }

    // if the mapSource type supports legends, fetch them,
    // otherwise return 'nolegend'.
    switch(mapSource.type) {
        case 'wms' :
            return wmsLayer.getLegend(mapSource, mapView, layerName);
        default:
            return {
                type: 'nolegend'
            };
    }
}


