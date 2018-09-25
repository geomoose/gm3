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

import { createStore, combineReducers } from 'redux';

import reducer from 'gm3/reducers/map'
import * as actions from 'gm3/actions/map'

describe('test the `map` reducer', () => {
    let store = null;

    // before each test refresh the store.
    beforeEach(() => {
        store = createStore(combineReducers({
            'map': reducer
        }));
    });

    it('changes the current tool', () => {
        // set the "point" tool.
        store.dispatch(actions.changeTool('Point'));
        expect(store.getState().map.interactionType).toBe('Point');

        // change the tool to "null", when testing the
        //  component this should test that no interaction is active.
        store.dispatch(actions.changeTool(null));
        expect(store.getState().map.interactionType).toBe(null);
    });

    it('adds a selection feature', () => {
        const selection_feature = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [0, 0]
            }
        };
        // ensure that a selection feature is added to the stack
        store.dispatch(actions.addSelectionFeature(selection_feature));
        expect(store.getState().map.selectionFeatures[0]).toBe(selection_feature);

        // test clearing the selection features
        store.dispatch(actions.clearSelectionFeatures());
        expect(store.getState().map.selectionFeatures.length).toBe(0);
    });

    it('sets a buffer distance', () => {
        store.dispatch(actions.setSelectionBuffer(100));
        expect(store.getState().map.selectionBuffer).toBe(100);
    });

    it('sets the map using a center/resolution', () => {
        const new_view = {
            center: [-100, -100],
            resolution: 200
        };

        store.dispatch(actions.setView(new_view));

        const st = store.getState().map;
        expect(st.center).toBe(new_view.center);
        expect(st.resolution).toBe(new_view.resolution);
    });

    it('sets the extent', () => {
        // a "zoom to extent" is a special case in GeoMoose,
        // As the extent shown on the map and the extent passed into
        // the reducer will be different things due to the
        // extent on the map being dependent on the rendered size
        // of the map.
        // This test simply ensures setting the extent will set
        // it in the reducer.
        const view = {
            bbox: [100, 100, 200, 200],
            projection: 'EPSG:900913'
        }

        store.dispatch(actions.zoomToExtent(view.bbox, view.projection));
        const st = store.getState().map.extent;
        expect(st.bbox).toBe(view.bbox);
        expect(st.projection).toBe(view.projection);
    });

});
