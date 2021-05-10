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
import ReactResizeDetector from 'react-resize-detector';
import { withTranslation } from 'react-i18next';

import uuid from 'uuid';
import md5 from 'md5/md5';

import * as mapSourceActions from '../../actions/mapSource';
import * as mapActions from '../../actions/map';
import {removeFeature, setEditFeature} from '../../actions/edit';

import * as util from '../../util';
import * as jsts from '../../jsts';

import GeoJSONFormat from 'ol/format/GeoJSON';
import EsriJSONFormat from 'ol/format/EsriJSON';
import GML2Format from 'ol/format/GML2';
import WMSGetFeatureInfoFormat from 'ol/format/WMSGetFeatureInfo';

import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import * as proj from 'ol/proj';

import olScaleLine from 'ol/control/ScaleLine';

import olView from 'ol/View';
import olMap from 'ol/Map';
import * as olXml from 'ol/xml';

import olCollection from 'ol/Collection';
import olSelectInteraction from 'ol/interaction/Select';
import olDrawInteraction, {createBox} from 'ol/interaction/Draw';
import olModifyInteraction from 'ol/interaction/Modify';
import * as olEventConditions from 'ol/events/condition';

import olRotateControl from 'ol/control/Rotate';


/* Import the various layer types */
import * as wmsLayer from './layers/wms';
import * as xyzLayer from './layers/xyz';
import * as agsLayer from './layers/ags';
import * as vectorLayer from './layers/vector';
import * as bingLayer from './layers/bing';
import * as usngLayer from './layers/usng';

import { buildWfsQuery, wfsGetFeatures} from './layers/wfs';
import {EDIT_LAYER_NAME} from '../../defaults';

import EditorModal from '../editor';
import RemoveModal from '../editor/remove-modal';
import AttributionDisplay from './attribution-display';
import JumpToZoom from './jump-to-zoom';

import ContextControls from './context-controls';

function getControls(mapConfig) {
    const controls = [];
    if (mapConfig.allowRotate !== false) {
        controls.push(new olRotateControl());
    }
    const scaleLineConf = Object.assign({enabled: false, units: 'metric'}, mapConfig.scaleLine);
    if (scaleLineConf.enabled !== false) {
        controls.push(new olScaleLine({units: scaleLineConf.units}));
    }
    return controls;
}

const GEOJSON_FORMAT = new GeoJSONFormat();


class Map extends React.Component {

