const { test, expect } = require("../helpers/demo");
const { PARCEL_POINT, coordinatePixel, readable } = require("../helpers/workflows");
const { mode } = require("../settings");

test("mobile catalog toggles layers and returns to a usable map", async ({
  page,
  demo: _demo,
}, testInfo) => {
  await page.goto("/examples/mobile/");
  await expect(page.locator("#map canvas").first()).toBeVisible();
  await page.getByTitle("Show catalog", { exact: true }).tap();
  await page.locator("#catalog .group-label").filter({ hasText: "County Layers" }).tap();
  await page.getByTitle("Hide layer Parcels", { exact: true }).tap();
  await expect(page.getByTitle("Show layer Parcels", { exact: true })).toBeVisible();
  await page.getByTitle("Show layer Parcels", { exact: true }).tap();
  await expect(page.getByTitle("Hide layer Parcels", { exact: true })).toBeVisible();
  await readable(page.locator("#catalog"));
  await page.screenshot({ path: testInfo.outputPath("mobile-catalog.png") });
  await page.getByTitle("Show tools", { exact: true }).tap();
  await expect(page.getByRole("button", { name: "Identify", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Identify", exact: true }).tap();
  await expect(page.locator("#map canvas").first()).toBeVisible();
  const box = await page.locator("#map").boundingBox();
  expect(box.width).toBeGreaterThan(300);
  expect(box.height).toBeGreaterThan(400);
  await page.screenshot({ path: testInfo.outputPath("mobile-map.png") });
});

test("mobile identify returns a real parcel and keeps results readable through navigation", async ({
  page,
  demo: _demo,
}, testInfo) => {
  test.skip(
    mode === "fixture",
    "Requires real MapServer WMS GetFeatureInfo, not a synthetic WFS reply"
  );
  await page.goto("/examples/mobile/");
  await expect(page.locator("#map canvas").first()).toBeVisible();
  await page.getByTitle("Show tools", { exact: true }).tap();
  await page.getByRole("button", { name: "Identify", exact: true }).tap();
  const point = await coordinatePixel(page, PARCEL_POINT);
  const responsePromise = page.waitForResponse((response) =>
    /request=GetFeatureInfo/i.test(response.url())
  );
  await page.locator("#map .ol-viewport").tap({ position: point });
  const response = await responsePromise;
  expect(response.ok()).toBeTruthy();
  const results = page.locator("#service-tab .identify-result");
  await expect(results.first()).toBeVisible();
  await expect(results.first()).toContainText("PIN:");
  await expect(results.first()).toContainText(/\d{10,}/);
  await expect(results.first()).toContainText("Owner Name:");
  const text = await results.first().innerText();
  await readable(page.locator("#service-tab"));
  await page.screenshot({ path: testInfo.outputPath("mobile-identify.png") });
  await page.getByTitle("Show map", { exact: true }).tap();
  await expect(page.locator("#map canvas").first()).toBeVisible();
  await page.getByTitle("Show results", { exact: true }).tap();
  await expect(results.first()).toHaveText(text);
});
