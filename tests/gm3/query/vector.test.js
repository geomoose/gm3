/*
 * Test the vector query filters.
 */

import GeoJSONFormat from "ol/format/GeoJSON";
import VectorSource from "ol/source/Vector";

import { buildFilterFunction, FILTER_FUNCTIONS, vectorFeatureQuery } from "gm3/query/vector";
import { registerSource, unregisterSource } from "gm3/featureStore";

const feature = (properties) => ({ properties });

/* Build a filter from a single field definition and run it against
 *  a feature carrying just the one property.
 */
const check = (comparitor, value, propertyValue, name = "NAME") =>
  buildFilterFunction({ comparitor, name, value })(feature({ [name]: propertyValue }));

describe("likeSQLtoRegExp", () => {
  const like = (value, pattern) => check("like", pattern, value);
  const ilike = (value, pattern) => check("ilike", pattern, value);

  test("matches the whole value, the same as PropertyIsLike", () => {
    expect(like("Smith", "Smith")).toBe(true);
    // a bare pattern is an exact match, not a "contains"
    expect(like("Smithson", "Smith")).toBe(false);
    expect(like("John Smith", "Smith")).toBe(false);
    expect(like("John Smithson", "Smith")).toBe(false);
  });

  test("anchors prefix wildcards", () => {
    expect(like("Smithson", "Smith%")).toBe(true);
    expect(like("Smith", "Smith%")).toBe(true);
    expect(like("John Smith", "Smith%")).toBe(false);
  });

  test("anchors suffix wildcards", () => {
    expect(like("John Smith", "%Smith")).toBe(true);
    expect(like("Smith", "%Smith")).toBe(true);
    expect(like("Smithson", "%Smith")).toBe(false);
  });

  test("surrounding wildcards are a contains match", () => {
    expect(like("John Smithson", "%Smith%")).toBe(true);
    expect(like("Baker", "%Smith%")).toBe(false);
  });

  test("a lone wildcard matches anything, including the empty string", () => {
    expect(like("anything at all", "%")).toBe(true);
    expect(like("", "%")).toBe(true);
  });

  test("an empty pattern matches only the empty string", () => {
    expect(like("", "")).toBe(true);
    expect(like("x", "")).toBe(false);
  });

  test("translates the single character wildcard", () => {
    expect(like("cat", "c_t")).toBe(true);
    expect(like("cut", "c_t")).toBe(true);
    expect(like("coat", "c_t")).toBe(false);
    expect(like("ct", "c_t")).toBe(false);
  });

  test("handles wildcards interleaved with literals", () => {
    expect(like("A1-100-B", "A_-%-B")).toBe(true);
    expect(like("A1-100-C", "A_-%-B")).toBe(false);
  });

  test("escapes regexp metacharacters in literals", () => {
    expect(like("a.c", "a.c")).toBe(true);
    expect(like("abc", "a.c")).toBe(false);

    expect(like("(x)", "(x)")).toBe(true);
    expect(like("x", "(x)")).toBe(false);

    // a value that would be a regexp quantifier if it leaked through
    expect(like("a+", "a+")).toBe(true);
    expect(like("aaa", "a+")).toBe(false);
  });

  test("honors backslash escapes for SQL wildcards", () => {
    expect(like("100%", "100\\%")).toBe(true);
    expect(like("1000", "100\\%")).toBe(false);

    expect(like("a_b", "a\\_b")).toBe(true);
    expect(like("axb", "a\\_b")).toBe(false);
  });

  test("a trailing backslash does not run off the end of the pattern", () => {
    // substring() is rollover safe, so this degrades to an empty escape
    expect(() => like("abc", "abc\\")).not.toThrow();
  });

  test("ilike ignores case, like does not", () => {
    expect(ilike("SMITH", "smith")).toBe(true);
    expect(ilike("smith", "SMITH")).toBe(true);
    expect(ilike("John SMITHSON", "%smith%")).toBe(true);
    expect(like("SMITH", "smith")).toBe(false);
  });

  test("null and undefined never match, even against a lone wildcard", () => {
    expect(like(null, "%")).toBe(false);
    expect(like(undefined, "%")).toBe(false);
    expect(ilike(null, "%")).toBe(false);
  });

  test("coerces non-string values rather than throwing", () => {
    expect(like(1234, "12%")).toBe(true);
    expect(like(1234, "99%")).toBe(false);
    expect(like(true, "true")).toBe(true);
    expect(like(0, "0")).toBe(true);
  });
});

