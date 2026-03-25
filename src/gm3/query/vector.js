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

// converts the SQL-style wild cards of '%' and '_' to their equivalent
//  reg-exp expressions and compiles them
const likeSQLtoRegExp = (pattern, ignoreCase = false) => {
  const parts = [];

  const addLiteral = () => {
    parts.push(RegExp.escape(currentLiteral));
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
      addLiteral(currentLiteral);
      parts.push(".*");
    } else if (chr === "_") {
      // this is the single character match
      addLiteral(currentLiteral);
      parts.push(".");
    } else {
      currentLiteral += chr;
    }
  }
  // ensure any trailing literal bits are added.
  if (currentLiteral.length > 0) {
    addLiteral(currentLiteral);
  }

  const flags = ignoreCase ? "i" : "";
  const rePattern = parts.join("");
  return new RegExp(rePattern, flags);
};

/* This mapping is based on what is available in the WFS module
 */
export const FILTER_FUNCTIONS = {
  like: (filter, ignoreCase = false) => {
    const re = likeSQLtoRegExp(filter.value, ignoreCase);
    return (f) => f.properties[filter.name]?.match(re) !== null;
  },
  ilike: (filter) => {
    return FILTER_FUNCTIONS.like(filter, true);
  },
  eq: (filter) => {
    // this is intentionally untype checked!
    return (f) => f.properties[filter.name] == filter.value;
  },
  ge: (filter) => {
    return (f) => filter.value >= f.properties[filter.name];
  },
  gt: (filter) => {
    return (f) => filter.value > f.properties[filter.name];
  },
  le: (filter) => {
    return (f) => filter.value <= f.properties[filter.name];
  },
  lt: (filter) => {
    return (f) => filter.value < f.properties[filter.name];
  },
};

export const vectorFeatureQuery = async (layer, mapState, mapSource, query) => {
  const filters = [];

  // if a selection is available, use it as a geometry filter
  const selection = query.selection?.[0];
  if (selection) {
    filters.push((feature) => {
      return intersects(selection, feature.geometry);
    });
  }

  console.log(query.fields);

  query.fields?.forEach((field) => {
    if (field.comparitor in FILTER_FUNCTIONS) {
      filters.push(FILTER_FUNCTIONS[field.comparitor](field));
    }
  });

  console.log("filters=", filters);

  // return an empty set if no filters are set.
  if (filters.length < 1) {
    return {
      layer,
      features: [],
    };
  }

  // iterate through the features, applying each to the list
  let features = mapSource.features || [];
  filters.forEach((filterFn) => {
    features = features.filter(filterFn);
  });
  return {
    layer,
    features,
  };
};
