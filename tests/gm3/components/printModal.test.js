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

/*
 * Tests for the print modal's scale handling.
 *
 * canRenderAtResolution is pure with respect to props, so the tests drive it
 * on a bare prototype instance rather than mounting the component -- mounting
 * would drag in the whole print pipeline (jsPDF, the OpenLayers map) without
 * exercising any more of the logic under test.
 */

// jsPDF ships as untransformed ESM and is only reached through the import
//  chain -- none of the logic under test builds a PDF.
jest.mock("jspdf", () => ({
  __esModule: true,
  default: function jsPDF() {},
}));

import { PrintModal } from "gm3/components/print/printModal";

// EPSG:3857 at the equator: 156543.03392804097 m/px at zoom 0, halving per
//  zoom level. maxZoom 20 therefore floors the resolution near 0.149 m/px.
const RESOLUTION_AT_ZOOM_20 = 156543.03392804097 / Math.pow(2, 20);

/* A PrintModal bound to a view config without running the constructor. */
const modalWith = (viewConfig, state = {}, scaleLine = { enabled: true }) => {
  const modal = Object.create(PrintModal.prototype);
  modal.props = {
    mapView: { center: [0, 0] },
    store: {
      getState: () => ({
        config: {
          map: {
            view: viewConfig,
            scaleLine,
          },
        },
      }),
    },
  };
  modal.state = {
    resolution: "fit",
    layout: 0,
    layouts: [
      {
        label: "letter-portrait",
        units: "in",
        elements: [{ type: "map", x: 0.5, y: 0.5, width: 7.5, height: 9 }],
      },
    ],
    ...state,
  };
  return modal;
};

describe("canRenderAtResolution", () => {
  test("a null resolution -- a 'fit' scale -- is always renderable", () => {
    expect(modalWith({ maxZoom: 20 }).canRenderAtResolution(null)).toBe(true);
    expect(modalWith({ maxZoom: 20 }).canRenderAtResolution(undefined)).toBe(true);
  });

  test("an unconfigured view constrains nothing", () => {
    expect(modalWith(undefined).canRenderAtResolution(0.0001)).toBe(true);
  });

  test("a resolution within the zoom limits is renderable", () => {
    // well coarser than the zoom-20 floor.
    expect(modalWith({ maxZoom: 20 }).canRenderAtResolution(1.5)).toBe(true);
  });

  test("a resolution finer than maxZoom allows is not renderable", () => {
    // this is the case chughes-lincoln reported on #999: maxZoom 20 with a
    //  10 ft/in scale on offer.
    const modal = modalWith({ maxZoom: 20 });
    expect(modal.canRenderAtResolution(RESOLUTION_AT_ZOOM_20 / 4)).toBe(false);
  });

  test("the resolution exactly at the limit is renderable", () => {
    const modal = modalWith({ maxZoom: 20 });
    expect(modal.canRenderAtResolution(RESOLUTION_AT_ZOOM_20)).toBe(true);
  });

  test("a resolution coarser than minZoom allows is not renderable", () => {
    const modal = modalWith({ minZoom: 10 });
    const resolutionAtZoom10 = 156543.03392804097 / Math.pow(2, 10);
    expect(modal.canRenderAtResolution(resolutionAtZoom10 * 4)).toBe(false);
  });

  test("raising maxZoom makes a previously unreachable scale reachable", () => {
    const target = RESOLUTION_AT_ZOOM_20 / 4;
    expect(modalWith({ maxZoom: 20 }).canRenderAtResolution(target)).toBe(false);
    expect(modalWith({ maxZoom: 24 }).canRenderAtResolution(target)).toBe(true);
  });
});

