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

import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";

import { UpTool } from "gm3/components/catalog/tools/up";

describe("UpTool test", () => {
  it("renders an up tool", () => {
    const props = {
      setZIndex: function () {},
      layer: {
        src: [
          {
            mapSourceName: "test",
            layerName: "test",
          },
        ],
      },
      catalog: {
        root: {
          children: ["zzz", "xxx"],
        },
        zzz: {
          src: [{ mapSourceName: "test", layerName: "test" }],
        },
        xxx: {
          src: [{ mapSourceName: "test2", layerName: "test3" }],
        },
      },
      mapSources: {
        test: {
          layers: [
            {
              name: "test",
              on: true,
            },
          ],
        },
        test2: {
          layers: [
            {
              name: "test3",
              on: true,
            },
          ],
        },
      },
    };

    render(<UpTool {...props} />);
    fireEvent.click(screen.getByRole("button"));
  });
});
