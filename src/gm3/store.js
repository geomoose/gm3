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

import { configureStore } from "@reduxjs/toolkit";

import catalogReducer from "./reducers/catalog";
import msReducer from "./reducers/mapSource";
import mapReducer from "./reducers/map";
import toolbarReducer from "./reducers/toolbar";
import queryReducer from "./reducers/query";
import uiReducer from "./reducers/ui";
import cursorReducer from "./reducers/cursor";
import printReducer from "./reducers/print";
import configReducer from "./reducers/config";
import editorReducer from "./reducers/editor";

export const createStore = () => {
  return configureStore({
    reducer: {
      mapSources: msReducer,
      catalog: catalogReducer,
      map: mapReducer,
      toolbar: toolbarReducer,
      query: queryReducer,
      ui: uiReducer,
      cursor: cursorReducer,
      print: printReducer,
      config: configReducer,
      editor: editorReducer,
    },
  });
};
