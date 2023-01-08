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
import { addDrawer, addTool, remove } from "../actions/toolbar";

/*
 * Toolbar tool definition
 * action.order
 * action.type
 * action.tool
 * * name
 * * label
 * * className
 * * actionType (tool, service)
 * * actionInfo
 * * order (first/last)
 *
 */

const add = (state, payload) => {
  if (!state[payload.root]) {
    state[payload.root] = [];
  }
  if (payload.order === "first") {
    state[payload.root].unshift(payload.tool);
  } else {
    state[payload.root].push(payload.tool);
  }
};

const reducer = createReducer(
  { root: [] },
  {
    [addDrawer]: (state, { payload }) => {
      add(state, payload);
    },
    [addTool]: (state, { payload }) => {
      add(state, payload);
    },
    [remove]: (state, { payload: name }) => {
      for (const root in state) {
        state[root] = state[root].filter((item) => item.name !== name);
      }
    },
  }
);

export default reducer;
