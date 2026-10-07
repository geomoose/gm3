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

import * as jsts from "gm3/jsts";

const feature = (geometry, properties = {}) => ({ type: "Feature", properties, geometry });

const square = (x, y, w) => ({
  type: "Polygon",
  coordinates: [
    [
      [x, y],
      [x + w, y],
      [x + w, y + w],
      [x, y + w],
      [x, y],
    ],
  ],
});

// a self-intersecting polygon, which the draw tool can produce
const bowtie = {
  type: "Polygon",
  coordinates: [
    [
      [0, 0],
      [10, 10],
      [10, 0],
      [0, 10],
      [0, 0],
    ],
  ],
};

// shoelace area of a polygon's shell
const shellArea = (ring) => {
  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return Math.abs(area / 2);
};

describe("test basic jsts stuff", function () {
  it("buffers a point", async function () {
    const point = feature({ type: "Point", coordinates: [0, 0] });

    const polygon = await jsts.buffer(point, 1);
    expect(polygon.type).toBe("Polygon");
    // 8 segments per quarter circle, plus the closing point
    expect(polygon.coordinates[0]).toHaveLength(33);
  });

  it("buffers a line", async function () {
    const line = feature({
      type: "LineString",
      coordinates: [
        [-93.1, 44.9],
        [-93.0, 44.9],
      ],
    });
    const polygon = await jsts.buffer(line, 100);
    expect(polygon.type).toBe("Polygon");
  });

  it("buffers a multipolygon in its own UTM zone", async function () {
    // two small squares in Minnesota, 0.001 degrees on a side
    const mpoly = feature({
      type: "MultiPolygon",
      coordinates: [square(-93.1, 44.9, 0.001).coordinates, square(-93.0, 44.9, 0.001).coordinates],
    });
    const geometry = await jsts.buffer(mpoly, 10);
    expect(geometry.type).toBe("MultiPolygon");
    // 10m at this latitude is roughly 0.00013 degrees of longitude,
    //  buffering in the wrong UTM zone distorts that badly.
    const ring = geometry.coordinates[0][0];
    const xs = ring.map((pt) => pt[0]);
    const width = Math.max(...xs) - Math.min(...xs);
    expect(width).toBeGreaterThan(0.0012);
    expect(width).toBeLessThan(0.0014);
  });

  it("buffers a self-intersecting polygon", async function () {
    const geometry = await jsts.buffer(
      feature({
        type: "Polygon",
        coordinates: [bowtie.coordinates[0].map(([x, y]) => [-93 + x / 1000, 44 + y / 1000])],
      }),
      5
    );
    expect(geometry.type).toBe("Polygon");
  });

  it("unions a couple of polygons", async function () {
    const features = [
      feature({
        type: "Polygon",
        coordinates: [
          [
            [0, 0],
            [-1, 0],
            [0, 1],
            [0, 0],
          ],
        ],
      }),
      feature({
        type: "Polygon",
        coordinates: [
          [
            [-1, 0],
            [-1, 1],
            [0, 1],
            [-1, 0],
          ],
        ],
      }),
    ];

    const shp = await jsts.bufferAndUnion(features, 1);
    expect(shp).toBeDefined();
    expect(shp.type).toBe("Polygon");
  });

  it("unions features and keeps the first feature's properties", async function () {
    const result = await jsts.union([
      feature(square(0, 0, 10), { buffer: true }),
      feature(square(5, 5, 10), { buffer: false }),
    ]);
    expect(result.properties).toEqual({ buffer: true });
    expect(result.geometry.type).toBe("Polygon");
    expect(shellArea(result.geometry.coordinates[0])).toBeCloseTo(175);
  });

  it("returns a multipolygon for disjoint features", async function () {
    const result = await jsts.union([feature(square(0, 0, 1)), feature(square(5, 5, 1))]);
    expect(result.geometry.type).toBe("MultiPolygon");
  });

  it("passes a single feature through union", async function () {
    const only = feature(square(0, 0, 1), { a: 1 });
    expect(await jsts.union([only])).toEqual(only);
  });
});

describe("intersection tests", function () {
  it("tests polygons, lines and points", async function () {
    const test = await jsts.intersectsTester(feature(square(0, 0, 10)));
    expect(test({ type: "Point", coordinates: [5, 5] })).toBe(true);
    expect(test({ type: "Point", coordinates: [50, 5] })).toBe(false);
    expect(
      test({
        type: "LineString",
        coordinates: [
          [-5, 5],
          [15, 5],
        ],
      })
    ).toBe(true);
    expect(test(square(10, 0, 5))).toBe(true);
    expect(test(square(20, 0, 5))).toBe(false);
    expect(
      test({
        type: "MultiPolygon",
        coordinates: [square(20, 0, 5).coordinates, square(8, 8, 5).coordinates],
      })
    ).toBe(true);
  });

  it("tests against a self-intersecting selection", async function () {
    const test = await jsts.intersectsTester(feature(bowtie));
    // inside the left lobe
    expect(test({ type: "Point", coordinates: [2, 5] })).toBe(true);
    // in the notch between the lobes
    expect(test({ type: "Point", coordinates: [5, 2] })).toBe(false);
  });

  it("tests a self-intersecting feature", async function () {
    expect(await jsts.intersects(square(1, 4, 2), bowtie)).toBe(true);
    expect(await jsts.intersects(square(4, 0, 2), bowtie)).toBe(false);
  });
});
