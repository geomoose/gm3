/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 Dan "Ducky" Little
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
import { connect } from 'react-redux';

import uuid from 'uuid';

import Map from '../map';

import { printImage } from '../../actions/print';

class PrintImage extends Component {

    constructor(props) {
        super(props);

        this.state = {
            mapId: 'print-map-' + uuid.v4()
        };
    }


    /* Get the PNG bytes from the included map.
     *
     */
    getImage() {
        // there are many opportunities for the map to
        //  disappear "out of order" and this makes sure all
        //  of the DOM elements required still exists.
        const p = document.getElementById(this.state.mapId);
        if(p) {
            const canvas = p.getElementsByTagName('canvas');
            if(canvas.length > 0) {
                // other options:
                // canvas.toDataURL('image/jpeg', quality)
                try {
                    for (let i = 0, ii = canvas.length; i < ii; i++) {
                        if (canvas[i].width > 0) {
                            return canvas[i].toDataURL('image/png');
                        }
                    }
                } catch(error) {
                    return 'err';
                }
            }
        }
        return '';
    }

    /* When the map renders, update the image in the reducer.
     */
    mapRendered() {
        const print_image_action = printImage(this.getImage());
        this.props.store.dispatch(print_image_action);
    }

    render() {
        const image_style = {
            display: 'inline-block',
            width: (this.props.width ? this.props.width : 600) + 'px',
            height: (this.props.height ? this.props.height : 400) + 'px',
        };

        const center = this.props.mapView.center;
        const rez = this.props.mapView.resolution;

        // draw the map.
        return (
            <div style={image_style} id={this.state.mapId}>
                <Map
                    store={this.props.store}
                    center={center}
                    resolution={rez}
                    printOnly={true}
                    mapRenderedCallback={() => { this.mapRendered() }}
                />
            </div>
        );
    }
}


const mapToProps = function(store) {
    return {
        mapView: store.map,
    }
}

export default connect(mapToProps)(PrintImage);
