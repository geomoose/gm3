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

/** Converts the catalog XML into something more useful.
 *
 */

import { createReducer } from "@reduxjs/toolkit";
import uuid from "uuid";
import {
  addLayer,
  addGroup,
  addChild,
  setLegendVisibility,
  setGroupExpand,
} from "../actions/catalog";

const DEFAULT_CATALOG = {
  root: {
    id: uuid.v4(),
    children: [],
  },
};

const reducer = createReducer(DEFAULT_CATALOG, {
  [addLayer]: (state, { payload }) => {
    state[payload.child.id] = payload.child;
  },
  [addGroup]: (state, { payload }) => {
    state[payload.child.id] = payload.child;
  },
  [addChild]: (state, { payload }) => {
    const parentId = payload.parentId || "root";
    state[parentId].children.push(payload.childId);
  },
  [setLegendVisibility]: (state, { payload }) => {
    state[payload.id].legend = payload.on;
  },
  [setGroupExpand]: (state, { payload }) => {
    state[payload.id].expand = payload.expand;
  },
});

export default reducer;
