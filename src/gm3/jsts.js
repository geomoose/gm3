/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2017,2026 Dan "Ducky" Little
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

/* All of the geometry-library integration lives in this module.
 *
 * The module kept its historical name (and its place in the public API as
 * gm3.jsts) but the operations are now backed by qdgeo, a WebAssembly
 * geometry library. Because a WebAssembly module has to be fetched and
 * compiled, every operation here is asynchronous. The module is loaded
 * on first use and shared after that.
 *
 */

import { load, QdgeoError } from "qdgeo";
import { ensureProjection, jsonToGeom, geomToJson, getUtmZone } from "./util";

// segments per quarter circle on a rounded buffer. JSTS used 8, keeping
//  the same density keeps selection geometry (which is often sent to
//  a server as a filter) the same size it has always been.
const BUFFER_STEPS = 8;

let geoPromise = null;

/** Load (once) the geometry library.
 *
 *  @returns Promise resolving to the qdgeo Geometry instance.
 */
export function ready() {
  if (geoPromise === null) {
    geoPromise = load().catch((err) => {
      // allow a later call to try again
      geoPromise = null;
      throw err;
    });
  }
  return geoPromise;
}

/** Convert a GeoJSON Geometry or Feature to a qdgeo operand.
 *
 *  @param input GeoJSON Geometry or Feature.
 *
 *  @returns {polygons, lines, points}
 */
export function toOperand(input) {
  const operand = { polygons: [], lines: [], points: [] };
  const add = (geometry) => {
    if (!geometry) {
      return;
    }
    switch (geometry.type) {
      case "Point":
        operand.points.push(geometry.coordinates);
        break;
      case "MultiPoint":
        operand.points.push(...geometry.coordinates);
        break;
      case "LineString":
        operand.lines.push(geometry.coordinates);
        break;
      case "MultiLineString":
        operand.lines.push(...geometry.coordinates);
        break;
      case "Polygon":
        operand.polygons.push(geometry.coordinates);
        break;
      case "MultiPolygon":
        operand.polygons.push(...geometry.coordinates);
        break;
      case "GeometryCollection":
        geometry.geometries.forEach(add);
        break;
      default:
      // unknown geometry types contribute nothing
    }
  };
  add(input && input.type === "Feature" ? input.geometry : input);
  return operand;
}

/** Convert a qdgeo result to a GeoJSON Polygon or MultiPolygon.
 *
 *  @returns GeoJSON geometry, or null when the result is empty.
 */
function resultToGeometry(result) {
  const shapes = result.toArrays();
  if (shapes.length === 0) {
    return null;
  } else if (shapes.length === 1) {
    return { type: "Polygon", coordinates: shapes[0] };
  }
  return { type: "MultiPolygon", coordinates: shapes };
}

const isInvalidGeometry = (err) => err instanceof QdgeoError && err.code === "INVALID_GEOMETRY";

/** Check whether qdgeo accepts the polygons in an operand. */
function hasValidPolygons(geo, operand) {
  if (operand.polygons.length === 0) {
    return true;
  }
  try {
    geo.union(operand.polygons);
  } catch (err) {
    if (isInvalidGeometry(err)) {
      return false;
    }
    throw err;
  }
  return true;
}

/** Make an operand with invalid polygons usable.
 *
 *  qdgeo refuses invalid polygons (a self-intersecting "bowtie" is the
 *  common one, and the OpenLayers draw tool will happily create them).
 *  turf and JSTS tolerated them, so to keep that behaviour the polygon
 *  is replaced by everything its outline encloses: the rings are traced
 *  as lines with a tiny buffer and only the outer shells are kept.
 *
 *  This drops holes, so it is only used for polygons qdgeo rejected.
 */
function repairOperand(geo, operand) {
  const rings = [];
  operand.polygons.forEach((shape) => rings.push(...shape));
  const span = polygonSpan(operand);

  // a small tolerance occasionally lands on an arrangement qdgeo cannot
  //  represent, a larger one is tried before giving up.
  let lastError = null;
  for (const relative of [1e-7, 1e-5]) {
    let outline;
    try {
      outline = geo.buffer({ lines: rings }, span * relative, { steps: 1 });
    } catch (err) {
      if (!(err instanceof QdgeoError)) {
        throw err;
      }
      lastError = err;
      continue;
    }
    return {
      polygons: outline.toArrays().map((shape) => [shape[0]]),
      lines: operand.lines,
      points: operand.points,
    };
  }
  throw lastError;
}

