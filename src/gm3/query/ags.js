import EsriJSONFormat from 'ol/format/EsriJSON';
import GeoJSONFormat from 'ol/format/GeoJSON';

import {xhr, transformFeatures} from '../util';
import {applyPixelTolerance} from './util';

export const agsFeatureQuery = (layer, mapState, mapSource, query) => {
    const fix_like = function(value) {
        const new_value = value.replace('*', '%');
        return new_value;
    };

    const simple_op = function(op, name, value) {
        if(typeof(value) === 'number') {
            return name + ' ' + op + ' ' + value;
        } else {
            return `${name} ${op} '${value}'`;
        }
    };

    // map the functions from OpenLayers to the internal
    //  types
    const filterMapping = {
        'like': function(name, value) {
            return name + ' like \'' + fix_like(value) + '\'';
        },
        'ilike': function(name, value) {
            return 'upper(' + name + ') like upper(\'' + fix_like(value) + '\')';
        },
        'eq': function(name, value) {
            return simple_op('=', name, value);
        },
        'ge': function(name, value) {
            return simple_op('>=', name, value);
        },
        'gt': function(name, value) {
            return simple_op('>', name, value);
        },
        'le': function(name, value) {
            return simple_op('<=', name, value);
        },
        'lt': function(name, value) {
            return simple_op('<', name, value);
        },
    };

    // setup the necessary format converters.
    const esri_format = new EsriJSONFormat();
    const queryParams = {
        f: 'json',
        returnGeometry: 'true',
        spatialReference: JSON.stringify({
            wkid: 102100
        }),
        inSR: 102100, outSR: 102100,
        outFields: '*',
    };

    if (query.selection && query.selection.length > 0) {
        const queryFeature = applyPixelTolerance(
            query.selection[0], mapSource,
            mapState.resolution, 2);
        const queryGeometry = queryFeature.geometry;

        // make this an E**I geometry.
        const ol_geom = (new GeoJSONFormat()).readGeometry(queryGeometry);

        // translate the geometry to E**I-ish
        const geomTypeLookup = {
            'Point': 'esriGeometryPoint',
            'MultiPoint': 'esriGeometryMultipoint',
            'LineString': 'esriGeometryPolyline',
            'Polygon': 'esriGeometryPolygon',
        };

        // setup the spatial filter.
        queryParams.geometryType = geomTypeLookup[queryGeometry.type];
        queryParams.geometry = esri_format.writeGeometry(ol_geom);
        queryParams.spatialRel = 'esriSpatialRelIntersects';
        // for lines?:'esriSpatialRelEnvelopeIntersects';
    }

    // build the filter fields.
    const whereStatements = query.fields.map(filter => (
        filterMapping[filter.comparitor](filter.name, filter.value)
    ));
    queryParams.where = whereStatements.join(' and ');

    const params = Object.assign({}, queryParams, mapSource.params);

    // get the query service url.
    const queryUrl = mapSource.urls[0] + '/query/';

    return new Promise(resolve => {
        xhr({
            url: queryUrl,
            method: 'get',
            type: 'jsonp',
            data: params,
            success: (response) => {
                // not all WMS services play nice and will return the
                //  error message as a 200, so this still needs checked.
                if(response) {
                    if (response.error && response.error.code !== 200){
                        console.error(response.error);
                        resolve({
                            layer,
                            error: true,
                            features: [],
                        });
                    } else {
                        // convert the esri features to OL features.
                        const features = esri_format.readFeatures(response);
                        // be ready with some json.
                        const json_format = new GeoJSONFormat();

                        // create the features array.
                        let js_features = [];
                        for (const feature of features) {
                            // feature to JSON.
                            const js_feature = json_format.writeFeatureObject(feature);
                            // ensure that every feature has a "boundedBy" attribute.
                            js_feature.properties.boundedBy = feature.getGeometry().getExtent();
                            // add it to the stack.
                            js_features.push(js_feature);
                        }

                        // apply the transforms
                        js_features = transformFeatures(mapSource.transforms, js_features);

                        resolve({
                            layer,
                            error: false,
                            features: js_features,
                        });
                    }
                }
            },
            error: () => {
                resolve({
                    layer,
                    error: true,
                    features: [],
                });
            }
        });
    });
}
