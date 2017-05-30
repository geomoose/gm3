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

import { getSelectableLayers, getLayerByPath } from '../actions/mapSource';

class DrawTool extends Component {

    constructor(props) {
        super(props);

        this.changeDrawTool = this.changeDrawTool.bind(this);
        this.changeSelectLayer = this.changeSelectLayer.bind(this);

        this.state = {
            selectLayer: null
        }

        if(this.props.geomType === 'Select') {
            this.state.selectLayer = getSelectableLayers(this.props.store)[0];
        }

    }

    changeDrawTool(type) {
        this.props.store.dispatch(changeTool(type, this.state.selectLayer));
    }

    changeSelectLayer(event) {
        this.setState({selectLayer: event.target.value});
    }

    getSelectOptions() {
        const selectable_layers = getSelectableLayers(this.props.store);
        const options = [];

        for(let layer of selectable_layers) {
            const label = getLayerByPath(this.props.store, layer).label;
            options.push((
                <option key={ layer } value={ layer }>{ label }</option>
            ));
        }

        return options;
    }

    render() {
        let gtype = this.props.geomType;

        let tool_class = 'draw-tool';

        let select_options = '';


        // ensures the state of the drawing tool
        // matches what is checked.
        if(this.props.map.interactionType === gtype) {
            tool_class += ' selected';
        }

        let tool_label = gtype;
        if(gtype === 'Select') {
            tool_label = 'Select from: ';
            select_options = (
              <select value={ this.state.selectLayer } onChange={ this.changeSelectLayer }>
                { this.getSelectOptions() }
              </select>
            );
        } else if(gtype === 'Modify') {
            tool_label = 'Modify Feature';
        } else if(gtype === 'LineString') {
            tool_label = 'Draw Line';
        } else if(gtype === 'MultiPoint') {
            tool_label = 'Draw Multi-Point';
        } else {
            tool_label = 'Draw ' + gtype;
        }

        return (
            <div key={'draw-tool-' + gtype} className={tool_class} onClick={ () => { this.changeDrawTool(gtype) } }>
                <i className="radio-icon"></i> { tool_label } { select_options }
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
