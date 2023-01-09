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
import { render, fireEvent } from "@testing-library/react";

import { Provider } from "react-redux";
import { createStore } from "gm3/store";

import SmartToolbar, { Toolbar } from "gm3/components/toolbar";
import SmartToolbarButton, {
  ToolbarButton,
} from "gm3/components/toolbar/button";
import ToolbarDrawer from "gm3/components/toolbar/drawer";

import * as actions from "gm3/actions/toolbar";

describe("Toolbar component tests", () => {
  let store = null;

  beforeEach(() => {
    store = createStore();
  });

  it("renders a toolbar button", () => {
    const tool = {
      name: "sample0",
      label: "Sample Zero",
      actionType: "service",
      actionDetail: "sample",
    };

    render(<ToolbarButton tool={tool} />);
  });

  it("renders a drawer", () => {
    const tool = {
      name: "sample0",
      label: "Sample Zero",
      actionType: "service",
      actionDetail: "sample",
    };

    render(
      <Provider store={store}>
        <ToolbarDrawer label="Drawer Zero" tools={[tool]} services={{}} />
      </Provider>
    );
  });

  it("renders a toolbar", () => {
    const tool = {
      name: "sample0",
      label: "Sample Zero",
      actionType: "service",
      actionDetail: "sample",
    };

    const drawer = {
      name: "drawer0",
      label: "Drawer Zero",
    };

    const toolbar = {
      root: [drawer],
      drawer0: [tool],
    };

    render(<Toolbar store={store} toolbar={toolbar} services={{}} />);
  });

  it("renders a toolbar from the store", function () {
    store.dispatch(
      actions.addDrawer("root", {
        name: "drawer0",
        label: "Drawer 0",
      })
    );
    store.dispatch(
      actions.addTool("drawer0", {
        name: "sample1",
        label: "Sample 1",
        actionType: "service",
        actionDetail: "sample2",
      })
    );

    render(<SmartToolbar store={store} services={{}} />);
  });

  it("renders a toolbar from a mapbook fragment", function () {
    const toolbarXml = `
            <toolbar>
                <tool name="findme" title="Find Me" type="action"/>

                <drawer title="Dummy Drawer" name="dummy-drawer">
                    <tool name="dummy1" title="Dummy Tool 1" type="service"/>
                    <tool name="dummy2" title="Dummy Tool 2" type="service"/>
                </drawer>
            </toolbar>`;

    const parser = new DOMParser();
    const xml = parser.parseFromString(toolbarXml, "text/xml");
    const results = actions.parseToolbar(
      xml.getElementsByTagName("toolbar")[0]
    );

    results.forEach((action) => {
      store.dispatch(action);
    });

    render(<SmartToolbar store={store} services={{}} />);
  });

  it("changes the active service when clicked.", function () {
    const tool = {
      name: "sample0",
      label: "Sample Zero",
      actionType: "service",
    };

    const { container } = render(
      <Provider store={store}>
        <SmartToolbarButton tool={tool} />
      </Provider>
    );
    fireEvent.click(container.getElementsByClassName("tool")[0]);

    const state = store.getState();
    expect(state.query.serviceName).toBe("sample0");
  });

  it("triggers an action when clicked.", function () {
    const tool = {
      name: "sample0",
      label: "Sample Zero",
      actionType: "action",
    };

    const { container } = render(
      <SmartToolbarButton tool={tool} store={store} />
    );
    fireEvent.click(container.getElementsByClassName("tool")[0]);

    expect(store.getState().ui.action).toBe("sample0");
  });
});
