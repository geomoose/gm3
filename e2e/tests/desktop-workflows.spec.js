// Follow-up desktop workflows: grid tools, reports, search, layers, and
// bookmarks. These run in both live and offline modes.
const { test, expect } = require("../helpers/demo");
const {
  PARCEL_POINT,
  SELECT_BOX,
  openDesktop,
  enableVectorParcels,
  clickMap,
  selectParcels,
  parcelRows,
  downloadCSV,
  downloadPDF,
  exportedRows,
  readable,
} = require("../helpers/workflows");

async function selected(page) {
  await enableVectorParcels(page);
  await selectParcels(page);
}

function column(page, title) {
  return page.locator("#results-grid th").filter({ hasText: title });
}

async function cellValues(page, index) {
  return parcelRows(page).evaluateAll(
    (rows, index) => rows.map((row) => row.cells[index].textContent.trim()),
    index
  );
}

async function pinFilter(page, pins) {
  await column(page, "PIN").getByTitle("Filter", { exact: true }).click();
  const modal = page.locator(".modal-frame");
  await expect(modal).toContainText("Set filter for PIN");
  await modal.getByText("Select none", { exact: true }).click();
  for (const pin of pins) await modal.getByText(pin, { exact: true }).click();
  await modal.getByRole("button", { name: "Set", exact: true }).click();
}

// Asking for `demo` turns on the network setup and the error checks.
test.beforeEach(async ({ page, demo: _demo }) => {
  await openDesktop(page);
});

test("selection asks for a shape, then works with a drawn polygon", async ({ page, demo }) => {
  await enableVectorParcels(page);
  await page.locator("#toolbar").getByText("Select Features", { exact: true }).click();
  const count = demo.queries.length;
  await page.locator(".service-form .go-button").click();
  const modal = page.locator(".modal-frame");
  await expect(modal).toContainText("A selection geometry is required");
  expect(demo.queries.length).toBe(count);
  await modal.getByRole("button", { name: "Okay", exact: true }).click();

  await page.locator(".draw-tool").getByText("Draw Polygon", { exact: true }).click();
  const [[west, north], [east, south]] = SELECT_BOX;
  await clickMap(page, [west, north]);
  await clickMap(page, [east, north]);
  await clickMap(page, [east, south]);
  await clickMap(page, [west, south], "dblclick");
  await page.locator(".service-form .go-button").click();
  await expect(parcelRows(page).first()).toBeVisible();
  await expect.poll(() => demo.queries.length).toBeGreaterThan(count);
  expect(demo.queries.at(-1)).toContain("Polygon");
});

// Sort order rules are covered by tests/gm3/components/grid/sort.test.js.
// This only checks that the header controls reorder the rows on screen.
test("a column header sorts rows up, down, and back to the original order", async ({ page }) => {
  await selected(page);
  // Demo roads and lakes have no value. Sort only parcels that have one.
  const rows = (await exportedRows(page)).filter((row) => row.EMV_TOTAL && row.OWNER_NAME);
  const pins = [...new Set(rows.map((row) => row.PIN))];
  expect(pins.length).toBeGreaterThan(1);
  await pinFilter(page, pins);
  const original = await cellValues(page, 0);
  const values = async () =>
    (await cellValues(page, 3)).map((v) => Number(v.replace(/[^\d.-]/g, "")));
  const sort = column(page, "Est. Value").getByTitle("Click to sort", { exact: true });

  await sort.click();
  await expect(sort.locator("i")).toHaveClass(/asc/);
  await expect
    .poll(async () => (await values()).every((v, i, all) => !i || all[i - 1] <= v))
    .toBe(true);
  await sort.click();
  await expect(sort.locator("i")).toHaveClass(/desc/);
  await expect
    .poll(async () => (await values()).every((v, i, all) => !i || all[i - 1] >= v))
    .toBe(true);
  await sort.click();
  await expect(sort.locator("i")).not.toHaveClass(/asc|desc/);
  await expect.poll(() => cellValues(page, 0)).toEqual(original);
});

test("a PIN filter limits the CSV, Cancel keeps it, and Clear removes it", async ({
  page,
}, testInfo) => {
  await selected(page);
  await expect.poll(() => parcelRows(page).count()).toBeGreaterThan(1);
  const data = await exportedRows(page);
  const pins = data.map((row) => row.PIN);
  await pinFilter(page, [pins[0]]);
  await expect(parcelRows(page)).toHaveCount(1);
  await expect(page.locator("#service-tab .features-count .value")).toHaveText("1");
  await expect(page.locator("#service-tab .filtered-features")).toBeVisible();
  const csv = await downloadCSV(page);
  expect(csv).toContain(pins[0]);
  for (const pin of pins.slice(1)) expect(csv).not.toContain(pin);
  await page.screenshot({ path: testInfo.outputPath("filtered-grid.png") });

  await column(page, "PIN").getByTitle("Filter", { exact: true }).click();
  const modal = page.locator(".modal-frame");
  await modal.getByText(pins[1], { exact: true }).click();
  await modal.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(parcelRows(page)).toHaveCount(1);
  await expect(parcelRows(page).first()).toContainText(pins[0]);

  await column(page, "PIN").getByTitle("Filter", { exact: true }).click();
  await modal.getByRole("button", { name: "Clear", exact: true }).click();
  expect(await exportedRows(page)).toEqual(data);
});

