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

import Enzyme, { mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import CoordinateDisplay, { formatCoordinates } from 'gm3/components/coordinate-display';

// this is necessary to configure the UTM projections
import { configureProjections } from 'gm3/util';
import { register } from 'ol/proj/proj4';
import proj4 from 'proj4';


Enzyme.configure({ adapter: new Adapter() });

describe('coordinate display component', () => {
    it('formats coordinates with default precision', () => {
        const proj = {
            projection: 'xy',
        };
        expect(formatCoordinates(proj, [100, 100])).toBe('100.0000, 100.0000');
    });

    it('formats coordinates with a set precision', () => {
        const proj = {
            projection: 'xy',
            precision: 2,
        };
        expect(formatCoordinates(proj, [100, 100])).toBe('100.00, 100.00');
    });

    it('formats coordinates with a set precision of 0', () => {
        const proj = {
            projection: 'xy',
            precision: 0,
        };
        expect(formatCoordinates(proj, [100, 100])).toBe('100, 100');
    });


    it('renders a coordinate display', () => {
        const wrapper = mount(
            <CoordinateDisplay
                coords={[100000, 100000]}
            />
        );

        expect(wrapper.html()).toContain('100000.0, 100000.0');
    });

    it('accepts a custom projections list', () => {
        configureProjections(proj4);
        register(proj4);
        const projections = [
            {
                label: 'UTM',
                ref: 'EPSG:32615',
                precision: 0
            },
            {
                label: 'X,Y',
                ref: 'xy'
            },
            {
                label: 'USNG',
                ref: 'usng'
            },
            {
                label: 'Lat,Lon',
                ref: 'EPSG:4326',
                precision: 3
            }
        ];

        const wrapper = mount(
            <CoordinateDisplay
                coords={[-10370000, 5550000]}
                projections={ projections }
            />
        );
        expect(wrapper.html()).toContain('487664, 4932296');
    });


    it('renders precision 0 correctly', () => {
        const wrapper = mount(
            <CoordinateDisplay
                coords={[123.456, 123.456]}
                projections={[{
                    label: 'xy',
                    ref: 'xy',
                    precision: 0,
                }]}
            />
        );

        expect(wrapper.html().indexOf('123, 123')).not.toBe(-1);
    });
});