describe("canShowFixedScale", () => {
  test("a 'fit' preset names no scale to caption", () => {
    expect(modalWith({}, { resolution: "fit" }).canShowFixedScale()).toBe(false);
    expect(modalWith({}, { resolution: "fit-highest" }).canShowFixedScale()).toBe(false);
  });

  test("a fixed scale the map can reach can be captioned", () => {
    expect(modalWith({}, { resolution: "100ft" }).canShowFixedScale()).toBe(true);
  });

  test("a fixed scale beyond the zoom limits cannot", () => {
    // chughes-lincoln's case on #999: maxZoom 20 with 10 ft/in on offer.
    expect(modalWith({ maxZoom: 20 }, { resolution: "10ft" }).canShowFixedScale()).toBe(false);
    // a coarser scale on the same map is still fine.
    expect(modalWith({ maxZoom: 20 }, { resolution: "2000ft" }).canShowFixedScale()).toBe(true);
  });

  test("an unknown scale value cannot be captioned", () => {
    expect(modalWith({}, { resolution: "nonsense" }).canShowFixedScale()).toBe(false);
  });
});

describe("getScaleLineMode", () => {
  const withMode = (mode, viewConfig, resolution) =>
    modalWith(viewConfig, { scaleLineMode: mode, resolution });

  test("passes through a mode that does not need a scale", () => {
    expect(withMode("none", {}, "fit").getScaleLineMode()).toBe("none");
    expect(withMode("line-distance", {}, "fit").getScaleLineMode()).toBe("line-distance");
  });

  test("keeps the scale caption when the scale is reachable", () => {
    expect(withMode("line-distance-scale", {}, "100ft").getScaleLineMode()).toBe(
      "line-distance-scale"
    );
  });

  test("drops to the bar alone when the scale cannot be honored", () => {
    expect(withMode("line-distance-scale", { maxZoom: 20 }, "10ft").getScaleLineMode()).toBe(
      "line-distance"
    );
  });

  test("drops to the bar alone for a 'fit' preset", () => {
    expect(withMode("line-distance-scale", {}, "fit").getScaleLineMode()).toBe("line-distance");
  });
});

describe("componentDidUpdate holds the scale-line picker", () => {
  // the control must never move on its own: whatever it shows is what
  //  prints, until the user changes it themselves.
  const mounted = (mode, resolution) => {
    const modal = modalWith({}, { scaleLineMode: mode, resolution });
    modal.setState = (patch) => Object.assign(modal.state, patch);
    return modal;
  };

  test("commits the fallback when the caption becomes unavailable", () => {
    const modal = mounted("line-distance-scale", "fit");
    modal.componentDidUpdate({}, {});
    expect(modal.state.scaleLineMode).toBe("line-distance");
  });

  test("a committed choice is not undone by picking a captionable scale", () => {
    // the regression: the user saw "Line and Distance", left it alone,
    //  chose a fixed scale, and used to get the caption anyway.
    const modal = mounted("line-distance-scale", "fit");
    modal.componentDidUpdate({}, {});
    expect(modal.state.scaleLineMode).toBe("line-distance");

    modal.state.resolution = "100ft";
    modal.componentDidUpdate({}, {});
    expect(modal.state.scaleLineMode).toBe("line-distance");
    expect(modal.getScaleLineMode()).toBe("line-distance");
  });

  test("leaves an available choice alone", () => {
    const modal = mounted("line-distance-scale", "100ft");
    modal.componentDidUpdate({}, {});
    expect(modal.state.scaleLineMode).toBe("line-distance-scale");
  });

  test("never overrides an explicit selection that is still valid", () => {
    const modal = mounted("none", "100ft");
    modal.componentDidUpdate({}, {});
    expect(modal.state.scaleLineMode).toBe("none");
  });

  test("settles, rather than looping, once committed", () => {
    const modal = mounted("line-distance-scale", "fit");
    modal.componentDidUpdate({}, {});
    const settled = modal.state.scaleLineMode;
    let writes = 0;
    modal.setState = (patch) => {
      writes += 1;
      Object.assign(modal.state, patch);
    };
    modal.componentDidUpdate({}, {});
    expect(writes).toBe(0);
    expect(modal.state.scaleLineMode).toBe(settled);
  });
});

