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

/** Tracks the state of the map.
 *
 */

import { MAP } from '../actionTypes';

const default_view = {
    coords: [0, 0],
    sketchGeometry: null,
    // size can be null by default, this is meant to be a hint only!
    size: null,
};

export default function cursorReducer(state = default_view, action) {
    switch(action.type) {
        case MAP.CURSOR:
            return Object.assign({}, state, {coords: action.coords});
        case MAP.SKETCH_GEOMETRY:
            return Object.assign({}, state, {sketchGeometry: action.geometry});
        case MAP.RESIZE:
            return Object.assign({}, state, {
                size: action.size,
            });
        default:
            return state;
    }
};
