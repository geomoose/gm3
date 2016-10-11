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
            on: util.parseBoolean(layerXml.getAttribute('status')),
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

/** Get the map-source definition from a store
 *
 *  @param store
 *  @param mapSourceName
 *
 *  @return the map-source definition
 */
export function get(store, mapSourceName) {
    return store.getState().mapSources[mapSourceName];
}

/** Get a map-source layer based on a catalog layer object.
 *
 *  @param store The master store.
 *  @param layer An object with {mapSourceName, layerName}
 *
 * @returns The layer from the map-source in the store.
 */
export function getLayer(store, layer) {
    let map_source = get(store, layer.mapSourceName);
    for(let l of map_source.layers) {
        if(l.name == layer.layerName) { return l; }
    }
    if(layer.layerName == null) {
        return map_source;
    }
    console.error('Cannot find layer', layer.mapSourceName, layer.layerName);
    throw {message: "Cannot find layer", layer};
}

/** This query is common enough that it's been reduced to 
 *  a handy function.
 *
 */
export function getVisibility(store, layer) {
    // the === normalizes everything when values are undefined.
    return (getLayer(store, layer).on === true);
}
