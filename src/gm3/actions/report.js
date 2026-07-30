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

import { getMapSourceName, getLayerName } from "../util";
import { getLayerFromPath, setLayerTemplate } from "./mapSource";

/* Ensure the layer's "report" layout template is loaded into the store.
 *
 * A report layout defined with a `src` attribute is stored as a "remote"
 * template with no `contents` until it is fetched. Unlike identify/select
 * templates (fetched during the query cycle), nothing else fetches the
 * "report" template, so without this the report modal silently falls back to
 * the built-in default layouts -- ignoring the deployer's layout,
 * showMeasurements, custom columns, etc.
 *
 * This mirrors Application.getTemplate()'s remote branch: fetch the src and
 * rewrite the template as a "local" one in the store. It is a no-op for
 * inline (already-local) templates and for layers without a report template.
 */
export const ensureReportTemplate = (layerPath) => (dispatch, getState) => {
  let layer = null;
  try {
    layer = getLayerFromPath(getState().mapSources, layerPath);
  } catch {
    layer = null;
  }
  const template = layer && layer.templates && layer.templates.report;
  if (!template || template.type !== "remote") {
    return;
  }
  fetch(template.src)
    .then((response) => response.text())
    .then((contents) => {
      dispatch(
        setLayerTemplate(getMapSourceName(layerPath), getLayerName(layerPath), "report", {
          ...template,
          type: "local",
          contents,
        })
      );
    })
    // a failed fetch (404, offline, ...) leaves the remote template in place;
    //  the report falls back to the default layouts, same as before.
    .catch(() => {});
};

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
