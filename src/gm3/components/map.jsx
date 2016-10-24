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

import { connect } from 'react-redux';

import uuid from 'uuid';

import * as mapSources from '../actions/mapSource';

/* Import the various layer types */
import * as wmsLayer from './layers/wms';


class Map extends Component {

    constructor() {
        super();

        // create a new map id for this component
        this.mapId = uuid.v4();

        // hash of mapsources
        this.olLayers = { };

    }


    /** Update a source's important bits.
     *
     *  @param sourceName The name of the mapsource to update.
     *
     */
    updateSource(sourceName) {
        var map_source = this.props.mapSources[sourceName];
        switch(map_source.type) {
            case 'wms' :
                wmsLayer.updateSource(this.olLayers[sourceName], map_source);
                break;
            default:
                console.info('Unhandled map-source type: '+map_source.type);
        }
    }

    /** Refresh the map-sources in the map
     *
     */
    refreshMapSources() {
        // get the list of current active map-sources
        let active_map_sources = mapSources.getActiveMapSources(this.props.store);

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
                this.olLayers[ms_name] = wmsLayer.createSource(map_source);
                this.map.addLayer(this.olLayers[ms_name]);
            } else {
                this.updateSource(ms_name);
                this.olLayers[ms_name].setVisible(true);
            }
        }

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
                /*
                new ol.layer.Tile({
                    source: new ol.source.XYZ({
                        url: 'http://{a-c}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png'
                    })
                })
                */
            view: new ol.View({
                // -10384069.859924,5538318.529767,-10356632.423788,5563580.927174
                //center: [-472202, 7530279],
                center: [ -10370351.141856, 5550949.728470501 ],
                zoom: 12
            })
        });

        // once the map is created, kick off the initial startup.
        this.refreshMapSources();
    }

    /** React should never update the component after
     *  the initial render.
     */
    shouldComponentUpdate(nextProps, nextState) {
        // Debugging code for turning layers on and off.
        let active_map_sources = mapSources.getActiveMapSources(this.props.store);
        console.log('ACTIVE MAP SOURCES', active_map_sources);

        // refresh all the map sources, as approriate.
        this.refreshMapSources();

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
        mapSources: store.mapSources
    }
}

export default connect(mapToProps)(Map);
