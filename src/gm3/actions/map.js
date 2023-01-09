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

import { createAction } from "@reduxjs/toolkit";

/** Actions for the Map.
 *
 */

export const zoomToExtent = createAction(
  "map/zoom-to-extent",
  (extent, projection) => ({
    payload: {
      extent,
      projection,
    },
  })
);

export const changeTool = createAction(
  "map/change-tool",
  (tool, src = null) => ({
    payload: {
      tool,
      src,
    },
  })
);

export const addSelectionFeature = createAction("map/add-selection-feature");

export const clearSelectionFeatures = createAction(
  "map/clear-selection-features"
);

/* Set the view of the map.
 *
 * @param view {Object} An object containing center and zoom or resolution.
 *
 * @return An action definition.
 */
export const setView = createAction("map/set-view");

/* Set a buffer for selection features.
 *
 * @param distance {Float} Distance to buffer features
 * @param units {String} Units of the buffer, defaults to meters in the reducer
 *
 * @return action definition
 */
export const setSelectionBuffer = createAction(
  "map/set-selection-buffer",
  (distance, units) => ({
    payload: {
      distance,
      units,
    },
  })
);

/* Set the edit source, which is a hint as to where
 * the current editing features originated from.
 *
 * @param editPath {String} The map-source name
 *
 * @return action definition.
 */
export const setEditPath = createAction("map/set-edit-path");

/* Set the list of available editing tools.
 *
 * @param editTools {Array} An array of tool names.
 *
 * @return action definition
 */
export const setEditTools = createAction("map/set-edit-tools");
