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
import { withTranslation } from 'react-i18next';

import DrawTool from './drawTool';

import * as util from '../util';

import * as proj from 'ol/proj';

import olPoint from 'ol/geom/Point';
import olLineString from 'ol/geom/LineString';

import CoordinateDisplay from './coordinate-display';

export class MeasureTool extends Component {

    constructor(props) {
        super(props);
        this.state = {
            units: this.props.initialUnits ? this.props.initialUnits : 'ft'
        };
    }

    /* Get the bearing of a drawing.
     * This is directly ported from GeoMoose 2.X
     *
     * @param {Array} pointA Array of x,y
     * @param {Array} pointB Array of x,y
     *
     * @return {string} Bearing description
     */
    getBearing(pointA, pointB) {
        let bearing = '-';
        if(pointA && pointB) {
            bearing = 'N0-0-0E';

            let rise = pointB[1] - pointA[1];
            let run = pointB[0] - pointA[0];
            if(rise === 0) {
                if(pointA[0] > pointB[0]) {
                    bearing = this.props.t('measure-due-west');
                } else {
                    bearing = this.props.t('measure-due-east');
                }
            } else if(run === 0) {
                if(pointA[1] > pointB[1]) {
                    bearing = this.props.t('measure-due-south');
                } else {
                    bearing = this.props.t('measure-due-north');
                }
            } else {
                let ns_quad = this.props.t('measure-north-abbr');
                let ew_quad = this.props.t('measure-east-abbr');
                if(rise < 0) {
                    ns_quad = this.props.t('measure-south-abbr');
                }
                if(run < 0) {
                    ew_quad = this.props.t('measure-west-abbr');
                }
                /* we've determined the quadrant, so we can make these absolute */
                rise = Math.abs(rise);
                run = Math.abs(run);
                /* convert to degrees */
                // var degrees = Math.atan(rise/run) / (2*Math.PI) * 360;
                // Calculation suggested by Dean Anderson, refs: #153
                const degrees = Math.atan(run / rise) / (2 * Math.PI) * 360;

                /* and to DMS ... */
                const d = parseInt(degrees, 10);
                const t = (degrees - d) * 60;
                const m = parseInt(t, 10);
                const s = parseInt(60 * (t - m), 10);

                bearing = ns_quad + d + '-' + m + '-' + s + ew_quad;
            }
        }
        return bearing;
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
        let line = new olLineString([a, b]);
        // transform into the new projection
        line = line.transform(this.props.mapProjection, utmZone);
        // return the measurement.
        const meters = line.getLength();

        return util.metersLengthToUnits(meters, this.state.units);
    }


    getSegmentInfo(geom) {
        // convert the first point of the line to 4326
        //  so a UTM zone can be determined.
        let point0 = new olPoint(geom.coordinates[0]);
        point0 = point0.transform(this.props.mapProjection, 'EPSG:4326');

        // determine an appropriate utm zone for measurement.
        const utm_zone = proj.get(util.getUtmZone(point0.getCoordinates()));

        const coords = [].concat(geom.coordinates);

        // ensure the last point is the current cursor.
        //  only when there is an active sketch!
        if(this.props.cursor.sketchGeometry !== null) {
            coords[coords.length - 1] = this.props.cursor.coords;
        }

        const segments = [];

        for(let i = 1, ii = coords.length; i < ii; i++) {
            const seg_len = this.calculateLength(coords[i - 1], coords[i], utm_zone);
            const bearing = this.getBearing(coords[i - 1], coords[i]);

            segments.push({
                id: i,
                len: seg_len, bearing
            });
        }

        return segments.reverse();
    }

