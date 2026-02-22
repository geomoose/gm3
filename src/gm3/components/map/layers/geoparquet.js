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

import { asyncBufferFromUrl, parquetReadObjects } from "hyparquet";
import { compressors } from "hyparquet-compressors";
import GeoJSON from "ol/format/GeoJSON";
import { scrubProperties } from "@gm3/util";

export const createGeoParquetLoader = (url) => {
  return async function (extent, resolution, projection, success, failure) {
    const file = await asyncBufferFromUrl({ url });
    const data = await parquetReadObjects({ file, compressors });
    // TODO: Test for zero data

    // TODO: This should be done via a sniff
    const geometryColumns = ["geom", "geometry"];
    let geometryColumn = "";
    const allColumns = Object.keys(data[0]);
    for (const testCol of geometryColumns) {
      if (allColumns.includes(testCol)) {
        geometryColumn = testCol;
        break;
      }
    }

    // if there is no geometry column, bail early
    if (!geometryColumn) {
      console.error("Failed to find geometry column in: ", url);
      return;
    }

    const rowToFeature = (row) => {
      const geometry = row[geometryColumn];
      const properties = row;
      // remove the geometry column from the properties
      delete properties[geometryColumn];

      return {
        type: "Feature",
        properties: scrubProperties(properties),
        geometry,
      };
    };

    const features = data.map(rowToFeature);

    // silently remove features
    this.clear(true);
    this.addFeatures(
      new GeoJSON({
        featureProjection: "EPSG:3857",
        dataProjection: "EPSG:4326",
      }).readFeatures({
        type: "FeatureCollection",
        features,
      })
    );

    success();
  };
};
