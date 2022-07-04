import * as olXml from 'ol/xml';
import GeoJSONFormat from 'ol/format/GeoJSON';
import GML2Format from 'ol/format/GML2';

import {applyPixelTolerance} from './util';
import { transformFeatures, formatUrlParameters } from '../util';

import { buildWfsQuery } from '../components/map/layers/wfs';

export const wfsGetFeatureQuery = (layer, mapState, mapSource, query) => {
    // the internal storage mechanism requires features
    //  returned from the query be stored in 4326 and then
    //  reprojected on render.
    const queryProjection = mapSource.wgs84Hack ? 'EPSG:4326' : mapState.projection;

    // check for the outputFormat based on the params
    let outputFormat = 'text/xml; subtype=gml/2.1.2';
    if(mapSource.params.outputFormat) {
        outputFormat = mapSource.params.outputFormat;
    }

    const selection = [...query.selection];
    if (selection && selection.length === 1) {
        selection[0] = applyPixelTolerance(
            selection[0], mapSource,
            mapState.resolution, 10);
    }

    const wfsQueryXml = buildWfsQuery({...query, selection}, mapSource, mapState.projection, outputFormat);

    // Ensure all the extra URL params are attached to the
    //  layer.
    const wfsUrl = mapSource.urls[0] + '?' + formatUrlParameters(mapSource.params);

    const isJsonLike = (outputFormat.toLowerCase().indexOf('json') > 0);

    return fetch(wfsUrl, {
        method: 'POST',
        body: wfsQueryXml,
        headers: {
            'Access-Control-Request-Headers': '*',
        },
    })
        .then(r => r.text())
        .then(response => {
            if(response) {
                // check for a WFS error message
                if(response.search(/(ows|wfs):exception/i) >= 0) {
                    // parse the document.
                    const wfsDoc = olXml.parse(response);
                    const tags = ['ows:ExceptionText', 'wfs:ExceptionText'];
                    let errorText = '';
                    for(let t = 0, tt = tags.length; t < tt; t++) {
                        const nodes = wfsDoc.getElementsByTagName(tags[t]);
                        for(let n = 0, nn = nodes.length; n < nn; n++) {
                            errorText += olXml.getAllTextContent(nodes[n]) + '\n';
                        }
                    }
                    console.error(errorText);

                    return {
                        layer,
                        error: true,
                        features: [],
                        message: errorText,
                    };
                } else {
                    // place holder for features to be added.
                    let js_features = [];
                    if (isJsonLike) {
                        js_features = JSON.parse(response).features;
                    } else {
                        const gml_format = new GML2Format();
                        const features = gml_format.readFeatures(response, {
                            featureProjection: mapState.projection,
                            dataProjection: queryProjection
                        });
                        // be ready with some json.
                        const json_format = new GeoJSONFormat();

                        // create the features array.
                        for(const feature of features) {
                            // feature to JSON.
                            const js_feature = json_format.writeFeatureObject(feature);
                            // ensure that every feature has a "boundedBy" attribute.
                            js_feature.properties.boundedBy = feature.getGeometry().getExtent();
                            // add it to the stack.
                            js_features.push(js_feature);
                        }
                    }

                    // apply the transforms
                    js_features = transformFeatures(mapSource.transforms, js_features);

                    return {
                        layer,
                        features: js_features,
                    }
                }
            }
        })
        .catch(() => {
            return {
                layer,
                error: true,
                message: 'Server error. Check network logs.',
            };
        });
}
