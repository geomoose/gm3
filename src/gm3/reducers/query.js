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

import { createReducer } from "@reduxjs/toolkit";
import {
  changeService,
  clearService,
  createQuery,
  runQuery,
  addFilter,
  removeFilter,
  setHotFilter,
  removeQueryResults,
  setServiceStep,
} from "../actions/query";
import { filterFeatures, getFilterFieldNames } from "../util";

export const SERVICE_STEPS = {
  START: "start",
  FINISHED: "finished",
  LOADING: "loading",
  RESULTS: "results",
};

const defaultState = {
  serviceName: null,
  instance: 0,
  defaultValues: {},
  step: "",
  query: {},
  results: {},
  filter: [],
  hotFilter: false,
};

const reducer = createReducer(defaultState, {
  [changeService]: (state, { payload: { serviceName, defaultValues } }) => {
    // the instance counter is used to delineate between
    //  simultaneous calls to the same service.
    state.instance += 1;
    state.serviceName = serviceName;
    state.defaultValues = defaultValues;
    state.step = SERVICE_STEPS.START;
  },
  [clearService]: (state) => {
    state.serviceName = "";
    state.defaultValues = {};
    state.step = SERVICE_STEPS.FINISHED;
  },
  [createQuery]: (state, { payload }) => {
    state.query = payload;
    // when starting a new query reset the results
    //   and filters
    state.results = {};
    state.filter = [];
  },
  [runQuery.pending]: (state) => {
    state.step = SERVICE_STEPS.LOADING;
  },
  [runQuery.fulfilled]: (state, { payload }) => {
    state.results = payload;
    state.step = SERVICE_STEPS.RESULTS;
  },
  [runQuery.rejected]: (state, action) => {
    console.error("Query error!", action.error);
    state.results = {};
    // TODO: Throw in a better error display?
    state.step = SERVICE_STEPS.RESULTS;
  },
  [addFilter]: (state, { payload }) => {
    state.filter.push(payload);
  },
  [removeFilter]: (state, { payload: fieldName }) => {
    state.filter = state.filter.filter((filterDef) => {
      const fieldNames = getFilterFieldNames(filterDef);
      return fieldNames.indexOf(fieldName) < 0;
    });
  },
  [setHotFilter]: (state, { payload: filter }) => {
    state.hotFilter = filter;
  },
  [removeQueryResults]: (state, { payload: filter }) => {
    for (const path in state.results) {
      state.results[path] = filterFeatures(state.results[path], filter);
    }
  },
  [setServiceStep]: (state, { payload: step }) => {
    state.step = step;
  },
});

export default reducer;
