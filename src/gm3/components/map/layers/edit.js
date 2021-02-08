/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2020 Dan "Ducky" Little
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
 * Special collection of functions for editing layers.
 */

import MultiPoint from 'ol/geom/MultiPoint';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';
import {EDIT_STYLE} from '../../../defaults';

export const getEditStyle = (glStyle = EDIT_STYLE, renderPoints = false) => {
    const styles = [
        new Style({
            stroke: new Stroke({
                color: glStyle['line-color'],
                width: 3,
            }),
            fill: new Fill({
                color: glStyle['fill-color'],
                opacity: glStyle['fill-opacity'],
            }),
        }),
    ];

    if (renderPoints) {
        styles.push(
            new Style({
                image: new CircleStyle({
                    radius: 5,
                    fill: new Fill({
                        color: glStyle['circle-color'],
                    }),
                }),
                geometry: (feature) => {
                    const geom = feature.getGeometry();
                    const type = geom.getType().toLowerCase();

                    let coordinates = [];
                    if (type === 'polygon' || type === 'multilinestring') {
                        coordinates = geom.getCoordinates().flat();
                    } else if (type === 'multipolygon') {
                        coordinates = geom.getCoordinates().flat(2);
                    } else if (type === 'point') {
                        return geom;
                    } else {
                        coordinates = geom.getCoordinates();
                    }
                    return new MultiPoint(coordinates);
                },
            })
        );
    }
    return styles;
};
