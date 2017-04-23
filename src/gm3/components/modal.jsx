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

    renderBody() {
        return '';
    }

    renderFooter() {
        return '';
    }

    close(response) {
        if(this.props.onClose) {
            this.props.onClose(response);
        }

        // make all this go away.
        // this.destroy();
    }

    render() {
        return (
            <div className="modal-blocker">
                <div className="modal-frame">
                    <div className="modal-title">
                        <h3>{ this.props.title }</h3>
                    </div>
                    <div className="modal-body">
                        { this.renderBody() }
                    </div>

                    <div className="modal-footer">
                        { this.renderFooter() }
                    </div>
                </div>
            </div>
        );
    }
}
