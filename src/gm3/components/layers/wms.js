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

/** Collection of functions for defining a WMS layers in a GeoMoose map.
 * 
 */

import * as util from '../../util';

/** Create the parameters for a WMS layer.
 *
 */
function defineSource(mapSource) {
    let layers = [];
    // this creates a layer list
    for(let layer of mapSource.layers) {
        if(layer.on) {
            layers.push(layer.name);
        }
    }

    return {
        url: mapSource.urls[0],
        ratio: 1.0, // This is a carry over from previous generations behaviour.
        params: Object.assign({'LAYERS' : layers.join(',')}, mapSource.params),
        serverType: mapSource.serverType
    }
}


/** Return an OpenLayers Layer for the WMS source.
 *
 *  @param mapSource The MapSource definition from the store.
 *
 *  @returns OpenLayers Layer instance.
 */
export function createLayer(mapSource) {
    return new ol.layer.Image({
        source: new ol.source.ImageWMS(defineSource(mapSource))
    });
}

/** Ensure that the WMS parameters all match.
 */
export function updateLayer(layer, mapSource) {
    // pull in the open layers source
    let src = layer.getSource();
    // get the new definition
    let defn = defineSource(mapSource);

    // if the params objects differ update them
    if(util.objectsDiffer(defn.params, src.getParams())) {
        src.updateParams(defn.params);
    }

    // if the url changed, update that as well.
    if(src.getUrl() != defn.url) {
        src.setUrl(defn.url);
    }
}
    
