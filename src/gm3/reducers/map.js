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

/** Tracks the state of the map.
 *
 */

import { createReducer } from "@reduxjs/toolkit";

import {
  setView,
  zoomToExtent,
  changeTool,
  addSelectionFeature,
  clearSelectionFeatures,
  setSelectionBuffer,
  setEditPath,
  setEditTools,
  setShowMeasureLabels,
  setMeasureUnits,
} from "../actions/map";

const defaultState = {
  center: [0, 0],
  zoom: 1,
  resolution: null,
  extent: null,
  activeSource: null,
  interactionType: null,
  selectionFeatures: [],
  selectionBuffer: 0,
  selectionBufferUnits: "ft",
  editPath: "",
  editTools: [],
  projection: "EPSG:3857",
  // on-map measure annotations (rendering concerns).  On by default; a
  //  deployer can opt out via config.map.showMeasureLabels = false.
  showMeasureLabels: true,
  measureLengthUnits: "ft",
  measureAreaUnits: "ft",
};

const reducer = createReducer(defaultState, {
  [setView]: (state, { payload }) => {
    state.extent = null;
    if (payload.center) {
      state.center = payload.center;
    }
    if (payload.zoom) {
      state.zoom = payload.zoom;
    }
    if (payload.resolution) {
      state.resolution = payload.resolution;
      state.zoom = null;
    }
  },
  [zoomToExtent]: (state, { payload }) => {
    state.extent = {
      bbox: payload.extent,
      projection: payload.projection,
      // default to having padding if undefined.
      padding: payload.padding !== undefined ? payload.padding : true,
    };
  },
  [changeTool]: (state, { payload }) => {
    state.activeSource = payload.src;
    state.interactionType = payload.tool;
  },
  [addSelectionFeature]: (state, { payload: feature }) => {
    state.selectionFeatures.push(feature);
  },
  [clearSelectionFeatures]: (state) => {
    state.selectionFeatures = [];
  },
  [setSelectionBuffer]: (state, { payload }) => {
    state.selectionBuffer = payload.distance;
    state.selectionBufferUnits = payload.units || state.selectionBufferUnits;
  },
  [setEditPath]: (state, { payload: editPath }) => {
    state.editPath = editPath;
  },
  [setEditTools]: (state, { payload: tools }) => {
    state.editTools = tools;
  },
  [setShowMeasureLabels]: (state, { payload: show }) => {
    state.showMeasureLabels = show;
  },
  [setMeasureUnits]: (state, { payload }) => {
    state.measureLengthUnits = payload.measureLengthUnits || state.measureLengthUnits;
    state.measureAreaUnits = payload.measureAreaUnits || state.measureAreaUnits;
  },
});

export default reducer;
