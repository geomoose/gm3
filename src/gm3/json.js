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

/** Functions for manipulating and cleaning JSON values.
 *
 *  This module is deliberately dependency free. It is imported by the
 *  GeoParquet web worker, and every module reachable from here has to be
 *  downloaded and evaluated before the worker can handle its first
 *  message. Keep OpenLayers, reqwest, and the rest of util.js out of it.
 */

// JSON.stringify throws on a BigInt, so they become strings wherever
//  they turn up, including nested inside an object.
const bigIntReplacer = (key, value) => (typeof value === "bigint" ? value.toString() : value);

/**
 * Clean feature properties to be better stored in state
 *
 * @param properties - Feature properties
 *
 * @returns Object. The same properties but scrubbed for redux storage
 */
export const scrubProperties = (properties) => {
  const cleanProps = {};
  Object.keys(properties).forEach((key) => {
    const val = properties[key];
    // convert all dates to their ISO string equivalent for storage
    if (val instanceof Date) {
      cleanProps[key] = val.toISOString();
      // BigInts survive a structured clone out of the worker but not
      //  JSON.stringify. Plain INT64 parquet columns arrive this way.
    } else if (typeof val === "bigint") {
      cleanProps[key] = val.toString();
      // Yikes, an object, give up and try JSON
    } else if (val instanceof Object) {
      cleanProps[key] = JSON.stringify(val, bigIntReplacer);
      // Oh good, this seems fine...
    } else {
      cleanProps[key] = val;
    }
  });
  return cleanProps;
};

// NaN !== NaN, so two NaN values would otherwise always be reported as
//  a difference. Note 0 === -0 is already true, which is what we want.
const sameScalar = (a, b) => a === b || (Number.isNaN(a) && Number.isNaN(b));

/** Convert the data type of a set of properties.
 *
 *  @param transforms Object mapping a property name to "string" or "number".
 *  @param properties The properties to convert.
 *
 *  @returns A new properties object, the input is not modified.
 */
export function transformProperties(transforms, properties) {
  const newProperties = Object.assign({}, properties);

  for (const prop in transforms) {
    let value = properties[prop];
    switch (transforms[prop]) {
      case "string":
        value = "" + value;
        break;
      case "number":
        value = parseFloat(value);
        break;
      default:
      // do nothing on default.
    }
    newProperties[prop] = value;
  }

  return newProperties;
}

/* Convert the data type of feature properties.
 *
 * @param transforms Object of transforms to apply.
 * @param features   Array of GeoJSON features.
 *
 * @return The array of GeoJSON features.
 */
export function transformFeatures(transforms, features) {
  if (typeof transforms !== "object") {
    return features;
  }

  for (const feature of features) {
    feature.properties = transformProperties(transforms, feature.properties);
  }

  return features;
}

/** Compare two objects
 *
 *  Scalars are compared by value, and nested objects only when `deep`
 *  is set. Without `deep` a nested object is not descended into, so
 *  ({a: {x: 1}}, {a: {x: 2}}) reports no difference - that is the
 *  intended "shallow" behaviour, not an oversight.
 *
 *  Values which are not scalars or objects - a function or a symbol -
 *  are reported as differing even when identical, on the grounds that
 *  they cannot be meaningfully compared and do not belong in the
 *  JSON-shaped data this module deals with.
 *
 *  Both arguments must be objects; null or undefined will throw.
 *
 *  @param objA The first object
 *  @param objB The second object
 *  @param deep Whether to go "deeper" into the object.
 *
 *  @returns boolean, true if they differ, false if they are the same.
 */
export function objectsDiffer(objA, objB, deep) {
  const aKeys = Object.keys(objA),
    bKeys = Object.keys(objB);

  for (const key of aKeys) {
    const bType = typeof objB[key];
    switch (bType) {
      // if the key from a does not exist in b, then they differ.
      case "undefined":
        return true;
      // standard comparisons
      case "string":
      case "number":
      case "boolean":
      case "bigint":
        if (!sameScalar(objA[key], objB[key])) {
          return true;
        }
        break;
      // GO DEEP!
      case "object":
        // typeof(null) == 'object'. Settle a null, or anything on the
        //  "a" side which is not itself an object, by value here rather
        //  than recursing into Object.keys(null).
        if (objA[key] === null || objB[key] === null || typeof objA[key] !== "object") {
          if (objA[key] !== objB[key]) {
            return true;
          }
          break;
        }
        if (deep === true && objectsDiffer(objA[key], objB[key], true)) {
          return true;
        }
        break;
      default:
        // assume the objects differ if they cannot
        //  be typed.
        return true;
    }
  }

  // The above loop ensures that all the keys
  //  in "A" match a key in "B", if "B" has any
  //  extra keys then the objects differ.
  for (const key of bKeys) {
    if (aKeys.indexOf(key) < 0) {
      return true;
    }
  }

  return false;
}
