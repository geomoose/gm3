/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2023 Dan "Ducky" Little
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

import { getUtmZone } from "../../util";
import { get as getProjection } from "ol/proj";
import olLineString from "ol/geom/LineString";

export const getBearing = (pointA, pointB, ordinalDictionary) => {
  let bearing = "-";
  if (pointA && pointB) {
    bearing =
      ordinalDictionary["measure-north-abbr"] +
      "0-0-0" +
      ordinalDictionary["measure-east-abbr"];

    let rise = pointB[1] - pointA[1];
    let run = pointB[0] - pointA[0];
    if (rise === 0) {
      if (pointA[0] > pointB[0]) {
        bearing = "measure-due-west";
      } else {
        bearing = "measure-due-east";
      }
    } else if (run === 0) {
      if (pointA[1] > pointB[1]) {
        bearing = "measure-due-south";
      } else {
        bearing = "measure-due-north";
      }
    } else {
      let nsQuad = "measure-north-abbr";
      let ewQuad = "measure-east-abbr";
      if (rise < 0) {
        nsQuad = "measure-south-abbr";
      }
      if (run < 0) {
        ewQuad = "measure-west-abbr";
      }
      /* we've determined the quadrant, so we can make these absolute */
      rise = Math.abs(rise);
      run = Math.abs(run);
      /* convert to degrees */
      // var degrees = Math.atan(rise/run) / (2*Math.PI) * 360;
      // Calculation suggested by Dean Anderson, refs: #153
      const degrees = (Math.atan(run / rise) / (2 * Math.PI)) * 360;

      /* and to DMS ... */
      const d = parseInt(degrees, 10);
      const t = (degrees - d) * 60;
      const m = parseInt(t, 10);
      const s = parseInt(60 * (t - m), 10);

      bearing =
        ordinalDictionary[nsQuad] +
        d +
        "-" +
        m +
        "-" +
        s +
        ordinalDictionary[ewQuad];
    }
  }
  // attempt to translate the bearing.
  return bearing;
};

/* Calcualte the distance between two points,
 *
 * @param {Point-like} a with [x,y]
 * @param {Point-like} b with [x,y]
 * @param {String} utmZone UTM zone to use for distance calculation
 *
 * @returns Distance of the line between a and b
 */
function calculateLength(a, b, utmZone) {
  // create the new line
  let line = new olLineString([a, b]);
  // transform into the new projection
  line = line.transform("EPSG:4326", utmZone);
  // return the measurement.
  // this is in meters!
  return line.getLength();
}

export function getSegmentInfo(
  geom,
  cursorCoords,
  isDrawing,
  ordinalDictionary
) {
  // determine an appropriate utm zone for measurement.
  const utmZone = getProjection(getUtmZone(geom.coordinates[0]));

  const coords = [].concat(geom.coordinates);

  // ensure the last point is the current cursor.
  //  only when there is an active sketch!
  if (isDrawing) {
    coords[coords.length - 1] = cursorCoords;
  }

  const segments = [];

  for (let i = 1, ii = coords.length; i < ii; i++) {
    const segLen = calculateLength(coords[i - 1], coords[i], utmZone);
    const bearing = getBearing(coords[i - 1], coords[i], ordinalDictionary);

    segments.push({
      id: i,
      len: segLen,
      bearing,
    });
  }

  return segments.reverse();
}

// This looks a bit silly but Javascript Math.pow(10..)
//  is painfully slow for real time use.
const PRECISION_LOOKUP = {
  0: 1,
  1: 10,
  2: 100,
  3: 1000,
  4: 10000,
};

export const chompFloat = (value, precision = 2) =>
  Math.floor(value * PRECISION_LOOKUP[precision]) / PRECISION_LOOKUP[precision];

export const normalizeGeometry = (selectedFeatures) => {
  if (selectedFeatures.length > 1) {
    const gType = selectedFeatures[0].geometry.type;
    const isPoly = gType === "Polygon" || gType === "MultiPolygon";

    const coordinates = [];
    selectedFeatures.forEach((feature) => {
      if (feature.geometry.type.startsWith("Multi")) {
        feature.geometry.coordinates.forEach((polygon) => {
          coordinates.push(polygon);
        });
      } else {
        coordinates.push(feature.geometry.coordinates);
      }
    });

    return {
      type: isPoly ? "MultiPolygon" : "MultiLineString",
      coordinates,
    };
  }
  return selectedFeatures[0].geometry;
};
