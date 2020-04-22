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

import React, { Component } from 'react';

import uuid from 'uuid';

export const getId = () => (uuid.v4());

export default class TextInput extends Component {

    constructor(props) {
        super(props);

        this.state = {
            value: props.value ? props.value : props.field.default ? props.field.default : ''
        };

        this.onChange = this.onChange.bind(this);
    }

    getId() {
        return getId();
    }

    getValue() {
        return this.state.value;
    }

    getName() {
        return this.props.field.name;
    }

    onChange(evt) {
        const v = evt.target.value;
        this.setState({value: v});

        this.setValue(this.getName(), v);
    }

    setValue(name, value) {
        // do nothing, this is meant for the parent to hook into.
        this.props.setValue(name, value);
    }


    render() {
        const id = this.getId();

        return (
            <div className='service-input'>
                <label htmlFor={ 'input-' + id }>{ this.props.field.label }</label>
                <input onChange={this.onChange} value={this.state.value} type="text" id={ 'input-' + id}></input>
            </div>
        );
    }

}