describe("FILTER_FUNCTIONS", () => {
  test("exposes the same comparitors as the WFS filter mapping", () => {
    expect(Object.keys(FILTER_FUNCTIONS).sort()).toEqual([
      "eq",
      "ge",
      "gt",
      "ilike",
      "le",
      "like",
      "lt",
    ]);
  });

  describe("eq", () => {
    test("matches on value", () => {
      expect(check("eq", "Smith", "Smith")).toBe(true);
      expect(check("eq", "Smith", "Jones")).toBe(false);
    });

    test("is intentionally not type checked", () => {
      // mapbook values arrive as strings, feature properties may be numbers
      expect(check("eq", "5", 5)).toBe(true);
      expect(check("eq", 5, "5")).toBe(true);
    });

    test("does not match a missing property", () => {
      expect(check("eq", "Smith", undefined)).toBe(false);
    });
  });

  describe("numeric comparitors", () => {
    test("gt and ge", () => {
      expect(check("gt", 5, 10)).toBe(true);
      expect(check("gt", 5, 5)).toBe(false);
      expect(check("gt", 5, 1)).toBe(false);

      expect(check("ge", 5, 10)).toBe(true);
      expect(check("ge", 5, 5)).toBe(true);
      expect(check("ge", 5, 1)).toBe(false);
    });

    test("lt and le", () => {
      expect(check("lt", 5, 1)).toBe(true);
      expect(check("lt", 5, 5)).toBe(false);
      expect(check("lt", 5, 10)).toBe(false);

      expect(check("le", 5, 1)).toBe(true);
      expect(check("le", 5, 5)).toBe(true);
      expect(check("le", 5, 10)).toBe(false);
    });

    test("coerces numeric strings", () => {
      expect(check("gt", "5", 10)).toBe(true);
      expect(check("lt", 5, "1")).toBe(true);
    });

    test("compares strings lexically when neither side is numeric", () => {
      expect(check("gt", "abc", "abd")).toBe(true);
      expect(check("lt", "abc", "abb")).toBe(true);
    });

    test("an absent property never matches", () => {
      expect(check("gt", 5, undefined)).toBe(false);
      expect(check("ge", 5, undefined)).toBe(false);
      expect(check("lt", 5, undefined)).toBe(false);
      expect(check("le", 5, undefined)).toBe(false);
    });

    // NOTE: null coerces to 0 in a JS relational compare, so a null
    //  property matches `ge 0` / `le 0`. A WFS backend would not match
    //  a null value here. See the review notes on aligning null handling.
    test("null coerces to zero (documents current behavior)", () => {
      expect(check("ge", 0, null)).toBe(true);
      expect(check("le", 0, null)).toBe(true);
      expect(check("gt", -1, null)).toBe(true);
    });
  });
});

