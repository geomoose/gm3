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
import TextInput from './text';


export default class SelectInput extends TextInput {
    renderOption(opt) {
        return (<option key={opt.value} value={opt.value}>{opt.label}</option>);
    }

    getOptions() {
        return this.props.field.options;
    }

    componentDidMount() {
        const options = this.getOptions();
        if (
            this.props.field.default === undefined ||
            options.filter(v => v.value === this.props.field.default).length < 1
        ) {
            this.onChange({
                target: {
                    value: options.length > 0 ? options[0].value : '',
                },
            });
        }
    }

    render() {
        const id = this.getId();
        const options = this.getOptions();

        return (
            <div className='service-input select'>
                <label htmlFor={ 'input-' + id }>{ this.props.field.label }</label>
                <select id={ 'input-' + id} value={this.state.value} onChange={this.onChange}>
                    { options.map(this.renderOption) }
                </select>
            </div>
        );
    }
}
