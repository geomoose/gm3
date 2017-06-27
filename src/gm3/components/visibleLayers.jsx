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

import { isLayerOn, getZValue, getLayersByZOrder } from '../util';

import { UpTool, DownTool } from './catalog/tools';

import { setMapSourceZIndex } from '../actions/mapSource';

/* VisibleLayers Tab.
 *
 * Displays layers in their map layer order.
 *
 */
class VisibleLayers extends FavoriteLayers {

    getToolsForLayer(layer) {
        let tools = layer.tools.slice();

        if(layer.tools.indexOf('down') < 0) {
            tools = ['down'].concat(tools);
        }
        if(layer.tools.indexOf('up') < 0) {
            tools = ['up'].concat(tools);
        }

        return this.getTools(layer, tools);
    }

    render() {
        // get the list of layers order'd by the stack order
        const layers = getLayersByZOrder(this.props.catalog, this.props.mapSources);

        // convert the layer to something to render
        const layer_objects = [];
        for(let i = 0, ii = layers.length; i < ii; i++) {
            const layer = layers[i];
            layer_objects.push(this.renderLayer(layer.layer));
        }

        // put a message out if there are no layers.
        let no_layers_error = '';
        if(layers.length === 0) {
            no_layers_error = (<i>No layers are visible</i>);
        }

        return (
            <div className="catalog visble-layers flat">
                <div className="info-box">
                This tab lists all of the visible layers. Checking a layer
                from the Catalog will cause the layer to appear here. Unchecking a
                layer's checkbox will cause it to disappear from this list.
                </div>
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
