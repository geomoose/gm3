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

import Map from 'gm3/components/map';
import mapReducer from 'gm3/reducers/map';
import msReducer from 'gm3/reducers/mapSource';
import queryReducer from 'gm3/reducers/query';
import configReducer from 'gm3/reducers/config';
import editorReducer from 'gm3/reducers/editor';

import { createStore, combineReducers } from 'redux';

import Enzyme, { mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import * as mapActions from 'gm3/actions/map';
import * as msActions from 'gm3/actions/mapSource';

Enzyme.configure({ adapter: new Adapter() });

/* This is a bit of a hacky polyfill for requestAnimationFrame
 * which is needed by the openlayers map to drawer but is not
 * simulated by the jsdom/enzyme combination.
 * Original source:
 * - https://stackoverflow.com/questions/44111231/react-native-requestanimationframe-is-not-supported-in-node
 */
if (!window.requestAnimationFrame) {
    const targetTime = 0
    window.requestAnimationFrame = function(callbackFun) {
        const currentTime = +new Date()
        const timeoutCb = function() { callbackFun(+new Date()) }
        return window.setTimeout(timeoutCb, Math.max(targetTime + 16, currentTime) - currentTime)
    }
}

describe('map component tests', () => {
    if (global.HAS_CANVAS === false) {
        it('is going to skip all tests....', () => {
            console.error('Skipping map tests without node-canvas installed.');
        });
        return false;
    }

    let store = null;

    beforeEach(() => {
        store = createStore(combineReducers({
            map: mapReducer,
            mapSources: msReducer,
            query: queryReducer,
            config: configReducer,
            editor: editorReducer,
        }));
    });

    it('creates a map', () => {
        mount(<div>
            <Map store={store} />
        </div>);
    });


    describe('add layers tests', () => {
        beforeEach(() => {
            store = createStore(combineReducers({
                map: mapReducer,
                mapSources: msReducer,
                query: queryReducer,
                config: configReducer,
                editor: editorReducer,
            }));
            // seed the view
            store.dispatch(mapActions.setView({
                center: [ -10370351.141856, 5550949.728470501 ],
                zoom: 12
            }));

            mount(
                <div style={{height: '500px', width: '500px'}}>
                    <Map mapId='map' store={store}/>
                </div>
            );
        });

        it('adds a wms layer', () => {
            store.dispatch(msActions.add({
                type: 'wms',
                urls: [
                    'http://test/wms?'
                ],
                name: 'test0',
                label: 'test0-label',
                opacity: 1,
                queryable: false,
                refresh: null,
                layers: [],
                params: {}
            }));

            store.dispatch(msActions.addLayer('test0', {
                name: 'test1',
                on: true,
                label: 'test1-label'
            }));

        });

        it('adds an XYZ layer', () => {
            store.dispatch(msActions.add({
                name: 'osm',
                type: 'xyz',
                label: 'OSM',
                urls: [
                    'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                ],
                layers: [{
                    name: 'osm_mapnik',
                    on: true
                }]
            }));

            // this tests "updating" the OSM layer's URLs.
            store.dispatch(msActions.add({
                name: 'osm',
                type: 'xyz',
                label: 'OSM',
                urls: [
                    'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
                ],
                layers: [{
                    name: 'osm_mapnik',
                    on: true
                }]
            }));
        });

        it('adds an ags tile layer', () => {
            store.dispatch(msActions.add({
                name: 'ags-test',
                type: 'ags',
                label: 'AGS',
                urls: [
                    'https://services.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer'
                ],
                layers: [{
                    name: 'NatGeo_World_map',
                    on: true
                }]
            }));

            store.dispatch(msActions.add({
                name: 'ags-test',
                type: 'ags',
                label: 'AGS',
                urls: [
                    'https://demo.services.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer'
                ],
                layers: [{
                    name: 'NatGeo_World_map',
                    on: true
                }]
            }));
        });

        it('adds a bing layer', () => {

            store.dispatch(msActions.add({
                name: 'bing-test',
                type: 'bing',
                label: 'Bing',
                layers: [{
                    name: 'roads',
                    on: true
                }],
                params: {
                    key: 'garbage-sample-key'
                }
            }));

        });

    });

});