// Range matching rules are covered by the matchFeatures tests in util.test.js.
test("a value range can hide every row and recover without a new query", async ({ page, demo }) => {
  await selected(page);
  const data = await exportedRows(page);
  const minimum = Math.max(...data.map((row) => Number(row.EMV_TOTAL))) + 1;
  const count = demo.queries.length;
  await column(page, "Est. Value").getByTitle("Filter", { exact: true }).click();
  const modal = page.locator(".modal-frame");
  await expect(modal).toContainText("Set filter for Est. Value");
  await modal.getByRole("textbox").nth(0).fill(String(minimum));
  await modal
    .getByRole("textbox")
    .nth(1)
    .fill(String(minimum + 1));
  await modal.getByRole("button", { name: "Set", exact: true }).click();
  await expect(parcelRows(page)).toHaveCount(0);
  await expect(page.locator("#service-tab .features-count .value")).toHaveText("0");
  await expect(page.locator("#service-tab .filtered-features")).toBeVisible();

  await column(page, "Est. Value").getByTitle("Filter", { exact: true }).click();
  await modal.getByRole("button", { name: "Clear", exact: true }).click();
  expect(await exportedRows(page)).toEqual(data);
  expect(demo.queries.length).toBe(count);
});

test("hiding the grid and cancelling a removal keep the selected parcels", async ({ page }) => {
  await selected(page);
  const data = await exportedRows(page);
  const toggle = page.getByTitle("Min/Maximize Grid", { exact: true });
  await toggle.click();
  await expect(toggle).toHaveClass(/maximize/);
  await expect(parcelRows(page).first()).not.toBeInViewport();
  await expect(page.locator("#map canvas").first()).toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveClass(/minimize/);
  await expect(parcelRows(page).first()).toBeInViewport();
  await parcelRows(page).first().getByTitle("Remove from results", { exact: true }).click();
  await page.locator(".modal-frame").getByRole("button", { name: "Cancel", exact: true }).click();
  expect(await exportedRows(page)).toEqual(data);
});

test("buffer all results, clear them, and select again", async ({ page, demo }) => {
  await selected(page);
  const service = page.locator("#service-tab");
  await service.getByRole("button", { name: /^Buffer results/ }).click();
  const form = page.locator(".service-form");
  await form.getByRole("textbox", { name: "With buffer", exact: true }).fill("50");
  const count = demo.queries.length;
  await form.locator(".go-button").click();
  await expect.poll(() => demo.queries.length).toBeGreaterThan(count);
  await expect(parcelRows(page).first()).toBeVisible();
  expect(demo.queries.at(-1)).toContain("Polygon");

  await service.getByRole("button", { name: /^Clear results/ }).click();
  await expect(page.locator("#results-grid .gm-grid")).toBeHidden();
  await expect(service.locator(".results-header")).toBeHidden();
  await selectParcels(page);
});

test("filtered results can be printed as a report", async ({ page }, testInfo) => {
  await selected(page);
  const pin = (await cellValues(page, 0))[0];
  await pinFilter(page, [pin]);
  await expect(parcelRows(page)).toHaveCount(1);
  await page.getByTitle("Report on results", { exact: true }).click();
  const modal = page.locator("#report-preview");
  await readable(modal.locator(".modal-frame"));
  await page.screenshot({ path: testInfo.outputPath("results-report.png") });
  await downloadPDF(page, modal);
});

test("parcel search asks for input, then finds a selected owner", async ({ page, demo }) => {
  await selected(page);
  const pin = (await cellValues(page, 0))[0];
  const owner = (await cellValues(page, 1))[0];
  await page.locator("#toolbar").getByText("Search", { exact: true }).click();
  await page.locator("#toolbar").getByText("Search Parcels", { exact: true }).click();
  const form = page.locator(".service-form");
  const count = demo.queries.length;
  await form.locator(".go-button").click();
  await expect(form).toContainText("Please complete at least one field.");
  expect(demo.queries.length).toBe(count);

  await form.getByRole("textbox", { name: "Owner Name", exact: true }).fill(owner);
  await form.locator(".go-button").click();
  await expect(page.locator("#service-tab .results-header")).toContainText("Search Results");
  const result = page.locator("#service-tab .search-result").filter({ hasText: pin });
  await expect(result).toContainText(owner);
  expect(demo.queries.at(-1)).toContain("OWNER_NAME");
});

