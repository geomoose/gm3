/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 GeoMoose
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

import { MAPSOURCE } from '../actionTypes';

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
    let layers = [].concat(state[action.mapSourceName].layers);
    // iterate through the layers and update the "on"
    //   setting based on the layerName
    for(let layer of layers) {
        if(layer.name == action.layerName) {
            layer[attr] = action[attr];
        }
    }

    let ms = Object.assign(state[action.mapSourceName], {
        layers
    });

    let mix = {};
    mix[action.mapSourceName] = ms;

    console.log('LAYER', attr, ms);

    return Object.assign({}, state, mix);
}

export default function mapSource(state = [], action) {
	switch(action.type) {
        case MAPSOURCE.LAYER_VIS:
            return setLayerAttribute(state, action, 'on');
        case MAPSOURCE.LAYER_FAVORITE:
            return setLayerAttribute(state, action, 'favorite'); 
		case MAPSOURCE.ADD:
            let new_elem = {};
            new_elem[action.mapSource.name] = action.mapSource;
			return Object.assign({}, state, new_elem);
        case MAPSOURCE.ADD_LAYER:
            if(state[action.mapSourceName]) {
                let ms = {};
                ms[action.mapSourceName] = Object.assign({}, state[action.mapSourceName], {
                    layers: [
                        ...state[action.mapSourceName].layers,
                        action.layer
                    ]
                });

                return Object.assign({}, state, ms);
            }

            return state;
		default:
			return state;
	}
}
