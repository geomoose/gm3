/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2026 Dan "Ducky" Little
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

import { createStore, combineReducers } from "redux";

import reducer from "gm3/reducers/report";
import { openReport, closeReport } from "gm3/actions/report";
import { getReportData } from "gm3/selectors/report";

describe("test the `report` reducer", () => {
  let store = null;

  beforeEach(() => {
    store = createStore(
      combineReducers({
        report: reducer,
      })
    );
  });

  test("starts with no report targeted", () => {
    expect(store.getState().report).toEqual({
      layerPath: null,
      serviceName: null,
      mode: "feature",
      filter: null,
    });
  });

  test("openReport records the target", () => {
    store.dispatch(openReport("parcels/parcels", "identify", "results", [["==", "PIN", "123"]]));
    expect(store.getState().report).toEqual({
      layerPath: "parcels/parcels",
      serviceName: "identify",
      mode: "results",
      filter: [["==", "PIN", "123"]],
    });
  });

  test("openReport defaults to a single-feature report with no filter", () => {
    store.dispatch(openReport("parcels/parcels", "identify"));
    const { mode, filter } = store.getState().report;
    expect(mode).toBe("feature");
    expect(filter).toBe(null);
  });

  test("closeReport clears the target", () => {
    store.dispatch(openReport("parcels/parcels", "identify", "results", null));
    store.dispatch(closeReport());
    expect(store.getState().report.layerPath).toBe(null);
  });
});

describe("getReportData", () => {
  const featureOf = (properties) => ({
    type: "Feature",
    properties,
    geometry: { type: "Point", coordinates: [0, 0] },
  });

  const stateWith = (report, results) => ({
    report,
    query: { results },
  });

  test("returns null when no report is targeted", () => {
    const state = stateWith(
      { layerPath: null, serviceName: null, mode: "feature", filter: null },
      {}
    );
    expect(getReportData(state)).toBe(null);
  });

  test("picks the filtered feature out of the live results", () => {
    const state = stateWith(
      {
        layerPath: "parcels/parcels",
        serviceName: "identify",
        mode: "feature",
        filter: [["==", "PIN", "222"]],
      },
      {
        "parcels/parcels": [featureOf({ PIN: "111" }), featureOf({ PIN: "222" })],
      }
    );

    const data = getReportData(state);
    expect(data.feature.properties.PIN).toBe("222");
    expect(data.results).toHaveLength(2);
    expect(data.mode).toBe("feature");
  });

  test("falls back to the first result when there is no filter", () => {
    const state = stateWith(
      {
        layerPath: "parcels/parcels",
        serviceName: "identify",
        mode: "results",
        filter: null,
      },
      {
        "parcels/parcels": [featureOf({ PIN: "111" }), featureOf({ PIN: "222" })],
      }
    );

    expect(getReportData(state).feature.properties.PIN).toBe("111");
  });

  test("tolerates a layer with no results yet", () => {
    const state = stateWith(
      {
        layerPath: "parcels/parcels",
        serviceName: "identify",
        mode: "feature",
        filter: null,
      },
      {}
    );

    const data = getReportData(state);
    expect(data.feature).toBe(undefined);
    expect(data.results).toEqual([]);
  });
});