/** Run fn(operand), repairing the operand if qdgeo rejects its polygons. */
function withRepair(geo, operand, fn) {
  try {
    return fn(operand);
  } catch (err) {
    if (!isInvalidGeometry(err)) {
      throw err;
    }
  }
  return fn(repairOperand(geo, operand));
}

/** The longest side of an operand's polygons' extent. */
function polygonSpan(operand) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  operand.polygons.forEach((shape) => {
    shape.forEach((ring) => {
      ring.forEach(([x, y]) => {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      });
    });
  });
  return Math.max(maxX - minX, maxY - minY);
}

/** Round every coordinate in an operand to a grid. */
function snapOperand(operand, grid) {
  const snap = ([x, y]) => [Math.round(x / grid) * grid, Math.round(y / grid) * grid];
  const snapPath = (path) => path.map(snap);
  return {
    polygons: operand.polygons.map((shape) => shape.map(snapPath)),
    lines: operand.lines.map(snapPath),
    points: operand.points.map(snap),
  };
}

/** Run fn(operand), working around the two ways qdgeo can refuse input.
 *
 *  - INVALID_GEOMETRY: the polygons are repaired (see repairOperand).
 *  - UNREPRESENTABLE: valid input, but two vertices are so nearly
 *    coincident that the answer cannot be built. qdgeo's documented
 *    remedy is to round the coordinates to a grid, so the call is
 *    retried once on a grid of `grid` units.
 */
function robustly(geo, operand, grid, fn) {
  try {
    return withRepair(geo, operand, fn);
  } catch (err) {
    if (!(err instanceof QdgeoError && err.code === "UNREPRESENTABLE")) {
      throw err;
    }
  }
  return withRepair(geo, snapOperand(operand, grid), fn);
}

// the grids used when an operation has to be retried: a millimetre,
//  in meters for UTM and (roughly) in degrees for WGS84.
const UTM_SNAP_GRID = 0.001;
const WGS84_SNAP_GRID = 1e-8;

function getAnchorPoint(feature, empty = null) {
  let anchorPoint = empty;
  const geometry = feature.geometry;
  if (!geometry) {
    return anchorPoint;
  }
  const gtype = geometry.type;
  if (gtype === "Point") {
    anchorPoint = geometry.coordinates;
  } else if (gtype === "MultiPoint" || gtype === "LineString") {
    anchorPoint = geometry.coordinates[0];
  } else if (gtype === "MultiLineString" || gtype === "Polygon") {
    anchorPoint = geometry.coordinates[0][0];
  } else if (gtype === "MultiPolygon") {
    anchorPoint = geometry.coordinates[0][0][0];
  }
  return anchorPoint;
}

/** Buffer WGS84 features, synchronously, with a loaded library.
 *
 *  The buffer happens in UTM so the distance is in meters. Features
 *  are grouped by their UTM zone and each zone is buffered in one call,
 *  which also dissolves the buffers of neighbouring features together.
 *  That is far more robust than buffering each feature and unioning
 *  the results, whose arcs are nearly coincident wherever the features
 *  are adjacent.
 *
 *  @returns GeoJSON geometry in WGS84, or null when nothing was buffered.
 */
