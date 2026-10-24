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

// Past this many coordinates a zone is buffered in batches and the batches
//  are unioned. Buffer distributes over union, so the answer is the same;
//  what changes is the peak memory, which is set by the largest single call.
//  Measured on the 4,040 demo parcels (135,000 coordinates): one call peaks
//  at 57 MiB of WebAssembly memory, batches of 500 parcels at 41 MiB.
export const BUFFER_BATCH_COORDINATES = 50000;

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

/** Forget the loaded library, so the next call loads a fresh copy.
 *
 *  WebAssembly memory only grows. After a call that ran out of memory the
 *  instance keeps that high-water mark for the life of the page, so the
 *  library is reloaded instead; a fresh instance starts at about 1 MiB and
 *  the browser has the module cached.
 */
export function reset() {
  geoPromise = null;
}

/** Translation keys for the ways a geometry operation can fail. */
export const GEOMETRY_ERRORS = {
  OUT_OF_MEMORY: "geometry-error-out-of-memory",
  UNREPRESENTABLE: "geometry-error-unrepresentable",
  INVALID_GEOMETRY: "geometry-error-invalid",
  UNKNOWN: "geometry-error-unknown",
};

/** Describe why a geometry operation failed, as a translation key.
 *
 *  @param err The error thrown by an operation in this module.
 *
 *  @returns One of GEOMETRY_ERRORS.
 */
export function describeError(err) {
  if (err instanceof QdgeoError) {
    switch (err.code) {
      case "OUT_OF_MEMORY":
      case "LIMIT_EXCEEDED":
        return GEOMETRY_ERRORS.OUT_OF_MEMORY;
      case "UNREPRESENTABLE":
        return GEOMETRY_ERRORS.UNREPRESENTABLE;
      case "INVALID_GEOMETRY":
      case "COORDINATE_RANGE":
      case "UNSUPPORTED_GEOMETRY":
        return GEOMETRY_ERRORS.INVALID_GEOMETRY;
      default:
        return GEOMETRY_ERRORS.UNKNOWN;
    }
  }
  // The browser itself ran out: a WebAssembly trap, or a JavaScript array
  //  too large to allocate while converting the result.
  if (
    (typeof WebAssembly !== "undefined" && err instanceof WebAssembly.RuntimeError) ||
    err instanceof RangeError
  ) {
    return GEOMETRY_ERRORS.OUT_OF_MEMORY;
  }
  return GEOMETRY_ERRORS.UNKNOWN;
}

