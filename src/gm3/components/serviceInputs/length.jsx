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

/**
 * Service input type for specifying length
 * - Renders a numeric text input and a select-list of units
 * - User-specified length is converted to its equivalent in meters and stored
 *   in the component state
 *
 * @extends TextInput
 */
import React from 'react';
import TextInput from './text.jsx';
import { convertLength } from '../../util.js';
export default class LengthInput extends TextInput {
    constructor(props) {
        super(props);
        this.units = [{
            label: 'Feet',
            value: 'ft'
        }, {
            label: 'Yards',
            value: 'yd'
        }, {
            label: 'Miles',
            value: 'mi'
        }, {
            label: 'Inches',
            value: 'in'
        }, {
            label: 'Meters',
            value: 'm'
        }, {
            label: 'Kilometers',
            value: 'km'
        }, {
            label: 'Chains',
            value: 'ch'
        }];
        this.state = {
            value: props.field.default ? props.field.default : 0
        };
    }
    onChange() {
        let lengthInput = parseFloat(this.lengthInput.value);
        let unitInput = this.unitInput.value;
        let lengthInMeters = convertLength(lengthInput, unitInput, 'm');
        this.setState({ value: lengthInMeters });
        this.setValue(this.getName(), lengthInMeters);
    }
    /**
     * Renders individual units of length as options within length select input
     * @param {Object} opt - Unit to be rendered
     * @param {string} opt.label - Unit Label, to be displayed in select
     * @param {string} opt.value - Unit abbreviated ID
     * @return {ReactElement} option to render
     */
    renderOption(opt) {
        return (<option key={opt.value} value={opt.value}>{opt.label}</option>);
    }
    render() {
        const id = this.getId();
        return (
            <div className='service-input'>
                <label htmlFor={ 'input-' + id }>{ this.props.field.label }</label>
                <input onChange={ this.onChange } type="number" id={ 'input-' + id } ref={(input) => { this.lengthInput = input; }}></input>
                <select onChange={ this.onChange } ref={(input) => { this.unitInput = input; }}>
                    { this.units.map(this.renderOption) }
                </select>
            </div>
        );
    }
}
