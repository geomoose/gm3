// Identify, select, and search: chaining them, empty results, and which
// layer a selection uses. These run in both live and offline modes.
const { test, expect } = require("../helpers/demo");
const {
  PARCEL_POINT,
  PIN,
  openDesktop,
  enableVectorParcels,
  clickMap,
  selectParcels,
  parcelRows,
  exportedRows,
} = require("../helpers/workflows");
const { mode } = require("../settings");

// A search term that matches nothing in the demo data or the address search.
const NO_MATCH = "ZZQX E2E NO MATCH";

function header(page) {
  return page.locator("#service-tab .results-header");
}

function featureCount(page) {
  return page.locator("#service-tab .features-count .value");
}

async function openSearch(page, title) {
  await page.locator("#toolbar").getByText("Search", { exact: true }).click();
  await page.locator("#toolbar").getByText(title, { exact: true }).click();
  return page.locator(".service-form");
}

async function identify(page, coordinate) {
  await page.locator("#toolbar").getByText("Identify", { exact: true }).click();
  if (coordinate) {
    await clickMap(page, coordinate);
  } else {
    await page.locator("#map .ol-viewport").click();
  }
  await expect(header(page)).toHaveText("Identify Results");
}

async function expectNoResults(page) {
  await expect(featureCount(page)).toHaveText("0");
  await expect(page.locator("#service-tab")).toContainText("Your query did not return any results");
}

// A WFS query for the parcels layer, as opposed to a map load or another layer.
const parcelQueries = (queries) => queries.filter((body) => body.includes("ms:parcels"));

// Asking for `demo` turns on the network setup and the error checks.
test.beforeEach(async ({ page, demo: _demo }) => {
  await openDesktop(page);
});

test("each identify, selection, and search replaces the last results", async ({ page, demo }) => {
  await enableVectorParcels(page);
  const results = page.locator("#service-tab .results");

  await identify(page, PARCEL_POINT);
  await expect(results).toContainText("PIN:");

  await selectParcels(page);
  await expect(header(page)).toHaveText("Select Results");
  await expect(results).not.toContainText("PIN:");
  const owner = (await parcelRows(page).first().locator("td").nth(1).innerText()).trim();
  const selectedForOwner = (await exportedRows(page)).filter((row) => row.OWNER_NAME === owner);

  const form = await openSearch(page, "Search Parcels");
  await form.getByRole("textbox", { name: "Owner Name", exact: true }).fill(owner);
  await form.locator(".go-button").click();
  await expect(header(page)).toHaveText("Search Results");
  // The search must cover the whole layer, not just the last selection shape.
  const searchQuery = demo.queries.at(-1);
  expect(searchQuery).toContain("OWNER_NAME");
  expect(searchQuery).not.toMatch(/Polygon|Envelope|BBOX/i);
  // Search results are listed in the Super Tab, not the grid.
  const found = page.locator("#service-tab .search-result");
  await expect(found.first()).toBeVisible();
  expect(Number(await featureCount(page).innerText())).toBeGreaterThanOrEqual(
    selectedForOwner.length
  );
  await expect(page.locator("#results-grid .gm-grid")).toBeHidden();
  if (mode === "live") {
    // The offline fixture returns the same parcels for every query.
    for (const text of await found.allInnerTexts()) expect(text).toContain(owner);
  }

  await identify(page, PARCEL_POINT);
  await expect(results).toContainText("PIN:");
  await expect(page.locator("#service-tab")).not.toContainText("Search Results");
});

test("every search type shows a clear message when nothing matches", async ({ page, demo }) => {
  if (mode === "fixture") demo.emptyResults();
  const searches = [
    ["Search Parcels", "Owner Name"],
    ["Single field search", "Search"],
    ["Search Runways", "Name"],
    ["Search by PIN list", "PINs"],
    ["Geocode an Address", "Address"],
  ];
  for (const [title, field] of searches) {
    await test.step(title, async () => {
      const form = await openSearch(page, title);
      await form.getByRole("textbox", { name: field, exact: true }).fill(NO_MATCH);
      await form.locator(".go-button").click();
      await expectNoResults(page);
    });
  }
});

