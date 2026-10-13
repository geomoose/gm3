// Shared user actions. Drive the page the way a person would; never dispatch
// app actions. Reading the URL hash or downloaded files for assertions is fine.
const fs = require("fs/promises");
const { parse } = require("papaparse");
const { expect } = require("./demo");
const { mode } = require("../settings");

// Map coordinates are EPSG:3857 meters in the demo's Castle Rock area. The live
// demo data and the offline fixture (fixtures/parcels-map.gml) both have a
// parcel at PARCEL_POINT, and SELECT_BOX covers several live parcels.
const PARCEL_POINT = [-10369931, 5551740];
const SELECT_BOX = [
  [-10370887, 5552428],
  [-10368976, 5550899],
];
// Live PINs are long numbers; fixture PINs look like E2E-001.
const PIN = mode === "live" ? /\d{6,}/ : /E2E-\d{3}/;
// The vector parcels "line-color" in examples/desktop/mapbook.xml.
// Update this if the demo's parcel style changes.
const PARCEL_STROKE = [0x00, 0xa1, 0x38];

async function openDesktop(page) {
  await page.goto("/examples/desktop/");
  await expect(
    page.locator("#toolbar").getByText("Select Features", { exact: true })
  ).toBeVisible();
  await expect(page.locator("#map canvas").first()).toBeVisible();
  await page.locator("#catalog .group-label").filter({ hasText: "County Layers" }).click();
}

async function enableVectorParcels(page) {
  const catalog = page.locator("#catalog");
  await catalog.getByRole("checkbox", { name: "Hide layer Parcels", exact: true }).uncheck();
  await catalog.getByRole("checkbox", { name: "Show layer Vector Parcels", exact: true }).check();
  await expect(
    catalog.getByRole("checkbox", { name: "Hide layer Vector Parcels", exact: true })
  ).toBeChecked();
  // Prove parcel outlines reached the canvas, not just the catalog state.
  await expect.poll(() => parcelPixels(page)).toBeGreaterThan(20);
}

async function parcelPixels(page) {
  return page.locator("#map canvas").evaluateAll((canvases, stroke) => {
    let count = 0;
    for (const canvas of canvases) {
      const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
      for (let i = 0; i < data.length; i += 4) {
        const near = stroke.every((value, channel) => Math.abs(data[i + channel] - value) < 24);
        if (data[i + 3] > 200 && near) count++;
      }
    }
    return count;
  }, PARCEL_STROKE);
}

// Convert a map coordinate to a pixel on the map, using the public URL hash.
// This keeps clicks on the same place no matter the screen size.
async function coordinatePixel(page, coordinate) {
  const map = page.locator("#map .ol-viewport");
  await expect(map).toBeVisible();
  await expect.poll(() => page.evaluate(() => location.hash)).toContain("&loc=");
  const hash = await page.evaluate(() => location.hash);
  const values = hash
    .match(/(?:[&#])loc=([^&]+)/)[1]
    .split(";")
    .map(Number);
  // Only the "zxy" location format (resolution;x;y) can be converted.
  expect(values, `Expected loc=resolution;x;y in ${hash}`).toHaveLength(3);
  const [resolution, centerX, centerY] = values;
  expect(Number.isFinite(resolution) && resolution > 0).toBeTruthy();
  const box = await map.boundingBox();
  const pixel = {
    x: box.width / 2 + (coordinate[0] - centerX) / resolution,
    y: box.height / 2 - (coordinate[1] - centerY) / resolution,
  };
  expect(pixel.x).toBeGreaterThan(0);
  expect(pixel.x).toBeLessThan(box.width);
  expect(pixel.y).toBeGreaterThan(0);
  expect(pixel.y).toBeLessThan(box.height);
  return pixel;
}

async function clickMap(page, coordinate, action = "click") {
  const position = await coordinatePixel(page, coordinate);
  await page.locator("#map .ol-viewport")[action]({ position });
}

async function selectParcels(page) {
  await page.locator("#toolbar").getByText("Select Features", { exact: true }).click();
  await page.locator(".draw-tool").getByText("Draw Box", { exact: true }).click();
  await clickMap(page, SELECT_BOX[0]);
  await clickMap(page, SELECT_BOX[1]);
  await page.locator(".service-form .go-button").click();
  await expect(page.locator("#service-tab .results-header")).toContainText("Select Results");
  await expect(parcelRows(page).first()).toBeVisible();
}

function parcelRows(page) {
  return page
    .locator("#results-grid tbody tr")
    .filter({ has: page.getByTitle("Zoom to Parcel", { exact: true }) });
}

async function downloadPDF(page, modal) {
  await expect(modal.getByRole("button", { name: "Print", exact: true })).toBeEnabled();
  await expect(modal.getByAltText("map preview")).toBeVisible();
  const downloading = page.waitForEvent("download");
  await modal.getByRole("button", { name: "Print", exact: true }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  const pdf = await fs.readFile(await download.path());
  expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  expect(pdf.length).toBeGreaterThan(10_000);
}

async function downloadCSV(page) {
  const downloading = page.waitForEvent("download");
  await page.getByTitle("Download results as CSV", { exact: true }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toMatch(/\.csv$/);
  return fs.readFile(await download.path(), "utf8");
}

// The full result set. The grid only mounts the rows on screen.
async function exportedRows(page) {
  const csv = await downloadCSV(page);
  // FileSaver prepends a UTF-8 BOM for spreadsheet compatibility.
  const parsed = parse(csv.replace(/^\uFEFF/, ""), { header: true, skipEmptyLines: true });
  expect(parsed.errors).toEqual([]);
  expect(parsed.meta.fields).toEqual(["PIN", "OWNER_NAME", "CITY", "EMV_TOTAL"]);
  return parsed.data;
}

async function readable(locator) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box.width).toBeGreaterThan(100);
  expect(box.height).toBeGreaterThan(40);
  // Structural readability guard, complemented by screenshots for human review.
  const fontSize = await locator.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(fontSize).toBeGreaterThanOrEqual(12);
}

module.exports = {
  PARCEL_POINT,
  SELECT_BOX,
  PIN,
  openDesktop,
  enableVectorParcels,
  coordinatePixel,
  clickMap,
  selectParcels,
  parcelRows,
  downloadPDF,
  downloadCSV,
  exportedRows,
  readable,
};
