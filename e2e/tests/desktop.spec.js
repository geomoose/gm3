// Core desktop workflows. These run in both live and offline modes.
const { test, expect } = require("../helpers/demo");
const {
  PARCEL_POINT,
  PIN,
  openDesktop,
  enableVectorParcels,
  clickMap,
  selectParcels,
  parcelRows,
  downloadPDF,
  downloadCSV,
  readable,
} = require("../helpers/workflows");
const { mode } = require("../settings");

// Asking for `demo` turns on the network setup and the error checks.
test.beforeEach(async ({ page, demo: _demo }) => {
  await openDesktop(page);
});

test("layers turn on and off and only one background shows at a time", async ({
  page,
}, testInfo) => {
  const catalog = page.locator("#catalog");
  await catalog.getByRole("checkbox", { name: "Hide layer Parcels", exact: true }).uncheck();
  await expect(
    catalog.getByRole("checkbox", { name: "Show layer Parcels", exact: true })
  ).not.toBeChecked();
  await catalog.getByRole("checkbox", { name: "Show layer Parcels", exact: true }).check();
  await expect(
    catalog.getByRole("checkbox", { name: "Hide layer Parcels", exact: true })
  ).toBeChecked();
  await catalog.getByRole("radio", { name: "Show layer No background", exact: true }).check();
  await expect(
    catalog.getByRole("radio", { name: "Hide layer No background", exact: true })
  ).toBeChecked();
  await catalog.getByRole("radio", { name: "Show layer OpenStreetMap", exact: true }).check();
  await expect(
    catalog.getByRole("radio", { name: "Hide layer OpenStreetMap", exact: true })
  ).toBeChecked();
  await expect(
    catalog.getByRole("radio", { name: "Show layer No background", exact: true })
  ).not.toBeChecked();
  await readable(catalog);
  await page.screenshot({ path: testInfo.outputPath("layers.png") });
});

test("identify a parcel on a newly turned-on layer", async ({ page, demo }, testInfo) => {
  await enableVectorParcels(page);
  await page.locator("#toolbar").getByText("Identify", { exact: true }).click();
  await clickMap(page, PARCEL_POINT);
  const results = page.locator("#service-tab .results");
  await expect(results).toContainText("PIN:");
  await expect(results).toContainText("Owner Name:");
  await expect(results).toContainText(PIN);
  expect(demo.queries.some((body) => body.includes("Filter") && body.includes("parcels"))).toBe(
    true
  );
  await readable(results);
  await page.screenshot({ path: testInfo.outputPath("identify.png") });
});

test("select parcels, zoom to one, export CSV, and remove one", async ({
  page,
  demo,
}, testInfo) => {
  await enableVectorParcels(page);
  await selectParcels(page);
  expect(demo.queries.at(-1)).toContain("Polygon");
  const row = parcelRows(page).first();
  const pin = (await row.locator("td").nth(0).innerText()).trim();
  const owner = (await row.locator("td").nth(1).innerText()).trim();
  expect(pin).toMatch(PIN);
  expect(owner.length).toBeGreaterThan(0);
  await readable(page.locator("#results-grid"));
  await page.screenshot({ path: testInfo.outputPath("selection.png") });

  const hash = await page.evaluate(() => location.hash);
  await row.getByTitle("Zoom to Parcel", { exact: true }).click();
  await expect.poll(() => page.evaluate(() => location.hash)).not.toBe(hash);

  const csv = await downloadCSV(page);
  expect(csv).toContain(pin);
  expect(csv).toContain(owner);

  await row.getByTitle("Remove from results", { exact: true }).click();
  await page.getByRole("button", { name: "Okay", exact: true }).click();
  await expect(page.locator("#results-grid")).not.toContainText(pin);
});

test("buffer a selected parcel and print its feature report", async ({ page, demo }, testInfo) => {
  await enableVectorParcels(page);
  await selectParcels(page);
  await parcelRows(page).first().getByTitle("Buffer feature", { exact: true }).click();
  const form = page.locator(".service-form");
  await form.getByRole("textbox", { name: "With buffer", exact: true }).fill("100");
  const count = demo.queries.length;
  await form.locator(".go-button").click();
  await expect.poll(() => demo.queries.length).toBeGreaterThan(count);
  expect(demo.queries.at(-1)).toContain("Polygon");
  await expect(parcelRows(page).first()).toBeVisible();

  await parcelRows(page).first().getByTitle("Feature report", { exact: true }).click();
  const modal = page.locator("#report-preview");
  await readable(modal.locator(".modal-frame"));
  await page.screenshot({ path: testInfo.outputPath("feature-report.png") });
  await downloadPDF(page, modal);
});

test("customize, cancel, and download a printed map", async ({ page }, testInfo) => {
  // Include a rendered parcel layer in the printed map.
  await enableVectorParcels(page);
  await page.locator("#toolbar").getByText("Print", { exact: true }).click();
  const modal = page.locator("#print-preview");
  await expect(modal.getByRole("button", { name: "Print", exact: true })).toBeEnabled();
  await modal.getByRole("textbox").fill("GeoMoose E2E Map");
  await modal.locator("select").first().selectOption({ label: "Letter - Portrait" });
  await readable(modal.locator(".modal-frame"));
  await page.screenshot({ path: testInfo.outputPath("print-preview.png") });
  await modal.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(modal.getByRole("button", { name: "Print", exact: true })).toBeHidden();
  await page.locator("#toolbar").getByText("Print", { exact: true }).click();
  await downloadPDF(page, modal);
});

test("an empty selection shows a clear message", async ({ page, demo }) => {
  test.skip(mode === "live", "Needs a guaranteed empty reply from the offline fixture");
  await enableVectorParcels(page);
  demo.emptyResults();
  await page.locator("#toolbar").getByText("Select Features", { exact: true }).click();
  await page.locator(".draw-tool").getByText("Draw Point", { exact: true }).click();
  await clickMap(page, PARCEL_POINT);
  await page.locator(".service-form .go-button").click();
  await expect(page.locator("#service-tab")).toContainText("Your query did not return any results");
  await readable(page.locator("#service-tab"));
});