function bufferWith(geo, features, meters) {
  const zones = new Map();
  features.forEach((feature) => {
    if (!feature.geometry) {
      return;
    }
    // Start on null island.
    const utmZone = getUtmZone(getAnchorPoint(feature, [0, 0]));
    if (!zones.has(utmZone)) {
      zones.set(utmZone, { polygons: [], lines: [], points: [] });
    }
    const zoneOperand = zones.get(utmZone);
    const projection = ensureProjection(utmZone);
    const metersGeoJson = geomToJson(
      jsonToGeom(feature.geometry).transform("EPSG:4326", projection)
    );
    const operand = toOperand(metersGeoJson);
    zoneOperand.polygons.push(...operand.polygons);
    zoneOperand.lines.push(...operand.lines);
    zoneOperand.points.push(...operand.points);
  });

  const polygons = [];
  zones.forEach((operand, utmZone) => {
    const buffered = resultToGeometry(
      robustly(geo, operand, UTM_SNAP_GRID, (o) => geo.buffer(o, meters, { steps: BUFFER_STEPS }))
    );
    if (buffered !== null) {
      // back to 4326
      const wgs84 = geomToJson(
        jsonToGeom(buffered).transform(ensureProjection(utmZone), "EPSG:4326")
      );
      polygons.push(...toOperand(wgs84).polygons);
    }
  });

  if (polygons.length === 0) {
    return null;
  } else if (zones.size === 1) {
    return polygons.length === 1
      ? { type: "Polygon", coordinates: polygons[0] }
      : { type: "MultiPolygon", coordinates: polygons };
  }
  // features in more than one zone, dissolve the zones together
  return resultToGeometry(
    robustly(geo, { polygons, lines: [], points: [] }, WGS84_SNAP_GRID, (o) =>
      geo.union(o.polygons)
    )
  );
}

/** Buffer a WGS84 GeoJSON feature by a distance in meters.
 *
 *  @returns Promise resolving to the buffered GeoJSON geometry.
 */
export async function buffer(feature, meters) {
  return (await bufferFeature(feature, meters)).geometry;
}

/** Buffer a WGS84 GeoJSON feature by a distance in meters.
 *
 *  @returns Promise resolving to a GeoJSON feature.
 */
export async function bufferFeature(feature, meters) {
  const geo = await ready();
  return {
    type: "Feature",
    properties: {},
    geometry: bufferWith(geo, [feature], meters),
  };
}

/** Takes in an array of WGS84 GeoJSON features, buffers them
 *  and unions the result.
 *
 *  @param features Array of GeoJSON features.
 *  @param meters   Distance in meters to buffer the features.
 *
 * @returns Promise resolving to a GeoJSON geometry.
 */
export async function bufferAndUnion(features, meters) {
  const geo = await ready();
  return bufferWith(geo, features, meters);
}

/** Union features with a loaded library, keeping the first feature's
 *  properties, as turf did.
 */
function unionWith(geo, features) {
  if (features.length < 2) {
    return { ...features[0] };
  }
  const operand = { polygons: [], lines: [], points: [] };
  features.forEach((feature) => {
    operand.polygons.push(...toOperand(feature).polygons);
  });
  // the projection is unknown here, so the retry grid is relative
  //  to the size of the input
  const grid = polygonSpan(operand) * 1e-9;
  return {
    type: "Feature",
    properties: features[0].properties,
    geometry: resultToGeometry(robustly(geo, operand, grid, (o) => geo.union(o.polygons))),
  };
}

/** Union an array of polygon features.
 *
 *  @returns Promise resolving to a GeoJSON feature with
 *           the first feature's properties.
 */
export async function union(features) {
  const geo = await ready();
  return unionWith(geo, features);
}

/** Prepare a selection for repeated intersection tests.
 *
 *  The selection is converted (and, if needed, repaired) once.
 *  The returned tester never throws for a geometry the library
 *  cannot handle; it reports that geometry as not intersecting.
 *
 *  @param selection GeoJSON Geometry or Feature.
 *
 *  @returns Promise resolving to a function(geometry) => boolean.
 */
export async function intersectsTester(selection) {
  const geo = await ready();
  let selectionOperand = toOperand(selection);
  if (!hasValidPolygons(geo, selectionOperand)) {
    selectionOperand = repairOperand(geo, selectionOperand);
  }

  return (other) => {
    try {
      return withRepair(geo, toOperand(other), (operand) =>
        geo.intersects(selectionOperand, operand)
      );
    } catch (err) {
      if (!(err instanceof QdgeoError)) {
        throw err;
      }
      console.warn("[gm3:geometry] Could not test a feature for intersection:", err.message);
      return false;
    }
  };
}

/** Test whether two GeoJSON geometries (or features) intersect.
 *
 *  @returns Promise resolving to a boolean.
 */
export async function intersects(a, b) {
  return (await intersectsTester(a))(b);
}
