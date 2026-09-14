/*
 * Test the JSON value helpers.
 */

import { objectsDiffer, scrubProperties, transformFeatures, transformProperties } from "gm3/json";

describe("scrubProperties", () => {
  test("passes primitives through untouched", () => {
    expect(
      scrubProperties({
        NAME: "Smith",
        ACRES: 12.5,
        COUNT: 3,
        TAXABLE: true,
        MISSING: null,
        ABSENT: undefined,
        EMPTY: "",
        ZERO: 0,
      })
    ).toEqual({
      NAME: "Smith",
      ACRES: 12.5,
      COUNT: 3,
      TAXABLE: true,
      MISSING: null,
      ABSENT: undefined,
      EMPTY: "",
      ZERO: 0,
    });
  });

  test("converts dates to an ISO string", () => {
    const scrubbed = scrubProperties({ SALE_DATE: new Date(Date.UTC(2026, 0, 15, 12, 30)) });
    expect(scrubbed.SALE_DATE).toBe("2026-01-15T12:30:00.000Z");
  });

  test("converts a BigInt to a string", () => {
    // hyparquet returns BigInt for a plain INT64 column, and it survives
    //  the structured clone out of the worker
    const scrubbed = scrubProperties({ PARCEL_ID: 9007199254740993n });
    expect(scrubbed.PARCEL_ID).toBe("9007199254740993");
    // and specifically does not lose precision through Number()
    expect(scrubbed.PARCEL_ID).not.toBe("9007199254740992");
  });

  test("converts a negative and a zero BigInt", () => {
    const scrubbed = scrubProperties({ NEG: -42n, ZERO: 0n });
    expect(scrubbed.NEG).toBe("-42");
    expect(scrubbed.ZERO).toBe("0");
  });

  test("stringifies nested objects", () => {
    const scrubbed = scrubProperties({ META: { owner: "Smith", acres: 12 } });
    expect(scrubbed.META).toBe('{"owner":"Smith","acres":12}');
  });

  test("stringifies arrays", () => {
    const scrubbed = scrubProperties({ TAGS: ["a", "b"] });
    expect(scrubbed.TAGS).toBe('["a","b"]');
  });

  test("does not throw on a BigInt nested inside an object", () => {
    // JSON.stringify throws "Do not know how to serialize a BigInt"
    //  without the replacer
    const scrubbed = scrubProperties({ META: { id: 123n, name: "Smith" } });
    expect(scrubbed.META).toBe('{"id":"123","name":"Smith"}');
  });

  test("does not throw on a BigInt nested inside an array", () => {
    const scrubbed = scrubProperties({ IDS: [1n, 2n] });
    expect(scrubbed.IDS).toBe('["1","2"]');
  });

  test("a date nested in an object becomes an ISO string via JSON", () => {
    const scrubbed = scrubProperties({ META: { when: new Date(Date.UTC(2026, 0, 1)) } });
    expect(scrubbed.META).toBe('{"when":"2026-01-01T00:00:00.000Z"}');
  });

  test("the result is JSON serializable, which is the whole point", () => {
    const scrubbed = scrubProperties({
      PARCEL_ID: 123n,
      SALE_DATE: new Date(Date.UTC(2026, 0, 1)),
      META: { id: 456n },
      NAME: "Smith",
    });
    expect(() => JSON.stringify(scrubbed)).not.toThrow();
  });

  test("returns a new object rather than mutating the input", () => {
    const properties = { NAME: "Smith", ID: 1n };
    const scrubbed = scrubProperties(properties);
    expect(scrubbed).not.toBe(properties);
    expect(properties.ID).toBe(1n);
  });

  test("handles an empty property bag", () => {
    expect(scrubProperties({})).toEqual({});
  });

  test("preserves keys with falsy values", () => {
    const scrubbed = scrubProperties({ A: 0, B: false, C: "", D: null });
    expect(Object.keys(scrubbed).sort()).toEqual(["A", "B", "C", "D"]);
  });
});

describe("transformProperties", () => {
  test("coerces to string and number", () => {
    expect(
      transformProperties({ ACRES: "number", PIN: "string" }, { ACRES: "12.5", PIN: 1234 })
    ).toEqual({ ACRES: 12.5, PIN: "1234" });
  });

  test("leaves properties without a transform alone", () => {
    expect(transformProperties({ ACRES: "number" }, { ACRES: "5", NAME: "Smith" })).toEqual({
      ACRES: 5,
      NAME: "Smith",
    });
  });

  test("ignores an unknown transform type", () => {
    expect(transformProperties({ NAME: "bogus" }, { NAME: "Smith" })).toEqual({ NAME: "Smith" });
  });

  test("does not mutate the input", () => {
    const properties = { ACRES: "5" };
    const result = transformProperties({ ACRES: "number" }, properties);
    expect(result).not.toBe(properties);
    expect(properties.ACRES).toBe("5");
  });

  test("an unparseable number becomes NaN", () => {
    expect(transformProperties({ ACRES: "number" }, { ACRES: "not a number" }).ACRES).toBeNaN();
  });

  test("no transforms is a passthrough copy", () => {
    expect(transformProperties({}, { NAME: "Smith" })).toEqual({ NAME: "Smith" });
  });
});

