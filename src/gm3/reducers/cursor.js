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

/** Tracks extra map state that updates frequently but is of limited use.
 *
 */
import { createReducer } from "@reduxjs/toolkit";
import { setCursor, updateSketchGeometry, resizeMap } from "../actions/cursor";

const defaultState = {
  coords: [0, 0],
  sketchGeometry: null,
  // size can be null by default, this is meant to be a hint only!
  size: null,
};

const reducer = createReducer(defaultState, {
  [setCursor]: (state, { payload: coords }) => {
    state.coords = coords;
  },
  [updateSketchGeometry]: (state, { payload: geometry }) => {
    state.sketchGeometry = geometry;
  },
  [resizeMap]: (state, { payload: size }) => {
    state.size = size;
  },
});

export default reducer;
