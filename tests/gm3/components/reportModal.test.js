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
 * Tests for the report-specific behavior layered on top of PrintModal:
 * layout selection, column resolution, and binding a "table" element to the
 * subject feature or the results set.
 *
 * These methods are pure with respect to props/state, so the tests drive them
 * on a bare prototype instance rather than mounting the component -- mounting
 * would drag in the whole print pipeline (jsPDF, the OpenLayers map) without
 * exercising any more of the logic under test.
 */

// jsPDF ships as untransformed ESM and is only reached through PrintModal's
//  import chain -- none of the logic under test builds a PDF.
jest.mock("jspdf", () => ({
  __esModule: true,
  default: function jsPDF() {},
}));

import { ReportModal } from "gm3/components/report/reportModal";

/* A ReportModal bound to props/state without running the PrintModal
 * constructor.
 */
const modalWith = (props, state = {}) => {
  const modal = Object.create(ReportModal.prototype);
  modal.props = props;
  modal.state = { layout: 0, layouts: [], ...state };
  return modal;
};

const featureOf = (properties, geometry) => ({
  type: "Feature",
  properties,
  geometry: geometry || { type: "Point", coordinates: [0, 0] },
});

const parcel = featureOf({
  PIN: "12345",
  OWNER: "Smith, John",
  ACRES: 4.5,
  boundedBy: [0, 0, 1, 1],
  _uuid: "abc-123",
});

describe("pickLayoutForMode", () => {
  const featureLayout = {
    label: "single",
    elements: [{ type: "table", data: "feature" }],
  };
  const resultsLayout = {
    label: "all",
    elements: [{ type: "table", data: "results" }],
  };

  test("picks the results-bound layout for a results report", () => {
    const modal = modalWith({});
    expect(modal.pickLayoutForMode([featureLayout, resultsLayout], "results")).toBe(1);
  });

  test("picks the feature-bound layout for a single-feature report", () => {
    const modal = modalWith({});
    expect(modal.pickLayoutForMode([resultsLayout, featureLayout], "feature")).toBe(1);
  });

  test("falls back to the first layout when nothing matches", () => {
    const modal = modalWith({});
    expect(modal.pickLayoutForMode([{ label: "map only", elements: [] }], "results")).toBe(0);
    expect(modal.pickLayoutForMode(undefined, "feature")).toBe(0);
  });
});

describe("getColumnDefs", () => {
  test("uses an inline column array, dropping columns with no property", () => {
    const modal = modalWith({});
    const cols = modal.getColumnDefs(
      {
        columns: [{ property: "PIN", title: "Parcel" }, { title: "Actions" }],
      },
      parcel
    );
    expect(cols).toEqual([{ property: "PIN", title: "Parcel" }]);
  });

  test("resolves a named layer template", () => {
    const modal = modalWith({
      layer: {
        templates: {
          "select-grid-columns": {
            contents: JSON.stringify([{ property: "OWNER", title: "Owner" }]),
          },
        },
      },
    });
    expect(modal.getColumnDefs({ columns: "select-grid-columns" }, parcel)).toEqual([
      { property: "OWNER", title: "Owner" },
    ]);
  });

  test("returns nothing for a named template that is missing or unparsable", () => {
    const missing = modalWith({ layer: { templates: {} } });
    expect(missing.getColumnDefs({ columns: "nope" }, parcel)).toEqual([]);

    const broken = modalWith({
      layer: { templates: { report: { contents: "{ not json" } } },
    });
    expect(broken.getColumnDefs({ columns: "report" }, parcel)).toEqual([]);
  });

  test("with no column spec, lists the feature's attributes minus internals", () => {
    const modal = modalWith({});
    const properties = modal.getColumnDefs({}, parcel).map((col) => col.property);
    expect(properties).toEqual(["PIN", "OWNER", "ACRES"]);
    expect(properties).not.toContain("boundedBy");
    expect(properties).not.toContain("_uuid");
  });

  test("with no column spec and no feature, returns nothing", () => {
    const modal = modalWith({});
    expect(modal.getColumnDefs({}, undefined)).toEqual([]);
  });
});

