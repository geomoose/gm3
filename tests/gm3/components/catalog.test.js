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

import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import Catalog from 'gm3/components/catalog';

import reducer from 'gm3/reducers/catalog';
import msReducer from 'gm3/reducers/mapSource';
import editorReducer from 'gm3/reducers/editor';
import mapReducer from 'gm3/reducers/map';
import queryReducer from 'gm3/reducers/query';
import * as actions from 'gm3/actions/catalog';
import * as msActions from 'gm3/actions/mapSource';


Enzyme.configure({ adapter: new Adapter() });

describe('Catalog component tests', () => {
    const store = createStore(combineReducers({
        'catalog': reducer,
        'mapSources': msReducer,
        'editor': editorReducer,
        'map': mapReducer,
        'query': queryReducer,
    }), applyMiddleware(thunk));

    let catalog = null;

    /*
    it('renders a catalog from the store', function() {
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
    */

    it('renders a catalog from a mapbook fragment', function() {
        // setup the map sources
        store.dispatch(msActions.add({name: 'test', type: 'vector'}));

        store.dispatch(msActions.addLayer('test', {
            name: 'test0',
            on: true,
            label: 'Test 0',
            legend: {
                type: 'html',
                html: 'find-me',
            },
            refreshEnabled: false,
        }));

        store.dispatch(msActions.addLayer('test', {
            name: 'test1',
            on: false,
            label: 'Test 1',
            legend: {
                type: 'img',
                images: ['https://geomoose.org/_static/logo_2011.png', ],
            },
        }));

        const xml = `
            <catalog>
                <group title="Group">
                    <layer refresh="30" title="Test 2" src="test/test0"/>
                </group>
                <layer title="Test 1" src="test/test1" legend-toggle="true"/>

                <layer src="test/test0" title="ALL THE TOOLS"
                       zoomto="true" upload="true" download="true" clear="true"
                       draw-point="true" draw-line="true" draw-polygon="true"
                       draw-modify="true" draw-remove="true" />
            </catalog>`;

        const parser = new DOMParser();
        const catalog_xml = parser.parseFromString(xml, 'text/xml');
        const results = actions.parseCatalog(store, catalog_xml.getElementsByTagName('catalog')[0]);

        for(const action of results) {
            store.dispatch(action);
        }

        catalog = mount(<div>
            <Catalog store={store} />
        </div>);

        expect(catalog).not.toBe(null);
    });

    it('toggles a favorite', function() {
        catalog.find('i.favorite.icon').first().simulate('click');
        expect(store.getState().mapSources.test.layers[0].favorite).toBe(true);
    });

    it('toggles refreshes', function() {
        catalog.find('i.refresh.icon').first().simulate('click');
    });

    it('toggles the group state', function() {
        catalog.find('.group-label').first().simulate('click');
        expect(catalog.find('.gm-expand').length).toBe(1);
        catalog.find('.group-label').first().simulate('click');
        expect(catalog.find('.gm-collapse').length).toBe(1);
    });

    it('triggers a catalog search', function() {
        const searchbox = catalog.find('input').first();
        searchbox.simulate('change', {target: {value: '1'}});
    });

    it('toggles layer visibility', function() {
        catalog.find('.checkbox').first().simulate('click');
        expect(store.getState().mapSources.test.layers[0].on).toBe(true);
    });
});
