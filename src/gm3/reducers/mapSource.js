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

/** Reduces Map-Sources
 *
 */

import uuid from 'uuid';
import { MAPSOURCE } from '../actionTypes';
import { changeFeatures, filterFeatures } from '../util';

/** Use this to toggle boolean values on a layer.
 *
 *  @param state The current state.
 *  @param action The action definition from the user.
 *  @param attr   An attribute that should be found in both
 *                   the action and the layer.
 *
 * @returns a new state.
 */
function setLayerAttribute(state, action, attr) {
    // make a copy of the layers list
    const layers = [];
    if(!state[action.mapSourceName]) {
        // no state changes if we can't find the mapsource.
        return state;
    }

    for(let i = 0, ii = state[action.mapSourceName].layers.length; i < ii; i++) {
        // copy each layer and update the matching one.
        const layer = Object.assign({}, state[action.mapSourceName].layers[i]);
        if(layer.name === action.layerName) {
            if(action.type === MAPSOURCE.SET_TEMPLATE) {
                layer.templates[action.name] = action.template;
            } else {
                layer[attr] = action[attr];
            }
        }
        layers.push(layer);
    }

    const ms = Object.assign({}, state[action.mapSourceName], {
        layers
    });

    const mix = {};
    mix[action.mapSourceName] = ms;

    return Object.assign({}, state, mix);
}

/** Change the features on a map-source.
 *
 *  This handles removing and adding features to a map-source. There is
 *  no bespoke 'update' process at this point.  New features are tagged
 *  with a "_uuid" property in order to identify them.
 *
 *  All features passed in should be *GeoJson* feature not OpenLayers
 *  features.  The map handles that.
 */
function changeMapSourceFeatures(state, action) {
    const map_source = state[action.mapSourceName];

    let features = [];
    let version = 1;

    if(map_source.features) {
        features = map_source.features.slice();
        version = map_source.featuresVersion;
    }

    const id_prop = '_uuid';

    switch(action.type) {
        case MAPSOURCE.ADD_FEATURES:
            // add an ID to the features
            for(let x = 0, xx = action.features.length; !action.copy && x < xx; x++) {
                const id_mixin = {};
                id_mixin[id_prop] = uuid();
                action.features[x].properties = Object.assign({},
                    action.features[x].properties,
                    id_mixin
                );
            }
            features = features.concat(action.features);
            version += 1;
            break;
        case MAPSOURCE.CLEAR_FEATURES:
            features = [];
            version += 1;
            break;
        // delete a specific feature
        case MAPSOURCE.REMOVE_FEATURE:
            features = [];
            for(const f of map_source.features) {
                if(f.properties[id_prop] !== action.id) {
                    features.push(f);
                }
            }
            version += 1;
            break;
        case MAPSOURCE.REMOVE_FEATURES:
            features = filterFeatures(features, action.filter);
            version += 1;
            break;
        case MAPSOURCE.CHANGE_FEATURES:
            features = changeFeatures(map_source.features, action.filter, action.properties);
            version += 1;
            break;
        case MAPSOURCE.MODIFY_GEOMETRY:
            features = changeFeatures(map_source.features, {'_uuid': action.id}, null, action.geometry);
            version += 1;
            break;
        default:
            // do nothing.
    }

    const update_obj = {};
    update_obj[action.mapSourceName] = Object.assign(map_source, {
        features: features,
        featuresVersion: version
    });

    return update_obj;
}

export const handleReload = (state, action) => {
    const mixin = {};
    const mapSource = state[action.mapSourceName];
    mixin[action.mapSourceName] = Object.assign({}, mapSource, {
        featuresVersion: mapSource.featuresVersion ? mapSource.featuresVersion + 1 : 1,
        params: Object.assign({}, mapSource.params, {
            _ck: '.' + (new Date()).getTime(),
        }),
    });
    return Object.assign({}, state, mixin);
}

export default function mapSource(state = [], action) {
    const new_elem = {};

    switch(action.type) {
        case MAPSOURCE.SET_ATTRIBUTE:
            return setLayerAttribute(state, action);
        case MAPSOURCE.LAYER_VIS:
            return setLayerAttribute(state, action, 'on');
        case MAPSOURCE.LAYER_FAVORITE:
            return setLayerAttribute(state, action, 'favorite');
        case MAPSOURCE.SET_TEMPLATE:
            return setLayerAttribute(state, action);
        case MAPSOURCE.ADD:
            new_elem[action.mapSource.name] = Object.assign({
                layers: [],
                params: {},
                printable: true,
                queryable: false
            }, action.mapSource);
            return Object.assign({}, state, new_elem);
        case MAPSOURCE.SET_Z:
            const new_z_ms = {};
            new_z_ms[action.mapSourceName] = Object.assign({},
                state[action.mapSourceName],
                {zIndex: action.zIndex}
            );
            return Object.assign({}, state, new_z_ms);
        case MAPSOURCE.SET_OPACITY:
            const new_opacity_ms = {};
            new_opacity_ms[action.mapSourceName] = Object.assign({},
                state[action.mapSourceName],
                {opacity: action.opacity},
            );
            return Object.assign({}, state, new_opacity_ms);
        case MAPSOURCE.ADD_LAYER:
            if(state[action.mapSourceName]) {
                const ms = {};
                ms[action.mapSourceName] = Object.assign({}, state[action.mapSourceName], {
                    layers: [
                        ...state[action.mapSourceName].layers,
                        action.layer
                    ]
                });

                return Object.assign({}, state, ms);
            }

            return state;
        case MAPSOURCE.REFRESH:
            if(state[action.mapSourceName]) {
                const ms = {};
                ms[action.mapSourceName] = Object.assign({}, state[action.mapSourceName], {
                    refresh: action.refresh
                });
                return Object.assign({}, state, ms);
            }
            return state;
        case MAPSOURCE.ADD_FEATURES:
        case MAPSOURCE.CLEAR_FEATURES:
        case MAPSOURCE.REMOVE_FEATURE:
        case MAPSOURCE.REMOVE_FEATURES:
        case MAPSOURCE.CHANGE_FEATURES:
        case MAPSOURCE.MODIFY_GEOMETRY:
            return Object.assign({}, state, changeMapSourceFeatures(state, action));
        case MAPSOURCE.RELOAD:
            return handleReload(state, action);
        default:
            return state;
    }
}
