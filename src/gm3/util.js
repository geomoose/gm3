/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 Dan "Ducky" Little
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

import Request from 'reqwest';

import GeoJSONFormat from 'ol/format/GeoJSON';

import {featureFilter as createFilter} from '@mapbox/mapbox-gl-style-spec';

/** Collection of handy functions
 */

export function parseBoolean(bool, def = false) {
    if(typeof(bool) == 'undefined' || bool === null) { return def; }
    const boolString = '' + bool;
    if(boolString.match(/true/i)) { return true; }
    else if(boolString === '1') { return true; }
    else if(boolString.match(/on/i)) { return true; }
    return false;
}


/** Take in an XML node and return all the text
 *  contained within that node.
 *
 *  @param node  The XML node.
 *
 *  @returns Text in the node.
 */
export function getXmlTextContents(node) {
    if(node.firstChild) {
        return node.firstChild.nodeValue;
    } else if(node.text) {
        return node.text;
    } else if(node.textContent) {
        return node.textContent;
    }

    return '';
}


/** Parse a node from XML and return the text value.
 *
 *  Handy in this situation...
 *   <map>SOME STUFF HERE</map>
 *  Specify 'map' and 'SOME STUFF HERE' will be returned
 *  by the function.  Only the first 'tag' will be found if the
 *  xml fragment has multiple, unless 'multiple' is set to true.
 *
 *  @param xml      An XML fragment.
 *  @param tagName  The tagname to return.
 *  @param multiple Whether to return an array or the first element.
 *
 *  @returns Value of the text in the tag, or null if not found.
 */
export function getTagContents(xml, tagName, multiple) {
    // setup the array to handle multiple
    const contents = [];

    const tags = xml.getElementsByTagName(tagName);
    for(let i = 0, ii = tags.length; i < ii; i++) {
        const tag = tags[i];
        const node_value = getXmlTextContents(tag);
        // when multiple is not true, return the first value.
        if(multiple === true) {
            contents.push(node_value);
        } else {
            return node_value;
        }
    }

    return contents;
}

/** Compare two objects
 *
 *  @param objA The first object
 *  @param objB The second object
 *  @param deep Whether to go "deeper" into the object.
 *
 *  @returns boolean, true if they differ, false if they are the same.
 */
