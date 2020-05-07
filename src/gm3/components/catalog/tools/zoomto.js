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

import React from 'react';
import { connect } from 'react-redux';

import { zoomToExtent } from '../../../actions/map';
import { getFeaturesExtent } from '../../../util';

import { Tool } from '../tools';


/** Zoom the the extent of a vector layer's features.
 *
 */
export class ZoomToTool extends React.Component {
    render() {
        return (
            <Tool
                tip='zoomto-tip'
                iconClass='zoomto'
                onClick={() => {
                    const src = this.props.layer.src[0];
                    const extent = getFeaturesExtent(this.props.mapSources[src.mapSourceName]);
                    // ensure the extent is not null,
                    // which happens when there are no features on the layer.
                    if(extent[0] !== null) {
                        this.props.onZoomTo(extent);
                    }
                }}
            />
        );
    }
}

/* This makes the ZoomToTool a 'smart' object which
 * can more properly interact with the state.
 */
function mapState(store) {
    return {
        mapSources: store.mapSources,
    };
}

function mapDispatch(dispatch) {
    return {
        onZoomTo: (extent) => {
            dispatch(zoomToExtent(extent));
        },
    };
}

export default connect(mapState, mapDispatch)(ZoomToTool);
