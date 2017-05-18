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


class VisibleLayers extends FavoriteLayers {
    getZValue(layer) {
        // only care about the first src
        const src = layer.src[0];
        return this.props.mapSources[src.mapSourceName].zIndex;
    }

    render() {
        let layers = [];
        for(const key of Object.keys(this.props.catalog)) {
            const node = this.props.catalog[key];
            // no children, should be a layer
            if(node && typeof(node.children) === 'undefined') {
                if(isLayerOn(this.props.mapSources, node)) {
                    layers.push({
                        zIndex: this.getZValue(node),
                        layer: node
                    });
                }
            }
        }

        // sort the catalog layers by zIndex
        layers.sort(function(a, b) {
            return (a.zIndex > b.zIndex) ? -1 : 1;
        });

        const rendered_layers = [];
        for(const layer of layers) {
            rendered_layers.push(this.renderLayer(layer.layer));
        }

        let no_layers_error = '';
        if(layers.length === 0) {
            no_layers_error = (<i>No layers are visible</i>);
        }
        
        return (
            <div className="catalog visble-layers flat">
                { no_layers_error }
                { rendered_layers }
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
