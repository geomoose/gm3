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

import * as mapSourceActions from '../actions/mapSource';
import * as mapActions from '../actions/map';

import * as util from '../util';

/* Import the various layer types */
import * as wmsLayer from './layers/wms';
import * as xyzLayer from './layers/xyz';
import * as agsLayer from './layers/ags';
import * as vectorLayer from './layers/vector';


class Map extends Component {

    constructor() {
        super();

        // create a new map id for this component
        this.mapId = uuid.v4();

        // hash of mapsources
        this.olLayers = { };

        // the current 'active' interaction
        this.currentInteraction = null;
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
                wmsLayer.updateLayer(ol_layer, map_source);
                break;
            case 'xyz' :
                xyzLayer.updateLayer(ol_layer, map_source);
                break;
            case 'ags' :
                agsLayer.updateLayer(ol_layer, map_source);
                break;
            case 'vector' :
                vectorLayer.updateLayer(ol_layer, map_source);
                break;
            default:
                console.info('Unhandled map-source type: '+map_source.type);
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
                return vectorLayer.createLayer(mapSource);
            default:
                throw ('Unhandled creation of map-source type: '+map_source.type);
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

        if(feature_type == 'Point') {
            let coords = selection.geometry.coordinates;
            let src = this.olLayers[ms_name].getSource();

            // TODO: Allow the configuration to specify GML vs GeoJSON,
            //       but GeoMoose needs a real feature returned.
            let params = {
                'QUERY_LAYERS' : util.getLayerName(queryLayer),
                'INFO_FORMAT' : 'application/vnd.ogc.gml'
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

                        console.log('RESULTS', queryLayer, js_features);

                        this.props.store.dispatch(
                            mapActions.resultsForQuery(queryId, queryLayer, js_features)
                        );
                    }
                },
                failure: () => {
                },
            });
        }
    }

    /** Execute a query
     *
     *  @param query
     *
     */
    runQuery(queries, query_id) {
        let query = queries[query_id];

        for(let query_layer of query.layers) {
            // get the map source
            let ms_name = util.getMapSourceName(query_layer);
            let map_source = this.props.mapSources[ms_name];

            if(map_source.type == 'wms') {
                this.wmsGetFeatureInfoQuery(query_id, query.selection, query_layer);
            } else if(map_source.type == 'wfs') {
                // Query the WFS layer.
            }
        }
    }

    checkQueries(queries) {
        for(let query_id in queries) {
            let query = queries[query_id];
            if(query && query.progress == 'new') {
                // issue a 'started' modification so the query is
                //  not run twice.
                this.props.dispatch(mapActions.startQuery(query_id));
                // run the query.
                this.runQuery(queries, query_id);
            }
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
            }
        }

        // for each one of the active mapsources, 
        //  determine if the olSource already exists, if not
        //   create it, if it does, turn it back on.
        for(let ms_name of active_map_sources) {
            if(!this.olLayers[ms_name]) {
                // a map-source needs to be created.
                let map_source = this.props.mapSources[ms_name];
                this.olLayers[ms_name] = this.createLayer(map_source);
                this.map.addLayer(this.olLayers[ms_name]);
            } else {
                this.updateSource(ms_name);
                this.olLayers[ms_name].setVisible(true);
            }
        }

        // TODO: The layers should get ordered here!
        // this.sortOlLayers();
    }

    /** This is called after the first render.
     *  As state changes will not actually change the DOM according to
     *  React, this will establish the map.
     */
    componentDidMount() {
        // initialize the map.
        this.map = new ol.Map({
            target: this.mapId,
            layers: [],
            view: new ol.View({
                // -10384069.859924,5538318.529767,-10356632.423788,5563580.927174
                //center: [-472202, 7530279],
                center: [ -10370351.141856, 5550949.728470501 ],
                zoom: 12
            })
        });

        // when the map moves, dispatch an action
        this.map.on('moveend', () => {
            // get the view of the map
            let view = this.map.getView();
            // create a "mapAction" and dispatch it.
            this.props.store.dispatch(mapActions.move(view.getCenter(), view.getResolution()));
        });

        // and when the cursor moves, dispatch an action
        //  there as well.
        this.map.on('pointermove', (event) => {
            var action = mapActions.cursor(event.coordinate);
            this.props.store.dispatch(action);
        });

        // once the map is created, kick off the initial startup.
        this.refreshMapSources();
    }

    /** React should never update the component after
     *  the initial render.
     */
    shouldComponentUpdate(nextProps, nextState) {
        // Debugging code for turning layers on and off.
        // let active_map_sources = mapSourceActions.getActiveMapSources(this.props.store);
        // console.log('ACTIVE MAP SOURCES', active_map_sources);
        if(this.nextProps && this.nextProps.interaction != this.currentInteraction) {
            console.log('Change to ', nextState.mapView.interaction, ' interaction.');
        }

        // refresh all the map sources, as approriate.
        this.refreshMapSources();

        // see if any queries need their results populated.
        this.checkQueries(nextProps.queries);

        // prevent any DOM changes that the class
        //  didn't cause.
        return false;
    }
    

    render() {
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
