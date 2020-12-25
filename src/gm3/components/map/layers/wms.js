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

/** Collection of functions for defining a WMS layers in a GeoMoose map.
 *
 */

import * as util from '../../../util';
import Image from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';
import * as proj from 'ol/proj';

const WEBMERC_PROJ = proj.get('EPSG:3857');

/** Create the parameters for a WMS layer.
 *
 */
function defineSource(mapSource) {
    const layers = [];
    // this creates a layer list
    for(const layer of mapSource.layers) {
        if(layer.on) {
            layers.push(layer.name);
        }
    }

    const source_opts = {
        url: mapSource.urls[0],
        // This is a carry over from previous generations behaviour.
        ratio: 1.0,
        params: Object.assign({
            'VERSION': '1.1.1',
            'LAYERS': layers.join(',')
        }, mapSource.params),
        serverType: mapSource.serverType,
        minResolution: mapSource.minresolution,
        maxResolution: mapSource.maxresolution,
    };

    if(mapSource.params['cross-origin']) {
        source_opts.crossOrigin = mapSource.params['cross-origin'];
    } else if (mapSource.urls[0].indexOf('http') === 0) {
        source_opts.crossOrigin = 'anonymous';
    }
    return source_opts;
}


/** Return an OpenLayers Layer for the WMS source.
 *
 *  @param mapSource The MapSource definition from the store.
 *
 *  @returns OpenLayers Layer instance.
 */
export function createLayer(mapSource) {
    return new Image({
        source: new ImageWMS(defineSource(mapSource))
    });
}

/** Ensure that the WMS parameters all match.
 */
export function updateLayer(map, layer, mapSource) {
    // pull in the open layers source
    const src = layer.getSource();
    // get the new definition
    const defn = defineSource(mapSource);

    // if the params objects differ update them
    if(util.objectsDiffer(defn.params, src.getParams())) {
        src.updateParams(defn.params);
    }

    // if the url changed, update that as well.
    if(src.getUrl() !== defn.url) {
        src.setUrl(defn.url);
    }
}

/** Get a URL for the map-source.
 *
 *  @param {gm3.MapSource} mapSource the Map Source.
 *  @param {Object}        mapView   the current view of the map from the state.
 *  @param {String}        layerName the name of the layer for the legend.
 *
 *  @returns {Object} Defining the legend.
 */
export function getLegend(mapSource, mapView, layerName) {
    // pull out the first url for making the legend.
    const base_url = mapSource.urls[0].split('?')[0];

    const params = Object.assign({
        'REQUEST': 'GetLegendGraphic',
        'SCALE': util.getScale(mapView.resolution, WEBMERC_PROJ),
        'SERVICE': 'WMS',
        // TODO: Does this need to be passed in? Check by server-type?
        'VERSION': '1.1.1',
        'WIDTH': '250',
        'LAYER': layerName,
        'FORMAT': 'image/png',
    }, mapSource.params);

    const images = [];

    images.push(base_url + '?' + util.formatUrlParameters(params));
    // 'img' type legends just return a list
    // of images that can be included with a <img src=image[x]>
    return {
        type: 'img',
        images
    }
}