/** Run fn(geo) with the loaded library, reloading it after it ran out of memory. */
async function recovering(fn) {
  const geo = await ready();
  try {
    return fn(geo);
  } catch (err) {
    if (describeError(err) === GEOMETRY_ERRORS.OUT_OF_MEMORY) {
      reset();
    }
    throw err;
  }
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

/** Convert a list of polygons to a GeoJSON Polygon or MultiPolygon.
 *
 *  @returns GeoJSON geometry, or null when the list is empty.
 */
function shapesToGeometry(shapes) {
  if (shapes.length === 0) {
    return null;
  } else if (shapes.length === 1) {
    return { type: "Polygon", coordinates: shapes[0] };
  }
  return { type: "MultiPolygon", coordinates: shapes };
}

/** Convert a qdgeo result to a GeoJSON Polygon or MultiPolygon. */
function resultToGeometry(result) {
  return shapesToGeometry(result.toArrays());
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
 *  turf and JSTS tolerated them, so to keep that behaviour the polygons
 *  are repaired with qdgeo's makeValid, which follows JTS GeometryFixer:
 *  a bowtie keeps both lobes, holes are kept, and parts with no area are
 *  dropped.
 *
 *  This used to trace every ring as a hairline buffer instead. On a
 *  selection of thousands of parcels that needed hundreds of megabytes,
 *  ran out of memory, and never produced an answer anyway.
 */
function repairOperand(geo, operand) {
  return {
    polygons: geo.makeValid(operand.polygons).toArrays(),
    lines: operand.lines,
    points: operand.points,
  };
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

/** How many coordinates an operand holds. */
export function countCoordinates(operand) {
  let count = operand.points.length;
  operand.lines.forEach((line) => {
    count += line.length;
  });
  operand.polygons.forEach((shape) => {
    shape.forEach((ring) => {
      count += ring.length;
    });
  });
  return count;
}

/** An origin near the operand that every coordinate subtracts exactly.
 *
 *  Projected coordinates are large (a UTM northing is around 5,000,000)
 *  and doubles are coarse there, which is what makes qdgeo decline an
 *  arrangement as not representable. Working relative to a nearby origin
 *  gives the same geometry far more precision: measured on the demo
 *  parcels, buffers of 1,000 and 2,000 parcels that failed the first try
 *  in UTM succeed in a local frame.
 *
 *  The origin sits on the grid of doubles at the largest coordinate, so
 *  subtracting it loses nothing; adding it back to a result rounds by at
 *  most half of that spacing, under a nanometre for UTM.
 */
export function localOrigin(operand) {
  let minX = Infinity;
  let minY = Infinity;
  let magnitude = 0;
  const visit = ([x, y]) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    magnitude = Math.max(magnitude, Math.abs(x), Math.abs(y));
  };
  operand.polygons.forEach((shape) => shape.forEach((ring) => ring.forEach(visit)));
  operand.lines.forEach((line) => line.forEach(visit));
  operand.points.forEach(visit);
  if (!(magnitude > 0) || !isFinite(magnitude)) {
    return [0, 0];
  }
  const spacing = Math.pow(2, Math.floor(Math.log2(magnitude)) - 52);
  return [Math.floor(minX / spacing) * spacing, Math.floor(minY / spacing) * spacing];
}

/** Move every coordinate in an operand by [dx, dy]. */
function translateOperand(operand, [dx, dy]) {
  const move = ([x, y]) => [x + dx, y + dy];
  const movePath = (path) => path.map(move);
  return {
    polygons: operand.polygons.map((shape) => shape.map(movePath)),
    lines: operand.lines.map(movePath),
    points: operand.points.map(move),
  };
}

/** Split an operand's polygons into batches of about `budget` coordinates.
 *
 *  The polygons are sorted west to east first so each batch is compact,
 *  which keeps the seams between batches short. Lines and points go in
 *  the first batch.
 */
export function batchOperand(operand, budget) {
  const sized = operand.polygons.map((shape) => {
    let minX = Infinity;
    let count = 0;
    shape.forEach((ring) => {
      count += ring.length;
      ring.forEach(([x]) => {
        minX = Math.min(minX, x);
      });
    });
    return { shape, minX, count };
  });
  sized.sort((a, b) => a.minX - b.minX);

  const batches = [];
  let current = { polygons: [], lines: operand.lines, points: operand.points };
  let count = countCoordinates(current);
  sized.forEach(({ shape, count: n }) => {
    if (current.polygons.length > 0 && count + n > budget) {
      batches.push(current);
      current = { polygons: [], lines: [], points: [] };
      count = 0;
    }
    current.polygons.push(shape);
    count += n;
  });
  batches.push(current);
  return batches;
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

/** Buffer one zone's operand, in metres, and return the polygons.
 *
 *  The work happens relative to a local origin (see localOrigin). An
 *  operand over BUFFER_BATCH_COORDINATES is buffered in batches whose
 *  results are unioned, which bounds the memory any one call needs.
 */
function bufferOperand(geo, operand, meters) {
  const origin = localOrigin(operand);
  const local = translateOperand(operand, [-origin[0], -origin[1]]);
  const buffer = (o) => geo.buffer(o, meters, { steps: BUFFER_STEPS });

  let shapes;
  if (countCoordinates(local) <= BUFFER_BATCH_COORDINATES) {
    shapes = robustly(geo, local, UTM_SNAP_GRID, buffer).toArrays();
  } else {
    const parts = [];
    batchOperand(local, BUFFER_BATCH_COORDINATES).forEach((batch) => {
      parts.push(...robustly(geo, batch, UTM_SNAP_GRID, buffer).toArrays());
    });
    shapes = robustly(geo, { polygons: parts, lines: [], points: [] }, UTM_SNAP_GRID, (o) =>
      geo.union(o.polygons)
    ).toArrays();
  }
  return translateOperand({ polygons: shapes, lines: [], points: [] }, origin).polygons;
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
    const buffered = shapesToGeometry(bufferOperand(geo, operand, meters));
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
  const geometry = await recovering((geo) => bufferWith(geo, [feature], meters));
  return {
    type: "Feature",
    properties: {},
    geometry,
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
  return recovering((geo) => bufferWith(geo, features, meters));
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
  return recovering((geo) => unionWith(geo, features));
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
      if (describeError(err) === GEOMETRY_ERRORS.OUT_OF_MEMORY) {
        reset();
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
