/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-present Dan "Ducky" Little
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

import React from 'react';

import { connect } from 'react-redux';

import uuid from 'uuid';
import md5 from 'md5/md5';

import applyStyleFunction from 'mapbox-to-ol-style';

import * as mapSourceActions from '../actions/mapSource';
import * as mapActions from '../actions/map';

import * as util from '../util';
import * as jsts from '../jsts';

import GeoJSONFormat from 'ol/format/GeoJSON';
import EsriJSONFormat from 'ol/format/EsriJSON';
import GML2Format from 'ol/format/GML2';
import WMSGetFeatureInfoFormat from 'ol/format/WMSGetFeatureInfo';

import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import * as proj from 'ol/proj';

import olControl from 'ol/control/Control';
import olScaleLine from 'ol/control/ScaleLine';

import olView from 'ol/View';
import olMap from 'ol/Map';
import * as olXml from 'ol/xml';

import olCollection from 'ol/Collection';
import olSelectInteraction from 'ol/interaction/Select';
import olDrawInteraction, {createBox} from 'ol/interaction/Draw';
import olModifyInteraction from 'ol/interaction/Modify';
import * as olEventConditions from 'ol/events/condition';

import olZoomControl from 'ol/control/Zoom';
import olRotateControl from 'ol/control/Rotate';


/* Import the various layer types */
import * as wmsLayer from './layers/wms';
import * as xyzLayer from './layers/xyz';
import * as agsLayer from './layers/ags';
import * as vectorLayer from './layers/vector';
import * as bingLayer from './layers/bing';

import { buildWfsQuery } from './layers/wfs';

import AttributionDisplay from './attribution-display';

function getControls(mapConfig) {
    const controls = [];
    if (mapConfig.showZoom !== false) {
        controls.push(new olZoomControl());
    }
    if (mapConfig.allowRotate !== false) {
        controls.push(new olRotateControl());
    }
    const scaleLineConf = Object.assign({enabled: false, units: 'metric'}, mapConfig.scaleLine);
    if (scaleLineConf.enabled !== false) {
        controls.push(new olScaleLine({units: scaleLineConf.units}));
    }
    return controls;
}


class Map extends React.Component {

    constructor() {
        super();

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
        const map_source = this.props.mapSources[sourceName];
        const ol_layer = this.olLayers[sourceName];
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
            case 'ags-vector':
            case 'geojson':
                vectorLayer.updateLayer(this.map, ol_layer, map_source);
                break;
            case 'bing':
                bingLayer.updateLayer(this.map, ol_layer, map_source);
                break;
            default:
                console.info('Unhandled map-source type: ' + map_source.type);
        }
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
            case 'ags-vector':
            case 'geojson':
                return vectorLayer.createLayer(mapSource);
            case 'bing':
                return bingLayer.createLayer(mapSource);
            default:
                throw new Error('Unhandled creation of map-source type: ' + mapSource.type);
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
        const map_projection = this.map.getView().getProjection();

        const geojson = new GeoJSONFormat();
        const view = this.props.mapView;

        // get the map source
        const ms_name = util.getMapSourceName(queryLayer);

        const fail_layer = (message) => {
            // dispatch a message that the query has failed.
            this.props.store.dispatch(
                // true for 'failed', empty array to prevent looping side-effects.
                mapActions.resultsForQuery(queryId, queryLayer, true, [], message)
            );

            // TODO: This delay allows the state tree to refresh before
            //       checking for completeness.
            setTimeout(() => {
                this.checkQueryForCompleteness(queryId, queryLayer);
            }, 200);
        };

        // check that we have a geometry, if not fail.
        if (!selection || !selection.geometry || selection.geometry.type !== 'Point') {
            // set the failure
            fail_layer('No valid selection geometry.');
            // leave the function.
            return;
        }

        const coords = selection.geometry.coordinates;
        const src = this.olLayers[ms_name].getSource();

        // TODO: Allow the configuration to specify GML vs GeoJSON,
        //       but GeoMoose needs a real feature returned.
        const params = {
            'FEATURE_COUNT': 1000,
            'QUERY_LAYERS': util.getLayerName(queryLayer),
            'INFO_FORMAT': 'application/vnd.ogc.gml'
        };

