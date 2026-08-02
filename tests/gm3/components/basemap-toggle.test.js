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

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { BasemapToggleComponent, mapDispatchToProps } from "gm3/components/basemap-toggle";
import { setLayerVisibility } from "gm3/actions/mapSource";

jest.mock("gm3/actions/mapSource", () => ({
  setLayerVisibility: jest.fn((mapSourceName, layerName, on) => ({
    type: "mapsource/set-layer-vis-internal",
    payload: { mapSourceName, layerName, on },
  })),
}));

describe("BasemapToggle", () => {
  beforeEach(() => {
    setLayerVisibility.mockClear();
  });

  const layers = [
    { label: "No background", src: "blank.png", path: "blank/blank" },
    { label: "OpenStreetMap", src: "osm.png", path: "openstreetmap/osm_mapnik" },
    { label: "Aerial", src: "aerial.png", path: "lmic/mncomp" },
  ];

  it("dispatches layer visibility using source and layer names", () => {
    const dispatch = jest.fn((action) => action);
    const { onSetLayerVisibility } = mapDispatchToProps(dispatch);

    onSetLayerVisibility("lmic/mncomp", true);

    expect(setLayerVisibility).toHaveBeenCalledWith("lmic", "mncomp", true);
    expect(dispatch).toHaveBeenCalledWith({
      type: "mapsource/set-layer-vis-internal",
      payload: { mapSourceName: "lmic", layerName: "mncomp", on: true },
    });
  });

  it("marks and opens the active basemap", () => {
    render(
      <BasemapToggleComponent
        layers={layers}
        mapSources={{
          lmic: {
            layers: [{ name: "mncomp", on: true }],
          },
        }}
        onSetLayerVisibility={jest.fn()}
      />
    );

    const aerialChip = screen.getByText("Aerial").closest(".basemap-toggle-chip");
    const blankChip = screen.getByText("No background").closest(".basemap-toggle-chip");

    expect(aerialChip.classList.contains("active")).toBe(true);
    expect(aerialChip.classList.contains("open")).toBe(true);
    expect(blankChip.classList.contains("active")).toBe(false);
    expect(blankChip.classList.contains("open")).toBe(false);
  });

  it("toggles the clicked basemap on and the others off", () => {
    const onSetLayerVisibility = jest.fn();

    render(
      <BasemapToggleComponent
        layers={layers}
        mapSources={{}}
        onSetLayerVisibility={onSetLayerVisibility}
      />
    );

    fireEvent.click(screen.getByText("Aerial"));

    expect(onSetLayerVisibility).toHaveBeenCalledWith("lmic/mncomp", true);
    expect(onSetLayerVisibility).toHaveBeenCalledWith("blank/blank", false);
    expect(onSetLayerVisibility).toHaveBeenCalledWith("openstreetmap/osm_mapnik", false);
  });

  it("expands on hover", () => {
    const props = {
      layers,
      mapSources: {},
      onSetLayerVisibility: jest.fn(),
    };

    render(<BasemapToggleComponent {...props} />);

    fireEvent.mouseOver(screen.getByText("No background").closest(".basemap-toggle"));
    expect(
      screen.getByText("No background").closest(".basemap-toggle-chip").classList.contains("open")
    ).toBe(true);
  });
});
