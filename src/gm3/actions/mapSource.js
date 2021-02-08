/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Dan "Ducky" Little
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

import {get as getProj} from 'ol/proj';
import {changeTool} from './map';

import { MAPSOURCE } from '../actionTypes';
import {wfsDeleteFeatures, wfsSaveFeatures} from '../components/map/layers/wfs';
import {EDIT_LAYER_NAME} from '../defaults';

import * as util from '../util';

let MS_Z_INDEX = 100000;

const SOURCE_DEFAULTS = {
    opacity: 1.0,
};

/** Add a map-source using a MapSource
 *  object.
 */
export function add(mapSourceIn) {
    if(typeof(mapSourceIn.zIndex) !== 'number') {
        mapSourceIn.zIndex = MS_Z_INDEX;
        MS_Z_INDEX--;
    }

    const mapSource = Object.assign({}, SOURCE_DEFAULTS, mapSourceIn);

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

/** Convert all the <params> of a <map-source> into an object.
 *
 *  @param msXml The MapSource XML
 *
 *  @returns Object containing the params
 */
function parseParams(msXml, tagName = 'param') {
    const params_obj = {};
    const params = msXml.getElementsByTagName(tagName);
    for(let i = 0, ii = params.length; i < ii; i++) {
        const param = params[i];
        params_obj[param.getAttribute('name')] = param.getAttribute('value');
    }
    return params_obj;
}

/** Convert app the <property> tages of <properties> in <map-source>
 *  into an object.
 *
 *  @param msXml The MapSource XML
 *
 *  @returns Object containing the propeties
 */
function parseProperties(msXml) {
    const props = [];
    const propsParent = msXml.getElementsByTagName('properties')[0];

    if (propsParent) {
        const propXmls = propsParent
            .getElementsByTagName('property');

        const propNames = [
            'name', 'label', 'type', 'default',
            'min', 'max', 'step',
        ];

        for (let i = 0, ii = propXmls.length; i < ii; i++) {
            const prop = propXmls[i];
            const propDef = {};

            for (let p = 0, pp = propNames.length; p < pp; p++) {
                const propName = propNames[p];
                const v = prop.getAttribute(propName);
                if (v !== undefined && v !== null) {
                    propDef[propName] = prop.getAttribute(propName);
                }
            }

            props.push(propDef);
        }
    }
    return props;
}

/** Set a map-source's layer as a favorite.
 *
 *  @param mapSourceName  The name of the map source
 *  @param layerName      The name of the layer in the map source
 *  @param favorite       Whether the layer should be favorited or not.
 *
 *  @returns The action object.
 */
export function favoriteLayer(mapSourceName, layerName, favorite) {
    return {
        type: MAPSOURCE.LAYER_FAVORITE,
        mapSourceName, layerName,
        favorite
    }
}


/** Convert a mapserver layer to something more normal.
 *
 *  @param msXML the MapSource XML
 *  @param conf  The application configuration.
 *  @param destType The destination type for the layer.
 *
 *  @returns Object defining the map source
 */
function mapServerToDestType(msXml, conf, destType) {
    let urls = util.getTagContents(msXml, 'url', true);
    const mapfile = util.getTagContents(msXml, 'file', true)[0];

    // if the url is null then default to the
    //  mapserver url.
    if(urls.length === 0) { urls = [conf.mapserver_url]; }

    const map_source = {
        type: destType,
        serverType: 'mapserver',
        urls: urls,
        params: {
            'MAP': conf.mapfile_root + mapfile
        },
    };

    return map_source;

}

/** Convert a type='mapserver' layer into type='wms'
 *  style layer for internal storage.
 *
 *  @param msXml The MapSource XML
 *  @param conf  Application configuration object.
 *
 * @returns Object defining the WMS service.
 */
function mapServerToWMS(msXml, conf) {
    return mapServerToDestType(msXml, conf, 'wms');
}

/** Convert a type='mapserver-wfs' layer into type='wfs'
 *  style layer.
 *
 *  @param mxXml The MapSource XML
 *  @param conf  Application configuration object.
 *
 * @returns Object defining the WFS service.
 */
function mapServerToWFS(msXml, conf) {
    const wfs_conf = mapServerToDestType(msXml, conf, 'wfs');

    /* MapServer has a pretty major bug, it will not properly
     * reproject bounding boxes for non-WGS84 layers when doing
     * WFS queries.  This tells the query engine in the map component,
     * to use an internal work-around ... aka ... "hack".
     */
    wfs_conf.wgs84Hack = true;

    return wfs_conf;
}

/** Add a map-source from XML
 *
 */
export function addFromXml(xml, config) {
    // initialize the map source object.
    const map_source = {
        name: xml.getAttribute('name'),
        urls: util.getTagContents(xml, 'url', true),
        type: xml.getAttribute('type'),
        label: xml.getAttribute('title'),
        opacity: xml.getAttribute('opacity'),
        zIndex: xml.getAttribute('z-index'),
        queryable: util.parseBoolean(xml.getAttribute('queryable'), true),
        // assume layers are printable
        printable: util.parseBoolean(xml.getAttribute('printable'), true),
        refresh: null,
        layers: [],
        transforms: {},
        params: {},
        config: {},
        properties: [],
        idProperty: '_uuid',
    };

    // handle setting up the zIndex
    if(map_source.zIndex) {
        map_source.zIndex = parseInt(map_source.zIndex, 10);
    }

    // try to get an opacity,  if it won't parse then default to 1.0
    map_source.opacity = parseFloat(map_source.opacity);
    if(isNaN(map_source.opacity)) {
        map_source.opacity = 1.0;
    }

    // allow server-type hinting for hidpi displays.
    const server_type = xml.getAttribute('server-type');
    if(server_type) {
        map_source.serverType = server_type;
    }

    // set of 'correction' functions for mapsources that
    //  are parsed/tweaked to help the configurator.
    if(map_source.type === 'mapserver') {
        Object.assign(map_source, mapServerToWMS(xml, config));
    } else if(map_source.type === 'mapserver-wfs') {
        Object.assign(map_source, mapServerToWFS(xml, config));
    }

    // parse the optional float attributes
    ['refresh', 'minresolution', 'maxresolution'].forEach((attr) => {
        const value = xml.getAttribute(attr);
        if(value) {
            map_source[attr] = parseFloat(value);
        }
    });

    // catalog the transforms for the layer
    const transforms = xml.getElementsByTagName('transform');
    for(let x = 0, xx = transforms.length; x < xx; x++) {
        const transform = transforms[x];
        map_source.transforms[transform.getAttribute('attribute')] =
        transform.getAttribute('function');
    }

    // mix in the params
    Object.assign(map_source.params, {}, parseParams(xml));
    Object.assign(map_source.config, {}, parseParams(xml, 'config'));

    // check for the ID column config.
    if (map_source.config['id-property']) {
        map_source.idProperty = map_source.config['id-property'];
        delete map_source.config['id-property'];
    }

    // and lets get some properties
    Object.assign(map_source.properties, parseProperties(xml));

    // add all of the layers.
    const map_layers = [];
    const xml_layers = xml.getElementsByTagName('layer');
    for(let i = 0, ii = xml_layers.length; i < ii; i++) {
        const layerXml = xml_layers[i];
        const layer_title = layerXml.getAttribute('title');

        const layer = {
            name: layerXml.getAttribute('name'),
            on: util.parseBoolean(layerXml.getAttribute('status')),
            favorite: util.parseBoolean(layerXml.getAttribute('favorite')),
            selectable: util.parseBoolean(layerXml.getAttribute('selectable')),
            label: layer_title ? layer_title : map_source.label,
            templates: {},
            legend: null,
            attribution: null,
            style: null,
            queryAs: layerXml.getAttribute('query-as'),
        };

        // user defined legend.
        // two types currently supported: "html" and "img"
        const legends = layerXml.getElementsByTagName('legend');
        if(legends.length > 0) {
            layer.legend = {
                type: legends[0].getAttribute('type'),
                contents: util.getXmlTextContents(legends[0])
            };
        }

        // pull in an HTML attribution as available.
        const attribution = layerXml.getElementsByTagName('attribution');
        if (attribution.length > 0) {
            layer.attribution = util.getXmlTextContents(attribution[0]);
        }

        const templates = layerXml.getElementsByTagName('template');
        for(let x = 0, xx = templates.length; x < xx; x++) {
            let template_def = {};

            const template_xml = templates[x];
            const template_name = template_xml.getAttribute('name');

            const template_src = template_xml.getAttribute('src');
            const template_alias = template_xml.getAttribute('alias');
            const auto_template = util.parseBoolean(template_xml.getAttribute('auto'));
            if(template_alias) {
                template_def = {
                    type: 'alias',
                    alias: template_alias
                };
            } else if(template_src) {
                template_def = {
                    type: 'remote',
                    src: template_src
                };
            } else if(auto_template) {
                template_def = {
                    type: 'auto'
                };
            } else {
                template_def = {
                    type: 'local',
                    contents: util.getXmlTextContents(template_xml)
                };
            }

            layer.templates[template_name] = template_def;
        }

        // check to see if there are any style definitions
        const style = util.getTagContents(layerXml, 'style', false);
        if(style && style.length > 0) {
            // convert to JSON
            try {
                layer.style = JSON.parse(style);
            } catch(err) {
                console.error('There was an error parsing the style for: ', map_source.name);
                console.error('Error details', err);
            }
        }

        // check to see if there are any filter definitions
        const filter = util.getTagContents(layerXml, 'filter', false);
        if(filter && filter.length > 0) {
            // convert to JSON
            try {
                layer.filter = JSON.parse(filter);
            } catch(err) {
                console.error('There was an error parsing the filter for: ', map_source.name);
                console.error('Error details', err);
            }
        }

        // queryAs can be defined as multiple paths,
        //  and is normalized to an array using split.
        if(layer.queryAs) {
            layer.queryAs = layer.queryAs.split(':');
        }

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

/** Get a map-source layer based on a catalog layer object.
 *
 *  @param store The main store.
 *  @param layer An object with {mapSourceName, layerName}
 *
 * @returns The layer from the map-source in the store.
 */
export function getLayer(mapSources, layer) {
    const map_source = mapSources[layer.mapSourceName];
    for(const l of map_source.layers) {
        if(l.name === layer.layerName) { return l; }
    }
    if(layer.layerName == null) {
        return map_source;
    }
    console.error('Cannot find layer', layer.mapSourceName, layer.layerName);
    throw new Error(`Cannot find layer ${layer.mapSourceName}/${layer.layerName}`);
}

/** Get a layer using the internal path format "source"/"layer"
 *
 *  @param mapSources A list of map-sources
 *  @param path  String defining the path.
 *
 * @return The layer from the map-source in the store.
 */
export function getLayerByPath(mapSources, path) {
    const p = path.split('/');
    return getLayer(mapSources, {
        mapSourceName: p[0],
        layerName: p[1]
    });
}

/** This query is common enough that it's been reduced to
 *  a handy function.
 *
 */
export function getVisibility(mapSources, layer) {
    // the === normalizes everything when values are undefined.
    return (getLayer(mapSources, layer).on === true);
}

/** Check to see if a layer is a 'favorite'
 *
 *  @param store The store object.
 *  @param layer The layer definition
 *
 * @returns {Boolean} true if a favorite, false otherwise.
 */
export function isFavoriteLayer(mapSources, layer) {
    return (getLayer(mapSources, layer).favorite === true);
}

/** Check whether a map-source is 'active',
 *  'active' is defined as having any layers
 *  with status='on' or being a vector type map-source
 *  with the status='on'.
 *
 *  @param mapSource MapSource object from the state.
 *
 * @returns Boolean, true when the mapsource is active.
 */
function isMapSourceActive(mapSource) {
    if(mapSource.layers) {
        for(const layer of mapSource.layers) {
            if(layer.on) {
                return true;
            }
        }
    } else {
        // TODO: handle layer-less map-sources
    }
    return false;
}

/** Get the list of all map-sources which have a
 *  layer that is on.
 */
export function getActiveMapSources(mapSources, onlyPrintable = false) {
    const active = [];
    const all_maps = !onlyPrintable;
    for(const ms in mapSources) {
        if(isMapSourceActive(mapSources[ms])) {
            if(all_maps || mapSources[ms].printable) {
                active.push(ms);
            }
        }
    }
    return active;
}

export function getLayerFromPath(mapSources, path) {
    const ms_name = util.getMapSourceName(path);
    const layer_name = util.getLayerName(path);

    return getLayer(mapSources, {mapSourceName: ms_name, layerName: layer_name});
}

/** Check if a map-source is queryable.
 */
function isQueryable(mapSource) {
    // querying can be manually turned off in the mapbook
    //   configuration.
    if(mapSource.queryable === false) {
        return false;
    }
    // check by type
    switch(mapSource.type) {
        case 'wms':
        case 'wfs':
        case 'ags-vector':
        case 'geojson':
        case 'vector':
            return true;
        default:
            return false;
    }
}

/** check if a layer is on.
 */
function isVisible(mapSource, layer) {
    return (layer.on === true);
}

/** Check if a layer is selectable
 */
function isSelectable(mapSource, layer) {
    switch(mapSource.type) {
        case 'wfs':
        case 'vector':
        case 'ags-vector':
            return (layer.selectable === true);
        default:
            return false
    }
}

/* Match layers based on a matching function.
 *
 * @param store The application's store.
 * @param matchFunction The function that matches against the mapsource and layer.
 *
 * @return List of layers (as paths).
 */
export function matchLayers(mapSources, matchFunction) {
    const matches = [];
    for(const ms in mapSources) {
        const layers = mapSources[ms].layers;
        for(let i = 0, ii = layers.length; i < ii; i++) {
            if(matchFunction(mapSources[ms], layers[i])) {
                matches.push(ms + '/' + layers[i].name);
            }
        }
    }
    return matches;

}

/** Get the list of visible layers.
 *
 *  @param store {Store} the application's store.
 *
 *  @return List of layers.
 */
export function getVisibleLayers(mapSources) {
    return matchLayers(mapSources, isVisible);
}

export function getLayerFromSources(mapSources, msName, layerName) {
    if(mapSources[msName]) {
        const ms = mapSources[msName];
        for(let i = 0, ii = ms.layers.length; i < ii; i++) {
            if(ms.layers[i].name === layerName) {
                return ms.layers[i];
            }
        }
    }

    return null;
}

/** Return the list of layers that can be queried.
 *
 *  These layers are a subset of visible layers.
 *
 */
export function getQueryableLayers(mapSources, filter = {}, options = {}) {
    // when visible is set to true, then any visibility will
    //  be false and the isVisible call will be evaluated.
    const req_visible = (typeof filter.requireVisible === 'undefined') ? true : filter.requireVisible;
    const match_fn = function(ms, layer, queryLayer) {
        let template_filter_pass = true;
        if(filter && filter.withTemplate) {
            let template_names = filter.withTemplate;
            // coerce the templates into an array
            if(typeof template_names === 'string') {
                template_names = [template_names, ];
            }
            // clean up the names in case they have the `@` prefix
            template_names = template_names.map(v => {
                if (v.indexOf('@') === 0) {
                    return v.slice(1);
                }
                return v;
            });

            // this happens, primarily, with grid support where
            //  a layer may or may not have a template for the super tab
            //  and a template for the grid.
            const testOp = (filter.anyTemplate === undefined || filter.anyTemplate === true)
                ? (a, b) => a || b
                : (a, b) => a && b;

            // template_filter_pass = false;
            const templates = queryLayer.templates;
            template_filter_pass = false;
            if (templates) {
                for (let x = 0, xx = template_names.length; x < xx; x++) {
                    const tpl_name = template_names[x];
                    template_filter_pass = testOp(template_filter_pass, templates[tpl_name] !== undefined);
                }
            }
        }
        return (
            template_filter_pass
            && isQueryable(ms, queryLayer)
            && (!req_visible || isVisible(ms, layer))
        );
    }

    const query_layers = [];
    for(const ms_name in mapSources) {
        const ms = mapSources[ms_name];
        for(let i = 0, ii = ms.layers.length; i < ii; i++) {
            const layer = ms.layers[i];
            let query_layer_found = false;

            // queryAs allows raster sources to reference vector sources
            //  for query operations.
            if(layer.queryAs) {
                for(let q = 0, qq = layer.queryAs.length; q < qq; q++) {
                    const qs = layer.queryAs[q].split('/');
                    const query_layer = getLayerFromSources(mapSources, qs[0], qs[1]);
                    if(match_fn(ms, layer, query_layer)) {
                        query_layers.push(layer.queryAs[q]);
                        query_layer_found = true;
                    }
                }
            }

            if(!query_layer_found && match_fn(ms, layer, layer)) {
                query_layers.push(ms_name + '/' + layer.name);
            }
        }
    }

    return query_layers;
}

export function getSelectableLayers(mapSources) {
    const match_fn = function(ms, layer) {
        return (isSelectable(ms, layer) && isVisible(ms, layer));
    }
    return matchLayers(mapSources, match_fn);
}


/** Set the refresh rate for a map-source,
 *  null is the default state and will prevent the layer
 *  from refreshing.  Time is specified in seconds.
 */
export function setRefresh(mapSourceName, refreshSeconds) {
    return {
        type: MAPSOURCE.REFRESH,
        mapSourceName,
        refresh: refreshSeconds
    }
}

export function addFeatures(mapSourceName, features, copy = false) {
    return {
        type: MAPSOURCE.ADD_FEATURES,
        mapSourceName, features, copy
    };
}

export function clearFeatures(mapSourceName) {
    return {
        type: MAPSOURCE.CLEAR_FEATURES,
        mapSourceName
    };
}


export function removeFeatures(mapSourceName, filter) {
    return {
        type: MAPSOURCE.REMOVE_FEATURES,
        mapSourceName, filter
    };
}

/* Remove a specific feature from the layer.
 */
export function removeFeature(path, feature) {
    return (dispatch, getState) => {
        const mapSources = getState().mapSources;
        const layer = getLayerFromPath(mapSources, path);
        const layerSrcName = util.getMapSourceName(path);

        let mapSourceName = layerSrcName;
        if (layer && layer.queryAs && layer.queryAs.length > 0) {
            mapSourceName = util.getMapSourceName(layer.queryAs[0]);
        }

        const mapSource = getState().mapSources[mapSourceName];
        if (mapSource) {
            const idProp = mapSource.idProperty;
            const id = feature.id || (feature.properties || {})[idProp];
            if (mapSource.type === 'vector') {
                // just remove the feature from an in memory layer.
                dispatch({
                    type: MAPSOURCE.REMOVE_FEATURE,
                    mapSourceName,
                    id
                });
                // return a resolved promise.
                return new Promise(resolve => resolve());
            } else if (mapSource.type === 'wfs') {
                // time to get async'y.
                const projection = getProj('EPSG:3857');
                const features = [cleanFeature(feature)];

                const changeRequest = wfsDeleteFeatures(mapSource, projection, features);

                return fetch(mapSource.urls[0] + '', {
                    method: 'POST',
                    body: changeRequest,
                })
                    .then(r => r.text())
                    .then(text => {
                        // TODO: The response should be parsed for exceptions
                        //       and reported to the user.
                        dispatch(reloadSource(layerSrcName));
                    });
            } else {
                console.error(`${mapSource.type} sources do not support saving.`);
            }

        }
    };
}

/* Modify a feature's geomtery
 */
export function modifyFeatureGeometry(mapSourceName, id, geometry, idProp = 'uuid') {
    return {
        type: MAPSOURCE.MODIFY_GEOMETRY,
        mapSourceName, id, geometry, idProp,
    };
}

export function changeFeatures(mapSourceName, filter, properties) {
    return {
        type: MAPSOURCE.CHANGE_FEATURES,
        mapSourceName, filter, properties
    };
}

/* Get the active map-sources sorted by zIndex.
 *
 */
export function getOrderedMapSources(mapSources) {
    const active = [];
    for(const ms in mapSources) {
        if(isMapSourceActive(mapSources[ms])) {
            active.push(ms);
        }
    }

    // sort the active sources by their zIndex.
    return active.sort(function(a, b) {
        return (a.zIndex < b.zIndex) ? -1 : 1;
    });
}

/* Get an action for setting the zIndex of a Map Source
 *
 * @param mapSourceName The name of the map-source
 * @param zIndex        The new zindex.
 *
 * @return action.
 */
export function setMapSourceZIndex(mapSourceName, zIndex) {
    return {
        type: MAPSOURCE.SET_Z,
        mapSourceName,
        zIndex
    };
}

/* Get an action for setting the opacity of a Map Source
 *
 * @param mapSourceName The name of the map-source
 * @param opacity       The new opacity (float between 0 and 1)
 *
 * @return action.
 */
export function setOpacity(mapSourceName, opacity) {
    return {
        type: MAPSOURCE.SET_OPACITY,
        mapSourceName,
        opacity
    };
}

/** Definition for a change of template action.
 *
 * @param mapSourceName The name of the map-source
 * @param layerName     The name of the layer
 * @param name          The template name.
 * @param template      A new template definition
 */
export function setLayerTemplate(mapSourceName, layerName, name, template) {
    return {
        type: MAPSOURCE.SET_TEMPLATE,
        mapSourceName, layerName,
        name, template
    };
}

/** Change the visibility of a layer.
 *
 * @param mapSourceName The name of the map-source
 * @param layerName     The name of the layer
 * @param on            Visibility state of the layer.
 */
export function setLayerVisibility(mapSourceName, layerName, on) {
    return (dispatch, getState) => {
        const mapState = getState().map;

        // turn off the actual layer.
        dispatch({
            type: MAPSOURCE.LAYER_VIS,
            layerName,
            mapSourceName,
            on
        });

        // when the layer is turned off de-activate the editing tool
        const pathName = `${mapSourceName}/${layerName}`;
        if (mapState.activeSource === pathName || mapState.editPath === pathName) {
            dispatch(changeTool(null));
            dispatch(clearFeatures(EDIT_LAYER_NAME));
        }
    };
}

export function reloadSource(mapSourceName) {
    return {
        type: MAPSOURCE.RELOAD,
        mapSourceName,
    };
}

const cleanFeature = feature => {
    const newProps = Object.assign({}, feature.properties);
    delete newProps.boundedBy;
    return Object.assign({},
        feature,
        {
            properties: newProps,
        },
    );
};

/**
 * Save a feature
 *
 * Updates both the geometry and the properties.
 *
 */
export function saveFeature(path, feature) {
    return (dispatch, getState) => {
        const mapSources = getState().mapSources;
        const layer = getLayerFromPath(mapSources, path);
        const layerSrcName = util.getMapSourceName(path);

        let mapSourceName = layerSrcName;
        if (layer && layer.queryAs && layer.queryAs.length > 0) {
            mapSourceName = util.getMapSourceName(layer.queryAs[0]);
        }

        const mapSource = getState().mapSources[mapSourceName];
        if (mapSource) {
            const idProp = mapSource.idProperty;
            const id = feature.id || (feature.properties || {})[idProp];
            if (mapSource.type === 'vector') {

                // if this is a client side layer then just return
                //  the standard change events
                if (!id) {
                    dispatch(
                        addFeatures(mapSourceName, [feature])
                    );
                } else {
                    dispatch(
                        modifyFeatureGeometry(mapSourceName, id, feature.geometry, idProp)
                    );

                    // update the properties of the feature
                    const filter = {};
                    filter[idProp] = id;
                    dispatch(changeFeatures(mapSourceName, filter, feature.properties));
                }
            } else if (mapSource.type === 'wfs') {
                const projection = getProj('EPSG:3857');
                const features = [cleanFeature(feature)];

                const changeRequest = wfsSaveFeatures(mapSource, projection, features, !id);

                fetch(mapSource.urls[0] + '', {
                    method: 'POST',
                    body: changeRequest,
                })
                    .then(r => r.text())
                    .then(text => {
                        // TODO: The response should be parsed for exceptions
                        //       and reported to the user.
                        dispatch(reloadSource(layerSrcName));
                    });
            } else {
                console.error(`${mapSource.type} sources do not support saving.`);
            }
        }
    };
}