        const info_url = src.getGetFeatureInfoUrl(coords, view.resolution, map_projection.getCode(), params);
        fetch(info_url, {
            headers: {
                'Access-Control-Request-Headers': '*',
            },
        })
            .then(r => r.text())
            .then(responseText => {
                // not all WMS services play nice and will return the
                //  error message as a 200, so this still needs checked.
                if(responseText) {
                    const gml_format = new WMSGetFeatureInfoFormat();
                    const features = gml_format.readFeatures(responseText);
                    const js_features = geojson.writeFeaturesObject(features).features;

                    this.props.store.dispatch(
                        mapActions.resultsForQuery(queryId, queryLayer, false, js_features)
                    );
                } else {
                    fail_layer();
                }
                this.checkQueryForCompleteness(queryId, queryLayer);
            })
            .catch((err, msg) => {
                fail_layer();
                this.checkQueryForCompleteness(queryId, queryLayer);
            });
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
        const query = this.props.queries[queryId];
        let all_completed = true;

        // check to see if there are results for all the layers.
        if(query && query.layers) {
            for(const layer of query.layers) {
                all_completed = all_completed && (query.results[layer] || (layer === completedLayer));
            }
        } else if (query && query.layers.length > 0) {
            all_completed = false;
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
        const map_projection = this.map.getView().getProjection();

        // get the map source
        const ms_name = util.getMapSourceName(queryLayer);
        const map_source = this.props.mapSources[ms_name];

        // the internal storage mechanism requires features
        //  returned from the query be stored in 4326 and then
        //  reprojected on render.
        let query_projection = map_projection;
        if(map_source.wgs84Hack) {
            query_projection = new proj.get('EPSG:4326');
        }

        let ol_layer = this.olLayers[ms_name];
        if(!ol_layer) {
            ol_layer = this.createLayer(map_source);
        }

        // check for the output_format based on the params
        let output_format = 'text/xml; subtype=gml/2.1.2';
        if(map_source.params.outputFormat) {
            output_format = map_source.params.outputFormat;
        }

        const wfs_query_xml = buildWfsQuery(query, map_source, map_projection, output_format);

        // Ensure all the extra URL params are attached to the
        //  layer.
        const wfs_url = map_source.urls[0] + '?' + util.formatUrlParameters(map_source.params);;

        const is_json_like = (output_format.toLowerCase().indexOf('json') > 0);

        fetch(wfs_url, {
            method: 'POST',
            body: wfs_query_xml,
            headers: {
                'Access-Control-Request-Headers': '*',
            },
        })
            .then(r => r.text())
            .then(response => {
                if(response) {
                    // check for a WFS error message
                    if(response.search(/(ows|wfs):exception/i) >= 0) {
                        // parse the document.
                        const wfs_doc = olXml.parse(response);
                        const tags = ['ows:ExceptionText', 'wfs:ExceptionText'];
                        let error_text = '';
                        for(let t = 0, tt = tags.length; t < tt; t++) {
                            const nodes = wfs_doc.getElementsByTagName(tags[t]);
                            for(let n = 0, nn = nodes.length; n < nn; n++) {
                                error_text += olXml.getAllTextContent(nodes[n]) + '\n';
                            }
                        }
                        // ensure that the console variable exists
                        if(typeof console !== undefined) {
                            console.error(error_text);
                        }

                        // dispatch an error status.
                        this.props.store.dispatch(
                            mapActions.resultsForQuery(queryId, queryLayer, true, [], error_text)
                        );
                    } else {
                        // place holder for features to be added.
                        let js_features = [];
                        if(is_json_like) {
                            js_features = JSON.parse(response).features;
                        } else {
                            const gml_format = new GML2Format();
                            const features = gml_format.readFeatures(response, {
                                featureProjection: map_projection,
                                dataProjection: query_projection
                            });
                            js_features = (new GeoJSONFormat()).writeFeaturesObject(features).features;
                        }


                        // apply the transforms
                        js_features = util.transformFeatures(map_source.transforms, js_features);

                        this.props.store.dispatch(
                            mapActions.resultsForQuery(queryId, queryLayer, false, js_features)
                        );
                    }
                }
                this.checkQueryForCompleteness(queryId, queryLayer);
            })
            .catch(() => {
                // dispatch a message that the query has failed.
                this.props.store.dispatch(
                    // true for 'failed', empty array to prevent looping side-effects.
                    mapActions.resultsForQuery(queryId, queryLayer, true, [], 'Server error. Check network logs.')
                );
                this.checkQueryForCompleteness(queryId, queryLayer);
            });
    }


