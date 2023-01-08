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

import { BufferOp, GeoJSONReader, GeoJSONWriter } from "turf-jsts";
import turfUnion from "@turf/union";
import * as proj from "ol/proj";
import { jsonToGeom, geomToJson, getUtmZone } from "./util";

export function buffer(feature, meters) {
  return bufferFeature(feature, meters).geometry;
}

function getAnchorPoint(feature, empty = null) {
  let anchorPoint = empty;
  const gtype = feature.geometry.type;
  if (gtype === "Point") {
    anchorPoint = feature.geometry.coordinates;
  } else if (gtype === "MultiPoint" || gtype === "LineString") {
    anchorPoint = feature.geometry.coordinates[0];
  } else if (gtype === "MultiLineString" || gtype === "Polygon") {
    anchorPoint = feature.geometry.coordinates[0][0];
  } else if (gtype === "MuliPolygon") {
    anchorPoint = feature.geometry.cooredinates[0][0][0];
  }
  return anchorPoint;
}

export function bufferFeature(feature, meters) {
  // Start on null island.
  const posPt = getAnchorPoint(feature, [0, 0]);

  // find the feature's location in UTM space.
  const utmZone = proj.get(getUtmZone(posPt));

  // convert the geometry to an OL geometry
  let geom = jsonToGeom(feature.geometry);

  // project it to UTM
  geom = geom.transform("EPSG:4326", utmZone);

  // back again to JSON after reprojection
  let metersGeoJson = geomToJson(geom);

  // JSTS buffer operation
  const reader = new GeoJSONReader();
  const jstsGeom = reader.read(metersGeoJson);
  const buffered = BufferOp.bufferOp(jstsGeom, meters);
  const writer = new GeoJSONWriter();

  // buffer by meters
  metersGeoJson = writer.write(buffered);

  // back to 4326
  const finalGeom = jsonToGeom(metersGeoJson).transform(utmZone, "EPSG:4326");

  // return the geometry wrapped in a feature.
  return {
    type: "Feature",
    properties: {},
    geometry: geomToJson(finalGeom),
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

  for (let i = 0, ii = features.length; i < ii; i++) {
    // buffer the geometry.
    const g = bufferFeature(features[i], meters);
    // if the output geometry is still null, then set the
    //  first member to the new geometry
    if (geometry === null) {
      geometry = g;
      // otherwise buffer it.
    } else {
      geometry = turfUnion(geometry, g);
    }
  }

  return geometry.geometry;
}

export function union(features) {
  const distance = (pt) => Math.sqrt(pt[0] * pt[0] + pt[1] * pt[1]);
  // sort the features by their bounding boxes.
  const sortedFeatures = features.sort((a, b) => {
    const ptA = getAnchorPoint(a);
    const ptB = getAnchorPoint(b);
    if (ptA === null) {
      return 1;
    } else if (ptB === null) {
      return -1;
    }
    return distance(ptA) < distance(ptB) ? -1 : 1;
  });
  let unionFeature = { ...sortedFeatures[0] };
  for (let i = 1, ii = sortedFeatures.length; i < ii; i++) {
    unionFeature = turfUnion(unionFeature, sortedFeatures[i]);
  }
  return unionFeature;
}
