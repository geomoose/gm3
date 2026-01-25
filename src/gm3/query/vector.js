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

import intersects from "@turf/boolean-intersects";
import GeoJSONFormat from "ol/format/GeoJSON";
import { createEmpty, extend, intersects as extentsIntersect } from "ol/extent";

import { getSource } from "@gm3/featureStore";
import { applyPixelTolerance } from "@gm3/query/util";

const GEOJSON_FORMAT = new GeoJSONFormat();

// the same default the WFS query uses. Both are overridden per
//  map-source by config["pixel-tolerance"].
const DEFAULT_PIXEL_TOLERANCE = 10;

// RegExp.escape is not available until ES2025
const escapeRegExp = (literal) => literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// converts the SQL-style wild cards of '%' and '_' to their equivalent
//  reg-exp expressions and compiles them
const likeSQLtoRegExp = (pattern, ignoreCase = false) => {
  const parts = [];

  const addLiteral = () => {
    parts.push(escapeRegExp(currentLiteral));
    currentLiteral = "";
  };

  let currentLiteral = "";
  for (let i = 0, len = pattern.length; i < len; i++) {
    // substring is rollover safe
    const chr = pattern.substring(i, i + 1);
    const next = pattern.substring(i + 1, i + 2);

    if (chr === "\\") {
      // SQL does not have fancy escaping techniques
      currentLiteral += next;
      i += 1;
    } else if (chr === "%") {
      // SQL wild card, yahoo.
      addLiteral();
      parts.push(".*");
    } else if (chr === "_") {
      // this is the single character match
      addLiteral();
      parts.push(".");
    } else {
      currentLiteral += chr;
    }
  }
  // ensure any trailing literal bits are added.
  if (currentLiteral.length > 0) {
    addLiteral();
  }

  const flags = ignoreCase ? "i" : "";
  const rePattern = parts.join("");
  return new RegExp(`^${rePattern}$`, flags);
};

/* This mapping is based on what is available in the WFS module
 */
export const FILTER_FUNCTIONS = {
  like: (filter, ignoreCase = false) => {
    const re = likeSQLtoRegExp(filter.value, ignoreCase);
    return (f) => {
      const value = f.properties[filter.name];
      // null values never match a like, this also coerces
      //  numbers to strings so they do not throw on .match
      return value !== null && value !== undefined && re.test(String(value));
    };
  },
  ilike: (filter) => {
    return FILTER_FUNCTIONS.like(filter, true);
  },
  eq: (filter) => {
    // this is intentionally untype checked!
    return (f) => f.properties[filter.name] == filter.value;
  },
  ge: (filter) => {
    return (f) => f.properties[filter.name] >= filter.value;
  },
  gt: (filter) => {
    return (f) => f.properties[filter.name] > filter.value;
  },
  le: (filter) => {
    return (f) => f.properties[filter.name] <= filter.value;
  },
  lt: (filter) => {
    return (f) => f.properties[filter.name] < filter.value;
  },
};

/** Convert a query field definition into a feature filter function.
 *
 *  Fields can either be a simple {comparitor, name, value} definition
 *  or a nested ["and"/"or", ...fields] array as created by services
 *  using prepareFields.
 *
 *  Unsupported definitions throw. Dropping them instead would invert the
 *  meaning of the enclosing operator - an empty "and" matches everything
 *  and an empty "or" matches nothing - which silently returns the wrong
 *  features rather than reporting the problem.
 *
 *  @returns A filter function.
 */
export const buildFilterFunction = (field) => {
  if (Array.isArray(field)) {
    const [operator, ...subFields] = field;
    const subFilters = subFields.map(buildFilterFunction);
    if (operator === "and") {
      return (f) => subFilters.every((filterFn) => filterFn(f));
    } else if (operator === "or") {
      return (f) => subFilters.some((filterFn) => filterFn(f));
    }
    throw new Error(`Unsupported filter operator: ${operator}`);
  }
  if (field.comparitor in FILTER_FUNCTIONS) {
    return FILTER_FUNCTIONS[field.comparitor](field);
  }
  throw new Error(`Unsupported filter comparitor: ${field.comparitor}`);
};

