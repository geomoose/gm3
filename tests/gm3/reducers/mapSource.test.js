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
/*
CHANGE_TOOL: 'MAP_CHANGE_TOOL',
ADD_SELECTION_FEATURE: 'MAP_ADD_SELECTION_FEATURE',
CLEAR_SELECTION_FEATURES: 'MAP_CLEAR_SELECTION_FEATURES',
BUFFER_SELECTION_FEATURES: 'MAP_BUFFER_SELECTION_FEATURES',
*/

import { applyMiddleware, createStore, combineReducers } from 'redux';
import thunk from 'redux-thunk';

import reducer from 'gm3/reducers/mapSource'
import * as msActions from 'gm3/actions/mapSource'

import { FEATURES } from '../sample_data';

const setupMapSource = store => {
    // these are lifted directly from gm3.Application :)
    store.dispatch(msActions.add({
        name: 'results',
        urls: [],
        type: 'vector',
        label: 'Results',
        opacity: 1.0,
        queryable: false,
        refresh: null,
        layers: [],
        options: {
            'always-on': true,
        },
        params: {},
        // stupid high z-index to ensure results are
        //  on top of everything else.
        zIndex: 200001,
    }));
    store.dispatch(msActions.addLayer('results', {
        name: 'results',
        on: true,
        label: 'Results',
        selectable: true,
        style: {
            'circle-radius': 4,
            'circle-color': '#ffff00',
            'circle-stroke-color': '#ffff00',
            'line-color': '#ffff00',
            'line-width': 4,
            'fill-color': '#ffff00',
            'fill-opacity': 0.25,
            'line-opacity': 0.25,
        },
        filter: []
    }));
};

const addTestFeature = store => {
    store.dispatch(msActions.addFeatures('results', [
        {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'Point',
                coordinates: [0, 0]
            }
        }
    ]));
};

const createTestStore = () => {
    return createStore(combineReducers({
        mapSources: reducer
    }), applyMiddleware(thunk));
}

describe('test the `map` reducer', () => {
    let store = null;

    // before each test refresh the store.
    beforeEach(() => {
        store = createTestStore();
    });

    it('adds a vector layer', () => {
        setupMapSource(store);
    });

    it('adds features to the vector layer', () => {
        setupMapSource(store);
        addTestFeature(store);

        const st = store.getState();
        expect(st.mapSources.results.features.length).toBe(1);

    });

    it('removes a feature from the vector layer (by id)', done => {
        setupMapSource(store);
        addTestFeature(store);
        // eslint-disable-next-line
        const fid = store.getState().mapSources.results.features[0].properties._uuid;
        store.dispatch(msActions.removeFeature('results/results', {id: fid}))
            .then(() => {
                const st = store.getState();
                expect(st.mapSources.results.features.length).toBe(0);
                done();
            });
    });


    describe('Tests with data', () => {
        beforeEach(() => {
            store = createTestStore();
            setupMapSource(store);

            // add all the features from the sample data
            store.dispatch(msActions.addFeatures('results', FEATURES));
        });

        it('remove features by filter', () => {
            store.dispatch(msActions.removeFeatures('results', [['<', 'emv_total', 300000]]));
            const st = store.getState();
            expect(st.mapSources.results.features.length).toBe(3);
        });

        it('clears all the features', () => {
            store.dispatch(msActions.clearFeatures('results'));
            const st = store.getState();
            expect(st.mapSources.results.features.length).toBe(0);
        });
    });


});