test("Favorites, Visible, and Catalog stay in sync", async ({ page }) => {
  await enableVectorParcels(page);
  const layer = page
    .locator("#catalog .layer-label")
    .filter({ has: page.getByRole("button", { name: "Vector Parcels", exact: true }) });
  await layer.locator("input.favorite").check();
  await page.getByRole("button", { name: "Favorites", exact: true }).click();
  await expect(
    page.locator("#favorites").getByRole("button", { name: "Vector Parcels", exact: true })
  ).toBeVisible();

  await page.getByRole("button", { name: "Visible", exact: true }).click();
  const visibleToggle = page
    .locator("#visible-layers")
    .getByRole("checkbox", { name: "Hide layer Vector Parcels", exact: true });
  // This control removes itself when toggled; click then assert the resulting
  // catalog state instead of asking uncheck() to inspect a detached checkbox.
  await visibleToggle.click();
  await expect(visibleToggle).toBeHidden();
  await page.getByRole("button", { name: "Catalog", exact: true }).click();
  await expect(
    page
      .locator("#catalog")
      .getByRole("checkbox", { name: "Show layer Vector Parcels", exact: true })
  ).not.toBeChecked();

  await layer.locator("input.favorite").uncheck();
  await page.getByRole("button", { name: "Favorites", exact: true }).click();
  await expect(
    page.locator("#favorites").getByRole("button", { name: "Vector Parcels", exact: true })
  ).toBeHidden();
});

test("a bookmark link restores layers and map location", async ({ page }) => {
  await selected(page);
  const initialHash = await page.evaluate(() => location.hash);
  await parcelRows(page).first().getByTitle("Zoom to Parcel", { exact: true }).click();
  await expect.poll(() => page.evaluate(() => location.hash)).not.toBe(initialHash);
  await page.locator("#toolbar").getByText("Bookmark", { exact: true }).click();
  const modal = page.locator("#bookmark-modal");
  const url = await modal.getByRole("textbox").inputValue();
  expect(url).toContain("vector-parcels/parcels");
  expect(url).toContain("&loc=");
  await expect(modal.getByRole("link", { name: "Map Link", exact: true })).toHaveAttribute(
    "href",
    url
  );
  await modal.getByRole("button", { name: "Close", exact: true }).click();

  // Remove the competing persistence mechanism so this genuinely tests the link.
  await page.evaluate(() => localStorage.clear());
  await page.goto(url);
  // Same-document bookmark navigation otherwise leaves the existing UI mounted.
  await page.reload();
  await expect(page.locator("#map canvas").first()).toBeVisible();
  await page.locator("#catalog .group-label").filter({ hasText: "County Layers" }).click();
  const catalog = page.locator("#catalog");
  await expect(
    catalog.getByRole("checkbox", { name: "Hide layer Vector Parcels", exact: true })
  ).toBeChecked();
  await expect(
    catalog.getByRole("checkbox", { name: "Show layer Parcels", exact: true })
  ).not.toBeChecked();
  const expected = new URL(url).hash
    .match(/loc=([^&]+)/)[1]
    .split(";")
    .map(Number);
  await expect
    .poll(async () => {
      const hash = await page.evaluate(() => location.hash);
      const actual = hash
        .match(/loc=([^&]+)/)?.[1]
        .split(";")
        .map(Number);
      return actual && actual.every((v, i) => Math.abs(v - expected[i]) < (i === 0 ? 0.01 : 1));
    })
    .toBeTruthy();
});

test("identify skips a layer after it is turned off", async ({ page, demo }) => {
  await enableVectorParcels(page);
  await page.locator("#toolbar").getByText("Identify", { exact: true }).click();
  await clickMap(page, PARCEL_POINT);
  await expect(page.locator("#service-tab .results")).toContainText("PIN:");
  await page.getByRole("button", { name: "Catalog", exact: true }).click();
  await page
    .locator("#catalog")
    .getByRole("checkbox", { name: "Hide layer Vector Parcels", exact: true })
    .uncheck();
  // Counts WFS queries and WMS GetFeatureInfo requests (see helpers/demo.js).
  const count = demo.queries.length;
  await clickMap(page, PARCEL_POINT);
  await expect(page.locator("#service-tab .results")).not.toContainText("PIN:");
  await expect(page.locator("#service-tab")).toContainText("Your query did not return any results");
  expect(demo.queries.length).toBe(count);
});
