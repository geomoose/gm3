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

/** Reducer for the toolbar
 *
 */

import { createReducer } from "@reduxjs/toolkit";

import {
  setUiHint,
  clearUiHint,
  runAction,
  clearAction,
  showModal,
  hideModal,
} from "../actions/ui";

const defaultState = {
  stateId: 0,
  hint: null,
  action: null,
  modal: "",
};

const reducer = createReducer(defaultState, {
  [setUiHint]: (state, { payload: hint }) => {
    state.hint = hint;
    state.stateId++;
  },
  [clearUiHint]: (state) => {
    state.hint = null;
    state.stateId++;
  },
  [runAction]: (state, { payload: action }) => {
    state.action = action;
    state.stateId++;
  },
  [clearAction]: (state) => {
    state.action = null;
    state.stateId++;
  },
  [showModal]: (state, { payload }) => {
    state.modal = payload;
  },
  [hideModal]: (state) => {
    state.modal = "";
  },
});

export default reducer;
