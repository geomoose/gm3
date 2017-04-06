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

import { changeTool } from '../actions/map';

class DrawTool extends Component {

    constructor(props) {
        super(props);

        this.changeDrawTool = this.changeDrawTool.bind(this);
    }

    changeDrawTool(type) {
        this.props.store.dispatch(changeTool(type));
    }

    render() {
        let gtype = this.props.geomType;

        let tool_class = 'draw-tool';

        // ensures the state of the drawing tool 
        // matches what is checked. 
        if(this.props.map.interactionType === gtype) {
            tool_class += ' selected';
        }

        let tool_label = gtype;
        if(gtype === 'LineString') {
            tool_label = 'Line';
        } else if(gtype === 'MultiPoint') {
            tool_label = 'Multi-Point';
        }

        return (
            <div key={'draw-tool-' + gtype} className={tool_class} onClick={ () => { this.changeDrawTool(gtype) } }>
                <i className="radio-icon"></i> Draw { tool_label }
            </div>
        );

    }
}

const mapToProps = function(store) {
    return {
        map: store.map
    }
}
export default connect(mapToProps)(DrawTool);