export const vectorFeatureQuery = async (layer, mapState, mapSource, query) => {
  let fieldFilters;
  try {
    fieldFilters = (query.fields || []).map(buildFilterFunction);
  } catch (err) {
    // an unsupported filter cannot be safely approximated. fail just
    //  this layer - runQuery gathers the layers with Promise.all, so
    //  throwing here would take down every other layer in the query.
    console.error(`[gm3:query] Cannot query ${layer}:`, err.message);
    return {
      layer,
      features: [],
    };
  }

  // Identify produces a zero-area Point, which can never intersect a
  //  parcel. Buffering it by the pixel tolerance is what makes
  //  click-to-identify work, and is what the WFS and AGS queries
  //  already do. applyPixelTolerance only touches Points, so running
  //  it over the whole list is a no-op for drawn polygons.
  const selections = (query.selection || []).map((selectionFeature) =>
    applyPixelTolerance(selectionFeature, mapSource, mapState.resolution, DEFAULT_PIXEL_TOLERANCE)
  );
  const hasSelection = selections.length > 0;

  // computed once here rather than per candidate feature
  const selectionExtents = selections.map((selectionFeature) =>
    GEOJSON_FORMAT.readGeometry(selectionFeature.geometry).getExtent()
  );

  /** Cheap gate. An extent overlap is a necessary condition for a
   *  geometry intersection, so a miss here is always a real miss.
   */
  const extentCouldMatch = (featureExtent) => {
    for (let i = 0, ii = selectionExtents.length; i < ii; i++) {
      if (extentsIntersect(selectionExtents[i], featureExtent)) {
        return true;
      }
    }
    return false;
  };

  /** Precise test, skipping any selection this feature cannot reach.
   *  Every selection is ORed together, matching buildWfsQuery.
   */
  const matchesSelection = (geometry, featureExtent) => {
    if (!hasSelection) {
      return true;
    }
    if (!geometry) {
      // turf throws on a null geometry, and a feature without one
      //  cannot intersect anything anyway
      return false;
    }
    for (let i = 0, ii = selections.length; i < ii; i++) {
      if (featureExtent && !extentsIntersect(selectionExtents[i], featureExtent)) {
        continue;
      }
      if (intersects(selections[i], geometry)) {
        return true;
      }
    }
    return false;
  };

  // return an empty set if no filters are set.
  if (!hasSelection && fieldFilters.length < 1) {
    return {
      layer,
      features: [],
    };
  }

  // when the features live in an OpenLayers source, query them
  //  in place instead of from a copy in the store
  const olSource = getSource(mapSource.name);
  if (olSource !== null) {
    // the spatial index narrows the candidates down to those whose
    //  extents intersect the combined extent of the selections
    let candidates;
    if (hasSelection) {
      const searchExtent = createEmpty();
      selectionExtents.forEach((selectionExtent) => extend(searchExtent, selectionExtent));
      candidates = olSource.getFeaturesInExtent(searchExtent);
    } else {
      candidates = olSource.getFeatures();
    }

    const features = [];
    for (const olFeature of candidates) {
      const properties = olFeature.getProperties();
      // evaluate the attribute filters first, they are the cheapest
      if (!fieldFilters.every((filterFn) => filterFn({ properties }))) {
        continue;
      }

      // then reject on the extent, before paying for the GeoJSON
      //  conversion which is the expensive step in this loop
      let featureExtent = null;
      if (hasSelection) {
        const geometry = olFeature.getGeometry();
        if (!geometry) {
          // defensive: OpenLayers keeps null-geometry features out of
          //  the RTree, so getFeaturesInExtent should never hand us one
          continue;
        }
        featureExtent = geometry.getExtent();
        if (!extentCouldMatch(featureExtent)) {
          continue;
        }
      }

      const feature = GEOJSON_FORMAT.writeFeatureObject(olFeature);
      if (matchesSelection(feature.geometry, featureExtent)) {
        features.push(feature);
      }
    }
    return {
      layer,
      features,
    };
  }

  // fall back to features kept in the store (e.g. "vector" sources).
  //  these already carry boundedBy, so the extent gate is free.
  let features = mapSource.features || [];
  if (hasSelection) {
    features = features.filter((feature) =>
      matchesSelection(feature.geometry, feature.properties?.boundedBy)
    );
  }
  fieldFilters.forEach((filterFn) => {
    features = features.filter(filterFn);
  });
  return {
    layer,
    features,
  };
};
