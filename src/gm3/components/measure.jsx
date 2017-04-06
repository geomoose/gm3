/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 Dan "Ducky" Little
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

import DrawTool from './drawTool';

import * as util from '../util';

class MeasureTool extends Component {

    constructor(props) {
        super(props);

        // TODO: sniff the map for the proj.
        this.mapProjection = ol.proj.get('EPSG:3857');
    }

    calculateHeading() {
    }

    /* Calcualte the distance between two points,
     *
     * @param {Point-like} a with [x,y]
     * @param {Point-like} b with [x,y]
     * @param {String} utmZone UTM zone to use for distance calculation
     *
     * @returns Distance of the line between a and b
     */
    calculateLength(a, b, utmZone) {
        // create the new line
        let line = new ol.geom.LineString([a, b]);
        // transform into the new projection
        line = line.transform(this.mapProjection, utmZone);
        // return the measurement.
        return line.getLength();
    }


    getSegmentInfo(geom) {
        // convert the first point of the line to 4326
        //  so a UTM zone can be determined.
        let point0 = new ol.geom.Point(geom.coordinates[0]);
        point0 = point0.transform(this.mapProjection, 'EPSG:4326');

        // determine an appropriate utm zone for measurement.
        const utm_zone = ol.proj.get(util.getUtmZone(point0.getCoordinates()));

        const coords = [].concat(geom.coordinates);

        // ensure the last point is the current cursor.
        //  only when there is an active sketch!
        if(this.props.cursor.sketchGeometry !== null) {
            coords[coords.length - 1] = this.props.cursor.coords;
        }

        const segments = [];

        for(let i = 1, ii = coords.length; i < ii; i++) {
            const seg_len = this.calculateLength(coords[i-1], coords[i], utm_zone);
            const heading = '(heading)';

            segments.push({
                len: seg_len, heading
            });
        }

        return segments;
    }

    renderSegments(geom) {
        const segments = this.getSegmentInfo(geom);

        const segment_html = [];
        for(let i = 0, ii = segments.length; i < ii; i++) {
            segment_html.push((
                <tr key={ 'segment' + i}>
                    <td>{ i + 1 }</td>
                    <td>{ segments[i].len.toFixed(2) }</td>
                    <td>{ segments[i].heading }</td>
                </tr>
            ));
        }

        return (
            <table className="measured-segments">
                <tbody>
                    <tr key="header">
                        <th></th><th>Segment Length (m)</th><th>Heading</th>
                    </tr>
                    { segment_html }
                </tbody>
            </table>
        );
    }

    /* Render the HTML for the area of the polygon
     * being drawn.
     *
     * @param {GeoJson} geom
     *
     * @return JSX
     */
    renderArea(geom) {
        let point0 = new ol.geom.Point(geom.coordinates[0][0]);
        point0 = point0.transform(this.mapProjection, 'EPSG:4326');

        // determine an appropriate utm zone for measurement.
        const utm_zone = ol.proj.get(util.getUtmZone(point0.getCoordinates()));

        const utm_geom = util.jsonToGeom(geom).transform(this.mapProjection, utm_zone)

        const area = utm_geom.getArea();


        return (
            <table className="measured-area">
                <tbody>
                    <tr key="header">
                        <td>Area (sq.m)</td>
                    </tr>
                    <tr>
                        <td>{ area }</td>
                    </tr>
                </tbody>
            </table>
        );
    }

    renderMeasureOutput() {
        let g = this.props.cursor.sketchGeometry;

        if(g === null && this.props.map.selectionFeatures.length > 0) {
            g = this.props.map.selectionFeatures[0].geometry;
        }

        if(g === null ||
            (g.type === 'LineString' && g.coordinates.length < 2) ||
            (g.type === 'Polygon' && g.coordinates[0].length < 3)
           ) {
            return (
                <div className="help-text">
                    Please draw a feature on the map to measure.
                </div>
            );
        } else if (g.type === 'LineString') {
            return this.renderSegments(g);
        } else { // assume polygon 
            return this.renderArea(g);
        }

        return (
            <div>Enjoy this HTML placeholder.</div>
        );
    }

    render() {
        // TODO: These events can happen when measuring is not happening!!!
        return (
            <div>
                <div>
                    Use <b>Draw line</b> to measure distances and <b>Draw Polygon</b> to measure areas.
                </div>
                <div className="draw-tools">
                    <DrawTool key="measure-line" store={this.props.store} geomType="LineString"/>
                    <DrawTool key="measure-poly" store={this.props.store} geomType="Polygon"/>
                </div>
                { this.renderMeasureOutput() }
            </div>
        );
    }
}


const mapToProps = function(store) {
    return {
        map: store.map,
        cursor: store.cursor
    }
}

export default connect(mapToProps)(MeasureTool);
