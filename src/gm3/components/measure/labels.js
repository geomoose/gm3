/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2026 Dan "Ducky" Little
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

/* Builds the OpenLayers Text styles used to annotate measured features
 *  directly on the map: each line/polygon segment with its length, and each
 *  polygon with its area at the centroid.
 *
 * Display is toggled at runtime (state.map.showMeasureLabels) and renders in
 *  whichever length/area units the user currently has selected in the measure
 *  panel, so metric/imperial is always honored.  The enabled flag and the
 *  units are passed in by the caller -- this module intentionally owns no
 *  state of its own.
 */

import { Fill, Stroke, Style, Text } from "ol/style";
import LineString from "ol/geom/LineString";
import { toLonLat } from "ol/proj";
import { getArea } from "ol/sphere";

import { metersLengthToUnits, metersAreaToUnits } from "../../util";
import { getPathSegments, chompFloat } from "./calc";

// area units that are not expressed as a "square" of a length (acres, hectares).
//  Mirrors the measure panel's hasSqLabel().
const hasSqLabel = (units) => units !== "a" && units !== "h";

/* Pull every drawable path out of a geometry as lists of map-projection coords.
 *
 * Lines contribute a single path, polygons contribute one path per ring, and
 *  the Multi* variants flatten down to the same. Coordinates are returned in
 *  the map projection (EPSG:3857) so they can be used directly as the label
 *  geometry; the lengths are computed from their lon/lat equivalents.
 *
 * @param {ol/geom/Geometry} geometry Geometry in the map projection.
 *
 * @returns {Array} List of paths, each an array of [x, y] map coordinates.
 */
const getPaths = (geometry) => {
  const paths = [];

  const pushPath = (coordinates) => paths.push(coordinates);

  switch (geometry.getType()) {
    case "LineString":
      pushPath(geometry.getCoordinates());
      break;
    case "MultiLineString":
    case "Polygon":
      geometry.getCoordinates().forEach(pushPath);
      break;
    case "MultiPolygon":
      geometry.getCoordinates().forEach((polygon) => polygon.forEach(pushPath));
      break;
    default:
    // Point (and anything else) has no segments to annotate.
  }

  return paths;
};

/* Build a Text style that follows a single segment and hides itself when the
 *  rendered label is longer than the segment.
 *
 * @param {String} label The text to render.
 *
 * @returns {ol/style/Text}
 */
const buildSegmentText = (label) => {
  const text = new Text({
    text: label,
    font: "bold 12px sans-serif",
    // run the label along the segment instead of pinning it to a point.
    placement: "line",
    // when false, OpenLayers drops the label if it is longer than the line it
    //  follows -- exactly the "hide if it doesn't fit" behavior we want.
    overflow: false,
    fill: new Fill({ color: "#222222" }),
    stroke: new Stroke({ color: "#ffffff", width: 3 }),
  });

  // layers/vector.js monkey-patches Text.prototype.getOverflow to always
  //  return true (so polygon labels may spill outside the polygon). Override
  //  it per-instance so the overflow:false above is actually honored and
  //  over-long segment labels are hidden.
  text.getOverflow = () => false;

  return text;
};

/* Build the segment-label styles for a single geometry.
 *
 * @param {ol/geom/Geometry} geometry Geometry in the map projection (EPSG:3857).
 * @param {String} units               Length units to render, e.g. "ft".
 *
 * @returns {Array} List of ol/style/Style, one Text label per segment.
 */
export const getSegmentLabelStyles = (geometry, units) => {
  const styles = [];

  getPaths(geometry).forEach((path) => {
    // lengths/bearings are computed in lon/lat (UTM) space...
    const pathLonLat = path.map((coordinate) => toLonLat(coordinate));
    getPathSegments(pathLonLat).forEach((segment, i) => {
      const length = chompFloat(metersLengthToUnits(segment.len, units), 2);
      styles.push(
        new Style({
          // ...but the label follows the segment in the map projection.
          geometry: new LineString([path[i], path[i + 1]]),
          text: buildSegmentText(`${length.toFixed(2)} ${units}`),
        })
      );
    });
  });

  return styles;
};

/* Format an area (in square meters) for display, e.g. "1234.00 sq. ft". */
const formatArea = (areaMeters, units) => {
  const value = chompFloat(metersAreaToUnits(areaMeters, units), 2).toFixed(2);
  // acres/hectares stand alone, everything else is a "square" unit.
  const label = hasSqLabel(units) ? `sq. ${units}` : units;
  return `${value} ${label}`;
};

// prefixed before the area value to mark it as a (polygon) area measurement.
const AREA_PREFIX = "⬠ ";

/* A point-placed Text style used for the area label at a polygon's centroid,
 *  drawn with a white halo for legibility. */
const buildAreaText = (label) =>
  new Text({
    text: `${AREA_PREFIX}${label}`,
    font: "bold 13px sans-serif",
    placement: "point",
    fill: new Fill({ color: "#222222" }),
    stroke: new Stroke({ color: "#ffffff", width: 3 }),
  });

/* Build the area-label styles for a single geometry.  Each polygon (or each
 *  part of a multi-polygon) is labeled with its area at an interior point.
 *
 * @param {ol/geom/Geometry} geometry Geometry in the map projection (EPSG:3857).
 * @param {String} units               Area units to render, e.g. "ft".
 *
 * @returns {Array} List of ol/style/Style, one Text label per polygon.
 */
export const getAreaLabelStyles = (geometry, units) => {
  const polygons = [];
  switch (geometry.getType()) {
    case "Polygon":
      polygons.push(geometry);
      break;
    case "MultiPolygon":
      geometry.getPolygons().forEach((polygon) => polygons.push(polygon));
      break;
    default:
    // only polygons have an area to annotate.
  }

  return polygons.map(
    (polygon) =>
      new Style({
        // getInteriorPoint() returns a point guaranteed to fall inside the
        //  polygon -- a better anchor than the centroid for odd shapes.
        geometry: polygon.getInteriorPoint(),
        // getArea (ol/sphere) computes the geodesic area, matching the panel.
        text: buildAreaText(formatArea(getArea(polygon), units)),
      })
  );
};

/* Build every on-map label for a measured geometry: per-segment lengths plus,
 *  for polygons, the area at the centroid.
 *
 * @param {ol/geom/Geometry} geometry Geometry in the map projection (EPSG:3857).
 * @param {Object} options            `{ lengthUnits, areaUnits }`.
 *
 * @returns {Array} List of ol/style/Style.
 */
export const getMeasureLabelStyles = (geometry, { lengthUnits, areaUnits }) => [
  ...getSegmentLabelStyles(geometry, lengthUnits),
  ...getAreaLabelStyles(geometry, areaUnits),
];
