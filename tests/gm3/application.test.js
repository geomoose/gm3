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

import Application from "gm3/application";
import { setUiHint } from "gm3/actions/ui";

import { act } from "@testing-library/react";

import fs from "fs";

describe("Application Component", () => {
  it("create an application instance", () => {
    const app = new Application();
    expect(app).toBeDefined();
  });
});

// TODO: There likely should be a separate testing mapbook.
const MAPBOOK_PATH = "examples/desktop/mapbook.xml";

describe("application api calls", () => {
  const app = new Application({
    // eslint-disable-next-line camelcase
    mapserver_url: "/cgi-bin/mapserv",
    // eslint-disable-next-line camelcase
    mapfile_root: "/path/to/mapfiles/",
  });

  it("runs an action", () => {
    app.runAction("test-action");
  });

  it("clears an action when set", () => {
    app.store.dispatch(setUiHint("sample-hint"));
    app.clearHint();

    expect(app.store.getState().ui.hint).toBe(null);
  });

  it("loads a mapbook (from an XML doc)", (done) => {
    fs.readFile(MAPBOOK_PATH, "utf-8", (err, contents) => {
      const parser = new DOMParser();
      const xml = parser.parseFromString(contents, "text/xml");
      app.loadMapbook({ content: xml }).catch((err) => done(err));
      done();
    });
  });

  it("loads a mapbook from a string", (done) => {
    fs.readFile(MAPBOOK_PATH, "utf-8", (err, contents) => {
      app.loadMapbook({ content: contents }).catch((err) => done(err));
      done();
    });
  });

  // test that the query functions are working.
  it("gets a list of active layers", () => {
    app.getActiveMapSources();
  });

  it("gets a list of visible layers", () => {
    app.getVisibleLayers();
  });

  it("gets a list of queryable layers", () => {
    app.getQueryableLayers();
  });

  it("throws up an alert dialog", () => {
    const dialogBody = "Body of dialog";
    act(() => {
      app.alert("dialog-signature", dialogBody);
    });

    let contents = document.getElementsByTagName("body")[0].innerHTML;
    expect(contents).toContain(dialogBody);

    // this should close the dialog
    document.getElementsByTagName("button")[0].click();
    contents = document.getElementsByTagName("body")[0].innerHTML;
    expect(contents).not.toContain(dialogBody);
  });

  it("throws up a confirmation dialog", () => {
    const dialogBody = "Body of dialog";
    act(() => {
      app.confirm("confirm-signature", dialogBody);
    });
    let contents = document.getElementsByTagName("body")[0].innerHTML;
    expect(contents).toContain(dialogBody);

    // this should close the dialog
    const buttons = document.getElementsByTagName("button");
    expect(buttons.length).toBe(2);
    buttons[1].click();
    contents = document.getElementsByTagName("body")[0].innerHTML;
  });

  it("sets the view", () => {
    app.setView({
      center: [0, 0],
      resolution: 100,
    });

    const mapView = app.store.getState().map;
    expect(mapView.center).toEqual([0, 0]);
    expect(mapView.resolution).toBe(100);
  });

  it("adds a projection", () => {
    app.addProjection({
      ref: "EPSG:26915",
      def: "+proj=utm +zone=15 +ellps=GRS80 +datum=NAD83 +units=m +no_defs",
    });
  });

  it("zooms to a location", () => {
    app.zoomTo(-93, 45, 11);

    const mapView = app.store.getState().map;
    expect(mapView.center).toEqual([-10352712.643774442, 5621521.486192066]);
    expect(mapView.resolution).toBe(100);
  });
});
