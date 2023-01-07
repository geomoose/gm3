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
import reducer from "gm3/reducers/editor";
import { setEditFeature, finishEditing } from "gm3/actions/edit";

describe("test the `edit` reducer", () => {
  it("sets and clears the editing feature", () => {
    const store = configureStore({
      reducer,
    });

    const fakeFeature = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [0, 0],
      },
      properties: {},
    };

    let nextState = store.getState();

    store.dispatch(setEditFeature(fakeFeature));
    nextState = store.getState();
    expect(nextState).toEqual({
      feature: fakeFeature,
      source: "",
      modal: "edit",
      isNew: false,
    });

    store.dispatch(finishEditing());
    nextState = store.getState();
    expect(nextState).toEqual({
      feature: null,
      source: "",
      modal: "",
      isNew: false,
    });
  });
});
