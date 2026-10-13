# End-to-end tests

The end-to-end (e2e) tests open the GeoMoose demos in a real browser. They
click, type, and draw the way a person would. Then they check that the app
did the right thing.

The tests use [Playwright](https://playwright.dev/). They live in the `e2e/`
folder. They are separate from the unit tests that `npm test` runs.

## What the tests cover

The tests cover the tasks people do most often:

- Turning layers on and off, and picking a background map.
- Identifying a parcel by clicking on the map.
- Selecting parcels by drawing a box or a polygon.
- Buffering a parcel, or all results, and selecting again.
- Sorting and filtering the results grid.
- Zooming to a parcel, removing a parcel, and hiding the grid.
- Downloading results as a CSV file.
- Printing a map, a parcel report, and a results report as PDF files.
- Searching for parcels by owner.
- Keeping Favorites, Visible, and Catalog in sync.
- Opening a bookmark link.
- Using the mobile demo with touch.

Rules inside the app, like how sorting orders values, are checked by the unit
tests instead. The e2e tests only check that the screens use those rules.

## Two ways to run

**Live mode** is the default. It uses the real GeoMoose demo map server at
`https://demo.geomoose.org`. This proves that the app and the server work
together. It needs an internet connection the whole time.

**Offline mode** uses small, saved test files in `e2e/fixtures/`. It does not
need the internet. It is faster and gives the same answer every time. It does
not prove that the demo server works.

Most tests run in both modes. Two do not:

- The mobile identify test runs only in live mode. It needs a real WMS
  server reply.
- The empty-results test runs only in offline mode. Only the saved data can
  promise no results.

## Set up

You need Node.js 20 or newer. Run these commands from the top folder of the
project:

```sh
npm ci
npm ci --prefix examples/mobile
npx playwright install chromium
```

The second command installs Bootstrap and jQuery for the mobile demo.

On Linux, the browser may need extra system packages. To install them, run:

```sh
npx playwright install --with-deps chromium
```

You do not need your own map server, demo data, or API keys.

## Run the tests

| To do this                      | Run this                                         |
| ------------------------------- | ------------------------------------------------ |
| Run all tests in live mode      | `npm run test:e2e`                               |
| Run all tests in offline mode   | `npm run test:e2e:offline`                       |
| Run only the desktop tests      | `npm run test:e2e -- --project=desktop-chromium` |
| Run only the mobile tests       | `npm run test:e2e -- --project=mobile-chromium`  |
| Run tests whose name matches    | `npm run test:e2e -- --grep "bookmark"`          |
| Watch the browser as it runs    | `npm run test:e2e -- --headed --workers=1`       |
| Open the point-and-click runner | `npm run test:e2e:ui`                            |
| Open the last report            | `npm run test:e2e:report`                        |

The tests start the demo web server on port 4000 for you. This takes a minute
or two the first time.

If a server is already running on port 4000, the tests use it. Make sure it is
this project's `npm start` server. If you are not sure, stop it and let the
tests start a fresh one.

**On a slower computer**, add `--workers=1`. This runs one test at a time. It
takes longer, but it avoids failures caused by the computer running out of
memory. For example:

```sh
npm run test:e2e:offline -- --workers=1
```

## Read the results

Each test prints a line as it finishes. At the end you see how many tests
passed, failed, or were skipped.

Results are saved in two folders. Git ignores both of them.

- `e2e/report/` holds the HTML report. Open it with `npm run test:e2e:report`.
- `e2e/test-results/` holds screenshots from important steps. When a test
  fails, it also holds a video and a trace of that test.

To step through a failed test, open its trace:

```sh
npx playwright show-trace e2e/test-results/<test-folder>/trace.zip
```

Each test also saves a `service-requests` file. It lists the queries the app
sent to the map server.

## When a test fails

1. **Live mode only: check the `demo-setup` test first.** It asks the demo
   server for one parcel before any other test runs. If it fails, the demo
   server is down or its data has changed. The other tests do not run. This
   is not a bug in GeoMoose.
2. **Run the same test in offline mode.** If it passes offline but fails
   live, the problem is probably the server or the network.
3. **Look for a timeout while the app starts.** This usually means the
   computer was too busy. Try again with `--workers=1`.
4. **Open the trace or video.** It shows what the browser saw at each step.

A test also fails when:

- the browser shows a JavaScript error, or
- a request to the map server fails, or
- in offline mode, the app asks for something that has no saved test file.

## Use a different demo server

By default, live mode uses these settings:

```js
CONFIG = {
  mapserver_url: "https://demo.geomoose.org/cgi-bin/mapserv",
  mapfile_root: "/srv/demo/src/3.x/gm3-demo-data/",
};
```

To use another server, set both values before you run the tests:

```sh
E2E_MAPSERVER_URL=https://your-server.example/cgi-bin/mapserv \
E2E_MAPFILE_ROOT=/srv/your-demo/gm3-demo-data/ \
npm run test:e2e
```

The other server must:

- serve the same GeoMoose demo map files and parcel data,
- allow requests from the browser (CORS), and
- have a map file root that ends with `/`.

These defaults are kept in `e2e/settings.js`.

Live mode replaces only the demo's `config.js` file. All maps, legends, tiles,
and query results come from the real servers.

## Run the tests on GitHub

The GitHub workflow is **optional**. It never runs on its own, and it never
blocks a pull request.

To run it:

1. Open the **Actions** tab on GitHub.
2. Pick **GeoMoose End-to-End Tests**.
3. Click **Run workflow**.
4. Pick `live` or `offline`, then start the run.

When the run ends, download the `playwright-results` file from the run's page.
It holds the report and the screenshots.

## Known issues

- **Legend errors at start-up (live mode).** When the app first loads, it asks
  for catalog legends with `SCALE=0`. The demo server sends back an error, and
  the browser blocks it. The tests save these errors in a file called
  `known-initial-legend-failures`. They do not fail the test. Other server
  errors still fail the test.
- **Fixed map locations.** The tests click on the Castle Rock area of the
  demo data. If the demo data moves or changes, update the coordinates at the
  top of `e2e/helpers/workflows.js`.
- **Parcel color.** One check counts parcel outline pixels of a set color. If
  the demo's parcel style changes, update `PARCEL_STROKE` in the same file.
- **Chromium only.** The tests do not run in Firefox or Safari yet.

## What a person should still check

The tests check that things work. They do not judge how things look.
Screenshots are saved for people to review, but they are not compared to
approved pictures.

Before a release, a person should check these by eye:

- **Map readability.** Turn on parcels, boundaries, labels, and aerial photos
  at a few zoom levels. Parcel outlines and text should be easy to read. The
  toolbar and results should not cover the parcel you are looking at.
- **Selection shape.** Draw around an odd-shaped parcel. The selected parcels
  should match what you drew. Buffer by 100 feet and check that the added
  parcels make sense.
- **Printed pages.** Print a landscape map, a portrait map, and a parcel
  report. Check the title, legend, parcel details, and scale bar. Nothing
  should be cut off or overlap, and the text should be large enough to read.

Write down the layers, map location, and what you saw. Save the screenshots or
PDFs. If you are not sure something is right, ask someone else to look.

## Ideas for later

These changes to GeoMoose would make the tests simpler and sturdier:

- Add stable IDs for layers, tools, and result rows, like
  `data-layer-path`. Then tests do not depend on English labels.
- Link every form label to its input, and hide icon text from screen
  readers. Then tests can find buttons by name instead of by CSS class.
- Mark dialogs with `role="dialog"` and a title.
- Show when a query, layer, or print preview is done loading, for example
  with `aria-busy`. Then tests can wait for that instead of guessing.

More tests to add later include line and multi-point selection, measuring,
cancelling a query, server errors, Start Over, keyboard use, checking the
text inside PDFs, and other browsers.
