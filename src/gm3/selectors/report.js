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

import { matchFeatures } from "../util";

/* Resolve the report target into concrete data from the live query results.
 *
 * Returns null when no report is targeted, otherwise:
 *   {
 *     feature,      // the subject feature ("feature" mode) or first result
 *     results,      // all results for the layer ("results" mode)
 *     layerPath, serviceName, mode,
 *   }
 *
 * The feature is matched from state.query.results so the report always
 * reflects the current selection rather than a stale copy.
 */
export const getReportData = (state) => {
  const { layerPath, serviceName, mode, filter } = state.report;
  if (!layerPath) {
    return null;
  }
  const results = state.query.results[layerPath] || [];
  const feature = filter ? matchFeatures(results, filter)[0] : results[0];
  return { feature, results, layerPath, serviceName, mode };
};
