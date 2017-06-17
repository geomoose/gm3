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
import ReactDOM from 'react-dom';

import { createStore, combineReducers } from 'redux';

import CoordinateDisplay from 'gm3/components/coordinates';

import reducer from 'gm3/reducers/cursor';
import * as actions from 'gm3/actions/map';

describe('coordinate display component', () => {
    const store = createStore(combineReducers({
        cursor: reducer,
    }));

    it('renders a coordinate display', () => {
        const div = document.createElement('div');
        ReactDOM.render(<CoordinateDisplay store={ store }/>, div);

        store.dispatch(actions.cursor([100000, 100000]));
        expect(div.innerHTML).toContain('100000.0, 100000.0');

        const too_big = 9000000000;
        store.dispatch(actions.cursor([too_big, too_big]));

    });

    it('accepts a custom projections list', () => {
        const div = document.createElement('div');
        const projections = [
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
            },
            {
                label: 'UTM',
                projDef: '+proj=utm +zone=15 +ellps=GRS80 +datum=NAD83 +units=m +no_defs'
            }
        ];

        ReactDOM.render(<CoordinateDisplay store={ store } projections={ projections }/>, div);
    });
});


