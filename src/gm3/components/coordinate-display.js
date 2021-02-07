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

import React from 'react';
import USNG from 'usng-tools-js';
import proj4 from 'proj4';

import { addProjDef } from '../util';

import * as proj from 'ol/proj';

/**
 * Ensure the coordinates look pretty before output.
 * TODO: Localize the number formatting.
 *
 * @param {Object} projection - Output projection definition.
 * @param {number[]} coordinates - Coordinates to format.
 *
 * @return {string} Formatted coordinates.
 */
export function formatCoordinates(projection, coords, defaultPrecision = 4) {
    const precision = projection.precision !== undefined ? projection.precision : defaultPrecision;
    return coords.map(x => x.toFixed(precision)).join(', ');
}

/**
 * Convert the zoom level to a number of digits for lat/lon
 * formatting.
 *
 * @param {Number} zoom - The map's zoom level.
 *
 * @returns {Number} the number of digits.
 */
const zoomToPrecision = zoom => {
    if (zoom > 18) {
        return 6;
    } else if (zoom > 9) {
        return 4;
    }
    return 2;
};

/**
 * CoordinateDisplay options
 * - These options can be passed when adding the coordinate display to the app
 *
 * @param {Object[]} projections - an array of projections
 * @param {string} projections[].label - The label appearing next to displayed coordinates
 * @param {string} projections[].ref - an ID referring to the projection being used
 * @param {number} projections[].precision - integer referring to the number of decimal places
 *     to display for this projection
 *
 * Named Projections (do not need to be defined by the user):
 *     - USNG
 *        ref: 'usng'
 *     - XY
 *        ref: 'xy'
 *
 * Predefined Projections
 *     - Lat/Lng
 *        ref: 'EPSG:4326'
 *     - Web Mercator
 *        ref: 'EPSG:3857'
 *
 * Default Projections - displayed when user fails to configure component
 *     - XY, Lat/Lng, USNG
 */
export default class CoordinateDisplay extends React.Component {

    constructor(props) {
        super(props);
        this.u = new USNG();
        this.defaultProjections = [
            {
                label: 'X,Y',
                ref: 'xy'
            },
            {
                label: 'Lat,Lng',
                ref: 'EPSG:4326'
            },
            {
                label: 'USNG',
                ref: 'usng'
            }
        ];
        this.namedProjections = ['xy', 'usng', 'latlon'];
        this.getProjectionCoords = this.getProjectionCoords.bind(this);
        this.getCoordinateDisplay = this.getCoordinateDisplay.bind(this);

        /**
         * Validate specified projections
         *     - Register undefined projections with Proj4 if <projDef> property is specified
         *     - Add special-case projections ('xy', 'usng')
         *     - If not a special case, add if Proj definition exists
         */

        if(this.props.projections) {
            this.projections = [];
            for(const projection of this.props.projections) {
                if(typeof projection.projDef !== 'undefined') {
                    addProjDef(proj4, projection.ref, projection.projDef);
                }
                const isNamedProjection = (this.namedProjections.indexOf(projection.ref) !== -1);
                let isDefinedProjection = false;
                if (!isNamedProjection) {
                    // This is not the cleanest test for definition,
                    // but prevents the error during render.
                    try {
                        proj4(projection.ref, [0, 0]);
                        isDefinedProjection = true;
                    } catch(err) {
                        // swallow the error of the undefined projection.
                        console.error('Undefined projection', err);
                    }
                }
                if(isNamedProjection || isDefinedProjection) {
                    this.projections.push(projection);
                }
            }
        } else {
            this.projections = this.defaultProjections;
        }
    }

    mapXY() {
        const coords = this.props.coords;
        return coords[0].toFixed(1) + ', ' + coords[1].toFixed(1);
    }

    usng() {
        const coords = this.getLatLonCoords();
        try {
            // TODO: This assumes resolution is in meters per pixel
            const resolution = this.props.resolution;
            const digits = Math.max( Math.min( Math.ceil(Math.log10(100000 / resolution)), 5), 0);
            return this.u.fromLonLat({ lon: coords[0], lat: coords[1] }, digits);
        } catch (e) {
            console.error('Bug with USNG coordinate', e);
            return '--';
        }
    }

    /** Transform the map coordinate in to a lat-lon
     *  set of coordinates.
     */
    getLatLonCoords() {
        // TODO: The projection should be stored in the store,
        //       and defined by the user.
        const map_proj = new proj.get('EPSG:3857');
        const latlon_proj = new proj.get('EPSG:4326');

        // transform the point
        return proj.transform(this.props.coords, map_proj, latlon_proj);
    }

    latlon(projection, autoPrecision = true) {
        const coords = this.getLatLonCoords();
        const digits = autoPrecision ? zoomToPrecision(this.props.zoom) : 4;
        return formatCoordinates(projection, [coords[1], coords[0]], digits);
    }

    getProjectionCoords(projection) {
        // TODO: The projection should be stored in the store,
        //       and defined by the user.
        const map_proj = 'EPSG:3857';
        // transform the point
        const coords = proj4(map_proj, projection.ref, this.props.coords);
        return formatCoordinates(projection, coords);
    }

    getCoordinateDisplay(projection) {
        let display = '';
        switch (projection.ref) {
            case 'usng':
                display = (
                    <span className='coordinates map-usng' key='usng'>
                        <label>{projection.label}</label> { this.usng() }
                    </span>
                );
                break;
            case 'latlon':
                display = (
                    <span className='coordinates map-latlon' key='latlon'>
                        <label>{projection.label}</label> { this.latlon(projection) }
                    </span>
                );
                break;
            case 'xy':
                display = (
                    <span className='coordinates map-xy' key='xy'>
                        <label>{projection.label}</label> { formatCoordinates(projection, this.props.coords, 1) }
                    </span>
                );
                break;
            default: {
                const className = 'coordinates map-' + projection.ref.replace(/:/g, '-');
                display = (
                    <span className={className} key={projection.ref}>
                        <label>{projection.label}</label>
                        { this.getProjectionCoords(projection) }
                    </span>
                )
                break;
            }
        }
        return display;
    }

    render() {
        const coordinateDisplays = this.projections.map(this.getCoordinateDisplay)
        return (
            <span className='coordinate-display'>
                {coordinateDisplays}
            </span>
        );
    }
}