describe("buildFilterFunction", () => {
  test("and requires every sub-filter", () => {
    const fn = buildFilterFunction([
      "and",
      { comparitor: "ilike", name: "NAME", value: "%smith%" },
      { comparitor: "gt", name: "ACRES", value: 5 },
    ]);
    expect(fn(feature({ NAME: "John Smith", ACRES: 10 }))).toBe(true);
    expect(fn(feature({ NAME: "John Smith", ACRES: 1 }))).toBe(false);
    expect(fn(feature({ NAME: "Baker", ACRES: 10 }))).toBe(false);
  });

  test("or requires any sub-filter", () => {
    const fn = buildFilterFunction([
      "or",
      { comparitor: "eq", name: "NAME", value: "Smith" },
      { comparitor: "eq", name: "NAME", value: "Jones" },
    ]);
    expect(fn(feature({ NAME: "Smith" }))).toBe(true);
    expect(fn(feature({ NAME: "Jones" }))).toBe(true);
    expect(fn(feature({ NAME: "Baker" }))).toBe(false);
  });

  test("nests operators to arbitrary depth", () => {
    // the shape SearchService.prepareFields produces: an or of ands
    const fn = buildFilterFunction([
      "or",
      [
        "and",
        { comparitor: "ilike", name: "OWNER_NAME", value: "%john%" },
        { comparitor: "ilike", name: "OWNER_NAME", value: "%smith%" },
      ],
      [
        "and",
        { comparitor: "ilike", name: "OWN_ADD_L1", value: "%john%" },
        { comparitor: "ilike", name: "OWN_ADD_L1", value: "%smith%" },
      ],
    ]);

    expect(fn(feature({ OWNER_NAME: "John Smith", OWN_ADD_L1: "" }))).toBe(true);
    expect(fn(feature({ OWNER_NAME: "", OWN_ADD_L1: "123 John Smith Ave" }))).toBe(true);
    // both terms must land in the *same* field
    expect(fn(feature({ OWNER_NAME: "John Baker", OWN_ADD_L1: "123 Smith Ave" }))).toBe(false);
  });

  test("handles a deeply nested mix of operators", () => {
    const fn = buildFilterFunction([
      "and",
      { comparitor: "eq", name: "STATE", value: "MN" },
      [
        "or",
        { comparitor: "gt", name: "ACRES", value: 100 },
        ["and", { comparitor: "eq", name: "CITY", value: "Farmington" }],
      ],
    ]);

    expect(fn(feature({ STATE: "MN", ACRES: 200, CITY: "Anywhere" }))).toBe(true);
    expect(fn(feature({ STATE: "MN", ACRES: 1, CITY: "Farmington" }))).toBe(true);
    expect(fn(feature({ STATE: "MN", ACRES: 1, CITY: "Anywhere" }))).toBe(false);
    expect(fn(feature({ STATE: "WI", ACRES: 200, CITY: "Farmington" }))).toBe(false);
  });

  test("throws instead of dropping an unsupported comparitor", () => {
    // dropping it would leave an empty "and", which matches everything
    expect(() =>
      buildFilterFunction(["and", { comparitor: "bogus", name: "NAME", value: "x" }])
    ).toThrow(/Unsupported filter comparitor: bogus/);
  });

  test("throws on an unsupported comparitor at the top level", () => {
    expect(() => buildFilterFunction({ comparitor: "between", name: "A", value: 1 })).toThrow(
      /Unsupported filter comparitor: between/
    );
  });

  test("throws on an unsupported operator", () => {
    expect(() => buildFilterFunction(["nand", { comparitor: "eq", name: "A", value: 1 }])).toThrow(
      /Unsupported filter operator: nand/
    );
  });

  test("throws when an unsupported comparitor is buried in a nested branch", () => {
    expect(() =>
      buildFilterFunction([
        "or",
        ["and", { comparitor: "eq", name: "A", value: 1 }],
        ["and", { comparitor: "regex", name: "B", value: "x" }],
      ])
    ).toThrow(/Unsupported filter comparitor: regex/);
  });

  // vacuous truth: these are the empty-operator cases the throwing
  //  behavior above is designed to keep unreachable from a bad comparitor
  test("an empty and matches everything, an empty or matches nothing", () => {
    expect(buildFilterFunction(["and"])(feature({ NAME: "anything" }))).toBe(true);
    expect(buildFilterFunction(["or"])(feature({ NAME: "anything" }))).toBe(false);
  });
});

