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

/** The big bopper of all the GeoMoose Components, the Catalog.
 *
 *  This is the most exercised component of GeoMoose and serves
 *  as the 'dispatch' center to the map, presenting the layers
 *  of the mapbook in a nice tree format.
 */

import React, {Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';

import { connect } from 'react-redux';

import { isLayerOn } from '../util';

import { CATALOG, MAPSOURCE } from '../actionTypes';
import * as mapSourceActions from '../actions/mapSource';

import { UpTool, DownTool, ClearTool, DrawTool, ZoomToTool, LegendToggle } from './catalog/tools';
import { FadeTool, UnfadeTool } from './catalog/tools';
import { UploadTool } from './catalog/tools/upload';
import { DownloadTool } from './catalog/tools/download';

import Legend from './catalog/legend';

const mapCatalogToProps = function(store) {
    return {
        mapSources: store.mapSources,
        catalog: store.catalog
    }
}

class MetadataTool extends Component {
    render() {
        return (
            <a className="metadata" href={ this.props.href } target="_blank"
                title="View metadata - opens new window">
                <i className="icon metadata"></i>
            </a>
        );
    }
}



export class Catalog extends Component {


    constructor() {
        super();

        this.renderLayer = this.renderLayer.bind(this);
        this.renderGroup = this.renderGroup.bind(this);
        this.renderTreeNode = this.renderTreeNode.bind(this);

        this.toggleFavoriteLayer = this.toggleFavoriteLayer.bind(this);

        this.filterCatalog = this.filterCatalog.bind(this);

        this.state = {
            searchFilter: ''
        };
        this.searchable = true;
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
    renderMapSources(layer, on) {
        // "render" the src
        for(let src of layer.src) {
            this.props.store.dispatch({
                type: MAPSOURCE.LAYER_VIS,
                layerName: src.layerName,
                mapSourceName: src.mapSourceName,
                on
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

    toggleRefreshLayer(layer) {
        layer.refreshEnabled = !layer.refreshEnabled;
        let refresh_seconds = null;
        if(layer.refreshEnabled) {
            refresh_seconds = layer.refresh;
        }

        this.props.store.dispatch({
            type: CATALOG.REFRESH,
            id: layer.id,
            refreshEnabled: layer.refreshEnabled
        });


        // with each layer, turn of the
        for(let src of layer.src) {
            this.props.store.dispatch(mapSourceActions.setRefresh(src.mapSourceName, refresh_seconds));
        }
    }


    /* Convert the tool definitions to components.
     */
    getTools(layer, enabledTools) {
        let tools = [];
        for(let tool_name of enabledTools) {
            let key = layer.id + '_' + tool_name;

            switch(tool_name) {
                case 'up':
                    tools.push(<UpTool store={this.props.store} key={key} layer={layer} />);
                    break;
                case 'down':
                    tools.push(<DownTool store={this.props.store} key={key} layer={layer} />);
                    break;
                case 'fade':
                    tools.push(<FadeTool store={this.props.store} key={key} layer={layer} />);
                    break;
                case 'unfade':
                    tools.push(<UnfadeTool store={this.props.store} key={key} layer={layer} />);
                    break;
                case 'zoomto':
                    tools.push(<ZoomToTool store={this.props.store} key={key} layer={layer} />);
                    break;
                case 'upload':
                    tools.push(<UploadTool store={this.props.store} key={key} layer={layer} />);
                    break;
                case 'download':
                    tools.push(<DownloadTool store={this.props.store} key={key} layer={layer} />);
                    break;
                case 'clear':
                    tools.push(<ClearTool store={this.props.store} key={key} layer={layer} />);
                    break;

                case 'draw-point':
                case 'draw-polygon':
                case 'draw-line':
                case 'draw-modify':
                case 'draw-remove':
                    const draw_type = tool_name.split('-')[1];
                    tools.push(<DrawTool store={this.props.store} drawType={draw_type} key={key} layer={layer} />);
                    break;
                case 'legend-toggle':
                    tools.push(<LegendToggle store={this.props.store} layer={layer} key={key} />);
                    break;
                default:
                    // pass
            }
        }
        return tools;
    }

    getToolsForLayer(layer) {
        return this.getTools(layer, layer.tools);
    }

    renderLayer(layer) {
        let toggle = () => {
            const map_sources = this.props.store.getState().mapSources;
            this.renderMapSources(layer, !isLayerOn(map_sources, layer));
        };

        let toggleFavorite = () => {
            this.toggleFavoriteLayer(layer);
        };

        let toggleRefresh = () => {
            this.toggleRefreshLayer(layer);
        }

        // this prevents a React warning about the
        //  checkboxes not having an onChange event.
        let doNothing = () => {};

        let layer_classes = ['layer'];

        let is_favorite = 'favorite icon';
        if(!this.isFavoriteLayer(layer)) {
            is_favorite += ' not';
        }
        if(layer.on) {
            layer_classes.push('on');
        }

        // TODO: Check layer for minscale/maxscale against
        //       the mapView.
        // if(isOutOfScale(layer)) {
        //  layer_classes.push('out-of-scale');
        // }

        // only show the refresh icon when a layer has been configured
        //  with the ability to do auto-refresh.
        let refresh_tool = '';
        if(layer.refresh !== null && layer.refresh > 0) {
            const refresh_on = layer.refreshEnabled ? 'on' : '';
            refresh_tool = (<i className={'refresh icon ' + refresh_on} onClick={toggleRefresh}/>);
        }

        let tools = this.getToolsForLayer(layer);

        let legend = false;
        if(layer.legend) {
            legend = ( <Legend store={this.props.store} layer={layer}/> );
        }

        let metadata_tool = false;
        if(layer.metadata_url) {
            metadata_tool = <MetadataTool href={layer.metadata_url} />
        }
        // check to see if the layer is on or not.
        const is_on = isLayerOn(this.props.mapSources, layer);

        return (
            <div key={layer.id} className={layer_classes.join(' ')}>
                <div className="layer-label">
                    <input className="checkbox" type="checkbox"
                       onChange={doNothing} onClick={toggle} checked={is_on} />

                    <i className={ is_favorite } onClick={toggleFavorite}/>
                    <span onClick={toggle}>
                        {layer.label}
                    </span>
                    {refresh_tool}
                    {metadata_tool}
                </div>
                <div className="layer-tools">
                    {tools}
                </div>
                { legend }
            </div>
        );
    }


    renderGroup(group) {
        let classes = 'group';
        let is_open = '';
        if(group.expand) {
            classes += ' expand';
            is_open = 'open';
        } else {
            classes += ' collapse';
        }

        let toggle = () => {
            this.toggleGroup(group);
        }

        return (
            <div key={group.id} className={classes}>
                <div onClick={toggle} className="group-label"><i className={'folder icon ' + is_open}></i>{group.label}</div>
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

            if(this.searchable && this.shouldLayerRender(node)) {
                return this.renderLayer(node);
            } else {
                return null;
            }
        }
    }

    shouldLayerRender(layer) {
        if(this.state.searchFilter !== '') {
            // searchFilter is always lower case!
            // If the search filter is in the title then return true.
            return (layer.label.toLowerCase().indexOf(this.state.searchFilter) >= 0);
        }
        return true;
    }

    filterCatalog(evt) {
        let search_term = evt.target.value;
        this.setState({searchFilter: search_term.toLowerCase()});
    }

    render() {
        let searchbox = '';
        let catalog_classes = 'catalog'

        // if the catalog is searchable add a searchbox!
        if(this.searchable) {
            searchbox = (<div className='searchbox'>
                <input onChange={this.filterCatalog} placeholder='Search catalog'/>
            </div>);

            catalog_classes += ' searchable';
        }

        if(this.state.searchFilter !== '') {
            catalog_classes += ' flat';
        }

        return (
            <div className={ catalog_classes }>
                { searchbox }
                {
                    this.props.catalog.root.children.map(this.renderTreeNode)
                }
            </div>
        );
    }
}

export default connect(mapCatalogToProps)(Catalog);
