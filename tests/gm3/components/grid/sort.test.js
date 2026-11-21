import { nextSortState, sortFeatures } from "gm3/components/grid/sort";

const features = [
  { properties: { OWNER_NAME: "beta", EMV_TOTAL: "600000" } },
  { properties: { OWNER_NAME: "Alpha", EMV_TOTAL: "90000" } },
  { properties: { OWNER_NAME: "gamma", EMV_TOTAL: "250000" } },
];

const values = (sorted, property) => sorted.map((feature) => feature.properties[property]);

describe("nextSortState", () => {
  const column = { property: "EMV_TOTAL", sortAs: "number" };

  test("cycles ascending, descending, then back to results-order", () => {
    let state = { sortBy: null, sortAs: "string", sortAsc: true };
    state = { ...state, ...nextSortState(state, column) };
    expect(state).toEqual({ sortBy: "EMV_TOTAL", sortAs: "number", sortAsc: true });
    state = { ...state, ...nextSortState(state, column) };
    expect(state.sortAsc).toBe(false);
    state = { ...state, ...nextSortState(state, column) };
    expect(state.sortBy).toBeNull();
  });

  test("a different column starts over ascending", () => {
    const state = { sortBy: "EMV_TOTAL", sortAs: "number", sortAsc: false };
    expect(nextSortState(state, { property: "OWNER_NAME" })).toEqual({
      sortBy: "OWNER_NAME",
      sortAs: "string",
      sortAsc: true,
    });
  });
});

describe("sortFeatures", () => {
  test("strings sort by locale, ignoring case", () => {
    const state = { sortBy: "OWNER_NAME", sortAs: "string" };
    expect(values(sortFeatures(features, { ...state, sortAsc: true }), "OWNER_NAME")).toEqual([
      "Alpha",
      "beta",
      "gamma",
    ]);
    expect(values(sortFeatures(features, { ...state, sortAsc: false }), "OWNER_NAME")).toEqual([
      "gamma",
      "beta",
      "Alpha",
    ]);
  });

  test("numbers sort by value, not by text", () => {
    const state = { sortBy: "EMV_TOTAL", sortAs: "number" };
    expect(values(sortFeatures(features, { ...state, sortAsc: true }), "EMV_TOTAL")).toEqual([
      "90000",
      "250000",
      "600000",
    ]);
    expect(values(sortFeatures(features, { ...state, sortAsc: false }), "EMV_TOTAL")).toEqual([
      "600000",
      "250000",
      "90000",
    ]);
  });

  test("does not reorder the original results", () => {
    sortFeatures(features, { sortBy: "EMV_TOTAL", sortAs: "number", sortAsc: true });
    expect(values(features, "OWNER_NAME")).toEqual(["beta", "Alpha", "gamma"]);
  });
});
