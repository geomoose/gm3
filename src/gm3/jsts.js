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

/* All of the JSTS integration is integrated into this module.
 *
 * This was done with the intent of developing a system that makes
 * JSTS optional into the future.  And/or makes it so that different
 * geometry libraries can be substituted in the future.
 *
 */

import { BufferOp, GeoJSONReader, GeoJSONWriter } from 'turf-jsts';
import turf_union from '@turf/union';
import * as proj from 'ol/proj';
import { jsonToGeom, geomToJson, getUtmZone } from './util';

export function buffer(feature, meters) {
    return bufferFeature(feature, meters).geometry;
}

export function bufferFeature(feature, meters) {
    // Start on null island.
    let pos_pt = [0, 0];

    const gtype = feature.geometry.type;

    if (gtype === 'Point') {
        pos_pt = feature.geometry.coordinates;
    } else if(gtype === 'MultiPoint' || gtype === 'LineString') {
        pos_pt = feature.geometry.coordinates[0];
    } else if(gtype === 'MultiLineString' || gtype === 'Polygon') {
        pos_pt = feature.geometry.coordinates[0][0];
    } else if(gtype === 'MuliPolygon') {
        pos_pt = feature.geometry.cooredinates[0][0][0];
    }

    // find the feature's location in UTM space.
    const utmZone = proj.get(getUtmZone(pos_pt));

    // convert the geometry to an OL geometry
    let geom = jsonToGeom(feature.geometry);

    // project it to UTM
    geom = geom.transform('EPSG:4326', utmZone);

    // back again to JSON after reprojection
    let meters_geojson = geomToJson(geom);

    // JSTS buffer operation
    const reader = new GeoJSONReader();
    const jstsGeom = reader.read(meters_geojson);
    const buffered = BufferOp.bufferOp(jstsGeom, meters);
    const writer = new GeoJSONWriter();

    // buffer by meters
    meters_geojson = writer.write(buffered);

    // back to 4326
    const final_geom = jsonToGeom(meters_geojson).transform(utmZone, 'EPSG:4326');

    // return the geometry wrapped in a feature.
    return {
        type: 'Feature',
        properties: {},
        geometry: geomToJson(final_geom),
    };
}


/** Takes in an array of GeoJSON features, buffers them
 *  and returns a GeoJSON feature.
 *
 *  @param features Array of GeoJSON features.
 *  @param meters   Distance in meters to buffer the features.
 *
 * @returns GeoJSON feature.
 */
export function bufferAndUnion(features, meters) {
    let geometry = null;

    for(let i = 0, ii = features.length; i < ii; i++) {
        // buffer the geometry.
        const g = bufferFeature(features[i], meters);
        // if the output geometry is still null, then set the
        //  first member to the new geometry
        if(geometry === null) {
            geometry = g;
        // otherwise buffer it.
        } else {
            geometry = turf_union(geometry, g);
        }
    }

    return geometry.geometry;
}
