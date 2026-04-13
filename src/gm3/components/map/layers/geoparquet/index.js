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

import GeoJSON from "ol/format/GeoJSON";

const parquetWorker = new Worker(new URL("./worker.js", import.meta.url));

export const createGeoParquetLoader = (srcName, url) => {
  return async function (extent, resolution, projection, success) {
    parquetWorker.postMessage({
      type: "LOAD_PARQUET",
      srcName,
      url,
    });

    parquetWorker.addEventListener("error", (err) => {
      console.error("error loading parquet data=", srcName, err);
    });

    parquetWorker.addEventListener("message", (event) => {
      const eventData = event.data;
      if (eventData.type === "FEATURES_READY" && eventData.srcName === srcName) {
        // silently remove features
        this.clear(true);
        this.addFeatures(
          new GeoJSON({
            featureProjection: "EPSG:3857",
            dataProjection: "EPSG:4326",
          })
            .readFeatures({
              type: "FeatureCollection",
              features: eventData.features,
            })
            .map((feature) => {
              feature.setProperties(
                {
                  ...feature.getProperties(),
                  // boundedBy bug caught by Mariana...
                  boundedBy: feature.getGeometry().getExtent(),
                },
                true
              );
              return feature;
            })
        );
        success();
      }
    });
  };
};