    /* Render a LineString Measurement.
     *
     * @param {GeoJson} geom
     *
     * @return the table showing the log
     */
    renderSegments(geom) {
        const segments = this.getSegmentInfo(geom);

        let total_length = 0;

        const segment_html = [];
        for(let i = 0, ii = segments.length; i < ii; i++) {
            const seg = segments[i];
            total_length += seg.len;

            segment_html.push((
                <tr key={ 'segment' + i}>
                    <td>{ seg.id }</td>
                    <td>{ seg.len.toFixed(2) }</td>
                    <td>{ seg.bearing }</td>
                </tr>
            ));
        }


        segment_html.unshift((
            <tr key='line_total'>
                <td>&#931;</td>
                <td>{ total_length.toFixed(2) }</td>
                <td>&nbsp;</td>
            </tr>
        ));

        return (
            <table className='measured-segments'>
                <tbody>
                    <tr key='header'>
                        <th></th><th>{this.props.t('measure-segment-length')} ({this.props.t(`units-${this.state.units}`)})</th><th>Bearing</th>
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
        let point0 = new olPoint(geom.coordinates[0][0]);
        point0 = point0.transform(this.props.mapProjection, 'EPSG:4326');

        // determine an appropriate utm zone for measurement.
        const utm_zone = proj.get(util.getUtmZone(point0.getCoordinates()));

        const utm_geom = util.jsonToGeom(geom).transform(this.props.mapProjection, utm_zone)

        const area_m = utm_geom.getArea();

        const area = util.metersAreaToUnits(area_m, this.state.units);

        return (
            <table className='measured-area'>
                <tbody>
                    <tr key='header'>
                        <th>{this.props.t('measure-area')} ({this.props.t('measure-sq')} {this.props.t(`units-${this.state.units}`)})</th>
                    </tr>
                    <tr>
                        <td>{ area.toFixed(2) }</td>
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
            // swallow the measurement until the feature is ready.
            return false;
        } else if (g.type === 'Point') {
            return ( <CoordinateDisplay coords={ g.coordinates } projections={ this.props.pointProjections } resolution={ this.props.map.resolution } /> );
        } else if (g.type === 'LineString') {
            return this.renderSegments(g);
        } else if (g.type === 'Polygon') {
            // assume polygon
            return this.renderArea(g);
        }

        return false;
    }

    changeUnits(value) {
        this.setState({units: value});
    }

    renderUnitOption(value, isSq) {
        const selected = (this.state.units === value) ? 'selected' : '';
        return (
            <div key={'units-' + value} className={'radio-option ' + selected } onClick={ () => { this.changeUnits(value) } }>
                <i className='radio-icon'></i> {isSq ? `${this.props.t('measure-sq')} ` : ''}{this.props.t(`units-${value}`)}
            </div>
        );
    }

    renderUnitOptions() {
        const units = this.props.t('units');
        let measurement_type = this.props.map.interactionType;
        if(measurement_type === 'Select') {
            if(this.props.map.selectionFeatures.length > 0) {
                measurement_type = this.props.map.selectionFeatures[0].geometry.type;
            }
        }

        if(measurement_type === 'LineString') {
            return (
                <div className='measure-units'>
                    <b>{units}:</b>
                    { this.renderUnitOption('m') }
                    { this.renderUnitOption('km') }
                    { this.renderUnitOption('ft') }
                    { this.renderUnitOption('mi') }
                    { this.renderUnitOption('ch') }
                </div>
            );
        } else if(measurement_type === 'Polygon') {
            return (
                <div className='measure-units'>
                    <b>{units}:</b>
                    { this.renderUnitOption('m', true) }
                    { this.renderUnitOption('km', true) }
                    { this.renderUnitOption('ft', true) }
                    { this.renderUnitOption('mi', true) }
                    { this.renderUnitOption('a') }
                    { this.renderUnitOption('h') }
                </div>
            );
        } else {
            // no options for nothing to do.
            return false;
        }
    }

    render() {
        // TODO: These events can happen when measuring is not happening!!!
        return (
            <div className='measure-tool'>
                <div dangerouslySetInnerHTML={{__html: this.props.t('measure-help')}} />
                <div className='draw-tools'>
                    <DrawTool key='measure-point' geomType='Point'/>
                    <DrawTool key='measure-line' geomType='LineString'/>
                    <DrawTool key='measure-poly' geomType='Polygon'/>
                    <DrawTool key='measure-select' geomType='Select'/>
                </div>

                { this.renderUnitOptions() }
                <br/>
                { this.renderMeasureOutput() }
            </div>
        );
    }
}


const mapToProps = function(store) {
    return {
        map: store.map,
        cursor: store.cursor,
        mapProjection: 'EPSG:3857',
    }
}

export default connect(mapToProps)(withTranslation()(MeasureTool));