describe("vectorFeatureQuery", () => {
  const LAYER = "parcels/default";

  // a triangle covering the lower-left half of [0,0,10,10]
  const TRIANGLE = {
    type: "Polygon",
    coordinates: [
      [
        [0, 0],
        [10, 0],
        [0, 10],
        [0, 0],
      ],
    ],
  };

  const box = (minx, miny, maxx, maxy) => ({
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [minx, miny],
          [maxx, miny],
          [maxx, maxy],
          [minx, maxy],
          [minx, miny],
        ],
      ],
    },
  });

  describe("features held in the redux store", () => {
    const mapSource = {
      name: "store-parcels",
      features: [
        {
          type: "Feature",
          properties: { NAME: "Smith", ACRES: 10 },
          geometry: box(0, 0, 1, 1).geometry,
        },
        {
          type: "Feature",
          properties: { NAME: "Smithson", ACRES: 1 },
          geometry: box(20, 20, 21, 21).geometry,
        },
      ],
    };

    test("filters with an anchored like", async () => {
      const results = await vectorFeatureQuery(LAYER, {}, mapSource, {
        fields: [{ comparitor: "like", name: "NAME", value: "Smith" }],
      });
      expect(results.features.map((f) => f.properties.NAME)).toEqual(["Smith"]);
    });

    test("applies every top level field as an implicit and", async () => {
      const results = await vectorFeatureQuery(LAYER, {}, mapSource, {
        fields: [
          { comparitor: "like", name: "NAME", value: "Smith%" },
          { comparitor: "gt", name: "ACRES", value: 5 },
        ],
      });
      expect(results.features.map((f) => f.properties.NAME)).toEqual(["Smith"]);
    });

    test("filters on the selection geometry", async () => {
      const results = await vectorFeatureQuery(LAYER, {}, mapSource, {
        selection: [box(0, 0, 5, 5)],
      });
      expect(results.features.map((f) => f.properties.NAME)).toEqual(["Smith"]);
    });

    test("combines the selection and the attribute filters", async () => {
      const results = await vectorFeatureQuery(LAYER, {}, mapSource, {
        selection: [box(0, 0, 5, 5)],
        fields: [{ comparitor: "eq", name: "NAME", value: "Smithson" }],
      });
      // Smithson is outside the selection
      expect(results.features).toEqual([]);
    });

    test("returns the layer name with the results", async () => {
      const results = await vectorFeatureQuery(LAYER, {}, mapSource, {
        fields: [{ comparitor: "like", name: "NAME", value: "%" }],
      });
      expect(results.layer).toBe(LAYER);
    });

    test("a null geometry never matches a selection, and does not throw", async () => {
      // turf throws a TypeError when handed a null geometry, and unlike
      //  the feature store path there is no spatial index to filter
      //  these out first
      const withNullGeom = {
        name: "store-nulls",
        features: [
          { type: "Feature", properties: { NAME: "NoGeom" }, geometry: null },
          {
            type: "Feature",
            properties: { NAME: "Real" },
            geometry: box(0, 0, 1, 1).geometry,
          },
        ],
      };

      const results = await vectorFeatureQuery(LAYER, {}, withNullGeom, {
        selection: [box(0, 0, 5, 5)],
      });
      expect(results.features.map((f) => f.properties.NAME)).toEqual(["Real"]);
    });

    test("uses boundedBy as a free extent gate when present", async () => {
      const withBounds = {
        name: "store-bounds",
        features: [
          {
            type: "Feature",
            properties: { NAME: "Far", boundedBy: [500, 500, 501, 501] },
            geometry: box(500, 500, 501, 501).geometry,
          },
          {
            type: "Feature",
            properties: { NAME: "Near", boundedBy: [0, 0, 1, 1] },
            geometry: box(0, 0, 1, 1).geometry,
          },
        ],
      };

      const results = await vectorFeatureQuery(LAYER, {}, withBounds, {
        selection: [box(0, 0, 5, 5)],
      });
      expect(results.features.map((f) => f.properties.NAME)).toEqual(["Near"]);
    });

    test("tolerates a map-source with no features", async () => {
      const results = await vectorFeatureQuery(
        LAYER,
        {},
        { name: "empty" },
        {
          fields: [{ comparitor: "like", name: "NAME", value: "%" }],
        }
      );
      expect(results.features).toEqual([]);
    });
  });

  describe("features held in the feature store", () => {
    const SRC_NAME = "olsource-parcels";
    const mapSource = { name: SRC_NAME };

    const load = (features) => {
      const source = new VectorSource();
      source.addFeatures(new GeoJSONFormat().readFeatures({ type: "FeatureCollection", features }));
      registerSource(SRC_NAME, source);
      return source;
    };

    afterEach(() => {
      unregisterSource(SRC_NAME);
    });

    test("is preferred over the features on the map-source", async () => {
      load([
        { type: "Feature", properties: { NAME: "FromStore" }, geometry: box(0, 0, 1, 1).geometry },
      ]);

      const results = await vectorFeatureQuery(
        LAYER,
        {},
        {
          name: SRC_NAME,
          features: [{ type: "Feature", properties: { NAME: "FromRedux" }, geometry: null }],
        },
        { fields: [{ comparitor: "like", name: "NAME", value: "%" }] }
      );

      expect(results.features.map((f) => f.properties.NAME)).toEqual(["FromStore"]);
    });

    test("filters on attributes and returns GeoJSON features", async () => {
      load([
        { type: "Feature", properties: { NAME: "Smith" }, geometry: box(0, 0, 1, 1).geometry },
        { type: "Feature", properties: { NAME: "Smithson" }, geometry: box(2, 2, 3, 3).geometry },
      ]);

      const results = await vectorFeatureQuery(LAYER, {}, mapSource, {
        fields: [{ comparitor: "like", name: "NAME", value: "Smith" }],
      });

      expect(results.features).toHaveLength(1);
      expect(results.features[0].type).toBe("Feature");
      expect(results.features[0].properties.NAME).toBe("Smith");
      expect(results.features[0].geometry.type).toBe("Polygon");
    });

    test("uses the spatial index to exclude features outside the selection", async () => {
      load([
        { type: "Feature", properties: { NAME: "Near" }, geometry: box(0, 0, 1, 1).geometry },
        {
          type: "Feature",
          properties: { NAME: "Far" },
          geometry: box(100, 100, 101, 101).geometry,
        },
      ]);

      const results = await vectorFeatureQuery(LAYER, {}, mapSource, {
        selection: [box(0, 0, 5, 5)],
      });

      expect(results.features.map((f) => f.properties.NAME)).toEqual(["Near"]);
    });

    test("rejects a candidate whose extent intersects but whose geometry does not", async () => {
      // the triangle's bounding box is [0,0,10,10] so the spatial index
      //  returns it, but the corner selection misses the geometry itself
      load([{ type: "Feature", properties: { NAME: "Triangle" }, geometry: TRIANGLE }]);

      const inCorner = await vectorFeatureQuery(LAYER, {}, mapSource, {
        selection: [box(8, 8, 9, 9)],
      });
      expect(inCorner.features).toEqual([]);

      const onBody = await vectorFeatureQuery(LAYER, {}, mapSource, {
        selection: [box(0, 0, 1, 1)],
      });
      expect(onBody.features).toHaveLength(1);
    });

    test("combines the selection and the attribute filters", async () => {
      load([
        { type: "Feature", properties: { NAME: "Smith" }, geometry: box(0, 0, 1, 1).geometry },
        { type: "Feature", properties: { NAME: "Jones" }, geometry: box(1, 1, 2, 2).geometry },
      ]);

      const results = await vectorFeatureQuery(LAYER, {}, mapSource, {
        selection: [box(0, 0, 5, 5)],
        fields: [{ comparitor: "eq", name: "NAME", value: "Jones" }],
      });

      expect(results.features.map((f) => f.properties.NAME)).toEqual(["Jones"]);
    });

    test("returns everything matching when there is no selection", async () => {
      load([
        { type: "Feature", properties: { NAME: "A" }, geometry: box(0, 0, 1, 1).geometry },
        { type: "Feature", properties: { NAME: "B" }, geometry: box(100, 100, 101, 101).geometry },
      ]);

      const results = await vectorFeatureQuery(LAYER, {}, mapSource, {
        fields: [{ comparitor: "like", name: "NAME", value: "%" }],
      });

      expect(results.features.map((f) => f.properties.NAME).sort()).toEqual(["A", "B"]);
    });

    test("matches features from every selection, not just the first", async () => {
      // buffer-select produces one selection feature per buffered shape
      load([
        { type: "Feature", properties: { NAME: "InFirst" }, geometry: box(0, 0, 1, 1).geometry },
        {
          type: "Feature",
          properties: { NAME: "InSecond" },
          geometry: box(50, 50, 51, 51).geometry,
        },
        {
          type: "Feature",
          properties: { NAME: "InNeither" },
          geometry: box(25, 25, 26, 26).geometry,
        },
      ]);

      const results = await vectorFeatureQuery(LAYER, {}, mapSource, {
        selection: [box(0, 0, 5, 5), box(48, 48, 55, 55)],
      });

      expect(results.features.map((f) => f.properties.NAME).sort()).toEqual([
        "InFirst",
        "InSecond",
      ]);
    });

    test("excludes a feature inside the combined extent but outside every selection", async () => {
      // the extent gate is a prefilter, not the answer - this feature
      //  sits in the gap between two disjoint selections
      load([
        { type: "Feature", properties: { NAME: "InGap" }, geometry: box(25, 25, 26, 26).geometry },
      ]);

      const results = await vectorFeatureQuery(LAYER, {}, mapSource, {
        selection: [box(0, 0, 5, 5), box(48, 48, 55, 55)],
      });

      expect(results.features).toEqual([]);
    });

    test("the spatial index leaves out null-geometry features", async () => {
      // OpenLayers keeps them out of the RTree, so a selection query
      //  never sees them at all
      load([
        { type: "Feature", properties: { NAME: "NoGeom" }, geometry: null },
        { type: "Feature", properties: { NAME: "Real" }, geometry: box(0, 0, 1, 1).geometry },
      ]);

      const withSelection = await vectorFeatureQuery(LAYER, {}, mapSource, {
        selection: [box(0, 0, 5, 5)],
      });
      expect(withSelection.features.map((f) => f.properties.NAME)).toEqual(["Real"]);

      // without a selection they come back, since getFeatures() has them
      const noSelection = await vectorFeatureQuery(LAYER, {}, mapSource, {
        fields: [{ comparitor: "like", name: "NAME", value: "%" }],
      });
      expect(noSelection.features.map((f) => f.properties.NAME).sort()).toEqual(["NoGeom", "Real"]);
    });

    test("buffers a point selection by the pixel tolerance", async () => {
      // a click is a zero-area point and can never intersect a polygon
      //  without the tolerance buffer
      load([
        { type: "Feature", properties: { NAME: "Parcel" }, geometry: box(0, 0, 100, 100).geometry },
      ]);

      const clickInside = {
        type: "Feature",
        properties: {},
        geometry: { type: "Point", coordinates: [50, 50] },
      };

      const results = await vectorFeatureQuery(LAYER, { resolution: 1 }, mapSource, {
        selection: [clickInside],
      });
      expect(results.features.map((f) => f.properties.NAME)).toEqual(["Parcel"]);
    });

    test("a point just outside is pulled in by the tolerance, and excluded without it", async () => {
      load([
        { type: "Feature", properties: { NAME: "Parcel" }, geometry: box(0, 0, 100, 100).geometry },
      ]);

      // 5 ground units away, tolerance 10px at resolution 1 reaches it
      const nearMiss = {
        type: "Feature",
        properties: {},
        geometry: { type: "Point", coordinates: [105, 50] },
      };

      const withTolerance = await vectorFeatureQuery(LAYER, { resolution: 1 }, mapSource, {
        selection: [nearMiss],
      });
      expect(withTolerance.features).toHaveLength(1);

      // the map-source can opt out, as the demo's vector-parcels does.
      //  note the string - mapbook config values arrive as strings, and
      //  getPixelTolerance tests them for truthiness, so a numeric 0
      //  would be ignored and fall back to the default.
      const noTolerance = await vectorFeatureQuery(
        LAYER,
        { resolution: 1 },
        { name: SRC_NAME, config: { "pixel-tolerance": "0" } },
        { selection: [nearMiss] }
      );
      expect(noTolerance.features).toEqual([]);
    });

    test("returns an empty set when the registered source has not loaded yet", async () => {
      // an empty source is indistinguishable from one still fetching,
      //  see the review notes on ensureMapSourceFeatures
      load([]);

      const results = await vectorFeatureQuery(LAYER, {}, mapSource, {
        fields: [{ comparitor: "like", name: "NAME", value: "%" }],
      });

      expect(results.features).toEqual([]);
    });
  });

  describe("guards", () => {
    const mapSource = {
      name: "guard-parcels",
      features: [
        { type: "Feature", properties: { NAME: "Smith" }, geometry: box(0, 0, 1, 1).geometry },
      ],
    };

    test("returns an empty set when there is no selection and no filter", async () => {
      // an unfiltered query would otherwise return the whole dataset
      const results = await vectorFeatureQuery(LAYER, {}, mapSource, {});
      expect(results).toEqual({ layer: LAYER, features: [] });
    });

    test("returns an empty set for an empty field list", async () => {
      const results = await vectorFeatureQuery(LAYER, {}, mapSource, { fields: [] });
      expect(results.features).toEqual([]);
    });

    test("returns an empty set for the layer when a filter is unsupported", async () => {
      jest.spyOn(console, "error").mockImplementation(() => {});
      const results = await vectorFeatureQuery(LAYER, {}, mapSource, {
        fields: [{ comparitor: "bogus", name: "NAME", value: "Smith" }],
      });
      // and specifically not every feature, which is what an
      //  empty filter list would have produced
      expect(results).toEqual({ layer: LAYER, features: [] });
      expect(console.error).toHaveBeenCalled();
      console.error.mockRestore();
    });

    test("one unsupported filter does not discard the supported ones silently", async () => {
      jest.spyOn(console, "error").mockImplementation(() => {});
      const results = await vectorFeatureQuery(LAYER, {}, mapSource, {
        fields: [
          { comparitor: "like", name: "NAME", value: "Smith" },
          { comparitor: "bogus", name: "NAME", value: "Smith" },
        ],
      });
      // the whole layer fails rather than running a narrower query
      expect(results.features).toEqual([]);
      expect(console.error).toHaveBeenCalled();
      console.error.mockRestore();
    });
  });
});
