/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2024 Dan "Ducky" Little
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
 * Default feature-report layout, used when a layer does not define its own
 * "report" template. With no "columns" specified, the table lists every
 * attribute of the feature as label/value rows (transpose).
 */
const LAYOUTS = [
  {
    label: "feature-report",
    orientation: "portrait",
    page: "letter",
    units: "in",
    elements: [
      {
        type: "text",
        size: 18,
        fontStyle: "bold",
        x: 0.5,
        y: 0.7,
        text: "{{title}}",
      },
      {
        type: "map",
        x: 0.5,
        y: 0.9,
        width: 7.5,
        height: 5,
      },
      {
        type: "rect",
        x: 0.5,
        y: 0.9,
        width: 7.5,
        height: 5,
        strokeWidth: 0.01,
      },
      {
        type: "table",
        x: 0.5,
        y: 6.2,
        width: 7.5,
        data: "feature",
        transpose: true,
        header: false,
        labelWidth: 2.5,
        stripe: [245, 245, 245],
      },
      {
        type: "text",
        x: 0.5,
        y: 10.5,
        text: "Printed on {{month}} / {{day}} / {{year}}",
      },
    ],
  },
];

export default LAYOUTS;
