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

/** Reducer for the toolbar
 *
 */

import uuid from 'uuid';
import { UI } from '../actionTypes';

const defaultState = {
    stateId: 0,
    hint: null,
    action: null,
    modal: '',
};

export default function uiReducer(state = defaultState, action) {
    switch(action.type) {
        case UI.HINT:
            return Object.assign({}, state, {
                stateId: uuid(),
                hint: action.hint
            });
        case UI.CLEAR_HINT:
            return Object.assign({}, state, {
                stateId: uuid(),
                hint: null
            });
        case UI.RUN_ACTION:
            return Object.assign({}, state, {stateId: uuid(), action: action.action});
        case UI.CLEAR_ACTION:
            return Object.assign({}, state, {stateId: uuid(), action: null});
        case UI.SHOW_MODAL:
            return Object.assign({},
                state,
                {
                    modal: action.payload,
                },
            );
        default:
            return state;
    }
}
