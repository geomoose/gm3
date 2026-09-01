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
        mapbookReady={true}
        onSetLayerVisibility={jest.fn()}
      />
    );

    const aerialChip = screen.getByRole("button", { name: "Aerial" });
    const blankChip = screen.getByRole("button", { name: "No background" });

    expect(aerialChip.classList.contains("active")).toBe(true);
    expect(aerialChip.classList.contains("open")).toBe(true);
    expect(aerialChip.getAttribute("aria-pressed")).toBe("true");
    expect(blankChip.classList.contains("active")).toBe(false);
    expect(blankChip.classList.contains("open")).toBe(false);
    expect(blankChip.getAttribute("aria-pressed")).toBe("false");
  });

  it("does not render before the mapbook is ready", () => {
    const { container } = render(
      <BasemapToggleComponent
        layers={layers}
        mapSources={{}}
        mapbookReady={false}
        onSetLayerVisibility={jest.fn()}
      />
    );

    expect(container.firstChild).toBe(null);
  });

  it("shows an error state when no basemap is active", () => {
    render(
      <BasemapToggleComponent
        layers={layers}
        mapSources={{}}
        mapbookReady={true}
        onSetLayerVisibility={jest.fn()}
      />
    );

    const error = document.querySelector(".basemap-toggle.error");
    expect(error).not.toBe(null);
    expect(screen.queryByRole("button", { name: "No background" })).toBe(null);
    expect(
      screen.getByTitle("Invalid basemap toggle state: choose a different base layer")
    ).not.toBe(null);
    expect(error.querySelector(".error-indicator")).not.toBe(null);
  });

  it("toggles the clicked basemap on and the others off", () => {
    const onSetLayerVisibility = jest.fn();

    render(
      <BasemapToggleComponent
        layers={layers}
        mapSources={{
          blank: {
            layers: [{ name: "blank", on: true }],
          },
        }}
        mapbookReady={true}
        onSetLayerVisibility={onSetLayerVisibility}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Aerial" }));

    expect(onSetLayerVisibility).toHaveBeenCalledWith("lmic/mncomp", true);
    expect(onSetLayerVisibility).toHaveBeenCalledWith("blank/blank", false);
    expect(onSetLayerVisibility).toHaveBeenCalledWith("openstreetmap/osm_mapnik", false);
  });

  it("expands on hover", () => {
    const props = {
      layers,
      mapSources: {
        blank: {
          layers: [{ name: "blank", on: true }],
        },
      },
      mapbookReady: true,
      onSetLayerVisibility: jest.fn(),
    };

    render(<BasemapToggleComponent {...props} />);

    fireEvent.mouseEnter(
      screen.getByRole("button", { name: "No background" }).closest(".basemap-toggle")
    );
    expect(screen.getByRole("button", { name: "No background" }).classList.contains("open")).toBe(
      true
    );
  });

  it("expands on focus", () => {
    render(
      <BasemapToggleComponent
        layers={layers}
        mapSources={{
          blank: {
            layers: [{ name: "blank", on: true }],
          },
        }}
        mapbookReady={true}
        onSetLayerVisibility={jest.fn()}
      />
    );

    const chip = screen.getByRole("button", { name: "No background" });
    fireEvent.focus(chip);

    expect(chip.classList.contains("open")).toBe(true);
  });
});
