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

/** Tests for the toolbar reducer set.
 *
 */

import { createStore, combineReducers } from 'redux';

import toolbarReducer from 'gm3/reducers/toolbar';

import * as actions from 'gm3/actions/toolbar';


describe('Toolbar reducer tests', () => {
    let store = null;

    // before each test refresh the store.
    beforeEach(() => {
        store = createStore(combineReducers({
            'toolbar': toolbarReducer
        }));
    });

    test('Add a tool to the toolbar', () => {
        store.dispatch(actions.addTool('root', {
            name: 'sample',
            label: 'Sample',
            actionType: 'service', actionDetail: 'sample'
        }));

        const tb = store.getState();
        expect(tb.toolbar.root.length).toBe(1);
    });

    test('Add a drawer to the toolbar', () => {
        store.dispatch(actions.addDrawer('root', {
            name: 'drawer0', label: 'Drawer 0',
        }));

        store.dispatch(actions.addTool('drawer0', {
            name: 'sample1', label: 'Sample 1',
            actionType: 'service', actionDetail: 'sample2'
        }));

        const tb = store.getState();
        // ensure both the drawer and the tool made it on to
        //  the toolbar "stack"
        expect(tb.toolbar.root.length).toBe(1);
        // ensure the tool "sample1" made it into drawer0.
        expect(tb.toolbar.drawer0.length).toBe(1);
        expect(tb.toolbar.drawer0[0].name).toBe('sample1');
    });

    test('Remove a tool from the toolbar', () => {
        // create five tools, remove the third one.
        for(let i = 0; i < 5; i++) {
            store.dispatch(actions.addTool('root', {
                name: 'tool' + i, label: 'Tool ' + i,
                actionType: 'service', actionDetail: '',
            }));
        }
        // add a drawer
        store.dispatch(actions.addDrawer('root', {
            name: 'drawer0', label: 'Drawer 0',
        }));
        store.dispatch(actions.addTool('drawer0', {
            name: 'sample1', label: 'Sample 1',
            actionType: 'service', actionDetail: 'sample2'
        }));
        // test removing a tool
        store.dispatch(actions.remove('tool3'));
        let tb = store.getState();
        expect(tb.toolbar.root.length).toBe(5);

        // test removing a drawer
        store.dispatch(actions.remove('drawer0'));

        tb = store.getState();
        expect(tb.toolbar.root.length).toBe(4);
    });

    test('Adding a tool to the "front" of the toolbar', () => {
        // using null for the root and null for the order
        //  also checks the "default" settings in the reducer.
        store.dispatch(actions.addTool(null, {
            name: 'second', label: 'second'
        }, null));
        store.dispatch(actions.addTool('root', {
            name: 'first', label: 'first'
        }, 'first'));

        const tb = store.getState();
        expect(tb.toolbar.root.length).toBe(2);
        expect(tb.toolbar.root[0].name).toBe('first');

    });
});
