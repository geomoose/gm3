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

import * as jsts from 'gm3/jsts';

// this is necessary to configure the UTM projections
import { configureProjections } from 'gm3/util';
import { register } from 'ol/proj/proj4';
import proj4 from 'proj4';

describe('test basic jsts stuff', function() {
    beforeEach(() => {
        configureProjections(proj4);
        register(proj4);
    });

    it('buffers a point', function() {
        const point = {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'Point',
                coordinates: [0, 0]
            }
        };

        const polygon = jsts.buffer(point, 1);
        expect(polygon.type).toBe('Polygon');
    });

    it('unions a couple of polygons', function() {
        const features = [
            {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'Polygon',
                    coordinates: [[
                        [0, 0], [-1, 0], [0, 1], [0, 0]
                    ]]
                }
            },
            {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [[-1, 0], [-1, 1], [0, 1], [-1, 0]]
                    ]
                }
            }
        ];

        const shp = jsts.bufferAndUnion(features, 1);
        expect(shp).toBeDefined();
    });

});
