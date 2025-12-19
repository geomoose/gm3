/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2023 Dan "Ducky" Little
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

export const PolygonIcon = ({ geometry, width, height, padding, outline, stroke }) => {
  if (geometry.type !== "Polygon" || geometry.coordinates.length > 1) {
    // do something to return the null case.
    return false;
  }

  const first = geometry.coordinates[0][0];
  let minX = first[0],
    maxX = first[0],
    minY = first[1],
    maxY = first[1];

  for (let i = 1, ii = geometry.coordinates[0].length; i < ii; i++) {
    const point = geometry.coordinates[0][i];
    if (point[0] < minX) {
      minX = point[0];
    }
    if (point[0] > maxX) {
      maxX = point[0];
    }

    if (point[1] < minY) {
      minY = point[1];
    }
    if (point[1] > maxY) {
      maxY = point[1];
    }
  }

  // prevent divide by zero errors when
  //  projecting the ground points to pixel space.
  const gWidth = maxX - minX || 1;
  const gHeight = maxY - minY || 1;

  const ring = [];
  geometry.coordinates[0].forEach((point) => {
    const x = (width / gWidth) * (point[0] - minX);
    const y = ((maxY - point[1]) * height) / gHeight;
    ring.push(x);
    ring.push(y);
  });

  const points = ring.join(" ");

  return (
    <svg
      viewBox={`${-1 * padding} ${-1 * padding} ${width + padding * 2} ${height + padding * 2}`}
      height={height}
      width={width}
    >
      <polyline
        points={points}
        className="polygon-icon"
        style={{
          stroke: outline,
          strokeWidth: 7,
          strokeLineCap: "round",
        }}
      />
      <polyline
        points={points}
        className="polygon-icon"
        style={{
          stroke: stroke,
          strokeWidth: 3,
        }}
      />
    </svg>
  );
};

PolygonIcon.defaultProps = {
  width: 32,
  height: 32,
  padding: 5,
  outline: "#ffffff",
  stroke: "#0099ff",
};
