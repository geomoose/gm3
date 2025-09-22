/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2017, 2025 Dan "Ducky" Little
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

function OSMGeocoder(Application, options) {
  /** Define the title of the service. */
  this.title = options.title ? options.title : "Search address";

  /** Title to show at the top of the results. */
  this.resultsTitle = options.resultsTitle ? options.resultsTitle : "Address search results";

  /** There are no tools for the geocoder, just the search field. */
  this.tools = {};

  /** Aaand the search field. */
  this.fields = [
    {
      name: "address",
      type: "text",
      label: "Address",
    },
  ];

  /** Define the highlight layer */
  this.targetLayer = options.targetLayer ? options.targetLayer : "results/results";

  /** This template is specified in HTML instead of referring to a
   *  layer's set of named templates.  This also makes an assumption about the name
   *  of the application (app), and therefore would need overridden in something
   *  other than the demo application.
   */
  this.template = `
    <div class="serach-results">
      <div style="display: flex">
        <div style="padding-right: 8px">
          <i class="fa fa-search"></i>
        </div>
        <div style="flex: 1">
          <a onClick="app.zoomTo({{ properties.lon }}, {{ properties.lat }}, 18)" class="zoomto-link">
            {{ properties.display_name }}
          </a>
        </div>
      </div>
    </div>
  `;

  this.resultsAsHtml = function (queryid, query) {
    var html = "";

    try {
      // get the addresses from the results set.
      html += Application.renderFeaturesWithTemplate(query, this.targetLayer, this.template);
    } catch (err) {
      // let the user know something went wrong
      html = "There was an error from the geocoding service. Try searching again later.";
      // and output some debugging
      console.error(err);
    }

    return html;
  };

  this.runQuery = function (queryId, query) {
    const layer = this.targetLayer;
    const params = new URLSearchParams({
      format: "geojson",
      q: query.fields[0].value,
      limit: 20,
    });

    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
    return fetch(url, {
      headers: {
        Accept: "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Geocoder request failed: ${response.status}`);
        }
        return response.json();
      })
      .then((geojson) => ({
        layer,
        features: geojson.features.map((feature) => {
          return {
            ...feature,
            properties: {
              ...feature.properties,
              lon: feature.geometry.coordinates[0],
              lat: feature.geometry.coordinates[1],
            },
          };
        }),
      }));
  };

  /** Query the OSM Geocoder Service
   */
  this.query = function (selection, fields) {
    Application.dispatchQuery(this.name, selection, fields, []);
  };
}

if (typeof module !== "undefined") {
  module.exports = OSMGeocoder;
}
