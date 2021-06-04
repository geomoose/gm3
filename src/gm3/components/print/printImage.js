/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2017, 2021 Dan "Ducky" Little
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

import React, { useRef, useEffect, useState } from 'react';
import { connect } from 'react-redux';

import Map from '../map';

import { printImage } from '../../actions/print';

const getImage = (parentElement, exportSize) => {
    // a derivation of https://openlayers.org/en/latest/examples/export-map.html
    const mapCanvas = document.createElement('canvas');
    mapCanvas.width = exportSize[0];
    mapCanvas.height = exportSize[1];

    const mapContext = mapCanvas.getContext('2d');

    if (parentElement) {
        const canvases = parentElement.getElementsByTagName('canvas');
        for (let i = 0, ii = canvases.length; i < ii; i++) {
            const canvas = canvases[i];
            if (canvas.width > 0) {
                const opacity = canvas.parentNode.style.opacity;
                mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
                const transform = canvas.style.transform;
                // Get the transform parameters from the style's transform matrix
                const matrix = transform
                    // eslint-disable-next-line
                    .match(/^matrix\(([^\(]*)\)$/)[1]
                    .split(',')
                    .map(Number);
                // Apply the transform to the export map context
                CanvasRenderingContext2D.prototype.setTransform.apply(
                    mapContext,
                    matrix
                );
                mapContext.drawImage(canvas, 0, 0);
            }
        }
    }

    return mapCanvas.toDataURL('image/png');
}

const PrintImage = props => {
    const [image, setImage] = useState('');
    const parentRef = useRef();

    const parentStyle = {
        display: 'inline-block',
        width: props.width + 'px',
        height: props.height + 'px',
    };

    const center = props.mapView.center;
    const rez = props.mapView.resolution;

    // empty the print image whenever something changes.
    useEffect(() => {
        setImage('');
    }, [props.width, props.height, center, rez]);

    useEffect(() => {
        props.printImage(image);
    }, [image]);

    return (
        <div style={parentStyle} ref={parentRef}>
            <Map
                store={props.store}
                center={center}
                resolution={rez}
                printOnly={true}
                mapRenderedCallback={() => {
                    if (parentRef.current) {
                        setImage(getImage(parentRef.current, [props.width, props.height]));
                    }
                }}
            />
        </div>
    );
}

PrintImage.defaultProps = {
    width: 600,
    height: 400,
};

const mapToProps = state => ({
    mapView: state.map,
});

const mapDispatchToProps = {
    printImage,
};


export default connect(mapToProps, mapDispatchToProps)(PrintImage);