test("a comma separated list of PINs finds each of those parcels", async ({ page, demo }) => {
  await enableVectorParcels(page);
  await selectParcels(page);
  const rows = await exportedRows(page);
  const pins = [...new Set(rows.map((row) => row.PIN).filter((pin) => PIN.test(pin)))].slice(0, 3);
  expect(pins.length).toBeGreaterThan(1);

  const form = await openSearch(page, "Search by PIN list");
  // Mixed spacing and a trailing comma, like a list pasted from a spreadsheet.
  const list = pins.map((pin, i) => (i % 2 ? ` ${pin} ` : pin)).join(",") + ",";
  await form.getByRole("textbox", { name: "PINs", exact: true }).fill(list);
  await form.locator(".go-button").click();
  await expect(header(page)).toHaveText("Search Results");

  const query = demo.queries.at(-1);
  expect(query).not.toMatch(/Polygon|Envelope|BBOX/i);
  for (const pin of pins) expect(query).toContain(`>${pin}<`);
  const results = page.locator("#service-tab .search-result");
  for (const pin of pins) await expect(results.filter({ hasText: pin }).first()).toBeVisible();
  expect(Number(await featureCount(page).innerText())).toBeGreaterThanOrEqual(pins.length);
  if (mode === "live") {
    // Only the listed parcels come back. The offline fixture ignores the filter.
    for (const text of await results.allInnerTexts()) {
      expect(
        pins.some((pin) => text.includes(pin)),
        text
      ).toBe(true);
    }
  }
});

test("identify where there is no data returns zero results", async ({ page, demo }) => {
  if (mode === "fixture") demo.emptyResults();
  const hash = await page.evaluate(() => location.hash);
  // Duluth is far outside the demo's parcel data.
  await page.locator("#jump-to-extent select").selectOption({ label: "Duluth harbor" });
  await expect.poll(() => page.evaluate(() => location.hash)).not.toBe(hash);
  await identify(page);
  await expectNoResults(page);
});

// Known bug: after its layer is turned off, Select still queries that layer,
// even though the layer list no longer offers it. test.fail() marks this as
// expected to fail. Once the bug is fixed, Playwright reports
// "Expected to fail, but passed"; then remove test.fail().
for (const returnBy of ["Super Tab", "toolbar"]) {
  test(`selection uses the layer in the list after the layer is turned off (back by ${returnBy})`, async ({
    page,
    demo,
  }) => {
    test.fail();
    await enableVectorParcels(page);
    await page.locator("#toolbar").getByText("Select Features", { exact: true }).click();
    const layerList = page.locator(".service-form .service-input.select select");
    await expect(layerList).toHaveValue("vector-parcels/parcels");

    await page.getByRole("button", { name: "Catalog", exact: true }).click();
    await page
      .locator("#catalog")
      .getByRole("checkbox", { name: "Hide layer Vector Parcels", exact: true })
      .uncheck();
    if (returnBy === "Super Tab") {
      await page.getByRole("button", { name: "Super Tab", exact: true }).click();
    } else {
      await page.locator("#toolbar").getByText("Select Features", { exact: true }).click();
    }
    // Only visible layers are offered, so parcels should leave the list.
    await expect(layerList.locator('option[value="vector-parcels/parcels"]')).toHaveCount(0);
    const chosen = await layerList.inputValue();

    const before = parcelQueries(demo.queries).length;
    await page.locator(".draw-tool").getByText("Draw Point", { exact: true }).click();
    await clickMap(page, PARCEL_POINT);
    await page.locator(".service-form .go-button").click();
    await expect(header(page)).toBeVisible();
    // Parcels are off and not chosen in the list, so they must not be queried.
    const parcelQueryCount = parcelQueries(demo.queries).length - before;
    expect(parcelQueryCount, `Layer list shows "${chosen}"`).toBe(0);
  });
}
