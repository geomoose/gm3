/** Actions for map-sources
 *
 */

import { MAPSOURCE } from '../actionTypes'; 

import * as util from '../util';

/** Add a map-source using a MapSource
 *  object.
 */
export function add(mapSource) {
	return {
		type: MAPSOURCE.ADD,
		mapSource
	};
}

/** Add a layer to a mapsource.
 *
 */
export function addLayer(mapSourceName, layer) {
    return {
        type: MAPSOURCE.ADD_LAYER,
        mapSourceName,
        layer
    };
}

/** Add a map-source from XML
 *
 */
export function addFromXml(xml) {

	let map_source = {
        name: xml.getAttribute('name'),
        type: xml.getAttribute('type'),
        label: xml.getAttribute('title'),
        layers: [],
    }

    let map_layers = [];
    for(let layerXml of xml.getElementsByTagName('layer')) {
        let layer_title = layerXml.getAttribute('title');

        let layer = {
            name: layerXml.getAttribute('name'),
            on: util.parseBoolean(layerXml.getAttribute('state')),
            label: layer_title ? layer_title : map_source.label
        };

        map_layers.push(addLayer(map_source.name, layer));
    }

	return [add(map_source)].concat(map_layers);
}

/** Remove a map-source from the application.
 *
 *  @param path The 'path'/name of the map-source.
 *
 */
export function remove(path) {
	return {
		type: MAPSOURCE.REMOVE,
		path
	}
}