export function objectsDiffer(objA, objB, deep) {
    const a_keys = Object.keys(objA), b_keys = Object.keys(objB);

    for(const key of a_keys) {
        const b_type = typeof(objB[key]);
        switch(b_type) {
            // if the key from a does not exist in b, then they differ.
            case 'undefined':
                return true;
            // standard comparisons
            case 'string':
            case 'number':
                if(objA[key] !== objB[key]) {
                    return true;
                }
                break;
            // GO DEEP!
            case 'object':
                // typeof(null) == 'object', this
                //  prevents trying to recurse on null
                if(objB[key] == null) {
                    if(objA[key] != null) {
                        return true;
                    }
                }
                if(deep === true && objectsDiffer(objA[key], objB[key], true)) {
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
    for(const key of b_keys) {
        if(a_keys.indexOf(key) < 0) {
            return true;
        }
    }

    return false;
}


/** Get the map-sources name.  Paths are "/" split
 *  and so the first component should be the map-source name.
 *
 *  @param path
 *
 *  @returns a string with the map-source's name.
 */
export function getMapSourceName(path) {
    if(path === null) { return ''; }
    return path.split('/')[0];
}

/** Get the later name, path's last "/" should be the layer name.
 *
 * @param path
 *
 * @returns a layer name
 */
export function getLayerName(path) {
    if(path === null) { return ''; }
    const c = path.split('/');
    c.shift();
    // layers can have "/" in the name, so they need
    //  rejoined after removing the map-source name.
    return c.join('/');
}

/** Properly escape and join parameters for a URL
 *
 *  @params {Object} params an object of parameters.
 *  @params {Array}  stripParams a list of parameters to remove from the object.
 *
 *  @returns {String}
 */
export function formatUrlParameters(params, stripParams = []) {
    const formatted_params = [];
    for(const key in params) {
        // ignore any params in stripParams
        if (stripParams.indexOf(key) <= 0) {
            const formatted_value = encodeURIComponent(params[key]);
            formatted_params.push(key + '=' + formatted_value);
        }
    }
    return formatted_params.join('&');
}


/** Formatting options for markup-js
 *
 *  These options are centralized here so they can
 *  be included anywhere markup is used.
 *
 */
export const FORMAT_OPTIONS = {
    pipes: {
        localize: function(n) {
            return n.toLocaleString();
        },
        json: obj => JSON.stringify(obj),
    }
}


/* Check to see if a value is in a list.
 *
 * @param value The value to test.
 * @param list  The list with acceptable values.
 *
 * @return Boolean.
 */
function inList(value, list) {
    return (list.indexOf(value) >= 0);
}

/* Check to see if a value is in a range from min to max.
 *
 * @param value The value to test.
 * @param min   The minimum value (or null if no minimum)
 * @param max   The maximum value (or null if no maximum)
 *
 * @return Boolean.
 */
function inRange(value, min = null, max = null) {
    if(min !== null && max !== null) {
        return (min < value && value < max);
    }
    if(min === null) {
        return (value < max);
    }
    if(max === null) {
        return (min < value);
    }

    // if everything is null, then the value is
    //  considered in range.
    return true;
}

/** Check to see if a feature matches the given filter.
 *
 *  @param {Array} features The list of features
 *  @param {Object} filter key-value pairs of filter for the features.
 *
 *  @returns {Boolean} whether the feature matches.
 */
export function featureMatch(feature, filter) {
    const match_all = (filter.match === 'any') ? false : true;
    for(const filter_key in filter) {
        const filter_def = filter[filter_key];
        const prop_val = feature.properties[filter_key];
        let v = false;
        switch(filter_def.type) {
            // range filters can have a min, max, or both.
            case 'range':
                v = inRange(prop_val, filter_def.min, filter_def.max);
                break;
            case 'list':
                v = inList(prop_val, filter_def.value);
                break;
            // simple equals match
            case 'equals':
                v = (filter_def.value === prop_val);
                break;
            // no ".type" was set, assume the filter
            // is defined as an "equals" match, e.g. {'PIN' : '123456'}
            default:
                // if filter_def is an array, or specified
                //  as a "list type" then do the list match.
                if(Array.isArray(filter_def)) {
                    v = inList(prop_val, filter_def);
                } else {
                    // check to see if the values match
                    v = (filter_def === prop_val);
                }
        }
        // if they match, and this is an 'any' search then short-circuit
        //  and return true;
        if(v && !match_all) { return true; }
        // if this value doesn't match, and require matching all
        //  then this can short-circuit and return false;
        if(!v && match_all) { return false; }
    }

    // no false values could have been set
    //  and reach this point with match_all
    if(match_all) {
        return true;
    }

    // no true values + match-any search could
    //  reach this point
    return false;
}

/** Filter features from a list of features
 *
 *  @param {Array} features The list of features
 *  @param {Object} filter key-value pairs of filter for the features.
 *  @param {Boolean} inverse Optional. Defaults to true.
 *                           When true, filter out matching features.
 *                           When false,return matching features.
 *
 * @returns New list of features.
 */
export function filterFeatures(features, filter, inverse = true) {
    const new_features = [];

    // the createFilter function is from mapbox!
    // uses the mapbox gl style filters.
    let filter_function = function() { return true; };

    if (filter !== undefined && filter !== null ) {
        filter_function = createFilter(['all'].concat(filter)).filter;
    }

    if (features) {
        for (let x = 0, xx = features.length; x < xx; x++) {
            const feature = features[x];
            if(inverse !== filter_function({zoom: 15}, feature)) {
                new_features.push(feature);
            }
        }
    }

    return new_features;
}

/* Match the feature specified by the filter.
 *
 * This is really a wrapper around filterFeatures and is presented
 * for code-clarity.
 *
 * @param {Array}  features The list of features.
 * @param {Object} filter   Filter objects. key-value-pairs or {field: '', type: '', value/min/max}
 *
 * @returns New list of features.
 */
export function matchFeatures(features, filter) {
    // when no filter is applied, just return the features.
    if(filter === undefined || filter === null || filter === false) {
        return features;
    }

    return filterFeatures(features, filter, false);
}

/** Update feature properties.
 *
 *  @param {Array} features The list of features
 *  @param {Object} filter key-value pairs of filter for the features.
 *  @param {Object} properties The new values for the features.
 *  @param {Object} geometry  An Object definition of the geometry
 *
 * @returns New list of features.
 */
export function changeFeatures(features, filter, properties, geometry) {
    const new_features = [];

    for(const feature of features) {
        if(featureMatch(feature, filter)) {
            const new_feature = Object.assign({}, feature);
            if(properties) {
                new_feature.properties = Object.assign({}, feature.properties, properties);
            }
            if(geometry) {
                new_feature.geometry = Object.assign({}, geometry);
            }
            new_features.push(new_feature);
        } else {
            new_features.push(feature);
        }
    }

    return new_features;
}

/** Easy to stomach 'return me the version' fuction, the version
 *  is set using webpack and parses the package.json file to get it.
 *
 */
export function getVersion() {
    // this will be replaced by a version string by Webpack.
    // eslint-disable-next-line
    return GM_VERSION;
}

/** Determine the extent of the features in a source.
 *  WARNING! This only works with vector sources.
 *
 * @param {MapSource} mapSource
 *
 * @returns Array containing [minx,miny,maxx,maxy]
 */
export function getFeaturesExtent(mapSource) {
    const bounds = [null, null, null, null];

    const min = function(x, y) {
        if(x === null || y < x) { return y; }
        return x;
    };

    const max = function(x, y) {
        if(x === null || y > x) { return y; }
        return x;
    };

    const update_bounds = function(x, y) {
        bounds[0] = min(bounds[0], x);
        bounds[1] = min(bounds[1], y);
        bounds[2] = max(bounds[2], x);
        bounds[3] = max(bounds[3], y);
    };

    if(mapSource.features) {
        for(const feature of mapSource.features) {
            const geom = feature.geometry;
            if(geom.type === 'Point') {
                update_bounds(geom.coordinates[0], geom.coordinates[1]);
            } else if(geom.type === 'LineString') {
                for(const pt of geom.coordinates) {
                    update_bounds(pt[0], pt[1]);
                }
            } else if(geom.type === 'Polygon' || geom.type === 'MultiLineString') {
                for(const ring of geom.coordinates) {
                    for(const pt of ring) {
                        update_bounds(pt[0], pt[1]);
                    }
                }
            }
        }
    }

    return bounds;
}

/* Configure a set of projections useful for GeoMoose.
 *
 * At this point this will just configure the UTM zones
 * as they are used to do accurate measurement and buffers.
 *
 * @param {Proj4} p4 The Proj4 Library.
 *
 */
export function configureProjections(p4) {
    // var utm_zone = GeoMOOSE.getUtmZone(bounds.left);
    // var north = bounds.top > 0 ? 'north' : 'south';

    for(let utm_zone = 1; utm_zone <= 60; utm_zone++) {
        for(const north of ['north', 'south']) {
            // southern utm zones are 327XX, northern 326XX
            const epsg_code = 32600 + utm_zone + (north === 'north' ? 0 : 100);

            const proj_id = 'EPSG:' + epsg_code;
            const proj_alias = 'UTM' + utm_zone + (north === 'north' ? 'N' : 'S');
            // it's nice to have a formulary.
            const proj_string = '+proj=utm +zone=' + utm_zone + ' +' + north + '+datum=WGS84 +units=m +no_defs';

            // set up the standard way of calling the projection
            //  (using the EPSG Code)
            p4.defs(proj_id, proj_string);
            // add an alias, so it can be referred by 'UTM15N' for example.
            p4.defs(proj_alias, p4.defs(proj_id));
        }
    }

}

/**
 * addProjDef
 * Add a projection definition
 *
 * @param {object} p4 - the proj4js library
 * @param {string} code - an ID used to refer to the defined projection
 * @param {string} def - a proj4/wkt string used to define a projection
 */
export function addProjDef(p4, code, def) {
    p4.defs(code, def);
}

/* Determine the UTM zone for a point
 *
 * @param {Point-like} An array containing [x,y] in WGS84 or NAD83 DD
 *
 * @return UTM string (e.g. UTM15N)
 */
export function getUtmZone(pt) {
    // No citation provideded for this calculation,
    // it was working in the GM2.X series without a lot
    // of complaints.
    const zone = Math.floor((pt[0] / 6.0) + 30) + 1;

    // north zones are north of 0.
    const north = (pt[1] > 0) ? 'N' : 'S';

    // boom, string ot the user.
    return 'UTM' + zone + north;
}

const GEOJSON_FORMAT = new GeoJSONFormat();

export function geomToJson(geom) {
    return GEOJSON_FORMAT.writeGeometryObject(geom);
}

export function jsonToGeom(geom) {
    return GEOJSON_FORMAT.readGeometry(geom);
}

export function featureToJson(feature) {
    return GEOJSON_FORMAT.writeFeatureObject(feature);
}

export function jsonToFeature(feature, options = {}) {
    return GEOJSON_FORMAT.readFeature(feature, options);
}

const EQUIVALENT_METERS = {
    'ft': 0.3048,
    'yd': 0.9144,
    'mi': 1609.347,
    'in': 0.0254,
    'm': 1,
    'km': 1000,
    'ch': 20.11684,
    'a': 63.63,
    'h': 100
};

/** Converts numeric lengths between given units
 *
 * @param {number} length - Length
 * @param {string} srcUnits - Source unit
 * @param {string} destUnits - Destination unit
 * @return {number} Converted length
 */
export function convertLength(length, srcUnits, destUnits) {
    // US survey feet, miles
    return length * EQUIVALENT_METERS[srcUnits] / EQUIVALENT_METERS[destUnits];
}

/** Converts numeric areas between given units
 *
 * @param {number} area - Area
 * @param {string} srcUnits - Source unit
 * @param {string} destUnits - Destination unit
 * @return {number} Converted area
 */
export function convertArea(area, srcUnits, destUnits) {
    // US survey feet, miles
    return area * Math.pow(EQUIVALENT_METERS[srcUnits], 2) / Math.pow(EQUIVALENT_METERS[destUnits], 2);
}

/* Convert  Meters to a given units.
 *
 */
export function metersLengthToUnits(meters, units) {
    return convertLength(meters, 'm', units);
}

/* Convert Square Meters to a given units.
 *
 */
export function metersAreaToUnits(meters, units) {
    return convertArea(meters, 'm', units);
}

/* Check to see if a layer should be checked or not.
 *
 * @param mapSources The mapsources section of the state tree.
 * @param layer      The catalog layer definition.
 *
 */
export function isLayerOn(mapSources, layer) {
    // during "bootstrap" mapSources can be undefined,
    //  this catches that scenario.
    if(!mapSources) { return false };

    // assume the layer is on
    let is_on = true;
    // iterate through each src,
    //  if any are off, mark the checkbox as "off".
    for(let s = 0, ss = layer.src.length; s < ss; s++) {
        const src = layer.src[s];

        if(mapSources[src.mapSourceName]) {
            const map_source = mapSources[src.mapSourceName];
            for(let l = 0, ll = map_source.layers.length; l < ll; l++) {
                const layer = map_source.layers[l];
                if(layer.name === src.layerName) {
                    is_on = (is_on && layer.on);
                }
            }
        } else {
            return false;
        }
    }
    return is_on;
}

/* Given the map sources and a catalog layer definition
 * get the zIndex.
 *
 * @param mapSources The mapSources from the state.
 * @param layer      The layer definition from the catalog.
 *
 * @return The Z Index.
 */
export function getZValue(mapSources, layer) {
    // only care about the first src
    const src = layer.src[0];
    return mapSources[src.mapSourceName].zIndex;
}

/* Sort the list of visible catalog layers by their zIndex.
 *
 * @param catalog The catalog from the state.
 * @param mapSources The mapSources section of the state.
 *
 * @return An array of objects with two keys zIndex and layer.
 *         zIndex is an integer, layer is the catalog definition
 *         of a layer.
 */
export function getLayersByZOrder(catalog, mapSources) {
    const layers = [];
    for(const key of Object.keys(catalog)) {
        const node = catalog[key];
        // no children, should be a layer
        if(node && typeof(node.children) === 'undefined') {
            if(isLayerOn(mapSources, node)) {
                layers.push({
                    zIndex: getZValue(mapSources, node),
                    layer: node
                });
            }
        }
    }

    // sort the catalog layers by zIndex
    layers.sort(function(a, b) {
        return (a.zIndex > b.zIndex) ? -1 : 1;
    });

    return layers;
}

/** Bridge to a useful AJAX handler.
 *
 *  this is really a direct bridge to reqwest, which is the
 *  httplib used by the application.
 *
 *  @param {Object} opts The options for Reqwest.
 *
 */
export function xhr(opts) {
    return Request(opts);
}


export function transformProperties(transforms, properties) {
    const new_properties = Object.assign({}, properties);

    for(const prop in transforms) {
        let value = properties[prop];
        switch(transforms[prop]) {
            case 'string':
                value = '' + value;
                break
            case 'number':
                value = parseFloat(value);
                break;
            default:
                // do nothing on default.
        }
        new_properties[prop] = value;
    }

    return new_properties;
}

/* Convert the data type of feature properties.
 *
 * @param transforms Object of transforms to apply.
 * @param features   Array of GeoJSON features.
 *
 * @return The array of GeoJSON features.
 */
export function transformFeatures(transforms, features) {
    if(typeof(transforms) !== 'object') {
        return features;
    }

    for(const feature of features) {
        feature.properties = transformProperties(transforms, feature.properties);
    }

    return features;
}

/** Calculate the length of a GET query.
 *
 *  @param data An object of KVP.
 *
 * @returns An integer.
 */
export function requEstimator(data) {
    return formatUrlParameters(data).length;
}

/** Reproject a set of GeoJSON features.
 *
 *  @param features An array of GeoJSON features.
 *  @param srcProj  The source projection.
 *  @param destProj The destination projection.
 *
 *  @returns an Array of features in destProj.
 */
export function projectFeatures(features, srcProj, destProj) {
    // fake the array of features as a feature collection.
    const new_features = GEOJSON_FORMAT.readFeatures({
        type: 'FeatureCollection',
        features: features
    }, {
        dataProjection: srcProj,
        featureProjection: destProj
    });

    // the output will be a feature collection,
    //  the ".features" ensures an array is returned.
    return (GEOJSON_FORMAT.writeFeaturesObject(new_features)).features;
}

/**
 * Compare two objects by their JSON strings.
 *
 * @param a First object to compare.
 * @param b Second object to compare.
 *
 * @returns Boolean, true if they match, false if not.
 */
export function jsonEquals(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}


/** Get the extent of a query's results.
 *  All features must have a boundedBy property.
 */
export function getExtentForQuery(results, minSize = 150) {
    let extent = null;

    for(const path in results) {
        const features = results[path];
        if(features.length > 0) {
            if(extent === null) {
                extent = features[0].properties.boundedBy.slice();
            }
            for(let i = 1, ii = features.length; i < ii; i++) {
                const e = features[i].properties.boundedBy;
                extent[0] = Math.min(extent[0], e[0]);
                extent[1] = Math.min(extent[1], e[1]);
                extent[2] = Math.max(extent[2], e[2]);
                extent[3] = Math.max(extent[3], e[3]);
            }
        }
    }

    if (extent !== null) {
        if (extent[2] - extent[0] < minSize) {
            const mid_x = (extent[0] + extent[2]) / 2;
            extent[0] = mid_x - minSize;
            extent[2] = mid_x + minSize;
        }
        if (extent[3] - extent[1] < minSize) {
            const mid_y = (extent[1] + extent[3]) / 2;
            extent[1] = mid_y - minSize;
            extent[3] = mid_y + minSize;
        }
    }

    return extent;
}

/**
 * Calculate the scale based on the projection and resolution.
 * Very much inspired by ol/source/ImageWMS
 *
 * @params resolution - Resolution from the map
 * @params projection - Map projection
 *
 * @returns Number. The scale.
 */
export function getScale(resolution, projection) {
    const mpu = projection ? projection.getMetersPerUnit() : 1;
    const dpi = 25.4 / 0.28;
    const inchesPerMeter = 39.37;
    return resolution * mpu * inchesPerMeter * dpi;
}

/**
 * Ensure there is no funny business joining a URL to its parameters.
 *
 * @param url - The URL
 * @param params - GET parameters for the URL
 *
 * @returns String. The join URL and paramaters.
 */
export function joinUrl(url, params) {
    let r = url;
    if (url.substring(url.length - 1) !== '?') {
        r += '?';
    }
    return r + formatUrlParameters(params);
}

/** "Buffer" a point in a square fashion
 *
 * @param point - The point [x, y], in ground units.
 * @param buffer - The buffer width, in ground units.
 *
 * returns A GeoJSON polygon feature with a square geometry.
 *
 */
export const getSquareBuffer = (point, buffer) => ({
    type: 'Feature',
    properties: {},
    geometry: {
        type: 'Polygon',
        coordinates: [[
            [point[0] - buffer, point[1] - buffer],
            [point[0] - buffer, point[1] + buffer],
            [point[0] + buffer, point[1] + buffer],
            [point[0] + buffer, point[1] - buffer],
            [point[0] - buffer, point[1] - buffer],
        ]],
    },
});
