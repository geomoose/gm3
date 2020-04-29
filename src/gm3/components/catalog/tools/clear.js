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

import { clearFeatures } from '../../../actions/mapSource';

import ModalDialog from '../../modal';

import { Tool } from '../tools';

/** Clears features from a vector layer.
 *
 */
export class ClearTool extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
        };
    }

    render() {
        return (
            <Tool
                tip='clear-features-tip'
                iconClass='clear'
                onClick={() => {
                    this.setState({open: true});
                }}
            >
                { !this.state.open ? false :
                    (
                        <ModalDialog
                            title='Clear features'
                            open={this.state.open}
                            onClose={() => {
                                this.setState({open: false});

                                const src = this.props.layer.src[0];
                                this.props.clearFeatures(src.mapSourceName);
                            }}
                            options={[
                                {label: 'Cancel', value: 'dismiss'},
                                {label: 'Clear', value: 'clear'},
                            ]}
                        >
                            Remove all features from selected layer?
                        </ModalDialog>
                    )
                }
            </Tool>
        );
    }
}

function mapDispatch(dispatch) {
    return {
        clearFeatures: (mapSourceName) => {
            dispatch(clearFeatures(mapSourceName));
        },
    };
}

export default connect(undefined, mapDispatch)(ClearTool);
