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

import { connect } from 'react-redux';
import React, {Component, PropTypes } from 'react';

import { FavoriteLayers } from './favorites';

import { isLayerOn } from '../util';

import { Tool } from './catalog/tools';

import { setMapSourceZIndex } from '../actions/mapSource';


function getZValue(mapSources, layer) {
    // only care about the first src
    const src = layer.src[0];
    return mapSources[src.mapSourceName].zIndex;
}

function getLayersByZOrder(catalog, mapSources) {
    let layers = [];
    for(const key of Object.keys(catalog)) {
        const node = catalog[key];
        // no children, should be a layer
        if(node && typeof(node.children) === 'undefined') {
            if(isLayerOn(mapSources, node)) {
                layers.push({
                    zIndex: getZValue(mapSources, node),
                    layer: node
                });
            }
        }
    }

    // sort the catalog layers by zIndex
    layers.sort(function(a, b) {
        return (a.zIndex > b.zIndex) ? -1 : 1;
    });

    return layers;
}

class UpTool extends Tool {
    constructor() {
        super();
        this.tip = 'Move layer up in the order'
        this.iconClass = 'up tool';

        this.direction = -1;
    }

    onClick() {
        // this is the map-source to go "up"
        let up_src = this.props.layer.src[0];

        const state = this.props.store.getState();
        const layer_order = getLayersByZOrder(state.catalog, state.mapSources);

        const actions = [];
        for(let i = 0, ii = layer_order.length; i < ii; i++) {
            const layer = layer_order[i];
            if(layer.layer.src[0].mapSourceName === up_src.mapSourceName) {
                const swap = i + this.direction;
                if(swap >= 0 && swap < ii) {
                    const current_z = layer.zIndex;
                    const new_z = layer_order[swap].zIndex;
                    actions.push(setMapSourceZIndex(up_src.mapSourceName, new_z)); 
                    const other_ms = layer.layer.src[0].mapSourceName;
                    actions.push(setMapSourceZIndex(other_ms, new_z)); 
                }
            }
        }

        for(const action of actions) {
            this.props.store.dispatch(action);
        }
    }
}

class DownTool extends UpTool {
    constructor() {
        super();
        this.tip = 'Move layer down in the order';
        this.iconClass = 'down tool';
        this.direction = 1;
    }
}


/* VisibleLayers Tab.
 *
 * Displays layers in their map layer order.
 *
 */
class VisibleLayers extends FavoriteLayers {

    render() {
        // get the list of layers order'd by the stack order
        const layers = getLayersByZOrder(this.props.catalog, this.props.mapSources);

        // convert the layer to something to render
        const layer_objects = [];
        for(let i = 0, ii = layers.length; i < ii; i++) {
            const layer = layers[i];

            layer_objects.push((
                <div className='layer' key={ 'layers' + i }>
                    <div className='layer-tools'>
                        <UpTool store={this.props.store} layer={layer.layer} />
                        <DownTool store={this.props.store} layer={layer.layer} />
                    </div>
                    { this.renderLayer(layer.layer) }
                </div>
            ));
        }

        // put a message out if there are no layers.
        let no_layers_error = '';
        if(layers.length === 0) {
            no_layers_error = (<i>No layers are visible</i>);
        }
        
        return (
            <div className="catalog visble-layers flat">
                { no_layers_error }
                { layer_objects }
            </div>
        );
    }
}


const mapFavoritesToProps = function(store) {
    return {
        mapSources: store.mapSources,
        catalog: store.catalog
    }
}

export default connect(mapFavoritesToProps)(VisibleLayers);
