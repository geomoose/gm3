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
import { useTranslation } from 'react-i18next';

const ModalTitle = ({title}) => {
    const {t} = useTranslation();
    return (
        <h5>{t(title)}</h5>
    );
};

const ModalButton = ({option, onClick}) => {
    const {t} = useTranslation();
    return (
        <div
            className="button-parent"
        >
            <button
                onClick={() => { onClick(); }}
            >
                { t(option.label) }
            </button>
        </div>

    );
}

class ModalDialog extends React.Component {

    constructor(props) {
        super(props);
        this.renderBody = this.renderBody.bind(this);
        this.renderFooter = this.renderFooter.bind(this);
        this.state = {};
    }

    getTitle() {
        return this.props.title;
    }

    renderBody() {
        if(this.props.children) {
            return this.props.children;
        }
        return this.props.message;
    }

    renderOption(option) {
        return (
            <ModalButton
                key={option.value}
                option={option}
                onClick={() => {
                    this.close(option.value);
                }}
            />
        );
    }

    getFooterClass(n) {
        const footer_classes = {
            1: 'one', 2: 'two', 3: 'three'
        };
        return 'modal-footer ' + footer_classes[n];
    }

    getOptions() {
        return this.props.options;
    }

    renderFooter() {
        const options = this.getOptions();
        const footer_class = this.getFooterClass(options.length);

        const buttons = [];
        for(const option of options) {
            buttons.push(this.renderOption(option));
        }
        return (
            <div className={footer_class}>
                { buttons }
            </div>
        );
    }

    close(response) {
        if(this.props.onClose) {
            this.props.onClose(response);
        }
    }

    render() {
        if (!this.props.open) {
            return false;
        }

        return (
            <div className='modal-blocker'>
                <div className='modal-frame'>
                    <div className='modal-title'>
                        <ModalTitle title={this.getTitle()} />
                    </div>
                    <div className='modal-body' style={this.BodyProps && this.BodyProps.style}>
                        { this.renderBody() }
                    </div>

                    { this.renderFooter() }
                </div>
            </div>
        );
    }
}

ModalDialog.defaultProps = {
    open: false,
};

export default ModalDialog;
