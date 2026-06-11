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

import { asyncBufferFromUrl, parquetMetadataAsync, parquetReadObjects } from "hyparquet";
import { compressors } from "hyparquet-compressors";
import { scrubProperties } from "@gm3/util";

const loadParquet = async (srcName, url) => {
  const file = await asyncBufferFromUrl({ url });
  const metadata = await parquetMetadataAsync(file);
  const geomColumns = metadata.schema.filter((col) => col?.logical_type?.type === "GEOMETRY");

  if (geomColumns.length === 0) {
    postMessage({
      type: "FEATURES_ERROR",
      srcName,
      message: `Failed to find any geometry columns for ${srcName}`,
    });
    return;
  } else if (geomColumns.length > 1) {
    console.warn(
      `[gm3:geoparquet] Multiple geometry columns found for ${srcName}, using the first.`
    );
  }

  const data = await parquetReadObjects({ file, compressors });

  const features = [];

  const geomColumnName = geomColumns[0].name;
  for (const row of data) {
    const geometry = row[geomColumnName];
    const properties = { ...row };
    delete properties[geomColumnName];

    features.push({
      type: "Feature",
      geometry,
      properties: scrubProperties(properties),
    });
  }

  postMessage({
    type: "FEATURES_READY",
    srcName,
    features,
  });
};

self.addEventListener("message", (event) => {
  const eventData = event.data;
  if (eventData.type === "LOAD_PARQUET") {
    const { srcName, url } = eventData;
    loadParquet(srcName, url).catch((err) => {
      postMessage({
        type: "FEATURES_ERROR",
        srcName,
        message: `Failed to load ${srcName}: ${err?.message || err}`,
      });
    });
  }
});
