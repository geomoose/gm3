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


import React, {Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import * as msActions from '../../actions/mapSource';
import * as mapActions from '../../actions/map';
import { setLegendVisibility } from '../../actions/catalog';

import * as util from '../../util';

/** Generic class for basic "click this, do this" tools.
 */
export class Tool extends Component {
    constructor(props) {
        super(props);

        this.onClick = this.onClick.bind(this);

        this.tip = 'Unset tooltop';

        this.iconClass = 'tool';
    }

    onClick() {
    }

    render() {
        return (
            <i className={this.iconClass} onClick={this.onClick} title={this.tip}></i>
        );
    }
}

/** Clears features from a vector layer.
 *
 */
export class ClearTool extends Tool {
    constructor() {
        super();
        this.tip = 'Clear all features from layer';
        this.iconClass = 'clear tool';
    }

    onClick() {
        let src = this.props.layer.src[0];
        this.props.store.dispatch(
            msActions.clearFeatures(src.mapSourceName, src.layerName));
    }
}

/* Draw a point on the map.
 *
 */
export class DrawTool extends Tool {
    constructor(props) {
        super(props);

        this.tip = 'Add a ' + props.drawType + ' to the layer';
        this.iconClass = props.drawType + ' tool';
        this.drawType = {
            'point': 'Point',
            'line': 'LineString',
            'polygon': 'Polygon'
        }[props.drawType];
    }

    onClick() {
        let src = this.props.layer.src[0];
        let path = src.mapSourceName + '/' + src.layerName;

        this.props.store.dispatch(
            mapActions.changeTool(this.drawType, path)
        );
    }
}

/* Zoom the the extent of a vector layer's features.
 *
 */
class dumb_ZoomToTool extends Tool {
    constructor() {
        super();
        this.tip = 'Zoom to layer extents.';
        this.iconClass = 'zoomto tool';
    }

    onClick() {
        const src = this.props.layer.src[0];
        const extent = util.getFeaturesExtent(this.props.mapSources[src.mapSourceName]);
        // ensure the extent is not null,
        // which happens when there are no features on the layer.
        if(extent[0] !== null) {
            this.props.store.dispatch(
                mapActions.zoomToExtent(extent)
            );
        }
    }
}

/* This makes the ZoomToTool a 'smart' object which
 * can more properly interact with the state.
 */
const mapZoomToProps = function(store) {
    return {
        mapSources: store.mapSources
    }
}
const ZoomToTool = connect(mapZoomToProps)(dumb_ZoomToTool);
export { ZoomToTool };

/* Toggle whether a legend is visible or not.
 *
 */
export class LegendToggle extends Tool {
    constructor(props) {
        super(props);
        this.tip = 'Toggle legend visibility.';
        this.iconClass = 'legend tool';
    }

    onClick() {
        this.props.store.dispatch(
            setLegendVisibility(this.props.layer.id, this.props.layer.legend !== true)
        );
    }
}

/* Move the layer up in the stack.
 */
export class UpTool extends Tool {
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
        const layer_order = util.getLayersByZOrder(state.catalog, state.mapSources);

        const actions = [];
        for(let i = 0, ii = layer_order.length; i < ii; i++) {
            const layer = layer_order[i];
            if(layer.layer.src[0].mapSourceName === up_src.mapSourceName) {
                const swap = i + this.direction;
                if(swap >= 0 && swap <= ii) {
                    const current_z = layer.zIndex;
                    const new_z = layer_order[swap].zIndex;
                    const other_ms = layer_order[swap].layer.src[0].mapSourceName;

                    actions.push(msActions.setMapSourceZIndex(up_src.mapSourceName, new_z));
                    actions.push(msActions.setMapSourceZIndex(other_ms, current_z));
                }
            }
        }

        for(const action of actions) {
            this.props.store.dispatch(action);
        }
    }
}

/* Move the layer down in the stack.
 */
export class DownTool extends UpTool {
    constructor() {
        super();
        this.tip = 'Move layer down in the order';
        this.iconClass = 'down tool';
        this.direction = 1;
    }
}
