# E2E tests: notes for contributors

To install, run, or debug these tests, read
[docs/e2e-testing.md](../docs/e2e-testing.md). This file covers how the code
is laid out and the rules to follow when you change it.

## Files

| File                              | What it does                                                                                 |
| --------------------------------- | -------------------------------------------------------------------------------------------- |
| `settings.js`                     | Picks live or offline mode and the demo server settings.                                     |
| `playwright.config.js`            | Browser projects, timeouts, and the dev server.                                              |
| `playwright.fixture.config.js`    | Turns on offline mode, then loads the main config.                                           |
| `helpers/demo.js`                 | The `demo` fixture: network setup, query log, and error checks.                              |
| `helpers/workflows.js`            | Shared user actions, map coordinates, downloads, and checks.                                 |
| `fixtures/parcels-map.gml`        | Offline parcels for drawing the map (EPSG:3857 meters).                                      |
| `fixtures/parcels.gml`            | Offline parcels for query replies (CRS:84 longitude/latitude).                               |
| `tests/demo-setup.js`             | Live only. Checks the demo server before other tests run.                                    |
| `tests/desktop.spec.js`           | Core desktop tasks: layers, identify, select, buffer, print.                                 |
| `tests/desktop-workflows.spec.js` | Follow-up tasks: grid tools, reports, search, bookmarks, and more.                           |
| `tests/desktop-queries.spec.js`   | Identify, select, and search in a row; PIN list search; empty results; the Select layer bug. |
| `tests/desktop-map.spec.js`       | Print resolution, sketches in prints, Start Over, and the basemap toggle.                    |
| `tests/mobile.spec.js`            | Mobile demo with touch.                                                                      |

## Rules

- **Act like a user.** Click, type, and draw. Never dispatch Redux actions to
  stand in for a user. Reading the URL hash or a downloaded file to check a
  result is fine.
- **Write each workflow once.** Tests run in both modes. Use the helpers in
  `workflows.js` so the same steps work against live and offline data. Use
  `test.skip(mode === ...)` only when a test truly cannot work in one mode.
- **Leave rules to unit tests.** If a check is about how a function decides
  something (sort order, filter math, scale limits), write a Jest test in
  `tests/`. The e2e test should only show that the screen uses that function.
- **Request the `demo` fixture in every test.** It turns on the network setup
  and the error checks. Write `demo: _demo` when the test does not use it.
- **Click map coordinates, not pixels.** Use `clickMap(page, coordinate)`. It
  turns an EPSG:3857 coordinate into a pixel from the map's URL hash, so it
  works at any screen size.
- **Mark known bugs with `test.fail()`.** Add a comment that names the bug
  and says to remove `test.fail()` once it is fixed.
- **Never fall back to fixtures in live mode.** If the live server is down,
  the test should fail.
- **Keep both fixture files in step.** If you add or move a test parcel,
  change both GML files.

## Pitfalls

- Look for layer controls inside `#catalog`, and use checkbox or radio roles.
  The Visible tab repeats the same controls, and the layer name button has the
  same title.
- On desktop, `#map` has no height. Click `#map .ol-viewport` instead.
- Click the draw tool's label text, not the empty part of its row.
- Icon text is part of a button's name, so some buttons need a CSS selector
  like `.go-button` for now.
- Print and report wrappers may have no size. Check `.modal-frame` and the
  parts inside it.
- The fixture queries use `CRS:84`. With EPSG:4326, GML puts latitude first,
  and the parcels end up in the wrong place even though their text looks
  right. The parcel pixel, zoom, and buffer checks catch this.
- The grid only draws the rows that fit on screen. To compare the whole result
  set, download the CSV with `exportedRows()`.
- CSV files start with a byte order mark. `exportedRows()` removes it and
  parses with Papa Parse, because values can contain commas and quotes.
- The Visible tab's checkbox disappears when you click it. Click it, then
  check the Catalog tab, instead of calling `uncheck()`.
- Finishing a sketch opens an "Edit feature properties" dialog. Save or close
  it before you click anything else.
- `#basemap-toggle` has no size. Hover and click inside
  `#basemap-toggle .basemap-toggle`.
- Search results are listed in the Super Tab, not in the grid.
- Going to a bookmark URL on the same page does not reload the app. Call
  `page.reload()`, and clear local storage first so the test checks only the
  link.
