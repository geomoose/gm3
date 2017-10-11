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

import View from 'ol/view';
import Proj from 'ol/proj';

import jsPDF from 'jspdf';
import Mark from 'markup-js';

import Modal from '../modal';
import PrintImage from './printImage';
import PrintPreviewImage from './printPreviewImage';

import { getActiveMapSources } from '../../actions/mapSource';
import { printed } from '../../actions/print';

import DefaultLayouts from './printLayouts';

import GeoPdfPlugin from './geopdf';


export default class PrintModal extends Modal {

    constructor(props) {
        super(props);

        // Define the built-in layouts.
        // If the user overrides this then they just get their
        //  layouts.
        this.layouts = props.layouts ? props.layouts : DefaultLayouts;

        this.state = this.getMapSize(this.layouts[0], 1);
    }

    /* Print the PDF! Or, ya know, close the dialog.
     */
    close(status) {
        if(status === 'print') {
            const layout = parseInt(this.refs.layout.value);
            this.makePDF(this.layouts[layout]);
            // tell the store that the print is done,
            // this ensures that the memory is freed that was used
            // to store the (sometimes) enormous image.
            this.props.store.dispatch(printed());
        }
        this.setState({open: false});
    }

    /* Return the title for the dialog. */
    getTitle() {
        return 'Print';
    }


    addText(doc, def) {
        // these are the subsitution strings for the map text elements
        const date = new Date();
        const subst_dict = {
            title: this.refs.map_title.value,
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate()
        };

        // def needs to define: x, y, text
        const defaults = {
            size: 13,
            color: [0, 0, 0],
            font: 'Arial',
            fontStyle: 'normal'
        };

        // create a new font definition object based on
        //  the combination of the defaults and the definition
        //  passed in by the user.
        const full_def = Object.assign({}, defaults, def);

        // set the size
        doc.setFontSize(full_def.size);
        // the color
        doc.setTextColor(full_def.color[0], full_def.color[1], full_def.color[2]);
        // and the font face.
        doc.setFont(full_def.font, full_def.fontStyle);
        // then mark the face.
        doc.text(full_def.x, full_def.y, Mark.up(full_def.text, subst_dict));
    }

    /* Embed an image in the PDF
     */
    addImage(doc, def) {
        // optionally scale the image to fit the space.
        if(def.width && def.height) {
            doc.addImage(def.image_data, def.x, def.y, def.width, def.height);
        } else {
            doc.addImage(def.image_data, def.x, def.y);
        }

    }

    /* Wraps addImage specifically for the map.
     */
    addMapImage(doc, def, layout) {
        // this is not a smart component and it doesn't need to be,
        //  so sniffing the state for the current image is just fine.
        const image_data = this.props.store.getState().print.printData;
        this.addImage(doc, Object.assign({}, def, {image_data: image_data}));

        // construct the extents from the map
        const map_view = this.props.store.getState().map;
        // TODO: get this from state
        const map_proj = 'EPSG:3857';

        const view = new View({
            center: map_view.center,
            resolution: map_view.resolution,
            projection: map_proj,
        });

        const u = layout.units;
        const resolution = parseFloat(this.refs.resolution.value);
        const map_extents = view.calculateExtent([
            this.toPoints(def.width, u) * resolution,
            this.toPoints(def.height, u) * resolution,
        ]);

        const pdf_extents = [def.x, def.y, def.x + def.width, def.y + def.height];
        for(let i = 0; i < pdf_extents.length; i++) {
            pdf_extents[i] = this.toPoints(pdf_extents[i], u);
        }

        doc.setGeoArea(pdf_extents, map_extents);
    }

    /* Draw a shape on the map.
     *
     * Supported shapes: rect, ellipse
     */
    addDrawing(doc, def) {
        // determine the style string
        let style = 'S';
        if(def.filled) {
            style = 'DF';
        }

        // set the colors
        const stroke = def.stroke ? def.stroke : [0, 0, 0];
        const fill = def.fill ? def.fill : [255, 255, 255];
        doc.setDrawColor(stroke[0], stroke[1], stroke[2]);
        doc.setFillColor(fill[0], fill[1], fill[2]);

        // set the stroke width
        const stroke_width = def.strokeWidth ? def.strokeWidth : 1;
        doc.setLineWidth(stroke_width);

        // draw the shape.
        if(def.type === 'rect') {
            doc.rect(def.x, def.y, def.width, def.height, style);
        } else if(def.type === 'ellipse') {
            doc.ellipse(def.x, def.y, def.rx, def.ry, style);
        }
    }

