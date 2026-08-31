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
 * drawTable: a pure jsPDF table primitive.
 *
 * It knows nothing about features, results, or application state -- it takes
 * arrays and draws them. All measurements are in the document's units (the
 * same units the layout is expressed in), so callers do no point conversion.
 *
 * Cell text must already be formatted to strings; this function only handles
 * geometry: column widths, word wrapping, alternating-row striping, a header
 * row, and pagination (repeating the header on each new page).
 *
 * @param {jsPDF} doc          The jsPDF document to draw into.
 * @param {object} spec
 * @param {number} spec.x      Left edge of the table.
 * @param {number} spec.y      Top edge of the first row.
 * @param {number} spec.width  Total table width.
 * @param {Array}  spec.columns   [{ title, width?, align? }] presentation only.
 *                                Columns without an explicit width share the
 *                                leftover width evenly. May be empty for a
 *                                header-less grid (column count then comes
 *                                from the widest row).
 * @param {Array}  spec.rows      string[][] of pre-formatted cell text.
 * @param {number} [spec.rowHeight=0.25]  Minimum row height; rows grow to fit
 *                                wrapped text.
 * @param {boolean}[spec.header=true]     Draw (and repeat) a header row.
 * @param {Array}  [spec.stripe]          [r,g,b] fill for odd body rows.
 * @param {number} [spec.pageBottom]      Y past which a new page is started.
 * @param {number} [spec.pageTop=spec.y]  Top Y for continued pages.
 * @param {string} [spec.font="helvetica"]
 * @param {string} [spec.headerStyle="bold"]
 * @param {string} [spec.bodyStyle="normal"]
 * @param {number} [spec.fontSize=10]     In points (jsPDF font sizes are pt).
 * @param {Array}  [spec.color=[0,0,0]]   Text color.
 * @param {Array}  [spec.lineColor=[200,200,200]]  Header underline color.
 * @param {number} [spec.lineWidth=0.01]  Header underline width (doc units).
 * @param {number} [spec.padding=0.05]    Cell padding (doc units).
 *
 * @return {{ y: number, pages: number }} The Y after the last row and the
 *   number of pages the table spanned (1-based).
 */
export default function drawTable(doc, spec) {
  const {
    x,
    y,
    width,
    columns = [],
    rows = [],
    rowHeight = 0.25,
    header = true,
    stripe,
    pageBottom = Infinity,
    pageTop = y,
    font = "helvetica",
    headerStyle = "bold",
    bodyStyle = "normal",
    fontSize = 10,
    color = [0, 0, 0],
    lineColor = [200, 200, 200],
    lineWidth = 0.01,
    padding = 0.05,
  } = spec;

  // the number of columns: explicit headers win, otherwise infer from the
  //  widest row. With nothing to render, there is nothing to do.
  const colCount = columns.length || rows.reduce((max, row) => Math.max(max, row.length), 0);
  if (colCount === 0) {
    return { y, pages: 1 };
  }

  // resolve column widths: honor explicit widths, distribute the remainder
  //  evenly across the columns that did not specify one.
  const explicit = [];
  let usedWidth = 0;
  let unsized = 0;
  for (let i = 0; i < colCount; i++) {
    const w = columns[i] && columns[i].width;
    if (w != null) {
      explicit[i] = w;
      usedWidth += w;
    } else {
      explicit[i] = null;
      unsized += 1;
    }
  }
  const autoWidth = unsized > 0 ? Math.max(0, width - usedWidth) / unsized : 0;
  const widths = explicit.map((w) => (w != null ? w : autoWidth));

  // left edge of each column.
  const colX = [];
  let offset = x;
  for (let i = 0; i < colCount; i++) {
    colX[i] = offset;
    offset += widths[i];
  }

  const setRowFont = (isHeader) => {
    doc.setFont(font, isHeader ? headerStyle : bodyStyle);
    doc.setFontSize(fontSize);
  };

  // split each cell to fit its column and report the row's required height.
  const measureRow = (cells, isHeader) => {
    setRowFont(isHeader);
    const lineH = doc.getTextDimensions("Mg").h;
    let maxLines = 1;
    const cellLines = [];
    for (let i = 0; i < colCount; i++) {
      const text = cells[i] == null ? "" : String(cells[i]);
      const inner = Math.max(0, widths[i] - 2 * padding);
      const lines = doc.splitTextToSize(text, inner);
      cellLines[i] = lines;
      maxLines = Math.max(maxLines, lines.length);
    }
    const height = Math.max(rowHeight, maxLines * lineH + 2 * padding);
    return { cellLines, height, lineH };
  };

  const drawRow = (cells, top, isHeader, stripeOn) => {
    const { cellLines, height, lineH } = measureRow(cells, isHeader);

    if (stripeOn && stripe) {
      doc.setFillColor(stripe[0], stripe[1], stripe[2]);
      doc.rect(x, top, width, height, "F");
    }

    setRowFont(isHeader);
    doc.setTextColor(color[0], color[1], color[2]);
    for (let i = 0; i < colCount; i++) {
      const align = (columns[i] && columns[i].align) || "left";
      let tx = colX[i] + padding;
      if (align === "right") {
        tx = colX[i] + widths[i] - padding;
      } else if (align === "center") {
        tx = colX[i] + widths[i] / 2;
      }
      const lines = cellLines[i];
      for (let j = 0; j < lines.length; j++) {
        doc.text(tx, top + padding + j * lineH, lines[j], {
          baseline: "top",
          align,
        });
      }
    }
    return height;
  };

  const drawHeader = (top) => {
    if (!header || columns.length === 0) {
      return 0;
    }
    const titles = columns.map((col) => (col.title == null ? "" : col.title));
    const height = drawRow(titles, top, true, false);
    // underline the header.
    doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
    doc.setLineWidth(lineWidth);
    doc.line(x, top + height, x + width, top + height);
    return height;
  };

  let pages = 1;
  let cursorY = y;
  cursorY += drawHeader(cursorY);

  for (let r = 0; r < rows.length; r++) {
    const { height } = measureRow(rows[r], false);
    // start a new page when the row would overflow the printable area.
    if (cursorY + height > pageBottom) {
      doc.addPage();
      pages += 1;
      cursorY = pageTop;
      cursorY += drawHeader(cursorY);
    }
    drawRow(rows[r], cursorY, false, r % 2 === 1);
    cursorY += height;
  }

  return { y: cursorY, pages };
}
