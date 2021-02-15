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

/** Process queries
 *
 */

import uuid from 'uuid';

import { MAP, SERVICE } from '../actionTypes';

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
    const query = state[queryId];
    const new_state = {};
    new_state[queryId] = Object.assign({}, query, {
        progress,
        counter: query.counter === undefined ? 0 : query.counter + 1,
    });
    return new_state;
}

/** Remove specific results from a query.
 *
 *  @param state The state
 *  @param queryId A query ID
 *  @param filter An object describing matching feature properties.
 *
 * @returns A new state.
 */
function filterQueryResults(state, queryId, filter) {
    const new_results = {};
    // iterate through the paths
    for(const path in state[queryId].results) {
        new_results[path] = util.filterFeatures(state[queryId].results[path], filter);
    }

    const new_query = Object.assign({}, state[queryId], {results: new_results});

    const new_state = Object.assign({}, state);
    new_state[queryId] = new_query;
    return new_state;
}

/** Remove a query from the state.
 *
 *  @param state The state
 *  @param queryId The query ID to remove.
 *
 * @returns updated state.
 */
function removeQuery(state, queryId) {
    const new_order = [];
    for(const id of state.order) {
        if(id !== queryId) {
            new_order.push(id);
        }
    }

    const new_state = Object.assign({}, state, {order: new_order});
    delete new_state[queryId];
    return new_state;
}

export default function queryReducer(state = default_query, action) {
    const new_query = {};
    switch(action.type) {
        case SERVICE.START:
            return Object.assign({}, state, {service: action.service, showServiceForm: true});
        case SERVICE.FINISH:
            return Object.assign({}, state, {service: null, showServiceForm: false});
        case MAP.QUERY_NEW:
            const query_id = uuid.v4();
            new_query[query_id] = Object.assign({}, action.query, {
                progress: 'new',
                filter: [],
                results: {},
                rendered: {}
            });

            let query_order = [query_id].concat(state.order);

            // when running in single query mode the current query should
            //  be the only one displayed.
            const new_state = Object.assign({}, state);
            if(action.singleQuery) {
                query_order = [query_id];
                // remove the other queries
                for(const q of state.order) {
                    delete new_state[q];
                }
            }
            return Object.assign(new_state, {order: query_order}, new_query);
        case MAP.QUERY_RESULTS:
            // results are stored as results.layer = [features,]
            const new_results = {};
            if(action.failed) {
                new_results[action.layer] = {
                    failed: true,
                    failureMessage: action.messageText
                };
            } else {
                new_results[action.layer] = action.features;
            }
            for(let i = 0, ii = action.features.length; i < ii; i++) {
                new_results[action.layer][i].query = action.id;
            }
            const all_results = Object.assign({}, state[action.id].results, new_results);
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
            const rendered_results = [{data: action.data, target: action.target}].concat(state[action.id].rendered);
            const rendered_query = {};
            rendered_query[action.id] = Object({}, state[action.id], {rendered: rendered_results});
            return Object.assign({}, state, rendered_query);
        case MAP.QUERY_RESULTS_REMOVE:
            return filterQueryResults(state, action.id, action.filter);
        case MAP.QUERY_REMOVE:
            return removeQuery(state, action.id);
        case MAP.ADD_FILTER:
            new_query[action.id] = Object.assign({}, state[action.id], {
                filter: state[action.id].filter.concat([action.filter])
            });
            return Object.assign({}, state, new_query);
        case MAP.REMOVE_FILTER:
            const new_filter = [];
            // rebuild the filter array based without the
            //  filters for a given field.
            for(const filter in state[action.id].filter) {
                if(filter.length > 2 && filter[1] !== action.field) {
                    new_filter.push(filter);
                }
            }

            new_query[action.id] = Object.assign({}, state[action.id], {
                filter: new_filter
            });
            return Object.assign({}, state, new_query);
        case SERVICE.SHOW_FORM:
            return Object.assign({},
                state,
                {showServiceForm: action.show}
            );
        default:
            return state;
    }
};
