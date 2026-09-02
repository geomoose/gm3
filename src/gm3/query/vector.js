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

import { getSource } from "../featureStore";

const GEOJSON_FORMAT = new GeoJSONFormat();

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
  // if a selection is available, use it as a geometry filter
  const selection = query.selection?.[0];

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

  // return an empty set if no filters are set.
  if (!selection && fieldFilters.length < 1) {
    return {
      layer,
      features: [],
    };
  }

  // when the features live in an OpenLayers source, query them
  //  in place instead of from a copy in the store
  const olSource = getSource(mapSource.name);
  if (olSource !== null) {
    // the spatial index narrows the candidates down to those
    //  whose extents intersect the selection's extent
    const candidates = selection
      ? olSource.getFeaturesInExtent(GEOJSON_FORMAT.readGeometry(selection.geometry).getExtent())
      : olSource.getFeatures();

    const features = [];
    for (const olFeature of candidates) {
      const properties = olFeature.getProperties();
      // evaluate the attribute filters before paying for
      //  the GeoJSON conversion and precise intersection test
      if (fieldFilters.every((filterFn) => filterFn({ properties }))) {
        const feature = GEOJSON_FORMAT.writeFeatureObject(olFeature);
        if (!selection || intersects(selection, feature.geometry)) {
          features.push(feature);
        }
      }
    }
    return {
      layer,
      features,
    };
  }

  // fall back to features kept in the store (e.g. "vector" sources)
  let features = mapSource.features || [];
  if (selection) {
    features = features.filter((feature) => intersects(selection, feature.geometry));
  }
  fieldFilters.forEach((filterFn) => {
    features = features.filter(filterFn);
  });
  return {
    layer,
    features,
  };
};
