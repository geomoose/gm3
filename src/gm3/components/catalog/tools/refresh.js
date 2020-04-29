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
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { setRefresh } from '../../../actions/mapSource';

import { Tool } from '../tools';


export function isRefreshingOn(mapSources, layer) {
    for(let i = 0, ii = layer.src.length; i < ii; i++) {
        const src = layer.src[i];
        if(mapSources[src.mapSourceName].refresh) {
            return true;
        }
    }

    return false;
}


export class LayerRefresh extends React.Component {
    render() {
        const refreshing = isRefreshingOn(this.props.mapSources, this.props.layer);

        let classes = 'refresh';
        if(refreshing) {
            classes += ' on';
        }

        return (
            <Tool
                tip='layer-refresh-tip'
                iconClass={classes}
                onClick={() => {
                    this.props.onToggleRefresh(this.props.layer, !refreshing);
                }}
            />
        );
    }
}

LayerRefresh.propTypes = {
    mapSources: PropTypes.object.isRequired,
    layer: PropTypes.object.isRequired,
    onToggleRefresh: PropTypes.func.isRequired,
};

function mapStateProps(state) {
    return {
        mapSources: state.mapSources,
    };
}

function mapDispatchProps(dispatch) {
    return {
        onToggleRefresh: (layer, refresh) => {
            // turn off refreshing by setting it to null.
            const seconds = refresh ? layer.refresh : null;

            for(let i = 0, ii = layer.src.length; i < ii; i++) {
                const src = layer.src[i];
                dispatch(setRefresh(src.mapSourceName, seconds));
            }
        },
    }
}

export default connect(mapStateProps, mapDispatchProps)(LayerRefresh);
