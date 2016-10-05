/** Reduces Map-Sources
 *
 */

import { MAPSOURCE } from '../actionTypes';

export default function mapSource(state = [], action) {
	switch(action.type) {
        case MAPSOURCE.LAYER_VIS:
            // make a copy of the layers list
            let layers = [].concat(state[action.mapSourceName].layers);
            // iterate through the layers and update the "on"
            //   setting based on the layerName
            for(let layer of layers) {
                if(layer.name == action.layerName) {
                    layer.on = action.on;
                }
            }

            let ms = Object.assign({}, state[action.mapSourceName], {
                layers
            });
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
