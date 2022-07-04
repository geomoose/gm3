/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2022 Dan "Ducky" Little
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

import { createReducer } from '@reduxjs/toolkit';
import { startService, finishService, createQuery, runQuery, addFilter, removeFilter } from '../actions/query';


export const SERVICE_STEPS = {
    START: 'start',
    FINISHED: 'finished',
    LOADING: 'loading',
    RESULTS: 'results',
};

const defaultState = {
    serviceName: null,
    defaultValues: {},
    step: '',
    // dep soon
    order: ['query'],
    query: {},
    results: {},
    filter: [],
};

const reducer = createReducer(defaultState, {
    [startService]: (state, {payload: {serviceName, defaultValues}}) => {
        state.serviceName = serviceName;
        state.defaultValues = defaultValues;
        state.step = SERVICE_STEPS.START;
        state.results = {};
    },
    [finishService]: state => {
        state.serviceName = '';
        state.defaultValues = {};
        state.step = SERVICE_STEPS.FINISHED;
    },
    [createQuery]: (state, {payload}) => {
        state.query = payload;
        // when starting a new query reset the results
        //   and filters
        state.results = {};
        state.filter = [];
    },
    [runQuery.pending]: state => {
        state.step = SERVICE_STEPS.LOADING;
    },
    [runQuery.fulfilled]: (state, {payload}) => {
        state.results = payload;
        state.step = SERVICE_STEPS.RESULTS;
    },
    [runQuery.rejected]: (state, action) => {
        console.error('Query error!', action.error);
        state.results = {};
        // TODO: Throw in a better error display?
        state.step = SERVICE_STEPS.RESULTS;
    },
    [addFilter]: (state, {payload}) => {
        state.filter.push(payload);
    },
    [removeFilter]: (state, {payload: fieldName}) => {
        state.filter = state.filter.filter(filterDef => {
            return filterDef.length > 2 && filterDef[1] !== fieldName;
        });
    },
});

export default reducer;