describe("resolveTableData", () => {
  const reportProps = (report, layer) => ({ report, layer });

  test("transpose emits one label/value row per field", () => {
    const modal = modalWith(reportProps({ feature: parcel, results: [parcel], mode: "feature" }));
    const table = modal.resolveTableData({
      type: "table",
      transpose: true,
      columns: [
        { property: "PIN", title: "Parcel ID" },
        { property: "OWNER", title: "Owner" },
      ],
      labelTitle: "Field",
      valueTitle: "Value",
    });

    expect(table.columns.map((col) => col.title)).toEqual(["Field", "Value"]);
    expect(table.rows).toEqual([
      ["Parcel ID", "12345"],
      ["Owner", "Smith, John"],
    ]);
  });

  test("a single-feature table emits exactly one row", () => {
    const modal = modalWith(reportProps({ feature: parcel, results: [parcel], mode: "feature" }));
    const table = modal.resolveTableData({
      type: "table",
      columns: [{ property: "PIN", title: "Parcel ID" }],
    });

    expect(table.rows).toEqual([["12345"]]);
  });

  test("a results table emits one row per feature", () => {
    const other = featureOf({ PIN: "67890", OWNER: "Doe, Jane", ACRES: 1 });
    const modal = modalWith(
      reportProps({ feature: parcel, results: [parcel, other], mode: "results" })
    );
    const table = modal.resolveTableData({
      type: "table",
      columns: [
        { property: "PIN", title: "Parcel ID" },
        { property: "OWNER", title: "Owner" },
      ],
    });

    expect(table.rows).toEqual([
      ["12345", "Smith, John"],
      ["67890", "Doe, Jane"],
    ]);
  });

  test("an element's own data binding overrides the report mode", () => {
    const other = featureOf({ PIN: "67890" });
    const modal = modalWith(
      reportProps({ feature: parcel, results: [parcel, other], mode: "feature" })
    );
    const table = modal.resolveTableData({
      type: "table",
      data: "results",
      columns: [{ property: "PIN", title: "Parcel ID" }],
    });

    expect(table.rows).toHaveLength(2);
  });

  test("a column format string is applied to the cell", () => {
    const modal = modalWith(reportProps({ feature: parcel, results: [parcel], mode: "feature" }));
    const table = modal.resolveTableData({
      type: "table",
      columns: [{ property: "ACRES", title: "Area", format: "{{ properties.ACRES }} ac" }],
    });

    expect(table.rows).toEqual([["4.5 ac"]]);
  });

  test("returns null when there is no report or no subject feature", () => {
    expect(modalWith({ report: null }).resolveTableData({ type: "table" })).toBe(null);

    const noFeature = modalWith(reportProps({ feature: undefined, results: [], mode: "feature" }));
    expect(noFeature.resolveTableData({ type: "table", transpose: true })).toBe(null);
    expect(noFeature.resolveTableData({ type: "table" })).toBe(null);
  });
});

describe("getSubstDict", () => {
  // the report extends the print dictionary; stub the parent's contribution.
  const withBase = (base, report) => {
    const modal = modalWith({ report });
    modal.constructor = ReportModal;
    jest.spyOn(Object.getPrototypeOf(ReportModal.prototype), "getSubstDict").mockReturnValue(base);
    return modal;
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("exposes feature attributes alongside the print tokens", () => {
    const modal = withBase({ title: "Feature Report" }, { feature: parcel });
    const dict = modal.getSubstDict();
    expect(dict.PIN).toBe("12345");
    expect(dict.properties.OWNER).toBe("Smith, John");
    expect(dict.title).toBe("Feature Report");
  });

  test("reserved print tokens win over same-named attributes", () => {
    const clashing = featureOf({ title: "Parcel 12345" });
    const modal = withBase({ title: "Feature Report" }, { feature: clashing });
    expect(modal.getSubstDict().title).toBe("Feature Report");
  });

  test("passes the print dictionary through untouched with no feature", () => {
    const base = { title: "Feature Report" };
    expect(withBase(base, null).getSubstDict()).toEqual(base);
  });
});

describe("getMeasureFeatures", () => {
  const polygon = featureOf(
    { PIN: "12345" },
    {
      type: "Polygon",
      coordinates: [
        [
          [0, 0],
          [0, 1],
          [1, 1],
          [1, 0],
          [0, 0],
        ],
      ],
    }
  );

  test("returns nothing unless the layout opts in via showMeasurements", () => {
    const modal = modalWith({ report: { feature: polygon } }, { layouts: [{}], layout: 0 });
    expect(modal.getMeasureFeatures()).toBe(null);
  });

  test("colorizes the subject feature when the layout opts in", () => {
    const modal = modalWith(
      { report: { feature: polygon } },
      { layouts: [{ showMeasurements: true }], layout: 0 }
    );
    const features = modal.getMeasureFeatures();
    expect(features).toHaveLength(1);
    expect(features[0].geometry).toEqual(polygon.geometry);
    // the measure styling is carried on the feature's properties.
    expect(Object.keys(features[0].properties).length).toBeGreaterThan(1);
  });

  test("hands back a stable reference so the print map does not thrash", () => {
    const modal = modalWith(
      { report: { feature: polygon } },
      { layouts: [{ showMeasurements: true }], layout: 0 }
    );
    expect(modal.getMeasureFeatures()).toBe(modal.getMeasureFeatures());
  });

  test("returns nothing for a feature with no geometry", () => {
    const modal = modalWith(
      { report: { feature: { type: "Feature", properties: { PIN: "12345" } } } },
      { layouts: [{ showMeasurements: true }], layout: 0 }
    );
    expect(modal.getMeasureFeatures()).toBe(null);
  });
});

describe("getMeasureUnits", () => {
  test("defaults to feet", () => {
    const modal = modalWith({}, { layouts: [{}], layout: 0 });
    expect(modal.getMeasureUnits()).toEqual({ lengthUnits: "ft", areaUnits: "ft" });
  });

  test("honors the layout's units and memoizes the result", () => {
    const modal = modalWith({}, { layouts: [{ lengthUnits: "m", areaUnits: "a" }], layout: 0 });
    expect(modal.getMeasureUnits()).toEqual({ lengthUnits: "m", areaUnits: "a" });
    expect(modal.getMeasureUnits()).toBe(modal.getMeasureUnits());
  });
});
