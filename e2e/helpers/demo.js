// The `demo` fixture: points the demos at a MapServer, records query requests,
// and fails the test on browser errors or failed MapServer requests.
const { test: base, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { mode, mapserverURL, mapfileRoot } = require("../settings");

const fixture = (name) => fs.readFileSync(path.join(__dirname, "../fixtures", name), "utf8");
const parcels = fixture("parcels.gml");
const mapParcels = fixture("parcels-map.gml");
const empty =
  '<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs" xmlns:gml="http://www.opengis.net/gml"/>';
// A neutral raster, not a claim that the production basemap renders correctly.
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
  "base64"
);

const ORIGIN = "http://127.0.0.1:4000";
const FIXTURE_PATH = "/e2e-mapserver";
const serviceURL = mode === "live" ? mapserverURL : ORIGIN + FIXTURE_PATH;

// A user's query is a WFS POST (select, identify, search) or a WMS
// GetFeatureInfo GET. WFS GETs are the vector layer loading map features.
function queryText(request) {
  if (!request.url().startsWith(serviceURL)) return null;
  if (request.method() === "POST") return request.postData() || "";
  const params = new URL(request.url()).searchParams;
  const operation = params.get("REQUEST") || params.get("request") || "";
  return operation.toLowerCase() === "getfeatureinfo" ? request.url() : null;
}

const test = base.extend({
  demo: async ({ page }, use, testInfo) => {
    const errors = [];
    const queries = [];
    const unexpected = [];
    const serviceFailures = [];
    const serviceWarnings = [];
    const recordFailure = (url, message) => {
      const params = new URL(url).searchParams;
      // Known catalog-legend issue, outside these workflow assertions:
      // SCALE=0 yields an XML exception, blocked as an image by Chromium ORB.
      // Keep the evidence; never replace the server response.
      const initialLegend =
        params.get("REQUEST") === "GetLegendGraphic" && params.get("SCALE") === "0";
      (initialLegend ? serviceWarnings : serviceFailures).push(message);
    };
    let emptyResults = false;

    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      const query = queryText(request);
      if (query !== null) queries.push(query);
    });
    if (mode === "live") {
      page.on("requestfailed", (request) => {
        if (request.url().startsWith(mapserverURL)) {
          recordFailure(request.url(), `${request.url()}: ${request.failure()?.errorText}`);
        }
      });
      page.on("response", (response) => {
        if (response.url().startsWith(mapserverURL) && response.status() >= 400) {
          recordFailure(response.url(), `${response.status()} ${response.url()}`);
        }
      });
    }

    await page.route("**/*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (/\/examples\/(desktop|mobile)\/config\.js$/.test(url.pathname)) {
        // These key names are the demo's config.js format.
        /* eslint-disable camelcase */
        const config =
          mode === "live"
            ? { mapserver_url: mapserverURL, mapfile_root: mapfileRoot }
            : { mapserver_url: FIXTURE_PATH, mapfile_root: "/fixture/" };
        /* eslint-enable camelcase */
        return route.fulfill({
          contentType: "application/javascript",
          body: `CONFIG = ${JSON.stringify(config)};`,
        });
      }
      // Live mode never substitutes map, tile, legend, or query responses.
      if (mode === "live") return route.continue();
      if (url.pathname === FIXTURE_PATH) {
        const body = request.postData() || "";
        const operation = (
          url.searchParams.get("REQUEST") ||
          url.searchParams.get("request") ||
          ""
        ).toLowerCase();
        if (body.includes("GetFeature") || operation === "getfeature") {
          const reply = request.method() === "GET" ? mapParcels : emptyResults ? empty : parcels;
          return route.fulfill({ contentType: "text/xml", body: reply });
        }
        if (operation === "getmap" || operation === "getlegendgraphic") {
          return route.fulfill({ contentType: "image/png", body: png });
        }
        unexpected.push(request.url());
        return route.fulfill({ status: 400, body: "Unimplemented fixture request" });
      }
      if (url.origin !== ORIGIN) {
        if (/tile\.openstreetmap\.org$/.test(url.hostname)) {
          return route.fulfill({ contentType: "image/png", body: png });
        }
        unexpected.push(request.url());
        return route.abort();
      }
      return route.continue();
    });

    await use({
      queries,
      emptyResults: () => {
        if (mode !== "fixture") throw new Error("Synthetic empty results require E2E_MODE=fixture");
        emptyResults = true;
      },
    });

    await testInfo.attach("service-requests", {
      body: JSON.stringify(queries, null, 2),
      contentType: "application/json",
    });
    if (serviceWarnings.length) {
      await testInfo.attach("known-initial-legend-failures", {
        body: JSON.stringify(serviceWarnings, null, 2),
        contentType: "application/json",
      });
    }
    expect(unexpected, "Unexpected external/fixture requests; add an explicit fixture").toEqual([]);
    expect(errors, "Uncaught browser errors").toEqual([]);
    expect(serviceFailures, "Demo MapServer request failures").toEqual([]);
  },
});

module.exports = { test, expect };
