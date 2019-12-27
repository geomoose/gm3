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

import { transformProperties, formatUrlParameters, requEstimator } from '../../util';

import GML2Format from 'ol/format/GML2';
import GeoJSONFormat from 'ol/format/GeoJSON';
import EsriJsonFormat from 'ol/format/EsriJSON';
import { tile, bbox } from 'ol/loadingstrategy';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { createXYZ } from 'ol/tilegrid';

import applyStyleFunction from 'mapbox-to-ol-style';

// for JSONP support
import request from 'reqwest';

/** Create the parameters for a Vector layer.
 *
 */
function defineSource(mapSource) {
    if(mapSource.type === 'wfs') {
        // add a wfs type source
        let format = GML2Format;
        let output_format = 'text/xml; subtype=gml/2.1.2';

        if(mapSource.params.outputFormat) {
            output_format = mapSource.params.outputFormat;
        }

        if(output_format.toLowerCase().indexOf('json') >= 0) {
            format = GeoJSONFormat;
        }

        return {
            format: new format({}),
            projection: 'EPSG:4326',
            url: function(extent) {
                if(typeof(mapSource.params.typename) === 'undefined') {
                    console.error('No "typename" param defined for a WFS layer. This will fail.');
                }

                const url_params = Object.assign({}, mapSource.params, {
                    'srsname': 'EPSG:3857',
                    'outputFormat': output_format,
                    'service': 'WFS',
                    'version': '1.1.0',
                    'request': 'GetFeature',
                    'bbox': extent.concat('EPSG:3857').join(',')
                });

                return mapSource.urls[0] + '?' + formatUrlParameters(url_params);
            },
            strategy: bbox
        };
    } else if(mapSource.type === 'geojson') {
        return {
            format: new GeoJSONFormat(),
            projection: mapSource.params.crs ? mapSource.params.crs : 'EPSG:4326',
            url: mapSource.urls[0],
        };
    } else if(mapSource.type === 'ags-vector') {
        // Add an A**GIS FeatureService layer.
        // This performs a basic query based on the bounding box.
        return {
            loader: function(extent, resolution, proj) {
                const url = mapSource.urls[0] + '/query/';

                // the E**I language can get a bit complicated but
                //  this is the format for a basic BBOX query.
                const params = {
                    f: 'json',
                    returnGeometry: 'true',
                    spatialRel: 'esriSpatialRelIntersects',
                    geometry: JSON.stringify({
                        xmin: extent[0], ymin: extent[1],
                        xmax: extent[2], ymax: extent[3],
                    }),
                    spatialReference: JSON.stringify({
                        wkid: 102100
                    }),
                    geometryType: 'esriGeometryEnvelope',
                    inSR: 102100, outSR: 102100,
                    outFields: '*',
                    returnIdsOnly: true,
                };

                // use JSONP to fetch the features.
                request({
                    url: url,
                    data: params,
                    type: 'jsonp',
                    success: (response) => {
                        if(response.error) {
                            console.error('Error loading object IDs for ' + mapSource.label);
                        } else {
                            const esri_format = new EsriJsonFormat();

                            const object_ids = response.objectIds;
                            if(object_ids !== null) {
                                // E**I FeatureServer appears to have a limitation of
                                // roughly 2048 bytes past the "?" in the GET call.
                                //  this ensure that the batches are small enough to prevent
                                //  404 errors.
                                const n_objects = object_ids.length;

                                // dummy "request" that can be used to estimate the
                                //  overall length of the query.
                                const sniff_r = Object.assign({}, params, {
                                    returnIdsOnly: false
                                });

                                // the ID's need to get "batched" into groups
                                //  which will reliably be shorter than the
                                //  maximum request length.
                                const batches = [];

                                // current batch is "rotated" whenever it gets too long
                                let current_batch = [];
                                for(let i = 0; i < n_objects; i++) {
                                    // estimate the request size
                                    const requestimate = requEstimator(Object.assign(sniff_r, {
                                        objectIds: current_batch.concat([object_ids[i]]).join(',')
                                    }));
                                    // if it's too long "rotate" the batches.
                                    if(requestimate > 2000) {
                                        batches.push(current_batch.slice());
                                        current_batch = [];
                                    }
                                    current_batch.push(object_ids[i]);
                                }
                                // ensure the remainder gets pushed to a batch
                                if(current_batch.length > 0) {
                                    batches.push(current_batch);
                                }

                                // make the feature requests based on the batches.
                                for(const batch of batches) {
                                    request({
                                        url: url,
                                        data: Object.assign({}, params, {
                                            returnIdsOnly: false,
                                            objectIds: batch.join(','),
                                        }),
                                        type: 'jsonp',
                                        success: (response) => {
                                            if(response.error) {
                                                console.error('Error loading feature batch for ' + mapSource.label);
                                            } else {
                                                this.addFeatures(esri_format.readFeatures(response, {
                                                    // featureProjection: proj,
                                                }));
                                            }
                                        }
                                    });
                                }
                            }
                        }
                    }
                });
            },
            strategy: tile(createXYZ({
                tileSize: 512
            }))
        }
    }
    // empty object
    return {}
}

/** Return a style function for the layer.
 *
 */
function applyStyle(vectorLayer, mapSource) {
    const layers = [];
    for(const layer of mapSource.layers) {
        if(layer.on === true) {
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
            if(layer.filter !== undefined) {
                layer_def.filter = layer.filter;
            }

            layers.push(layer_def);
        }
    }


    applyStyleFunction(vectorLayer, {
        'version': 8,
        'layers': layers,
        'dummy-source': [
            {
                'type': 'vector'
            }
        ]
    }, 'dummy-source');
}

/** Return an OpenLayers Layer for the Vector source.
 *
 *  @param mapSource The MapSource definition from the store.
 *
 *  @returns OpenLayers Layer instance.
 */
export function createLayer(mapSource) {
    const source = new VectorSource(defineSource(mapSource));

    // get the transforms for the layer
    if(mapSource.transforms) {
        source.on('addfeature', function(evt) {
            const f = evt.feature;
            f.setProperties(transformProperties(mapSource.transforms, f.getProperties()));
        });
    }

    const opts = {
        source,
        minResolution: mapSource.minresolution,
        maxResolution: mapSource.maxresolution,
    };
    const vector_layer = new VectorLayer(opts);
    applyStyle(vector_layer, mapSource);

    return vector_layer;
}

/** Ensure that the Vector parameters all match.
 */
export function updateLayer(map, layer, mapSource) {
    if(mapSource.type === 'vector') {
        // vector layer features are defined by what
        // is stored in mapSource.features
        const layer_version = layer.get('featuresVersion');
        // check to see if there was an update to the features
        if(layer_version !== mapSource.featuresVersion) {
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
                type: 'FeatureCollection', features: mapSource.features
            });
            source.addFeatures(features);

            // update the version number
            layer.set('featuresVersion', mapSource.featuresVersion);
        }
    }

    // update the style effectively turns "layers"
    // on and off on vector layers.
    applyStyle(layer, mapSource);
}
