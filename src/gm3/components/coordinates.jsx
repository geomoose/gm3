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

import React, { Component } from 'react';
import { connect } from 'react-redux';
import USNG from 'usng-tools-js';

class CoordinateDisplay extends Component {

    constructor(props) {
        super(props);
        this.u = new USNG();
    }

    mapXY() {
        const coords = this.props.cursor.coords;
        return coords[0].toFixed(1) + ', ' + coords[1].toFixed(1);
    }

    usng() {
        const coords = this.getLatLonCoords();
        try {
            return this.u.fromLonLat({ lon: coords[0], lat: coords[1] }, 4);
        } catch (e) {
            console.log(e);
            return '--';
        }
    }

    /** Transform the map coordinate in to a lat-lon
     *  set of coordinates.
     */
    getLatLonCoords() {
        // TODO: The projection should be stored in the store,
        //       and defined by the user.
        const map_proj = new ol.proj.get('EPSG:3857');
        const latlon_proj = new ol.proj.get('EPSG:4326');

        // transform the point
        return ol.proj.transform(this.props.cursor.coords, map_proj, latlon_proj);
    }

    /** This formats the lat-lon as a string.
     */
    latLon() {
        let latlon = this.getLatLonCoords();
        return latlon[1].toFixed(3) + ', ' + latlon[0].toFixed(3);
    }

    render() {
        let usng_display = '';
        let latlon_display = '';

        if(this.props.usng) {
            usng_display = (
                <span className="coordinates map-usng">
                    <label>USNG:</label> { this.usng() }
                </span>
            );
        }
        if(this.props.latLon) {
            latlon_display = (
                <span className="coordinates map-lat-lon">
                    <label>Lat,Lon:</label> { this.latLon() }
                </span>
            );
        }

        return (
            <span className="coordinate-display">
                <span className="coordinates map-xy">
                    <label>X,Y:</label> { this.mapXY() }
                </span>
                { usng_display }
                { latlon_display }
            </span>
        );
    }
}

const mapToProps = function(store) {
    return {
        cursor: store.cursor
    }
}

export default connect(mapToProps)(CoordinateDisplay);
