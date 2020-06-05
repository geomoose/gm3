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

/** Collection of functions for defining a ArcGIS Rest layers in a GeoMoose map.
 *
 */

import TileLayer from 'ol/layer/Tile';
import ArcRestSource from 'ol/source/TileArcGISRest';

/** Create the parameters for a ArcGIS REST Services layer.
 *
 */
function defineSource(mapSource) {
    let cx_origin = null;
    if(mapSource.params['cross-origin']) {
        cx_origin = mapSource.params['cross-origin'];
    } else if (mapSource.urls[0].indexOf('http') === 0) {
        cx_origin = 'anonymous';
    }

    return {
        crossOrigin: cx_origin,
        url: mapSource.urls[0],
        params: mapSource.params,
    }
}

/** Return an OpenLayers Layer for the ArcGIS REST Services source.
 *
 *  @param mapSource The MapSource definition from the store.
 *
 *  @returns OpenLayers Layer instance.
 */
export function createLayer(mapSource) {
    return new TileLayer({
        source: new ArcRestSource(defineSource(mapSource)),
        minResolution: mapSource.minresolution,
        maxResolution: mapSource.maxresolution,
    });
}

/** Ensure that the ArcGIS REST Services parameters all match.
 */
export function updateLayer(map, layer, mapSource) {
    // pull in the open layers source
    const src = layer.getSource();
    // get the new definition
    const defn = defineSource(mapSource);

    // if the url changed, update that as well.
    if(src.getUrls()[0] !== defn.url) {
        src.setUrl(defn.url);
    }
}

