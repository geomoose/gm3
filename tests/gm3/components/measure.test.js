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

import { getBearing } from "gm3/components/measure/calc";

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

  test("Test Due North", () => {
    const pointB = [0, 1];
    expect(getBearing(pointA, pointB, ordinalDict)).toBe("measure-due-north");
  });
  test("Test Due East", () => {
    const pointB = [1, 0];
    expect(getBearing(pointA, pointB, ordinalDict)).toBe("measure-due-east");
  });
  test("Test Due South", () => {
    const pointB = [0, -1];
    expect(getBearing(pointA, pointB, ordinalDict)).toBe("measure-due-south");
  });
  test("Test Due West", () => {
    const pointB = [-1, 0];
    expect(getBearing(pointA, pointB, ordinalDict)).toBe("measure-due-west");
  });
  test("Test NE Quad", () => {
    const pointB = [1, 1];
    expect(getBearing(pointA, pointB, ordinalDict)).toBe("N45-0-0E");
  });
  test("Test SW Quad", () => {
    const pointB = [-1, -1];
    expect(getBearing(pointA, pointB, ordinalDict)).toBe("S45-0-0W");
  });
});
