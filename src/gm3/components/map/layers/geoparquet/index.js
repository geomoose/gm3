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

/** Load a GeoParquet file in a worker and return its contents
 *  as OpenLayers features in the map projection.
 *
 *  @param srcName The name of the map-source.
 *  @param url     The URL of the GeoParquet file.
 *
 *  @returns A Promise resolving to a list of OpenLayers features.
 */
export const fetchGeoParquetFeatures = (srcName, url) =>
  new Promise((resolve, reject) => {
    const parquetWorker = new Worker(
      new URL(/* webpackChunkName: "parquet-worker" */ "./worker.js", import.meta.url)
    );

    const settle = (fn, value) => {
      parquetWorker.terminate();
      fn(value);
    };

    parquetWorker.addEventListener("error", (err) => settle(reject, err));

    parquetWorker.addEventListener("message", (event) => {
      const eventData = event.data;
      if (eventData.srcName !== srcName) {
        return;
      }
      if (eventData.type === "FEATURES_READY") {
        settle(
          resolve,
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
      } else if (eventData.type === "FEATURES_ERROR") {
        settle(reject, new Error(eventData.message));
      }
    });

    parquetWorker.postMessage({
      type: "LOAD_PARQUET",
      srcName,
      url,
    });
  });

export const createGeoParquetLoader = (srcName, url) => {
  return function (extent, resolution, projection, success, failure) {
    fetchGeoParquetFeatures(srcName, url)
      .then((features) => {
        // silently remove features
        this.clear(true);
        this.addFeatures(features);
        success(features);
      })
      .catch((err) => {
        console.error("error loading parquet data=", srcName, err);
        if (failure) {
          failure();
        }
      });
  };
};
