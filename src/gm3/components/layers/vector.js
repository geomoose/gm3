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

import GML2Format from 'ol/format/gml2';
import GeoJSONFormat from 'ol/format/geojson';
import LoadingStrategy from 'ol/loadingstrategy';
import VectorSource from 'ol/source/vector';
import VectorLayer from 'ol/layer/vector';

import getStyleFunction from 'mapbox-to-ol-style';

/** Create the parameters for a Vector layer.
 *
 */
function defineSource(mapSource) {
    if(mapSource.type === 'wfs') {
        // add a wfs type source
        return {
            format: new GML2Format({}),
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
            strategy: LoadingStrategy.bbox
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
    const source = new VectorSource(defineSource(mapSource));
    const opts = {
        source
    };

    // with vector layers each sub-layer is a style grouping
    // in defineSource, only the FIRST layer's name is used
    // as the WFS type name.
    const layers = [];
    for(const layer of mapSource.layers) {
        const layer_def = {
            id: layer.name,
            // source is a contant that is used to dummy up
            //  the Mapbox styles
            source: 'dummy-source',
            paint: layer.style,
        };

        // check to see if there is a filter
        //  set on the layer.  This uses the Mapbox GL/JS
        //  filters.
        if(layer.filter !== null) {
            layer_def.filter = layer.filter;
        }

        layers.push(layer_def);
    }

    // If there are any styles defined
    //  then use them to style the layer.
    // Otherwise this will use the built-in OL styles.
    if(layers.length > 0) {
        opts.style = getStyleFunction({
            'version': 8,
            'layers': layers,
            'dummy-source': [
                {
                    'type': 'vector'
                }
            ]
        }, 'dummy-source');
    }

    return new VectorLayer(opts);
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
            const output_format = new GeoJSONFormat({
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
