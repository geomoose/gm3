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

import { setLayerVisibility } from '../../actions/mapSource';
import { isLayerOn } from '../../util';


class LayerCheckbox extends React.Component {
    render() {
        let classes = 'checkbox icon';
        if(this.props.on) {
            classes += ' on';
        }

        return (
            <i
                className={ classes }
                onClick={() => {
                    this.props.onChange(!this.props.on);
                }}
            />
        );

    }
}

function mapStateProps(state, ownProps) {
    return {
        on: isLayerOn(state.mapSources, ownProps.layer),
    };
}

function mapDispatchProps(dispatch, ownProps) {
    return {
        onChange: (on) => {
            const layer = ownProps.layer;

            for(let s = 0, ss = layer.src.length; s < ss; s++) {
                const src = layer.src[s];
                dispatch(setLayerVisibility(src.mapSourceName, src.layerName, on));
            }
        },
    }
}

export default connect(mapStateProps, mapDispatchProps)(LayerCheckbox);
