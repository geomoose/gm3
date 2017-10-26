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

import { shallow } from 'enzyme';

import { createStore, combineReducers } from 'redux';

import { Toolbar, ToolbarButton, ToolbarDrawer } from 'gm3/components/toolbar';

import SmartToolbar from 'gm3/components/toolbar';

import toolbarReducer from 'gm3/reducers/toolbar';
import queryReducer from 'gm3/reducers/query';
import * as actions from 'gm3/actions/toolbar';

import Enzyme, { mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

Enzyme.configure({ adapter: new Adapter() });


describe('Toolbar component tests', () => {
    it('renders a toolbar button', () => {
        const div = document.createElement('div');

        const tool = {
            name: 'sample0',
            label: 'Sample Zero',
            actionType: 'service', actionDetail: 'sample'
        };

        const btn = shallow(<ToolbarButton tool={tool} />);
    });

    it('renders a drawer', () => {

        const div = document.createElement('div');

        const tool = {
            name: 'sample0',
            label: 'Sample Zero',
            actionType: 'service', actionDetail: 'sample'
        };

        const drawer = {
            name: 'drawer0',
            label: 'Drawer Zero',
        };

        const toolbar = {
            root: [drawer],
            drawer0: [tool]
        }

        ReactDOM.render(<ToolbarDrawer drawer={drawer} toolbar={toolbar} />, div);
    });

    it('renders a toolbar', () => {
        const div = document.createElement('div');

        const tool = {
            name: 'sample0',
            label: 'Sample Zero',
            actionType: 'service', actionDetail: 'sample'
        };

        const drawer = {
            name: 'drawer0',
            label: 'Drawer Zero',
        };

        const toolbar = {
            root: [drawer],
            drawer0: [tool]
        }

        ReactDOM.render(<Toolbar toolbar={toolbar} />, div);
    });

    it('renders a toolbar from the store', function() {
        const store = createStore(combineReducers({
            'toolbar': toolbarReducer
        }));
        store.dispatch(actions.addDrawer('root', {
            name: 'drawer0', label: 'Drawer 0',
        }));
        store.dispatch(actions.addTool('drawer0', {
            name: 'sample1', label: 'Sample 1',
            actionType: 'service', actionDetail: 'sample2'
        }));

        const div = document.createElement('div');
        ReactDOM.render(<SmartToolbar store={store}/>, div);
    });

    it('renders a toolbar from a mapbook fragment', function() {
        const store = createStore(combineReducers({
            'toolbar': toolbarReducer
        }));


        const toolbarXml = `
            <toolbar>
                <tool name="findme" title="Find Me" type="action"/>

                <drawer title="Dummy Drawer" name="dummy-drawer">
                    <tool name="dummy1" title="Dummy Tool 1" type="service"/>
                    <tool name="dummy2" title="Dummy Tool 2" type="service"/>
                </drawer>
            </toolbar>`;

        const parser = new DOMParser();
        const xml = parser.parseFromString(toolbarXml, "text/xml");
        const results = actions.parseToolbar(xml.getElementsByTagName('toolbar')[0]);


        for(const action of results) {
            store.dispatch(action);
        }

        const div = document.createElement('div');
        ReactDOM.render(<SmartToolbar store={store}/>, div);
    });

    it('changes the active service when clicked.', function() {
        const store = createStore(combineReducers({
            toolbar: toolbarReducer,
            query: queryReducer,
        }));

        const tool = {
            name: 'sample0',
            label: 'Sample Zero',
            actionType: 'service'
        };

        const btn = shallow(<ToolbarButton tool={tool} store={store} />);
        btn.find('button').simulate('click');

        const state = store.getState();
        expect(state.query.service).toBe('sample0');
    });

    it('triggers an action when clicked.', function() {
        const store = createStore(combineReducers({
            toolbar: toolbarReducer,
            query: queryReducer,
        }));

        const tool = {
            name: 'sample0',
            label: 'Sample Zero',
            actionType: 'action'
        };

        const btn = shallow(<ToolbarButton tool={tool} store={store} />);
        btn.find('button').simulate('click');
    });
});
