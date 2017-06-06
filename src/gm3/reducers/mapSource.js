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
    let layers = [];
    if(!state[action.mapSourceName]) {
        // no state changes if we can't find the mapsource.
        return state;
    }

    for(var i = 0, ii = state[action.mapSourceName].layers.length; i < ii; i++) {
        // copy each layer and update the matching one.
        let layer = Object.assign({}, state[action.mapSourceName].layers[i]);
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

/** Change the features in a layer.
 *
 *  This handles removing and adding features to a layer. There is
 *  no bespoke 'update' process at this point.  New features are tagged
 *  with a "_uuid" property in order to identify them.
 *
 *  All features passed in should be *GeoJson* feature not OpenLayers
 *  features.  The map handles that.
 */
function changeLayerFeatures(state, action) {
    const map_source = state[action.mapSourceName];
    const layers = [];
    let changed = false;

    const id_prop = '_uuid';

    for(let i = 0, ii = map_source.layers.length; i < ii; i++) {
        if(map_source.layers[i].name === action.layerName) {
            let layer = Object.assign({}, map_source.layers[i]);

            // ensure there is a features array in the layer.
            //  this is not gauranteed on initialization.
            if(!layer.features) {
                layer.features = [];
                layer.featuresVersion = 0;
            }
            // add features.
            if(action.type === MAPSOURCE.ADD_FEATURES) {
                // add an ID to the features
                for(var x = 0, xx = action.features.length; x < xx; x++) {
                    const id_mixin = {};
                    id_mixin[id_prop] = uuid();
                    action.features[x].properties = Object.assign({},
                        action.features[x].properties,
                        id_mixin
                    );
                }
                layer.features = layer.features.concat(action.features);
                layer.featuresVersion += 1;
            // clear features
            } else if(action.type === MAPSOURCE.CLEAR_FEATURES) {
                layer.features = [];
                layer.featuresVersion += 1;
            // delete a specific feature
            } else if(action.type === MAPSOURCE.REMOVE_FEATURE) {
                let features = [];
                for(let f of layer.features) {
                    if(f.properties[id_prop] !== action.id) {
                        features.push(f);
                    }
                }
                layer.features = features;
                layer.featuresVersion += 1;
            } else if(action.type === MAPSOURCE.REMOVE_FEATURES) {
                layer.features = filterFeatures(layer.features, action.filter);
                layer.featuresVersion += 1;
            } else if(action.type === MAPSOURCE.CHANGE_FEATURES) {
                layer.features = changeFeatures(layer.features, action.filter, action.properties);
                layer.featuresVersion += 1;
            } else if(action.type === MAPSOURCE.MODIFY_GEOMETRY) {
                layer.features = changeFeatures(layer.features, {'_uuid': action.id}, null, action.geometry);
                layer.featuresVersion += 1;
            }
            layers.push(layer);

            changed = true;
        } else {
            layers.push(map_source.layers[i]);
        }
    }

    // if there was a miss in the tree, then do not return a change
    if(changed) {
        const ms = {};
        ms[action.mapSourceName] = Object.assign({}, state[action.mapSourceName], {
            layers: layers
        });
        return Object.assign({}, state, ms);
    }

    return state;
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
            new_elem[action.mapSource.name] = action.mapSource;
            return Object.assign({}, state, new_elem);
        case MAPSOURCE.SET_Z:
            const new_z_ms = {};
            new_z_ms[action.mapSourceName] = Object.assign({},
                                                           state[action.mapSourceName],
                                                           {zIndex: action.zIndex});
            return Object.assign({}, state, new_z_ms);
        case MAPSOURCE.SET_OPACITY:
            const new_opacity_ms = {};
            new_opacity_ms[action.mapSourceName] = Object.assign({},
                                                           state[action.mapSourceName],
                                                           {opacity: action.opacity});
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
            if(state[action.mapSourceName]) {
                return changeLayerFeatures(state, action);
            }
            return state;
        default:
            return state;
    }
}
