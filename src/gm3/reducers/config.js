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

import { createReducer } from "@reduxjs/toolkit";
import { setConfig, setMeasureUnits } from "../actions/config";

const DEFAULT_CONFIG = {
  map: {},
  serviceManager: {},
  measure: {
    areaUnits: ["m", "km", "ft", "mi", "a", "h"],
    lengthUnits: ["m", "km", "ft", "mi", "ch"],
    // opt-in: annotate each line/polygon segment with its length on the map.
    segmentLabels: false,
    // the default units the measure panel starts with.  The panel mirrors its
    //  live selection back here so non-React consumers (the map layer styles)
    //  can render the on-map labels in the matching units.
    defaultLengthUnits: "ft",
    defaultAreaUnits: "ft",
  },
};

const reducer = createReducer(DEFAULT_CONFIG, (builder) => {
  builder.addCase(setConfig, (state, action) => {
    const config = action.payload;
    // Merge the measure config so a deployer that only overrides part of it
    //  (e.g. just `segmentLabels`) does not drop the unit defaults.
    return {
      ...state,
      ...config,
      measure: {
        ...state.measure,
        ...(config.measure || {}),
      },
    };
  });

  builder.addCase(setMeasureUnits, (state, action) => {
    state.measure = {
      ...state.measure,
      ...action.payload,
    };
  });
});

export default reducer;
