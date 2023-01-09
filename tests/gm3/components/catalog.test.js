/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 Dan "Ducky" Little
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

import React from "react";

import { fireEvent, render } from "@testing-library/react";

import { createStore, combineReducers, applyMiddleware } from "redux";
import thunk from "redux-thunk";

import Catalog from "gm3/components/catalog";

import reducer from "gm3/reducers/catalog";
import msReducer from "gm3/reducers/mapSource";
import editorReducer from "gm3/reducers/editor";
import mapReducer from "gm3/reducers/map";
import queryReducer from "gm3/reducers/query";
import * as actions from "gm3/actions/catalog";
import * as msActions from "gm3/actions/mapSource";

describe("Catalog component tests", () => {
  const store = createStore(
    combineReducers({
      catalog: reducer,
      mapSources: msReducer,
      editor: editorReducer,
      map: mapReducer,
      query: queryReducer,
    }),
    applyMiddleware(thunk)
  );

  let catalog = null;

  beforeEach(function () {
    // setup the map sources
    store.dispatch(msActions.add({ name: "test", type: "vector" }));

    store.dispatch(
      msActions.addLayer("test", {
        name: "test0",
        on: true,
        label: "Test 0",
        legend: {
          type: "html",
          html: "find-me",
        },
        refreshEnabled: false,
      })
    );

    store.dispatch(
      msActions.addLayer("test", {
        name: "test1",
        on: false,
        label: "Test 1",
        legend: {
          type: "img",
          images: ["https://geomoose.org/_static/logo_2011.png"],
        },
      })
    );

    const xml = `
            <catalog>
                <group title="Group">
                    <layer refresh="30" title="Test 2" src="test/test0"/>
                </group>
                <layer title="Test 1" src="test/test1" legend-toggle="true"/>

                <layer src="test/test0" title="ALL THE TOOLS"
                       zoomto="true" upload="true" download="true" clear="true"
                       draw-point="true" draw-line="true" draw-polygon="true"
                       draw-modify="true" draw-remove="true" />
            </catalog>`;

    const parser = new DOMParser();
    const catalogXml = parser.parseFromString(xml, "text/xml");
    const results = actions.parseCatalog(
      store,
      catalogXml.getElementsByTagName("catalog")[0]
    );

    results.forEach((action) => {
      store.dispatch(action);
    });

    const { container } = render(
      <div>
        <Catalog store={store} />
      </div>
    );

    catalog = container;
  });

  it("toggles a favorite", function () {
    fireEvent.click(catalog.querySelector("i.favorite.icon"));
    expect(store.getState().mapSources.test.layers[0].favorite).toBe(true);
  });

  it("toggles refreshes", function () {
    fireEvent.click(catalog.querySelector("i.refresh.icon"));
  });

  it("toggles the group state", function () {
    fireEvent.click(catalog.querySelector(".group-label"));
    expect(catalog.querySelector(".gm-expand")).not.toBeNull();
    fireEvent.click(catalog.querySelector(".group-label"));
    expect(catalog.querySelector(".gm-collapse")).not.toBeNull();
  });

  it("triggers a catalog search", function () {
    fireEvent.change(catalog.querySelector("input"), { value: "1" });
  });

  it("toggles layer visibility", function () {
    fireEvent.click(catalog.querySelector(".checkbox"));
    // the layer is on by default
    expect(store.getState().mapSources.test.layers[0].on).toBe(false);
  });
});
