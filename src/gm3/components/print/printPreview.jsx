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

/*
 * Present the user with a preview of what
 * they will get in a print.
 *
 * This really provides a buffer for the map to load
 * and hopefully the user does not hit "print" until
 * that image is ready.
 */
import React, { Component } from 'react';
import { connect } from 'react-redux';

import Modal from '../modal';
import PrintImage from './printImage';
import PrintPreviewImage from './printPreviewImage';

export default class PrintPreview extends Modal {

    close(status) {
        if(status === 'print') {
            console.log('PRINT IMAGE?', this.refs.print_image);
        }
        this.setState({open: false});
    }

    getTitle() {
        return 'Print Preview';
    }

    updatePreview() {
        // get the contents of the print image,
        // then scale it down to fit into our preview canvas.
        const print_canvas = this.refs.print_image.getElementsByTagName('canvas');
        // get the preview canvas
        const preview_ctx = this.refs.prevew.getContext('2d');

        // get the image contents
        const print_image = print_canvas.getContext('2d').getImageData();

        // put the image contents on the preview.
        preview_ctx.putImageData(print_image, 0, 0);

    }

    renderFooter() {
        const buttons = [
            this.renderOption({value: 'dismiss', label: 'Cancel'}),
            this.renderOption({value: 'print', label: 'Print'})
        ];

        return (
            <div className={ this.getFooterClass(2) }>
                { buttons }
            </div>
        );
    }

    renderBody() {
        // small set of CSS hacks to keep the print map
        //  invisible but drawn.
        const map_style_hack = {
            visibility: 'hidden',
            zIndex: -1,
            position: 'absolute',
            top: 0, left: 0
        };

        return (
            <div>
                <label>
                    Map title: <input placeholder="Map title"/>
                </label>
                <div>
                    <PrintPreviewImage store={this.props.store}/>
                </div>

                <div style={ map_style_hack }>
                    <PrintImage store={this.props.store}/>
                </div>
            </div>
        );
                
    }

}
