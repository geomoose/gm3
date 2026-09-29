/*
 * Copyright (c) 2016-2026 Dan "Ducky" Little & GeoMoose.org
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

import catalogReducer from "gm3/reducers/catalog";
import mapReducer from "gm3/reducers/map";
import msReducer from "gm3/reducers/mapSource";
import { setLayerVisibility } from "gm3/actions/mapSource";

const src = (mapSourceName, layerName = "0") => ({ mapSourceName, layerName });

const makeMapSource = (name, on = false) => ({
  name,
  layers: [{ name: "0", on }],
});

const createTestStore = (catalog, mapSources) =>
  configureStore({
    reducer: {
      catalog: catalogReducer,
      map: mapReducer,
      mapSources: msReducer,
    },
    preloadedState: {
      catalog,
      mapSources,
    },
  });

const isOn = (store, mapSourceName) => store.getState().mapSources[mapSourceName].layers[0].on;

describe("setLayerVisibility exclusive group handling", () => {
  // one radio group containing layers a, b, c, d.
  const CATALOG = {
    basemaps: { id: "basemaps", children: ["a", "b", "c", "d"], multiple: false },
    a: { id: "a", parent: "basemaps", exclusive: true, src: [src("basemap-a")] },
    b: { id: "b", parent: "basemaps", exclusive: true, src: [src("basemap-b")] },
    c: { id: "c", parent: "basemaps", exclusive: true, src: [src("basemap-c")] },
    d: { id: "d", parent: "basemaps", exclusive: true, src: [src("basemap-d")] },
  };

  const makeBasemapSources = () => ({
    "basemap-a": makeMapSource("basemap-a", true),
    "basemap-b": makeMapSource("basemap-b"),
    "basemap-c": makeMapSource("basemap-c"),
    "basemap-d": makeMapSource("basemap-d"),
  });

  test("turning a layer on turns off the rest of its group", () => {
    const store = createTestStore(CATALOG, makeBasemapSources());

    store.dispatch(setLayerVisibility("basemap-d", "0", true));

    expect(isOn(store, "basemap-d")).toBe(true);
    expect(isOn(store, "basemap-a")).toBe(false);
    expect(isOn(store, "basemap-b")).toBe(false);
    expect(isOn(store, "basemap-c")).toBe(false);
  });

  test("the basemap toggle cannot leave two group members on", () => {
    // "a" is on in the catalog but the toggle is only configured
    //  with b, c, and d; clicking "d" dispatches the same actions
    //  as the toggle's click handler.
    const store = createTestStore(CATALOG, makeBasemapSources());

    store.dispatch(setLayerVisibility("basemap-d", "0", true));
    store.dispatch(setLayerVisibility("basemap-b", "0", false));
    store.dispatch(setLayerVisibility("basemap-c", "0", false));

    expect(isOn(store, "basemap-d")).toBe(true);
    // "a" was outside the toggle's list but is still turned off.
    expect(isOn(store, "basemap-a")).toBe(false);
  });

  test("turning a layer off leaves the rest of its group alone", () => {
    const store = createTestStore(CATALOG, makeBasemapSources());

    store.dispatch(setLayerVisibility("basemap-d", "0", false));

    expect(isOn(store, "basemap-a")).toBe(true);
  });

  test("non-exclusive layers do not affect each other", () => {
    const catalog = {
      overlays: { id: "overlays", children: ["p", "q"], multiple: true },
      p: { id: "p", parent: "overlays", exclusive: false, src: [src("parcels")] },
      q: { id: "q", parent: "overlays", exclusive: false, src: [src("roads")] },
    };
    const store = createTestStore(catalog, {
      parcels: makeMapSource("parcels", true),
      roads: makeMapSource("roads"),
    });

    store.dispatch(setLayerVisibility("roads", "0", true));

    expect(isOn(store, "roads")).toBe(true);
    expect(isOn(store, "parcels")).toBe(true);
  });

  test("a layer in multiple exclusive groups turns off both groups", () => {
    // the "shared" source is referenced from two different radio groups.
    const catalog = {
      group1: { id: "group1", children: ["g1-a", "g1-shared"], multiple: false },
      "g1-a": { id: "g1-a", parent: "group1", exclusive: true, src: [src("basemap-a")] },
      "g1-shared": { id: "g1-shared", parent: "group1", exclusive: true, src: [src("shared")] },
      group2: { id: "group2", children: ["g2-shared", "g2-x"], multiple: false },
      "g2-shared": { id: "g2-shared", parent: "group2", exclusive: true, src: [src("shared")] },
      "g2-x": { id: "g2-x", parent: "group2", exclusive: true, src: [src("basemap-x")] },
    };
    const store = createTestStore(catalog, {
      "basemap-a": makeMapSource("basemap-a", true),
      shared: makeMapSource("shared"),
      "basemap-x": makeMapSource("basemap-x", true),
    });

    store.dispatch(setLayerVisibility("shared", "0", true));

    expect(isOn(store, "shared")).toBe(true);
    expect(isOn(store, "basemap-a")).toBe(false);
    expect(isOn(store, "basemap-x")).toBe(false);
  });
});
