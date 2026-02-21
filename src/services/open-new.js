/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2026 Dan "Ducky" Little
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

/** Open New Service.
 *
 * When a user clicks on a map, open a new window at that coordinate!
 *
 */
function OpenNewService(Application, options) {
  /** Define the title of the service. */
  this.title = options.title ? options.title : "Jump to external service";

  /** Title to show at the top of the results. */
  this.resultsTitle = options.resultsTitle ? options.resultsTitle : "Open Results";

  this.showGrid = false;

  this.showHeader = false;

  /** Name will be set by the application when the service is registered. */
  this.name = "";

  /** Limit the number of selection tools available */
  this.tools = { Point: true, default: "Point" };

  /** autoGo = true instructs the service to query whenever
   *                the geometry has changed.
   */
  this.autoGo = true;

  /** keepAlive = true will keep the service in 'query mode'
   *                   in the background, until it is explictly turned off.
   */
  this.keepAlive = true;

  /** User input fields, there are none for identify */
  this.fields = [];

  this.getUrl = function (selection) {
    const [x, y] = selection[0].geometry.coordinates;
    const [lon, lat] = Application.toLonLat(x, y);
    return options.url.replace("{{lat}}", lat).replace("{{lon}}", lon);
  };

  /** This function is called everytime there is an identify query.
   *
   *  @param selection contains a GeoJSON feature describing the
   *                   geography to be used for the query.
   *
   *  @param fields    is an array containing any user-input
   *                   given to the service.
   */
  this.query = function (selection, fields) {
    window.open(this.getUrl(selection));
    Application.dispatchQuery(this.name, selection, [], [], []);
  };

  /** resultsAsHtml is the function used to populate the Service Tab
   *                after the service has finished querying.
   */
  this.resultsAsHtml = function (queryId, query) {
    const html = `
      <div>
        <a target="_blank" href="${this.getUrl(query.selection)}">Opened</a> in a new tab.
      </div>
    `;
    return html;
  };
}

if (typeof module !== "undefined") {
  module.exports = OpenNewService;
}
