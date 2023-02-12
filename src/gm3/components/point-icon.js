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

export const PointIcon = ({ width, height, padding, fill, stroke }) => {
  const cx = width / 2.0;
  const cy = width / 2.0;
  const r = width / 2.0 - padding / 2.0;

  return (
    <svg
      viewBox={`${-1 * padding} ${-1 * padding} ${width + padding * 2} ${
        height + padding * 2
      }`}
      height={height}
      width={width}
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        style={{
          fill,
          stroke,
          strokeWidth: 7,
        }}
      />
    </svg>
  );
};

PointIcon.defaultProps = {
  width: 32,
  height: 32,
  padding: 5,
  fill: "#ffffff",
  stroke: "#0099ff",
};
