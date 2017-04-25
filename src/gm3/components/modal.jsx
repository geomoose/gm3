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

import { connect } from 'react-redux';
import React, {Component, PropTypes } from 'react';

export default class ModalDialog extends Component {

    constructor(props) {
        super(props);

        this.state = {
            open: false
        }

        this.renderBody = this.renderBody.bind(this);
        this.renderFooter = this.renderFooter.bind(this);
    }

    renderBody() {
        return this.props.message;
    }

    renderFooter() {
        const buttons = [];
        for(const option of this.props.options) {
            buttons.push(
                <button key={option.value } 
                        onClick={ () => { this.close(option.value) } }>
                            { option.label }
                </button>
            );
        }

        return buttons;
    }

    close(response) {
        if(this.props.onClose) {
            this.props.onClose(response);
        }
        this.setState({open: false});
    }

    render() {
        if(this.state.open) {
            const footer_classes = {
                1: 'one', 2: 'two', 3: 'three'
            };
            const footer_class = 'modal-footer ' + footer_classes[this.props.options.length];

            return (
                <div className="modal-blocker">
                    <div className="modal-frame">
                        <div className="modal-title">
                            <h3>{ this.props.title }</h3>
                        </div>
                        <div className="modal-body">
                            { this.renderBody() }
                        </div>

                        <div className={footer_class}>
                            { this.renderFooter() }
                        </div>
                    </div>
                </div>
            );
        }
        return false;
    }
}
