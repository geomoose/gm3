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

/** This is used to define a *vector* layer source,
 *  it does *not* link this to a data source.
 *
 */

import * as util from '../../util';

import * as olMapboxStyle from 'ol-mapbox-style';

/** Create the parameters for a Vector layer.
 *
 */
function defineSource(mapSource) {
    if(mapSource.type === 'wfs') {
        // add a wfs type source
        return {
            format: new ol.format.GML2({}),
            projection: 'EPSG:4326',
            url: function(extent) {
                // http://localhost:8080/mapserver/cgi-bin/tinyows?
                // service=WFS&version=1.1.0&request=GetFeature&typename=gm:minnesota_places

                let url_params = Object.assign({}, mapSource.params,
                    {typename: mapSource.layers[0].name}, {
                        'srsname': 'EPSG:3857',
                        'outputFormat': 'text/xml; subtype=gml/2.1.2',
                        'service': 'WFS',
                        'version': '1.1.0',
                        'request': 'GetFeature',
                        'bbox': extent.concat('EPSG:3857').join(',')
                    });

                return mapSource.urls[0] + '?' + util.formatUrlParameters(url_params);
            },
            strategy: ol.loadingstrategy.bbox
        };
    }
    // empty object
    return {}
}

/** Return an OpenLayers Layer for the Vector source.
 *
 *  @param mapSource The MapSource definition from the store.
 *
 *  @returns OpenLayers Layer instance.
 */
export function createLayer(mapSource) {
    const source = new ol.source.Vector(defineSource(mapSource));
    const opts = {
        source
    };

    if(mapSource.style) {
        opts.style = olMapboxStyle.getStyleFunction({
            'version': 8,
            'layers': [
                {
                    'id': 'red',
                    'source': 'dummy-source',
                    'filter': ['==', 'displayClass', 'red'],
                    'paint': {
                        'line-color': '#ff0000',
                        'line-width': 2,
                        'fill-color': '#ff0000',
                        'fill-opacity': 0.5
                    }
                },
                {
                    'id': 'dummy',
                    'source': 'dummy-source',
                    'paint': mapSource.style
                }
            ],
            'dummy-source': [
                {
                    'type': 'vector'
                }
            ]
        }, 'dummy-source');
    }

    return new ol.layer.Vector(opts);
}

/** Ensure that the Vector parameters all match.
 */
export function updateLayer(map, layer, mapSource) {
    if(mapSource.type === 'vector') {
        // vector layer features are defined by what
        // is stored in mapSource.features
        const layer_version = layer.get('featuresVersion');
        // check to see if there was an update to the features
        if(layer_version !== mapSource.layers[0].featuresVersion) {
            // this is a bit heavy-handed strategy.
            const source = layer.getSource();
            // clear the layer without setting off events.
            source.clear(true);
            // setup the JSON parser
            const output_format = new ol.format.GeoJSON({
            /*
                dataProjection: 'EPSG:4326',
                featureProjection: map.getView().getProjection()
            */
            });
            // bring in the new features.
            const features = output_format.readFeatures({
                type: 'FeatureCollection', features: mapSource.layers[0].features
            });
            source.addFeatures(features);

            // update the version number
            layer.set('featuresVersion', mapSource.layers[0].featuresVersion);

        }
    }
}
