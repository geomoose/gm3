const { test, expect } = require("@playwright/test");
const { mapserverURL, mapfileRoot } = require("../settings");

test("demo MapServer and parcel data are available", async ({ request }, testInfo) => {
  // A successful CGI landing page does not establish that the configured data works.
  const url = new URL(mapserverURL);
  const params = {
    SERVICE: "WFS",
    VERSION: "1.1.0",
    REQUEST: "GetFeature",
    TYPENAME: "ms:parcels",
    SRSNAME: "EPSG:3857",
    MAXFEATURES: "1",
    OUTPUTFORMAT: "text/xml; subtype=gml/2.1.2",
    MAP: `${mapfileRoot}demo/parcels/parcels.map`,
    BBOX: "-10371000,5550000,-10370000,5552000,EPSG:3857",
  };
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await request.get(url.href, { timeout: 30_000 });
  const body = await response.text();
  await testInfo.attach("demo-preflight", { body, contentType: "text/xml" });
  expect(response.ok(), `Demo server unavailable: ${url.href}`).toBeTruthy();
  expect(body, "Demo WFS returned an exception").not.toMatch(/Exception|ServiceException/i);
  expect(body, "Configured demo parcel map returned no features").toContain("<ms:parcels");
});
