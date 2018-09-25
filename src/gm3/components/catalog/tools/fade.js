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

import { setOpacity } from '../../../actions/mapSource';

import { Tool } from '../tools';


/** Tool to "fade" a layer. Aka, take away opacity.
 */
export class FadeTool extends React.Component {
    constructor() {
        super();
        this.tip = 'Fade layer';
        this.iconClass = 'fade';
        this.direction = -.10;
    }

    render() {
        return (
            <Tool
                tip={this.props.tip}
                iconClass={this.props.iconClass}
                onClick={() => {
                    // collect the map sources
                    const map_sources = {};
                    for(let i = 0, ii = this.props.layer.src.length; i < ii; i++) {
                        const ms_name = this.props.layer.src[i].mapSourceName;
                        map_sources[ms_name] = this.props.mapSources[ms_name].opacity;
                    }

                    for(const ms_name in map_sources) {
                        let new_opacity = map_sources[ms_name] += this.props.direction;

                        // check the bounds
                        if(new_opacity < 0) {
                            new_opacity = 0;
                        } else if(new_opacity > 1) {
                            new_opacity = 1;
                        }

                        this.props.onFade(ms_name, new_opacity);
                    }
                }}
            />
        );
    }
}

FadeTool.defaultProps = {
    tip: 'Fade layer',
    iconClass: 'fade',
    direction: -.1,
};

function mapState(state) {
    return {
        mapSources: state.mapSources,
    };
}

function mapDispatch(dispatch) {
    return {
        onFade: (mapSourceName, opacity) => {
            dispatch(setOpacity(mapSourceName, opacity));
        },
    }
}

export default connect(mapState, mapDispatch)(FadeTool);