    /**
     * Convert units to PDF units
     *
     */
    toPoints(n, unit) {
        let k = 1;

        // this code is borrowed from jsPDF
        //  as it does not expose a public API
        //  for converting units to points.
        switch (unit) {
            case 'pt':
                k = 1;
                break;
            case 'mm':
                k = 72 / 25.4;
                break;
            case 'cm':
                k = 72 / 2.54;
                break;
            case 'in':
                k = 72;
                break;
            case 'px':
                k = 96 / 72;
                break;
            case 'pc':
                k = 12;
                break;
            case 'em':
                k = 12;
                break;
            case 'ex':
                k = 6;
                break;
            default:
                throw 'Invalid unit: ' + unit;
        }

        return n * k;
    }

    makePDF(layout) {
        // check for and install the geopdf plugin
        if(!jsPDF.API.setGeoArea) {
            GeoPdfPlugin(jsPDF.API);
        }
        // new PDF document
        const doc = new jsPDF(layout.orientation, layout.units, layout.page);

        // add some fonts
        doc.addFont('Arial', 'Arial', 'normal');
        doc.addFont('Arial-Bold', 'Arial', 'bold');

        // iterate through the elements of the layout
        //  and place them in the document.
        for(const element of layout.elements) {
            switch(element.type) {
                case 'text':
                    this.addText(doc, element);
                    break;
                case 'map':
                    this.addMapImage(doc, element, layout);
                    break;
                case 'image':
                    this.addImage(doc, element);
                    break;
                case 'rect':
                case 'ellipse':
                    this.addDrawing(doc, element);
                    break;
                default:
                    // pass, do nothing.
            }
        }

        // kick it back out to the user.
        doc.save('print_' + ((new Date()).getTime()) + '.pdf');
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

    /* The Map Image size changes based on the layout used
     * and the resolution selected by the user.
     *
     * @param layout The layout definition.
     * @param resolution The "map size" multiplier.
     *
     * @return An object with "width" and "height" properties.
     */
    getMapSize(layout, resolution) {
        // iterate through the layout elements looking
        //  for the map.
        let map_element = null;
        for(const element of layout.elements) {
            if(element.type === 'map') {
                map_element = element;
                break;
            }
        }

        // caculate the width and height and kick it back.
        return {
            width: this.toPoints(map_element.width, layout.units) * resolution,
            height: this.toPoints(map_element.height, layout.units) * resolution
        };
    }

    /* Update the map size whenever
     * The layout or resolutoin has changed.
     */
    updateMapLayout() {
        // check for the first map element and then
        //  use that as the render size.
        const layout = this.layouts[parseInt(this.refs.layout.value)];
        // convert the resoltion to a multiplier.
        const resolution = parseFloat(this.refs.resolution.value);

        this.setState(this.getMapSize(layout, resolution));
    }

    /** Render a select box with the layouts.
     */
    renderLayoutSelect() {
        // convert the layouts to options based on their index
        //  and the label given in "label"
        const options = [];
        for(let i = 0, ii = this.layouts.length; i < ii; i++) {
            options.push(<option key={ i } value={ i }>{ this.layouts[i].label }</option>);
        }
        // kick back the select.
        return (
            <select ref='layout' onChange={ () => { this.updateMapLayout(); } }>
                { options }
            </select>
        );
    }

    /** Render a select drop down that allows the user
     *  to up the DPI.
     */
    renderResolutionSelect() {
        return (
            <select ref='resolution' onChange={ () => { this.updateMapLayout(); } }>
                <option value='1'>Normal</option>
                <option value='1.5'>Higher</option>
                <option value='2'>Highest</option>
            </select>
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

        // get the number of all map-sources.
        const all_ms = getActiveMapSources(this.props.store).length;
        // not get the number of printable map-sources.
        const printable_ms = getActiveMapSources(this.props.store, true).length;

        // if there are fewer printable map-sources than there
        //  are active map-sources then inform the user they will lose some
        //  layers in the print.
        let print_warning = false;
        if(printable_ms < all_ms) {
            print_warning = (
                <div className='info-box'>
                Some of the map layers cannot be printed. The map image
                in the resulting PDF may differ from what is seen in the
                map viewer.
                </div>
            );
        }

        return (
            <div>
                {print_warning}

                <p>
                    <label>Map title:</label>
                    <input ref='map_title' placeholder="Map title"/>
                </p>
                <p>
                    <label>Page layout:</label>
                    { this.renderLayoutSelect() }
                </p>
                <p>
                    <label>Resolution:</label>
                    { this.renderResolutionSelect() }
                </p>
                <div>
                    <PrintPreviewImage store={this.props.store}/>
                </div>

                <div style={ map_style_hack }>
                    <PrintImage width={this.state.width} height={this.state.height} store={this.props.store}/>
                </div>
            </div>
        );

    }

}
