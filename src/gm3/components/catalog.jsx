/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 GeoMoose
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

/** The big bopper of all the GeoMoose Components, the Catalog.
 * 
 *  This is the most exercised component of GeoMoose and serves
 *  as the 'dispatch' center to the map, presenting the layers
 *  of the mapbook in a nice tree format.
 */

import React, {Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';

import { connect } from 'react-redux';

import { CATALOG, MAPSOURCE } from '../actionTypes';
import * as mapSourceActions from '../actions/mapSource'; 

const mapCatalogToProps = function(store) {
    return {
        mapSources: store.mapSources,
        catalog: store.catalog
    }
}



export class Catalog extends Component {


    constructor() {
        super();

        this.renderLayer = this.renderLayer.bind(this);
        this.renderGroup = this.renderGroup.bind(this);
        this.renderTreeNode = this.renderTreeNode.bind(this);

        this.toggleLayer = this.toggleLayer.bind(this);
        this.toggleFavoriteLayer = this.toggleFavoriteLayer.bind(this);
    }

    /** Change the layer's visibility state
     *
     *  @param layer Catalog layer definition.
     *
     */
    toggleLayer(layer) {
        // change the actual layer value.
        this.props.store.dispatch({
            type: CATALOG.LAYER_VIS,
            id: layer.id,
            on: !layer.on
        });
    }

    /** Toggle whether a layer is considered a "favorite" 
     *  or not.
     * 
     *  @param {Layer} layer Catalog layer definition
     *
     */
    toggleFavoriteLayer(layer) {
        this.props.store.dispatch({
            type: CATALOG.FAVORITE,
            id: layer.id,
            favorite: !layer.favorite
        });

        for(let src of layer.src) {
            this.props.store.dispatch(
                mapSourceActions.favoriteLayer(src.mapSourceName, src.layerName, !layer.favorite)
            );
        }
    }

    /** Change the group's "expansion" state.
     *
     *  @param group Catalog group definition.
     *
     */
    toggleGroup(group) {
        this.props.store.dispatch({
            type: CATALOG.GROUP_VIS,
            id: group.id,
            expand: !group.expand
        });
    }


    /** Render the 'map sources' of a layer.
     *
     *  @param layer Catalog layer definition.
     *  
     */
    renderMapSources(layer) {
        // "render" the src
        for(let src of layer.src) {
            this.props.store.dispatch({
                type: MAPSOURCE.LAYER_VIS,
                layerName: src.layerName,
                mapSourceName: src.mapSourceName,
                on: !layer.on
            })
        }
    }

    isFavoriteLayer(layer) {
        // check to see if this catalog item is a favorite layer or not.
        let is_favorite = true;
        for(let i = 0, ii = layer.src.length; i < ii; i++) {
            let src = layer.src[i];
            is_favorite = (is_favorite && mapSourceActions.isFavoriteLayer(this.props.store, src));
        }

        return is_favorite;
    }

    renderLayer(layer) {
        let toggle = () => {
            this.toggleLayer(layer);
            this.renderMapSources(layer);
        };

        let toggleFavorite = () => {
            this.toggleFavoriteLayer(layer);
        };

        let layer_classes = ['layer'];

        if(this.isFavoriteLayer(layer)) {
            layer_classes.push('favorite');
        }
        if(layer.on) {
            layer_classes.push('on');
        }

        // TODO: Check layer for minscale/maxscale against
        //       the mapView.

        return (
            <div key={layer.id} className={layer_classes.join(' ')}>
                <div className="layer-label"> 
                    <input type="checkbox" onClick={toggle} checked={layer.on} />
                    <i className="favorite-icon" onClick={toggleFavorite}/> 
                    <span onClick={toggle}>
                        {layer.label}
                    </span>
                </div>
            </div>
        );
    }


    renderGroup(group) {
        let classes = 'group';
        if(group.expand) {
            classes += ' expand';
        } else {
            classes += ' collapse';
        }

        let toggle = () => {
            this.toggleGroup(group);
        }

        return (
            <div key={group.id} className={classes}>
                <div onClick={toggle} className="group-label"><i className="group-icon"></i>{group.label}</div>
                <div className="children">
                {group.children.map(this.renderTreeNode)}
                </div>
            </div>
        );
    }


    renderTreeNode(childId) {
        var node = this.props.catalog[childId];
        if(node.children) {
            return this.renderGroup(node);
        } else {
            return this.renderLayer(node);
        }
    }
    
    render() {
        return (
            <div className="catalog">
                {
                    this.props.catalog.root.children.map(this.renderTreeNode)
                }
            </div>
        );
    }
}

export default connect(mapCatalogToProps)(Catalog);