    constructor() {
        super();

        // hash of mapsources
        this.olLayers = { };

        // the current 'active' interaction
        this.currentInteraction = null;

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
                vectorLayer.updateLayer(
                    this.map,
                    ol_layer,
                    map_source,
                    this.props.mapView.interactionType
                );
                break;
            case 'bing':
                bingLayer.updateLayer(this.map, ol_layer, map_source);
                break;
            case 'usng':
                usngLayer.updateLayer(this.map, ol_layer, map_source);
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
            case 'usng':
                return usngLayer.createLayer(mapSource);
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

        const selectionPoints = selection.filter(feature =>
            feature.geometry && feature.geometry.type === 'Point');

        // check that we have a geometry, if not fail.
        if (selectionPoints.length === 0) {
            // set the failure
            fail_layer('No valid selection geometry.');
            // leave the function.
            return;
        }

        const coords = selectionPoints[0].geometry.coordinates;
        const src = this.olLayers[ms_name].getSource();

        // TODO: Allow the configuration to specify GML vs GeoJSON,
        //       but GeoMoose needs a real feature returned.
        const params = {
            'FEATURE_COUNT': 1000,
            'QUERY_LAYERS': util.getLayerName(queryLayer),
            'INFO_FORMAT': 'application/vnd.ogc.gml'
        };

        const info_url = src.getFeatureInfoUrl(coords, view.resolution, map_projection.getCode(), params);
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
                    const js_features = GEOJSON_FORMAT.writeFeaturesObject(features).features;

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
            if (query.runOptions && query.runOptions.zoomToResults) {
                this.props.zoomToResults(query);
            }
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
        const wfs_url = map_source.urls[0] + '?' + util.formatUrlParameters(map_source.params);

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
                            // be ready with some json.
                            const json_format = new GeoJSONFormat();

                            // create the features array.
                            for(const feature of features) {
                                // feature to JSON.
                                const js_feature = json_format.writeFeatureObject(feature);
                                // ensure that every feature has a "boundedBy" attribute.
                                js_feature.properties.boundedBy = feature.getGeometry().getExtent();
                                // add it to the stack.
                                js_features.push(js_feature);
                            }
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
                return name + ' like \'' + fix_like(value) + '\'';
            },
            'ilike': function(name, value) {
                return 'upper(' + name + ') like upper(\'' + fix_like(value) + '\')';
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
        const query_params = {
            f: 'json',
            returnGeometry: 'true',
            spatialReference: JSON.stringify({
                wkid: 102100
            }),
            inSR: 102100, outSR: 102100,
            outFields: '*',
        };

        if (query.selection.length > 0) {
            const queryGeometry = query.selection[0].geometry;
            // Since AGS servers don't "intersect" a point with anything, we make a box
            // Make a 4 pixel (2 pixels each way) box around the point
            if (queryGeometry.type === 'Point'){
                const res = this.map.getView().getResolution() * 2;
                const pt = queryGeometry.coordinates;
                queryGeometry.type = 'Polygon'
                queryGeometry.coordinates = [[
                    [pt[0] + res, pt[1] + res],
                    [pt[0] + res, pt[1] - res],
                    [pt[0] - res, pt[1] - res],
                    [pt[0] - res, pt[1] + res]
                ]]
            }
            // make this an E**I geometry.
            const ol_geom = GEOJSON_FORMAT.readGeometry(queryGeometry);

            // translate the geometry to E**I-ish
            const geom_type_lookup = {
                'Point': 'esriGeometryPoint',
                'MultiPoint': 'esriGeometryMultipoint',
                'LineString': 'esriGeometryPolyline',
                'Polygon': 'esriGeometryPolygon',
            };

            // setup the spatial filter.
            query_params.geometryType = geom_type_lookup[queryGeometry.type];
            query_params.geometry = esri_format.writeGeometry(ol_geom);
            query_params.spatialRel = 'esriSpatialRelIntersects';
            // for lines?:'esriSpatialRelEnvelopeIntersects';
        }

        // build the filter fields.
        const where_statements = [];
        for(const filter of query.fields) {
            where_statements.push(filter_mapping[filter.comparitor](filter.name, filter.value));
        }

        query_params.where = where_statements.join(' and ');

        const params = Object.assign({}, query_params, map_source.params);

        // get the query service url.
        const query_url = map_source.urls[0] + '/query/';
        util.xhr({
            url: query_url,
            method: 'get',
            type: 'jsonp',
            data: params,
            success: (response) => {
                // not all WMS services play nice and will return the
                //  error message as a 200, so this still needs checked.
                if(response) {
                    if (response.error && response.error.code !== 200){
                        console.error(response.error);
                        this.props.store.dispatch(
                            // true for 'failed', empty array to prevent looping side-effects.
                            mapActions.resultsForQuery(queryId, queryLayer, true, [])
                        );
                    } else {
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

        const selection = query.selection[0];
        if(selection && selection.geometry && selection.geometry.type === 'Point') {
            const coords = selection.geometry.coordinates;
            src.forEachFeatureAtCoordinateDirect(coords, (feature) => {
                const jsonFeature = format.writeFeatureObject(feature);
                // the temp drawing feature has features set as null
                if (jsonFeature.properties !== null) {
                    result_features.push(jsonFeature);
                }
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
    }

    /** Add features to the selection layer.
     *
     *  @param inFeatures Current list of features
     *  @param inBuffer   A buffer distance to apply.
     *
     */
    addSelectionFeatures(inFeatures, inBuffer) {
        const features = inFeatures
            .map(feature => GEOJSON_FORMAT.writeFeatureObject(feature));
        const buffer = inBuffer !== 0 && !isNaN(inBuffer) ? inBuffer : 0;

        let bufferedFeature = features;

        if (buffer !== 0) {
            // buffer + union the features
            const wgs84Features = util.projectFeatures(features, 'EPSG:3857', 'EPSG:4326');

            // buffer those features.
            bufferedFeature =
                util.projectFeatures(
                    wgs84Features.map(feature => {
                        const buffered = jsts.bufferFeature(feature, buffer);
                        buffered.properties = {
                            buffer: true,
                        };
                        return buffered;
                    }),
                    'EPSG:4326',
                    'EPSG:3857'
                );
        }

        // the selection feature(s) are the original, as-drawn feature.
        this.props.setSelectionFeatures(features);

        // the feature(s) stored in the selection are what will
        //  be used for querying.
        this.props.setFeatures('selection', bufferedFeature);
    }

    /** Create a selection layer for temporary selection features.
     *
     */
    configureSelectionLayer() {
        const src_selection = new VectorSource();

        this.selectionLayer = new VectorLayer({
            source: src_selection,
        });

        // Fake a GeoMoose style source + layer definition
        //  to bootstrap the style
        vectorLayer.applyStyle(this.selectionLayer, {
            layers: [
                {on: true, style: this.props.selectionStyle},
            ],
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

        if (this.props.config.view) {
            const mixinKeys = ['extent', 'center', 'zoom', 'maxZoom', 'minZoom'];
            mixinKeys.forEach(key => {
                if (this.props.config.view[key]) {
                    view_params[key] = this.props.config.view[key];
                }
            });
        }

        // initialize the map.
        this.map = new olMap({
            target: this.mapDiv,
            layers: [this.selectionLayer, ],
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

        // note the size of the map
        this.props.onMapResize({
            width: this.mapDiv.clientWidth,
            height: this.mapDiv.clientHeight,
        });
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
        const map_source = this.props.mapSources[map_source_name];

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

        // "null" interaction mean no more drawing.
        if(type !== null) {
            // switch to the new drawing tool.
            if(type === 'Select') {
                this.drawTool = new olSelectInteraction({
                    // toggleCondition: olEventConditions.never,
                    toggleCondition: olEventConditions.shiftKeyOnly,
                    layers: [this.olLayers[map_source_name]]
                });

                this.drawTool.on('select', (evt) => {
                    const selectedFeatures = evt.target.getFeatures();
                    this.addSelectionFeatures(selectedFeatures.getArray(), this.props.selectionBuffer);
                });
            } else if (type === 'Modify' || type === 'Edit' || type === 'Remove') {
                let layer = null;
                try {
                    layer = mapSourceActions.getLayerFromPath(this.props.mapSources, path);
                } catch (err) {
                    // swallow the error if the layer can't be found.
                }

                const modifyNext = editFeatures => {
                    // tell other tools where this feature originated.
                    this.props.setEditPath(path);

                    // set the features of the editing layer
                    //  to the selected feature.
                    this.props.setFeatures(
                        EDIT_LAYER_NAME,
                        editFeatures,
                        true
                    );

                    // only show the follow up steps if a feature is selected
                    if (editFeatures && editFeatures.length > 0) {
                        if (type === 'Remove') {
                            this.props.removeFeature(path, editFeatures[0]);
                        } else if (type === 'Edit') {
                            this.props.onEditProperties(editFeatures[0]);
                        } else if (type === 'Modify') {
                            // unset the edit-selection tool
                            this.props.changeTool('_Modify', `${EDIT_LAYER_NAME}/${EDIT_LAYER_NAME}`)
                        }
                    }
                };

                if (['wfs', 'vector', 'geojson'].indexOf(map_source.type) >= 0) {
                    this.drawTool = new olSelectInteraction({
                        layers: [this.olLayers[map_source_name]],
                        style: null,
                    });

                    this.drawTool.on('select', evt => {
                        modifyNext(
                            [GEOJSON_FORMAT.writeFeatureObject(evt.selected[0])]
                        );
                    });
                } else if (layer && layer.queryAs.length > 0) {
                    const editSrc = this.olLayers[EDIT_LAYER_NAME].getSource();

                    this.drawTool = new olDrawInteraction({
                        type: 'Point',
                        source: editSrc,
                    });

                    this.drawTool.on('drawend', evt => {
                        const querySourceName = util.getMapSourceName(layer.queryAs[0]);
                        const querySource = this.props.mapSources[
                            querySourceName
                        ];
                        let queryFeature = util.featureToJson(evt.feature);
                        const mapProjection = this.map.getView().getProjection();

                        // the default pixel tolerance is 10 pixels.
                        let pxTolerance = 10;
                        try {
                            if (querySource.config['pixel-tolerance']) {
                                pxTolerance = parseFloat(querySource.config['pixel-tolerance']);
                            }
                        } catch (err) {
                            // swallow the error
                        }

                        if (pxTolerance > 0) {
                            // buffer point is in pixels,
                            //  this converts pixels to ground units
                            const width = pxTolerance *
                                this.props.mapView.resolution;

                            queryFeature = util.getSquareBuffer(
                                queryFeature.geometry.coordinates,
                                width
                            );
                        }

                        editSrc.clear();

                        wfsGetFeatures(
                            {
                                selection: [queryFeature],
                                fields: [],
                            },
                            querySource,
                            mapProjection
                        )
                            .then(features => {
                                modifyNext(features);
                            });
                    });
                }
            } else if(type === '_Modify') {
                const features = source.getFeatures();
                this.drawTool = new olModifyInteraction({
                    features: new olCollection(features),
                });
            } else {
                const editSrc = this.olLayers[EDIT_LAYER_NAME].getSource();
                const drawOptions = {
                    // source: editSrc,
                    // collection: [],
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
                        const newFeature = GEOJSON_FORMAT.writeFeatureObject(evt.feature);
                        editSrc.clear();

                        const layer = mapSourceActions.getLayerFromPath(this.props.mapSources, path);

                        let querySource = map_source;
                        if (layer.queryAs && layer.queryAs.length > 0) {
                            const querySourceName = util.getMapSourceName(layer.queryAs[0]);
                            querySource = this.props.mapSources[
                                querySourceName
                            ];
                        }

                        if (util.parseBoolean(querySource.config['edit-attributes-on-add'], true)) {
                            this.props.setEditPath(path);
                            this.props.onEditProperties(newFeature, true);
                        } else {
                            this.props.saveFeature(path, newFeature);
                        }

                        // drawing is finished, no longer sketching.
                        this.sketchFeature = null;
                        this.props.store.dispatch(mapActions.updateSketchGeometry(null));
                    });
                } else {
                    this.drawTool.on('drawend', (evt) => {
                        // drawing is finished, no longer sketching.
                        this.sketchFeature = null;
                        this.props.store.dispatch(mapActions.updateSketchGeometry(null));

                        let nextFeatures = [evt.feature];
                        if (type === 'MultiPoint') {
                            nextFeatures = this.selectionLayer.getSource().getFeatures();
                            nextFeatures.push(evt.feature);
                        }

                        this.addSelectionFeatures(nextFeatures, this.props.selectionBuffer);
                    });
                }
            }

            if (this.drawTool) {
                this.map.addInteraction(this.drawTool);
            }
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
    }

    /** This is a hack for OpenLayers. It makes sure the map is
     *   properly sized under various conditions.
     *
     * @returns Boolean. True when the map sucessfully sized, false otherwise.
     */
    updateMapSize(width, height) {
        if(this.map && this.mapDiv) {
            this.map.updateSize();

            // this is a hint for other components to calculate
            //  things based on the map size.
            // this.props.onMapResize({width, height});

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

            // ensure zoom is defined.
            if (view.zoom && map_view.getZoom() !== view.zoom) {
                this.map.getView().setZoom(view.zoom);
            }
        }

        // handle out of loop buffer distance changes
        if (this.selectionLayer) {
            if (this.props.selectionBuffer !== prevProps.selectionBuffer) {
                const features = this.props.selectionFeatures
                    .map(feature => GEOJSON_FORMAT.readFeature(feature));
                if (features.length > 0) {
                    this.addSelectionFeatures(features, this.props.selectionBuffer);
                }
            }
            if (this.props.selectionFeatures !== prevProps.selectionFeatures) {
                const src = this.selectionLayer.getSource();
                src.clear();
                this.props.selectionFeatures
                    .forEach(feature => {
                        src.addFeature(GEOJSON_FORMAT.readFeature(feature));
                    });
            }
        }

        // see if any queries need their results populated.
        this.checkQueries(this.props.queries);


        // ensure the map is defined and ready.
        if(this.map) {
            // refresh all the map sources, as approriate.
            this.refreshMapSources();
            const interactionType = this.props.mapView.interactionType;

            if (interactionType !== prevProps.mapView.interactionType
               || this.props.mapView.activeSource !== prevProps.mapView.activeSource
               || interactionType !== this.currentInteraction) {
                // "null" refers to the selection layer, "true" means only one feature
                //   at a time.
                const is_selection = (this.props.mapView.activeSource === null);
                this.activateDrawTool(
                    this.props.mapView.interactionType,
                    this.props.mapView.activeSource,
                    is_selection
                );

                // clear out the previous features
                //  if changing the draw tool type.
                const drawTypes = ['Polygon', 'LineString', 'Box', 'Point', 'MultiPoint'];
                if (drawTypes.indexOf(this.props.mapView.interactionType) >= 0) {
                    const typeDict = {
                        'Box': 'Polygon',
                        'MultiPoint': 'Point',
                    };
                    const keepers = this.props.selectionFeatures
                        .filter(feature => (
                            feature.geometry.type === interactionType ||
                            (
                                typeDict[interactionType] !== undefined &&
                                feature.geometry.type === typeDict[interactionType]
                            )
                        ));
                    this.props.setSelectionFeatures(keepers);
                    this.props.setFeatures('selection', keepers);
                }
            }

            // note the size of the map
            this.props.onMapResize({
                width: this.mapDiv.clientWidth,
                height: this.mapDiv.clientHeight,
            });
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

        const config = this.props.config || {};

        const enableZoomJump = config.enableZoomJump === true

        return (
            <div
                className='map'
                ref={(self) => {
                    this.mapDiv = self;
                }}
            >
                <AttributionDisplay store={this.props.store} />
                <ReactResizeDetector handleWidth handleHeight onResize={this.updateMapSize} />

                <EditorModal store={this.props.store} />
                <RemoveModal store={this.props.store} />

                <div className="map-tools">
                    {enableZoomJump && <JumpToZoom store={this.props.store} />}

                    <ContextControls
                        saveFeature={this.props.saveFeature}
                        editPath={this.props.mapView.editPath}
                        olLayers={this.olLayers}
                        setFeatures={this.props.setFeatures}
                        changeTool={this.props.changeTool}
                        interactionType={this.props.mapView.interactionType}
                        activeSource={this.props.mapView.activeSource}
                        setZoom={this.props.setZoom}
                        zoom={this.props.mapView.zoom}
                        showZoom={config.showZoom === true}
                    />
                </div>
            </div>
        )
    }
}

Map.defaultProps = {
    services: {},
    onMapResize: () => {},
};

function mapState(state) {
    return {
        mapSources: state.mapSources,
        mapView: state.map,
        queries: state.query,
        serviceName: state.query.service,
        config: state.config.map || {},
        selectionStyle: state.config.selectionStyle || {},
        // resolve this to meters
        selectionBuffer: util.convertLength(state.map.selectionBuffer, state.map.selectionBufferUnits, 'm'),
        selectionFeatures: state.map.selectionFeatures,
    }
}

function mapDispatch(dispatch) {
    return {
        changeTool: (toolName, opt) => {
            dispatch(mapActions.changeTool(toolName, opt));
        },
        finishQuery: (queryId) => {
            dispatch(mapActions.finishQuery(queryId));
        },
        onEditProperties: (feature, isNew = false) => {
            dispatch(setEditFeature(feature, isNew));
        },
        setSelectionFeatures: (features) => {
            dispatch(mapActions.clearSelectionFeatures());
            features.forEach(feature => {
                dispatch(mapActions.addSelectionFeature(feature));
            });
        },
        setFeatures: (mapSourceName, features, copy = false) => {
            dispatch(mapSourceActions.clearFeatures(mapSourceName));
            dispatch(mapSourceActions.addFeatures(mapSourceName, features, copy));
        },
        zoomToResults: (query) => {
            const extent = util.getExtentForQuery(query.results);
            if (extent) {
                dispatch(mapActions.zoomToExtent(extent));
            }
        },
        setEditPath: path => dispatch(mapActions.setEditPath(path)),
        saveFeature: (path, feature) => {
            dispatch(mapSourceActions.saveFeature(path, feature));
        },
        setZoom: z => dispatch(mapActions.setView({zoom: z})),
        removeFeature: (path, feature) => {
            dispatch(removeFeature(path, feature));
        },
        onMapResize: size => dispatch(mapActions.resize(size)),
    };
}

export default connect(mapState, mapDispatch)(withTranslation()(Map));


export function getLegend(mapSource, mapView, layerName) {
    // see if the layer has a fixed legend.
    for(const layer of mapSource.layers) {
        if(layer.name === layerName && layer.legend !== undefined && layer.legend !== null) {
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
