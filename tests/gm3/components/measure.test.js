/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 Dan "Ducky" Little
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

import { getBearing, getPathSegments } from "gm3/components/measure/calc";
import { getComplementaryUnit } from "gm3/components/measure/unit";
import {
  getSegmentLabelStyles,
  getAreaLabelStyles,
  getMeasureLabelStyles,
} from "gm3/components/measure/labels";

// necessary to configure the UTM projections used by getPathSegments
import { configureProjections } from "gm3/util";
import { register } from "ol/proj/proj4";
import proj4 from "proj4";
import LineString from "ol/geom/LineString";
import Polygon from "ol/geom/Polygon";
import { fromLonLat } from "ol/proj";

/*
 * Test getBearing()
 */

describe("getBearing tests", () => {
  const pointA = [0, 0];

  const ordinalDict = {
    "measure-north-abbr": "N",
    "measure-south-abbr": "S",
    "measure-east-abbr": "E",
    "measure-west-abbr": "W",
  };

  test("Due North", () => {
    const pointB = [0, 1];
    expect(getBearing(pointA, pointB, ordinalDict)).toBe("measure-due-north");
  });
  test("Due East", () => {
    const pointB = [1, 0];
    expect(getBearing(pointA, pointB, ordinalDict)).toBe("measure-due-east");
  });
  test("Due South", () => {
    const pointB = [0, -1];
    expect(getBearing(pointA, pointB, ordinalDict)).toBe("measure-due-south");
  });
  test("Due West", () => {
    const pointB = [-1, 0];
    expect(getBearing(pointA, pointB, ordinalDict)).toBe("measure-due-west");
  });
  test("NE Quad", () => {
    const pointB = [1, 1];
    expect(getBearing(pointA, pointB, ordinalDict)).toBe("N45-0-0E");
  });
  test("SW Quad", () => {
    const pointB = [-1, -1];
    expect(getBearing(pointA, pointB, ordinalDict)).toBe("S45-0-0W");
  });
});

/*
 * Test getPathSegments() -- used by the on-map segment annotations.
 */

describe("getPathSegments tests", () => {
  beforeEach(() => {
    configureProjections(proj4);
    register(proj4);
  });

  test("returns nothing for paths with fewer than two points", () => {
    expect(getPathSegments([])).toEqual([]);
    expect(getPathSegments([[0, 45]])).toEqual([]);
  });

  test("returns one segment per pair of coordinates", () => {
    const segments = getPathSegments([
      [-93.0, 45.0],
      [-93.0, 45.01],
      [-92.99, 45.01],
    ]);
    expect(segments).toHaveLength(2);
  });

  test("reports a positive length and the lon/lat midpoint of each segment", () => {
    const segments = getPathSegments([
      [-93.0, 45.0],
      [-93.0, 45.01],
    ]);
    expect(segments[0].len).toBeGreaterThan(0);
    expect(segments[0].midpointLonLat[0]).toBeCloseTo(-93.0, 5);
    expect(segments[0].midpointLonLat[1]).toBeCloseTo(45.005, 5);
  });
});

/*
 * Test getSegmentLabelStyles() -- builds the on-map labels from a map-projection
 *  (EPSG:3857) geometry.
 */

describe("getSegmentLabelStyles tests", () => {
  beforeEach(() => {
    configureProjections(proj4);
    register(proj4);
  });

  test("builds one label per line segment", () => {
    const geometry = new LineString([
      fromLonLat([-93.0, 45.0]),
      fromLonLat([-93.0, 45.01]),
      fromLonLat([-92.99, 45.01]),
    ]);
    const styles = getSegmentLabelStyles(geometry, "ft");
    expect(styles).toHaveLength(2);
    expect(styles[0].getText().getText()).toMatch(/ ft$/);
  });

  test("labels follow the segment and are hidden when they do not fit", () => {
    const geometry = new LineString([fromLonLat([-93.0, 45.0]), fromLonLat([-93.0, 45.01])]);
    const text = getSegmentLabelStyles(geometry, "ft")[0].getText();
    // placed along the line so the label rotates to follow the segment...
    expect(text.getPlacement()).toBe("line");
    // ...and overflow is off so OpenLayers drops over-long labels (this also
    //  guards against the global Text.getOverflow monkey-patch leaking in).
    expect(text.getOverflow()).toBe(false);
  });

  test("builds one label per polygon edge (including the closing edge)", () => {
    const ringLonLat = [
      [-93.0, 45.0],
      [-93.0, 45.01],
      [-92.99, 45.01],
      [-93.0, 45.0],
    ];
    const geometry = new Polygon([ringLonLat.map((coord) => fromLonLat(coord))]);
    const styles = getSegmentLabelStyles(geometry, "m");
    expect(styles).toHaveLength(3);
  });

  test("ignores point geometries", () => {
    const geometry = new LineString([fromLonLat([-93.0, 45.0])]);
    expect(getSegmentLabelStyles(geometry, "ft")).toEqual([]);
  });
});

describe("getComplementaryUnit tests", () => {
  test("maps a length unit to its preferred area unit", () => {
    expect(getComplementaryUnit("mi", "area")).toBe("mi");
    expect(getComplementaryUnit("ft", "area")).toBe("ft");
    expect(getComplementaryUnit("m", "area")).toBe("m");
    expect(getComplementaryUnit("km", "area")).toBe("km");
    // chains and rods pair with acres (surveyor convention).
    expect(getComplementaryUnit("ch", "area")).toBe("a");
    expect(getComplementaryUnit("r", "area")).toBe("a");
  });

  test("maps an area unit to its preferred length unit", () => {
    expect(getComplementaryUnit("mi", "length")).toBe("mi");
    expect(getComplementaryUnit("a", "length")).toBe("ft");
    expect(getComplementaryUnit("h", "length")).toBe("m");
  });
});

describe("getAreaLabelStyles tests", () => {
  beforeEach(() => {
    configureProjections(proj4);
    register(proj4);
  });

  const polygon = new Polygon([
    [
      [-93.0, 45.0],
      [-93.0, 45.01],
      [-92.99, 45.01],
      [-92.99, 45.0],
      [-93.0, 45.0],
    ].map((coord) => fromLonLat(coord)),
  ]);

  test("labels a polygon's area at an interior point", () => {
    const styles = getAreaLabelStyles(polygon, "ft");
    expect(styles).toHaveLength(1);
    // outline-pentagon prefix, white halo, no backer.
    expect(styles[0].getText().getText()).toMatch(/^⬠ .* sq\. ft$/);
    expect(styles[0].getGeometry().getType()).toBe("Point");
    expect(styles[0].getText().getStroke().getColor()).toBe("#ffffff");
    expect(styles[0].getText().getBackgroundFill()).toBe(null);
  });

  test("getMeasureLabelStyles combines segment and area labels (4 edges + area)", () => {
    const styles = getMeasureLabelStyles(polygon, { lengthUnits: "ft", areaUnits: "ft" });
    expect(styles).toHaveLength(5);
  });
});
