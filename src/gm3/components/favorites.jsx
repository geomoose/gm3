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

import { Catalog } from './catalog';


export class FavoriteLayers extends Catalog {

    constructor() {
        super();

        this.nFavorites = 0;
    }

    shouldRenderNode(node) {
        return (!node.children && this.isFavoriteLayer(node));
    }

    renderTreeNode(childId) {
        let node = this.props.catalog[childId];
        if(this.shouldRenderNode(node)) {
            this.nFavorites += 1;
            return this.renderLayer(node);
        }
        return '';
    }

    render() {
        // reset the favorites counter.
        this.nFavorites = 0;

        let favorites = Object.keys(this.props.catalog).map(this.renderTreeNode)

        if(this.nFavorites === 0) {
            favorites = (<i>No layers marked as favorite</i>);
        }

        return (
            <div className="catalog favorites flat">
                <div className="info-box">
                This tab lists all layers marked as "Favorites".  Favorite layers
                can be selected by clicking the <i className="icon favorite"></i> icon
                next to the layer name.
                </div>
                { favorites }
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

export default connect(mapFavoritesToProps)(FavoriteLayers);
