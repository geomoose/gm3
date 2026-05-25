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

/** Collection of functions for defining Cloud Optimized GeoTIFF layers
 *  in a GeoMoose map.
 */

import GeoTIFFSource from "ol/source/GeoTIFF";
import WebGLTileLayer from "ol/layer/WebGLTile";

function defineSource(mapSource) {
  return {
    sources: mapSource.urls.map((url) => ({ url })),
  };
}

export function createLayer(mapSource) {
  return new WebGLTileLayer({
    source: new GeoTIFFSource(defineSource(mapSource)),
    minResolution: mapSource.minresolution,
    maxResolution: mapSource.maxresolution,
  });
}

export function updateLayer(map, layer, mapSource) {
  const src = layer.getSource();
  const currentUrls = src.getSourceOptions ? src.getSourceOptions().map((s) => s.url) : [];
  const nextUrls = mapSource.urls;

  let changed = currentUrls.length !== nextUrls.length;
  if (!changed) {
    for (let i = 0; i < nextUrls.length; i++) {
      if (currentUrls[i] !== nextUrls[i]) {
        changed = true;
        break;
      }
    }
  }

  if (changed) {
    layer.setSource(new GeoTIFFSource(defineSource(mapSource)));
  }
}
