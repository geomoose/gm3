// Map-level tools: print options, sketches in prints, Start Over, and the
// basemap toggle. These run in both live and offline modes.
const { test, expect } = require("../helpers/demo");
const {
  PARCEL_POINT,
  openDesktop,
  enableVectorParcels,
  clickMap,
  selectParcels,
  parcelRows,
  downloadPDF,
} = require("../helpers/workflows");

async function openPrint(page) {
  await page.locator("#toolbar").getByText("Print", { exact: true }).click();
  const modal = page.locator("#print-preview");
  await expect(modal.getByRole("button", { name: "Print", exact: true })).toBeEnabled();
  return modal;
}

// Count orange pixels in the print preview. The demo's sketch style is an
// orange outline (#d95f0e) with a yellow-orange fill (#fec44f).
async function orangePixels(modal) {
  const preview = modal.getByAltText("map preview");
  await expect(preview).toBeVisible();
  return preview.evaluate(async (img) => {
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const context = canvas.getContext("2d");
    context.drawImage(img, 0, 0);
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let count = 0;
    for (let i = 0; i < data.length; i += 4) {
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      if (r > 180 && g < r && r - b > 90) count++;
    }
    return count;
  });
}

// Asking for `demo` turns on the network setup and the error checks.
test.beforeEach(async ({ page, demo: _demo }) => {
  await openDesktop(page);
});

test("each print resolution produces a PDF, and higher ones are larger", async ({ page }) => {
  await enableVectorParcels(page);
  const sizes = [];
  for (const label of ["Scale to fit", "Scale to fit (highest resolution)"]) {
    await test.step(label, async () => {
      const modal = await openPrint(page);
      const preview = await modal.getByAltText("map preview").getAttribute("src");
      const scale = modal.locator("select").nth(1);
      await scale.selectOption({ label });
      await expect(scale.locator("option:checked")).toHaveText(label);
      // Changing the resolution redraws the preview.
      if (label !== "Scale to fit") {
        await expect(modal.getByAltText("map preview")).not.toHaveAttribute("src", preview);
      }
      sizes.push((await downloadPDF(page, modal)).length);
    });
  }
  expect(sizes[1]).toBeGreaterThan(sizes[0]);
});

test("a sketch drawn on the map shows up in the print", async ({ page }) => {
  let modal = await openPrint(page);
  const before = await orangePixels(modal);
  await modal.getByRole("button", { name: "Cancel", exact: true }).click();

  // "Drawing and Markup" is the first layer in the catalog.
  await page.locator("#catalog").getByTitle("Open drawing tools", { exact: true }).first().click();
  await page.getByTitle("Add a Polygon to the layer", { exact: true }).click();
  const [x, y] = PARCEL_POINT;
  const size = 1500;
  await clickMap(page, [x - size, y + size]);
  await clickMap(page, [x + size, y + size]);
  await clickMap(page, [x + size, y - size]);
  await clickMap(page, [x - size, y - size], "dblclick");
  // Finishing a shape opens its label and style settings.
  const properties = page.locator(".modal-frame").filter({ hasText: "Edit feature properties" });
  await properties.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(properties).toBeHidden();

  modal = await openPrint(page);
  await expect.poll(() => orangePixels(modal)).toBeGreaterThan(before + 200);
  await downloadPDF(page, modal);
});

test("cancelling Start Over keeps the map and results", async ({ page }) => {
  await enableVectorParcels(page);
  await selectParcels(page);
  const hash = await page.evaluate(() => location.hash);
  // A reload would clear this marker.
  await page.evaluate(() => (window.e2eNoReload = true));

  await page.locator("#toolbar").getByText("Start Over", { exact: true }).click();
  const modal = page.locator(".modal-frame");
  await expect(modal).toContainText("Are you sure you want to start over?");
  await modal.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(modal).toBeHidden();

  expect(await page.evaluate(() => window.e2eNoReload)).toBe(true);
  expect(await page.evaluate(() => location.hash)).toBe(hash);
  await expect(page.locator("#service-tab .results-header")).toHaveText("Select Results");
  await expect(parcelRows(page).first()).toBeVisible();
  await page.getByRole("button", { name: "Catalog", exact: true }).click();
  await expect(
    page
      .locator("#catalog")
      .getByRole("checkbox", { name: "Hide layer Vector Parcels", exact: true })
  ).toBeChecked();
});

test("the basemap toggle and the catalog backgrounds stay in sync", async ({ page }) => {
  // The #basemap-toggle wrapper has no size; use the control inside it.
  const toggle = page.locator("#basemap-toggle .basemap-toggle");
  const chip = (label) => toggle.getByRole("button", { name: label, exact: true });
  const background = (title) =>
    page
      .locator("#catalog")
      .getByRole("radio", { name: new RegExp(`^(Show|Hide) layer ${title}$`) });
  const pickInToggle = async (label) => {
    await toggle.hover();
    await chip(label).click();
  };

  await test.step("toggle to catalog", async () => {
    await pickInToggle("No background");
    await expect(chip("No background")).toHaveAttribute("aria-pressed", "true");
    await expect(background("No background")).toBeChecked();
    await expect(background("OpenStreetMap")).not.toBeChecked();
  });

  await test.step("catalog to a layer in the toggle", async () => {
    await background("Reprojected Regional Aerial").check();
    await expect(chip("Aerial")).toHaveAttribute("aria-pressed", "true");
    await expect(chip("No background")).toHaveAttribute("aria-pressed", "false");
  });

  await test.step("catalog to a layer not in the toggle", async () => {
    await background("ArcGIS Rest Example").check();
    await expect(toggle).toHaveClass(/\binfo\b/);
    await expect(toggle.locator('[aria-pressed="true"]')).toHaveCount(0);
  });

  await test.step("toggle back from a layer not in the toggle", async () => {
    await toggle.locator(".info-indicator").click();
    await chip("OpenStreetMap").click();
    await expect(chip("OpenStreetMap")).toHaveAttribute("aria-pressed", "true");
    await expect(background("OpenStreetMap")).toBeChecked();
    await expect(background("ArcGIS Rest Example")).not.toBeChecked();
    await expect(toggle).not.toHaveClass(/\binfo\b/);
  });
});
