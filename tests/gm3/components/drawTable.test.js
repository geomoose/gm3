/*
 * Tests for the pure drawTable primitive.
 *
 * drawTable only ever talks to a jsPDF document through a small set of
 * methods, so a lightweight mock that records calls keeps the test fast,
 * dependency-free, and focused on geometry (widths, alignment, pagination).
 */

import drawTable from "gm3/components/print/drawTable";

// a minimal jsPDF stand-in. Text/line metrics are deterministic so row
//  heights and pagination are predictable.
const makeDoc = () => {
  let fontSize = 12;
  const calls = { text: [], line: [], rect: [], addPage: 0 };
  return {
    calls,
    setFont() {},
    setFontSize(size) {
      fontSize = size;
    },
    // one line is fontSize points tall, expressed in inches.
    getTextDimensions() {
      return { w: 1, h: fontSize / 72 };
    },
    // no wrapping in the mock; honor explicit newlines only.
    splitTextToSize(text) {
      return String(text).split("\n");
    },
    setFillColor() {},
    setTextColor() {},
    setDrawColor() {},
    setLineWidth() {},
    rect(...args) {
      calls.rect.push(args);
    },
    text(...args) {
      calls.text.push(args);
    },
    line(...args) {
      calls.line.push(args);
    },
    addPage() {
      calls.addPage += 1;
    },
  };
};

const columns = [
  { title: "Field", width: 2 },
  { title: "Value", width: 4, align: "right" },
];

const makeRows = (n) => {
  const rows = [];
  for (let i = 0; i < n; i++) {
    rows.push([`label ${i}`, `value ${i}`]);
  }
  return rows;
};

describe("drawTable", () => {
  test("returns a single page and advances Y for a short table", () => {
    const doc = makeDoc();
    const result = drawTable(doc, {
      x: 0.5,
      y: 1,
      width: 6,
      columns,
      rows: makeRows(3),
    });

    expect(result.pages).toBe(1);
    expect(result.y).toBeGreaterThan(1);
  });

  test("paginates and repeats the header when rows overflow pageBottom", () => {
    const doc = makeDoc();
    const result = drawTable(doc, {
      x: 0.5,
      y: 1,
      width: 6,
      columns,
      rows: makeRows(60),
      rowHeight: 0.3,
      pageBottom: 10,
      pageTop: 1,
    });

    expect(result.pages).toBeGreaterThan(1);
    expect(doc.calls.addPage).toBe(result.pages - 1);
    // one header underline drawn per page.
    expect(doc.calls.line).toHaveLength(result.pages);
  });

  test("does nothing for an empty table", () => {
    const doc = makeDoc();
    const result = drawTable(doc, {
      x: 0.5,
      y: 1,
      width: 6,
      columns: [],
      rows: [],
    });

    expect(result).toEqual({ y: 1, pages: 1 });
    expect(doc.calls.text).toHaveLength(0);
  });

  test("infers column count from the widest row when no columns are given", () => {
    const doc = makeDoc();

    drawTable(doc, {
      x: 0.5,
      y: 1,
      width: 6,
      columns: [],
      rows: [["a", "b", "c"]],
      header: false,
    });

    const drawnStrings = doc.calls.text.map((call) => call[2]);
    expect(drawnStrings).toEqual(expect.arrayContaining(["a", "b", "c"]));
  });

  test("right-aligns a column at its right edge", () => {
    const doc = makeDoc();

    drawTable(doc, {
      x: 0.5,
      y: 1,
      width: 6,
      columns,
      rows: [["left", "right"]],
      header: false,
      padding: 0.05,
    });

    const rightCall = doc.calls.text.find((call) => call[2] === "right");
    expect(rightCall).toBeDefined();
    const [tx, , , options] = rightCall;
    expect(options.align).toBe("right");
    // column 2 starts at x(0.5) + width(2) = 2.5, spans 4 wide -> right edge
    //  6.5, minus padding 0.05 => 6.45.
    expect(tx).toBeCloseTo(6.45, 5);
  });
});
