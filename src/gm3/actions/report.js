/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2024 Dan "Ducky" Little
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

/* Point the feature report at a layer's results.
 *
 * The slice holds references, not a copy of the feature(s): the actual
 * feature is resolved from the live query results by getReportData(). A
 * "feature" report (mode) is identified by a filter; a "results" report
 * covers the whole result set for the layer.
 */
export const openReport = createAction("report/open", (layerPath, serviceName, mode, filter) => ({
  payload: {
    layerPath,
    serviceName,
    mode: mode || "feature",
    filter: filter || null,
  },
}));

/* Clear the report target. */
export const closeReport = createAction("report/close");