describe("getScales", () => {
  const labels = (modal) => modal.getScales().map((s) => s.label);

  test("offers every scale when the view is unconstrained", () => {
    const modal = modalWith({});
    expect(modal.getScales().length).toBe(modal.getAllScales().length);
    expect(labels(modal)).toContain("10 ft / in");
  });

  test("drops scales the zoom limits cannot reach", () => {
    const modal = modalWith({ maxZoom: 20 });
    const offered = labels(modal);
    // chughes-lincoln's case: 10 ft/in is unreachable under maxZoom 20.
    expect(offered).not.toContain("10 ft / in");
    // the coarser engineering scales survive.
    expect(offered).toContain("2000 ft / in");
    expect(offered.length).toBeLessThan(modal.getAllScales().length);
  });

  test("always keeps the 'fit' presets", () => {
    const offered = labels(modalWith({ maxZoom: 1 }));
    expect(offered).toContain("Scale to fit");
    expect(offered).toContain("Scale to fit (higher resolution)");
    expect(offered).toContain("Scale to fit (highest resolution)");
  });

  test("names the dropped scales for the dialog to show", () => {
    const modal = modalWith({ maxZoom: 20 });
    expect(modal.getUnavailableScales()).toContain("10 ft / in");
    expect(modal.getUnavailableScales()).not.toContain("2000 ft / in");
  });

  test("offered and unavailable scales partition the configured list", () => {
    const modal = modalWith({ maxZoom: 20 });
    expect(modal.getScales().length + modal.getUnavailableScales().length).toBe(
      modal.getAllScales().length
    );
  });

  test("nothing is unavailable on an unconstrained view", () => {
    expect(modalWith({}).getUnavailableScales()).toEqual([]);
  });

  test("tracks the view configuration rather than caching it", () => {
    const modal = modalWith({ maxZoom: 20 });
    expect(labels(modal)).not.toContain("10 ft / in");

    modal.props.store.getState = () => ({
      config: { map: { view: { maxZoom: 24 }, scaleLine: { enabled: true } } },
    });
    expect(labels(modal)).toContain("10 ft / in");
  });
});

describe("extent-constrained views", () => {
  // OpenLayers caps resolution at the configured extent spread across the
  //  viewport, so the reachability check has to use the size the print map
  //  really mounts at. Checked against a 100x100 viewport it reads far too
  //  permissive and lets through scales the print will silently clamp.
  //  Regression for the review finding on #1021.

  // roughly 3km across, a city-sized restriction
  const cityExtent = [-10380000, 5615000, -10377000, 5618000];

  test("a scale coarser than the extent allows is not offered", () => {
    const modal = modalWith({ extent: cityExtent });
    const offered = modal.getScales().map((s) => s.label);
    // 2000 ft/in needs ~4.2 m/px; the extent across the print map's
    //  viewport only permits ~2.3 m/px.
    expect(offered).not.toContain("2000 ft / in");
    // the finer engineering scales are unaffected.
    expect(offered).toContain("10 ft / in");
    expect(offered).toContain("100 ft / in");
  });

  test("the same scale is fine without the extent restriction", () => {
    expect(
      modalWith({})
        .getScales()
        .map((s) => s.label)
    ).toContain("2000 ft / in");
  });

  test("a larger map element admits a coarser scale", () => {
    // the constraint is extent/viewport, so a bigger map on the page
    //  reaches further out.
    const small = modalWith({ extent: cityExtent });
    const large = modalWith(
      { extent: cityExtent },
      {
        layouts: [
          {
            label: "wall-map",
            units: "in",
            elements: [{ type: "map", x: 0, y: 0, width: 30, height: 30 }],
          },
        ],
      }
    );
    const labels = (m) => m.getScales().map((s) => s.label);
    expect(labels(small)).not.toContain("2000 ft / in");
    expect(labels(large)).not.toEqual(labels(small));
  });
});

describe("getScaleDef", () => {
  test("resolves the selected scale", () => {
    expect(modalWith({}, { resolution: "100ft" }).getScaleDef().value).toBe("100ft");
  });

  test("falls back to 'fit' when the selection is no longer offered", () => {
    // changing layouts or panning can drop a scale out from under the
    //  user; the picker must not keep showing a value it no longer lists.
    const modal = modalWith({ maxZoom: 20 }, { resolution: "10ft" });
    expect(modal.getScales().map((s) => s.value)).not.toContain("10ft");
    expect(modal.getScaleDef().value).toBe("fit");
    expect(modal.canShowFixedScale()).toBe(false);
  });
});
