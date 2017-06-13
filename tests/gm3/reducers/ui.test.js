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

import { createStore, combineReducers } from 'redux';

import reducer from 'gm3/reducers/ui'
import * as actions from 'gm3/actions/ui'

describe('test the `ui` reducer', () => {
    let store = null;

    // before each test refresh the store.
    beforeEach(() => {
        store = createStore(combineReducers({
            'ui': reducer
        }));
    });

    it('sets and clears the ui hint', () => {
        // set the hint ot test-hint and verify the change in the state
        store.dispatch(actions.setUiHint('test-hint'));
        expect(store.getState().ui.hint).toBe('test-hint');

        // clear the hint and see if it is null
        store.dispatch(actions.clearUiHint());
        expect(store.getState().ui.hint).toBe(null);
    });

    it('sets a run action', () => {
        store.dispatch(actions.runAction('test-action'));
        expect(store.getState().ui.action).toBe('test-action');

        store.dispatch(actions.clearAction());
        expect(store.getState().ui.action).toBe(null);

    });



});
