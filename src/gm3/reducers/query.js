/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 GeoMoose
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

/** Process queries
 *
 */

import uuid from 'uuid';

import { MAP } from '../actionTypes';

import * as util from '../util';

const default_query = {
    service: null,
    order: []
};

/** Update a query through its progress cycle.
 *
 *  @param queryId  The query's ID.
 *  @param state    The current state.
 *  @param progress The new progress state.
 *
 * @returns a mixin for the state object.
 */
function queryProgress(queryId, state, progress) {
    let query = state[queryId];
    let new_state = {};
    new_state[queryId] = Object.assign({}, query, {progress});
    return new_state;
}

export default function queryReducer(state = default_query, action) {
    let new_query = {};
	switch(action.type) {
        case SERVICE.START:
            return Object.assign({}, state, {service: action.service});
        case SERVICE.FINISHED:
            return Object.assign({}, state, {service: null});
        case MAP.QUERY_NEW:
            let query_id = uuid.v4();
            new_query[query_id] = Object.assign({}, action.query, {
                progress: 'new',
                results: {},
                rendered: {}
            });

            let query_order = [query_id].concat(state.order);
            // TODO: Maybe add a 'culling' bit here to remove old processed 
            //       queries
            return Object.assign({}, state, {order: query_order}, new_query);
        case MAP.QUERY_RESULTS:
            // issued when a specific layer returns a result
            let query_detail = state[action.id];

            // results are stored as results.layer = [features,]
            let new_results = {};
            new_results[action.layer] = action.features;
            let all_results = Object.assign({}, state[action.id].results, new_results);
            // create the new query object
            new_query[action.id] = Object.assign({}, state[action.id], {results: all_results});
            return Object.assign({}, state, new_query);
        case MAP.QUERY_START:
            return Object.assign({}, state, queryProgress(action.id, state, 'started'));
        case MAP.QUERY_PROGRESS:
            return Object.assign({}, state, queryProgress(action.id, state, 'progress'));
        case MAP.QUERY_FINISHED:
            return Object.assign({}, state, queryProgress(action.id, state, 'finished'));
        case MAP.QUERY_RENDERED_RESULTS:
            let rendered_results = [{data: action.data, target: action.target}].concat(state[action.id].rendered);
            let rendered_query = {};
            rendered_query[action.id] = Object({}, state[action.id], {rendered: rendered_results});
            return Object.assign({}, state, rendered_query); 
        default:
            return state;
    }
};