    /** Create a FeatureService formatted query and send it
     *
     *  @param queryId
     *  @param query
     *
     */
    agsFeatureQuery(queryId, query, queryLayer) {
        // get the map source
        const ms_name = util.getMapSourceName(queryLayer);
        const layer_name = util.getLayerName(queryLayer);

        const map_source = this.props.mapSources[ms_name];

        // if the openlayers layer is not on, this fakes
        //  one for use in the query.
        let ol_layer = this.olLayers[ms_name];
        if(!ol_layer) {
            ol_layer = this.createLayer(map_source);
        }

        const fix_like = function(value) {
            const new_value = value.replace('*', '%');
            return new_value;
        };

        const simple_op = function(op, name, value) {
            if(typeof(value) === 'number') {
                return name + ' ' + op + ' ' + value;
            } else {
                return `${name} ${op} '${value}'`;
            }
        };

        // map the functions from OpenLayers to the internal
        //  types
        const filter_mapping = {
            'like': function(name, value) {
                return name + ' like ' + fix_like(value);
            },
            'ilike': function(name, value) {
                return name + ' like upper(' + fix_like + ')'
            },
            'eq': function(name, value) {
                return simple_op('=', name, value);
            },
            'ge': function(name, value) {
                return simple_op('>=', name, value);
            },
            'gt': function(name, value) {
                return simple_op('>', name, value);
            },
            'le': function(name, value) {
                return simple_op('<=', name, value);
            },
            'lt': function(name, value) {
                return simple_op('<', name, value);
            },
        };

        // setup the necessary format converters.
        const esri_format = new EsriJSONFormat();
        const geojson_format = new GeoJSONFormat();

        const query_params = {
            f: 'json',
            returnGeometry: 'true',
            spatialReference: JSON.stringify({
                wkid: 102100
            }),
            inSR: 102100, outSR: 102100,
            outFields: '*',
        };

        if(query.selection && query.selection.geometry) {
            // make this an E**I geometry.
            const ol_geom = geojson_format.readGeometry(query.selection.geometry);

            // translate the geometry to E**I-ish
            const geom_type_lookup = {
                'Point': 'esriGeometryPoint',
                'MultiPoint': 'esriGeometryMultipoint',
                'LineString': 'esriGeometryPolyline',
                'Polygon': 'esriGeometryPolygon',
            };

            // setup the spatial filter.
            query_params.geometryType = geom_type_lookup[query.selection.geometry.type];
            query_params.geometry = esri_format.writeGeometry(ol_geom);
            query_params.spatialRel = 'esriSpatialRelIntersects';
        }

        // build the filter fields.
        const where_statements = [];
        for(const filter of query.fields) {
            where_statements.push(filter_mapping[filter.comparitor](filter.name, filter.value));
        }

        const where_str = where_statements.join(' and ');

        query_params.layers = JSON.stringify([{
            layerId: layer_name,
            'where': where_str,
        }]);

        // get the query service url.
        const query_url = map_source.urls[0] + '/query/';
        util.xhr({
            url: query_url,
            method: 'get',
            type: 'jsonp',
            data: query_params,
            success: (response) => {
                // not all WMS services play nice and will return the
                //  error message as a 200, so this still needs checked.
                if(response) {
                    // convert the esri features to OL features.
                    const features = esri_format.readFeatures(response);
                    // be ready with some json.
                    const json_format = new GeoJSONFormat();

                    // create the features array.
                    let js_features = [];
                    for(const feature of features) {
                        // feature to JSON.
                        const js_feature = json_format.writeFeatureObject(feature);
                        // ensure that every feature has a "boundedBy" attribute.
                        js_feature.properties.boundedBy = feature.getGeometry().getExtent();
                        // add it to the stack.
                        js_features.push(js_feature);
                    }

                    // apply the transforms
                    js_features = util.transformFeatures(map_source.transforms, js_features);

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

    /** Run a query in memory.
     *
     */
    vectorLayerQuery(queryId, query, queryLayer) {
        // get the map source
        const ms_name = util.getMapSourceName(queryLayer);

        const map_source = this.props.mapSources[ms_name];

        // if the openlayers layer is not on, this fakes
        //  one for use in the query.
        let ol_layer = this.olLayers[ms_name];
        if(!ol_layer) {
            ol_layer = this.createLayer(map_source);
        }

        // get the src
        const src = ol_layer.getSource();

        const format = new GeoJSONFormat();

        const result_features = [];

        const selection = query.selection;
        if(selection && selection.geometry && selection.geometry.type === 'Point') {
            const coords = selection.geometry.coordinates;
            src.forEachFeatureAtCoordinateDirect(coords, (feature) => {
                result_features.push(format.writeFeatureObject(feature));
            });
        }

        this.props.store.dispatch(
            mapActions.resultsForQuery(queryId, queryLayer, false, result_features)
        );

        this.checkQueryForCompleteness(queryId, queryLayer);
    }


    /** Execute a query
     *
     *  @param query
     *
     */
    runQuery(queries, queryId) {
        const query = queries[queryId];

        if (!query.layers || query.layers.length === 0) {
            // a ha! no layers in the query. consider it done.
            this.props.finishQuery(queryId);
        }

        for(const query_layer of query.layers) {
            // get the map source
            const ms_name = util.getMapSourceName(query_layer);
            const map_source = this.props.mapSources[ms_name];

            // Run the appropriate query function
            //  based on the map-source type
            switch(map_source.type) {
                case 'wms':
                    this.wmsGetFeatureInfoQuery(queryId, query.selection, query_layer);
                    break;
                case 'wfs':
                    this.wfsGetFeatureQuery(queryId, query, query_layer);
                    break;
                case 'ags-vector':
                    this.agsFeatureQuery(queryId, query, query_layer);
                    break;
                case 'geojson':
                case 'vector':
                    this.vectorLayerQuery(queryId, query, query_layer);
                    break;
                default:
                    // pass.
            }
        }
    }

    /** iterates through the queries and executes
     *  any query with a 'progress=new' state.
     *
     *  @param Queries Array of query ids.
     */
    checkQueries(queries) {
        for(const query_id in queries) {
            const query = queries[query_id];
            if(query && query.progress === 'new' && query.layers.length > 0) {
                // issue a 'started' modification so the query is
                //  not run twice.
                this.props.store.dispatch(mapActions.startQuery(query_id));
                // run the query.
                this.runQuery(queries, query_id);
            }
        }

        if(queries.order.length > 0) {
            const query_id = queries.order[0];
            const query = queries[query_id];
            if(query.progress === 'finished') {
                // check the filters
                const filter_json = JSON.stringify(query.filter);
                const filter_md5 = md5(filter_json);

                if(this.currentQueryId !== query_id
                   || this.currentQueryFilter !== filter_md5) {

                    this.renderQueryLayer(query);
                    this.currentQueryId = query_id;
                    this.currentQueryFilter = filter_md5;
                }
            }
        } else {
            // once there are no more queries,
            //  clear the results from the map.
            const results = this.props.mapSources.results;
            if(results && results.features && results.features.length > 0) {
                this.props.store.dispatch(mapSourceActions.clearFeatures('results', 'results'));
            }
        }
    }

    sortOlLayers() {
        const layers = [];
        for(const ms_name in this.olLayers) {
            layers.push(this.olLayers[ms_name]);
        }

        layers.sort((a, b) => {
            return (a.zIndex < b.zIndex) ? -1 : 1;
        });

        layers.push(this.selectionLayer);

        const map_layers = this.map.getLayers();

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
                const wms_src = this.olLayers[mapSource.name].getSource();
                const params = wms_src.getParams();
                // ".ck" = "cache killer"
                params['.ck'] = uuid.v4();
                wms_src.updateParams(params);
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
                this.refreshLayer(mapSource);
            }, mapSource.refresh * 1000);
        }
    }

    /* Render the query as a layer.
     *
     */
    renderQueryLayer(query) {
        if(this.props.mapSources.results) {
            // clear the features
            this.props.store.dispatch(mapSourceActions.clearFeatures('results', 'results'));
            // get the path to the first set of features
            const layer_path = Object.keys(query.results)[0];

            // ensure the layer_path does not have a failure.
            if(query.results[layer_path].failed !== true) {
                // get the features, after applying the query filter
                const features = util.matchFeatures(query.results[layer_path], query.filter);
                // render only those features.
                this.props.store.dispatch(mapSourceActions.addFeatures('results', features));
            }
        } else {
            console.error('No "results" layer has been defined, cannot do smart query rendering.');
        }
    }

    /** Refresh the map-sources in the map
     *
     */
    refreshMapSources() {
        // get the list of current active map-sources
        const print_only = (this.props.printOnly === true);
        const active_map_sources = mapSourceActions.getActiveMapSources(this.props.mapSources, print_only);

        // annoying O(n^2) iteration to see if the mapsource needs
        //  to be turned off.
        for(const ms_name in this.olLayers) {
            // if the ms_name is not active, turn the entire source off.
            if(active_map_sources.indexOf(ms_name) < 0) {
                this.olLayers[ms_name].setVisible(false);
                this.removeRefreshInterval(ms_name);
            }
        }

        // for each one of the active mapsources,
        //  determine if the olSource already exists, if not
        //   create it, if it does, turn it back on.
        for(const ms_name of active_map_sources) {
            const map_source = this.props.mapSources[ms_name];
            if(!this.olLayers[ms_name]) {
                // create the OL layer
                this.olLayers[ms_name] = this.createLayer(map_source);
                this.map.addLayer(this.olLayers[ms_name]);
            } else {
                this.updateSource(ms_name);
                this.olLayers[ms_name].setVisible(true);
            }
            this.olLayers[ms_name].setZIndex(map_source.zIndex);
            this.olLayers[ms_name].setOpacity(map_source.opacity);

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

    /** Add a buffer to the features in the selection set.
     *
     *  @param buffer Buffer distance to apply.
     *
     *  @returns a GeoJSON feature of the union of the above features.
     */
    bufferSelectionFeatures(buffer) {
    }

    /** Add features to the selection layer.
     *
     *  @param feature  An ol.Feature
     *  @param buffer   A buffer distance to apply.
     *
     */
    addSelectionFeature(feature, buffer) {
        const geojson = new GeoJSONFormat();

        let json_feature = geojson.writeFeatureObject(feature);

        if(buffer !== 0 && !isNaN(buffer)) {
            // create an array of the drawn features.
            const selection_src = this.selectionLayer.getSource();
            const drawn_features = selection_src.getFeatures();
            let json_features = [];
            for(let i = 0, ii = drawn_features.length; i < ii; i++) {
                json_features.push(geojson.writeFeatureObject(drawn_features[i]));
            }

            json_features = util.projectFeatures(json_features, 'EPSG:3857', 'EPSG:4326');

            // buffer those features.
            const buffered_geom = jsts.bufferAndUnion(json_features, buffer)

            const buffered_feature = {
                type: 'Feature',
                geometry: buffered_geom,
                properties: {
                    buffer: true
                }
            };

            json_feature = util.projectFeatures([buffered_feature], 'EPSG:4326', 'EPSG:3857')[0];
        }


        // assign the feature a UUID.
        json_feature.properties = Object.assign({
            id: uuid.v4()
        }, json_feature.properties);

        this.props.store.dispatch(mapActions.addSelectionFeature(json_feature));

        this.props.store.dispatch(
            mapSourceActions.clearFeatures('selection')
        );

        this.props.store.dispatch(
            mapSourceActions.addFeatures('selection', [json_feature])
        );

    }

    /** Create a selection layer for temporary selection features.
     *
     */
    configureSelectionLayer() {
        const src_selection = new VectorSource();

        this.selectionLayer = new VectorLayer({
            source: src_selection,
        });

        applyStyleFunction(this.selectionLayer, {
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
        }, 'dummy-source');

        // whenever a feature has been added or changed on the selection layer,
        //  reflect that in the selection.
        const feature_change_fn = (evt) => {
            this.addSelectionFeature(evt.feature, this.props.mapView.selectionBuffer);
        };
        src_selection.on('addfeature', feature_change_fn);
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
        this.map = new olMap({
            target: this.mapDiv,
            layers: [this.selectionLayer],
            logo: false,
            view: new olView(view_params),
            controls: getControls(this.props.config),
        });

        // when the map moves, dispatch an action
        this.map.on('moveend', () => {
            // get the view of the map
            const view = this.map.getView();
            // create a "mapAction" and dispatch it.
            this.props.store.dispatch(mapActions.setView({
                center: view.getCenter(),
                resolution: view.getResolution(),
                zoom: view.getZoom()
            }));
        });

        // and when the cursor moves, dispatch an action
        //  there as well.
        this.map.on('pointermove', (event) => {
            const action = mapActions.cursor(event.coordinate);
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

    /* Add a "stop" tool to the map.
     *
     * @param type The type of drawing tool.
     *
     */
    createStopTool(type) {
        // "translate" a description of the tool
        let tool_desc = {
            Polygon: 'End Drawing',
            LineString: 'End Drawing',
            Point: 'End Drawing',
            Select: 'End Selection',
        }[type];

        // helpful default behaviour for when the description
        //  is not defined.
        if(typeof(tool_desc) === 'undefined') {
            tool_desc = 'End ' + type;
        }

        // yikes this is super not-reacty.
        // But it's necessary to bridge the gap to open layers.
        const button = document.createElement('button');
        button.innerHTML = '<i class="stop tool"></i> ' + tool_desc;
        // when the button is clicked, stop drawing.
        button.onclick = () => {
            this.props.store.dispatch(mapActions.changeTool(null));
        };

        // create a wrapper div that places the button in the map
        const elem = document.createElement('div');
        elem.className = 'stop-tool ol-unselectable ol-control';
        elem.appendChild(button);

        // this creates the actual OL controls and adds it to the map
        this.stopTool = new olControl({
            element: elem
        });
        this.map.addControl(this.stopTool);
    }

    /* Remove the stop tool from the map.
     *
     */
    removeStopTool() {
        if(this.stopTool) {
            // remove it from the map
            this.map.removeControl(this.stopTool);
            // set it to null.
            this.stopTool = null;
        }
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

        // normalize the input.
        if(typeof(type) === 'undefined') {
            type = null;
        }

        // when path is null, use the selection layer,
        //  else use the specified source.
        let source = this.selectionLayer.getSource();
        if(!is_selection) {
            source = this.olLayers[map_source_name].getSource();
        }

        // stop the 'last' drawing tool.
        this.stopDrawing();

        // make sure the type is set.
        this.currentInteraction = type;
        this.activeSource = this.props.mapView.activeSource;

        // "null" interaction mean no more drawing.
        if(type !== null) {
            // add a "stop" button to the map, this provides
            //  clarity to the user as to what interaction is currently active.
            this.createStopTool(type);

            // switch to the new drawing tool.
            if(type === 'Select') {
                this.drawTool = new olSelectInteraction({
                    toggleCondition: olEventConditions.never,
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
            } else if(type === 'Remove') {
                // setup the select tool to allow the user
                //  to pick a feature from the layer.
                this.drawTool = new olSelectInteraction({
                    layers: [this.olLayers[map_source_name]]
                });

                this.drawTool.on('select', (evt) => {
                    // "_uuid" is the internal GeoMoose ID property added to
                    //  all features that go through the state.
                    const id_prop = '_uuid';
                    const fid = evt.selected[0].getProperties()[id_prop];
                    // send the remove feature event to remove it.
                    this.props.store.dispatch(
                        mapSourceActions.removeFeature(map_source_name, fid)
                    );
                    // clear the selected features from the tool.
                    this.drawTool.getFeatures().clear();
                });
            } else if(type === 'Modify') {
                const features = source.getFeatures();
                this.drawTool = new olModifyInteraction({
                    features: new olCollection(features),
                });

                if(is_selection) {
                    this.drawTool.on('modifyend', (evt) => {
                        const features = evt.features.getArray();
                        this.addSelectionFeature(features[0], this.props.mapView.selectionBuffer);
                    });
                } else {
                    this.drawTool.on('modifyend', (evt) => {
                        const id_prop = '_uuid';
                        const features = evt.features.getArray();
                        for(const feature of features) {
                            const geometry = util.geomToJson(feature.getGeometry());
                            const id = feature.getProperties()[id_prop];

                            if(id) {
                                this.props.store.dispatch(
                                    mapSourceActions.modifyFeatureGeometry(map_source_name, id, geometry)
                                );
                            }
                        }
                    });
                }
            } else {
                const drawOptions = {
                    source,
                    type,
                };

                // Draw by box requires some special settings.
                if (type === 'Box') {
                    drawOptions.type = 'Circle';
                    drawOptions.geometryFunction = createBox();
                }
                this.drawTool = new olDrawInteraction(drawOptions);

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
                        const geojson = new GeoJSONFormat();
                        const json_feature = geojson.writeFeatureObject(evt.feature);

                        this.props.store.dispatch(
                            mapSourceActions.addFeatures(map_source_name, [json_feature])
                        );

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

            // and the current interaction
            this.currentInteraction = null;
        }

        // remove the stop tool from the map
        this.removeStopTool();
    }

    /** This is a hack for OpenLayers. It makes sure the map is
     *   properly sized under various conditions.
     *
     * @returns Boolean. True when the map sucessfully sized, false otherwise.
     */
    updateMapSize() {
        if(this.map && this.mapDiv) {
            this.map.updateSize();

            const canvas = this.mapDiv.getElementsByTagName('canvas');
            if(canvas && canvas[0] && canvas[0].style.display !== 'none') {
                return true;
            }
        }
        return false;
    }

    /** Intercept extent changes during a part of the render
     *  cycle where the state can get modified.
     */
    componentDidUpdate(prevProps) {
        // extent takes precendent over the regular map-view,
        if(this.props.mapView.extent) {
            let bbox = this.props.mapView.extent.bbox;
            const bbox_code = this.props.mapView.extent.projection;
            if(bbox_code) {
                const map_proj = this.map.getView().getProjection();
                bbox = proj.transformExtent(bbox, proj.get(bbox_code), map_proj);
            }
            // move the map to the new extent.
            this.map.getView().fit(bbox, {size: this.map.getSize()});

        // check to see if the view has been altered.
        } else if(this.props.mapView) {
            const map_view = this.map.getView();
            const view = this.props.mapView;

            const center = map_view.getCenter();
            const resolution = map_view.getResolution();

            if(center[0] !== view.center[0] || center[1] !== view.center[1]
                || resolution !== view.resolution) {

                this.map.getView().setCenter(view.center);
                this.map.getView().setResolution(view.resolution);
            }

            if(map_view.getZoom() !== view.zoom) {
                this.map.getView().setZoom(view.zoom);
            }
        }

        // ensure that the selection features have been 'cleared'
        //  appropriately.
        if(this.props.mapView.selectionFeatures.length === 0) {
            if(this.selectionLayer) {
                this.selectionLayer.getSource().clear();
            }
        }

        // this will cause the active drawing tool to *stop*
        //  when the service changes.
        if(this.props.queries.service !== null
           && this.props.queries.service !== prevProps.queries.service) {
            this.stopDrawing();
        }

        // handle out of loop buffer distance changes
        if(this.props.mapView.selectionBuffer !== prevProps.mapView.selectionBuffer) {
            if(this.selectionLayer && !isNaN(this.props.mapView.selectionBuffer)) {
                const buffer = this.props.mapView.selectionBuffer;
                const selection_src = this.selectionLayer.getSource();

                for(const feature of selection_src.getFeatures()) {
                    this.addSelectionFeature(feature, buffer);
                }
            }
        }

        // see if any queries need their results populated.
        this.checkQueries(this.props.queries);


        // ensure the map is defined and ready.
        if(this.map) {
            // refresh all the map sources, as approriate.
            this.refreshMapSources();

            if(this.props.mapView.interactionType !== this.currentInteraction
               || this.props.mapView.activeSource !== this.activeSource) {
                // console.log('Change to ', nextState.mapView.interaction, ' interaction.');
                // "null" refers to the selection layer, "true" means only one feature
                //   at a time.
                const is_selection = (this.props.mapView.activeSource === null);
                this.activateDrawTool(
                    this.props.mapView.interactionType,
                    this.props.mapView.activeSource,
                    is_selection
                );
            }
        }
    }

    render() {
        // ensure the map is defined and ready.
        if(this.map) {
            // update the map size when data changes
            setTimeout(this.updateMapSize, 250);
        }

        // IE has some DOM sizing/display issues on startup
        //  when we're using react. This ensures the map is
        //  drawn correctly on startup.
        const update_map_size = this.updateMapSize;
        if(!update_map_size()) {
            const startup_interval = setInterval(function() {
                if(update_map_size()) {
                    clearInterval(startup_interval);
                }
            }, 250);
        }

        return (
            <div
                className='map'
                ref={(self) => {
                    this.mapDiv = self;
                }}
            >
                <AttributionDisplay store={this.props.store} />
            </div>
        )
    }
}

function mapState(state) {
    return {
        mapSources: state.mapSources,
        mapView: state.map,
        queries: state.query,
        config: state.config.map || {},
    }
}

function mapDispatch(dispatch) {
    return {
        finishQuery: (queryId) => {
            dispatch(mapActions.finishQuery(queryId));
        },
    };
}

export default connect(mapState, mapDispatch)(Map);


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