describe("transformFeatures", () => {
  const features = () => [
    { type: "Feature", properties: { ACRES: "10" }, geometry: null },
    { type: "Feature", properties: { ACRES: "20" }, geometry: null },
  ];

  test("applies the transform to every feature", () => {
    const result = transformFeatures({ ACRES: "number" }, features());
    expect(result.map((f) => f.properties.ACRES)).toEqual([10, 20]);
  });

  test("returns the features untouched when transforms is not an object", () => {
    const input = features();
    expect(transformFeatures(undefined, input)).toBe(input);
    expect(input[0].properties.ACRES).toBe("10");
  });

  test("mutates the features in place and returns them", () => {
    const input = features();
    expect(transformFeatures({ ACRES: "number" }, input)).toBe(input);
    expect(input[0].properties.ACRES).toBe(10);
  });

  test("handles an empty feature list", () => {
    expect(transformFeatures({ ACRES: "number" }, [])).toEqual([]);
  });
});

describe("objectsDiffer", () => {
  test("matching strings and numbers do not differ", () => {
    expect(objectsDiffer({ A: "x", B: 1 }, { A: "x", B: 1 })).toBe(false);
  });

  test("differing strings and numbers differ", () => {
    expect(objectsDiffer({ A: "x" }, { A: "y" })).toBe(true);
    expect(objectsDiffer({ B: 1 }, { B: 2 })).toBe(true);
  });

  test("a key missing from either side differs", () => {
    expect(objectsDiffer({ A: 1 }, {})).toBe(true);
    expect(objectsDiffer({}, { A: 1 })).toBe(true);
  });

  test("key order does not matter", () => {
    expect(objectsDiffer({ A: 1, B: 2 }, { B: 2, A: 1 })).toBe(false);
  });

  test("recurses only when deep is set", () => {
    expect(objectsDiffer({ A: { x: 1 } }, { A: { x: 2 } }, true)).toBe(true);
    // NOTE: without `deep` nested values are not compared at all
    expect(objectsDiffer({ A: { x: 1 } }, { A: { x: 2 } })).toBe(false);
  });

  test("null on one side differs, in either order", () => {
    expect(objectsDiffer({ A: { x: 1 } }, { A: null })).toBe(true);
    expect(objectsDiffer({ A: null }, { A: { x: 1 } })).toBe(true);
  });

  test("null on both sides does not differ, shallow or deep", () => {
    expect(objectsDiffer({ A: null }, { A: null })).toBe(false);
    expect(objectsDiffer({ A: null }, { A: null }, true)).toBe(false);
  });

  test("undefined and null differ", () => {
    expect(objectsDiffer({ A: undefined }, { A: null })).toBe(true);
  });

  test("a non-object against an object differs rather than throwing", () => {
    expect(objectsDiffer({ A: undefined }, { A: { x: 1 } }, true)).toBe(true);
    expect(objectsDiffer({ A: "s" }, { A: { x: 1 } }, true)).toBe(true);
  });

  test("matching booleans do not differ", () => {
    // "boolean" used to fall through to `default: return true`, which made
    //  a WMS layer with a boolean param reload on every update
    expect(objectsDiffer({ TRANSPARENT: true }, { TRANSPARENT: true })).toBe(false);
    expect(objectsDiffer({ TRANSPARENT: false }, { TRANSPARENT: false })).toBe(false);
  });

  test("differing booleans differ", () => {
    expect(objectsDiffer({ TRANSPARENT: true }, { TRANSPARENT: false })).toBe(true);
  });

  test("a boolean and its string spelling differ", () => {
    expect(objectsDiffer({ TRANSPARENT: "true" }, { TRANSPARENT: true })).toBe(true);
  });

  test("matching bigints do not differ", () => {
    expect(objectsDiffer({ ID: 1n }, { ID: 1n })).toBe(false);
    expect(objectsDiffer({ ID: 1n }, { ID: 2n })).toBe(true);
  });

  test("two NaN values do not differ", () => {
    // NaN !== NaN would otherwise report a difference between a property
    //  and itself, and transformProperties produces NaN readily
    expect(objectsDiffer({ ACRES: NaN }, { ACRES: NaN })).toBe(false);
    expect(objectsDiffer({ ACRES: NaN }, { ACRES: 1 })).toBe(true);
  });

  test("0 and -0 do not differ", () => {
    expect(objectsDiffer({ A: 0 }, { A: -0 })).toBe(false);
  });

  test("arrays are compared elementwise when deep", () => {
    expect(objectsDiffer({ A: [1, 2] }, { A: [1, 2] }, true)).toBe(false);
    expect(objectsDiffer({ A: [1, 2] }, { A: [1, 3] }, true)).toBe(true);
    expect(objectsDiffer({ A: [1, 2] }, { A: [1, 2, 3] }, true)).toBe(true);
  });

  // NOTE: documents a deliberate bail-out, not a defect. Functions and
  //  symbols cannot be meaningfully compared and do not belong in
  //  JSON-shaped data, so they always report a difference.
  test("identical function references are reported as differing", () => {
    const fn = () => {};
    expect(objectsDiffer({ A: fn }, { A: fn })).toBe(true);
  });
});
