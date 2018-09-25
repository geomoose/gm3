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

import { PRINT } from '../actionTypes';


const default_state = {
    state: 'printed',
    // populated with a png or jpeg base64 string,
    printData: '',
    request: null,
};

/* Example Request Structure:
 *
 * { size: [600, 400], center: [0,0], resolution: 1000 }
 *
 */
export default function printReducer(state = default_state, action) {
    switch(action.type) {
        // requests come in specifying the size, center, and resolution.
        case PRINT.REQUEST:
            return Object.assign({}, state, {
                state: 'printing',
                request: action.request
            });
        case PRINT.IMAGE:
            return Object.assign({}, state, {
                state: 'printing',
                printData: action.data
            });
        case PRINT.FINISHED:
            return Object.assign({}, state, {
                state: 'printed',
                data: '',
                request: null
            });
        default:
            return state;
    }
};
