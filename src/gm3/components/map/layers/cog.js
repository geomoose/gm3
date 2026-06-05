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

const COG_KEY = "_gm3_cog_key";

function parseBands(value) {
  if (typeof value !== "string" || value === "") {
    return undefined;
  }
  const tokens = value.split(",").map((b) => b.trim());
  const bands = [];
  for (const tok of tokens) {
    if (!/^\d+$/.test(tok)) {
      console.warn(`cog: ignoring invalid band token "${tok}" in "${value}"`);
      return undefined;
    }
    const n = parseInt(tok, 10);
    if (n < 1) {
      console.warn(`cog: band indices are 1-based; got ${n}`);
      return undefined;
    }
    bands.push(n);
  }
  return bands.length > 0 ? bands : undefined;
}

function withCacheBuster(url, buster) {
  if (!buster) {
    return url;
  }
  const sep = url.indexOf("?") >= 0 ? "&" : "?";
  return `${url}${sep}_=${buster}`;
}

function defineSource(mapSource, cacheBuster) {
  if (!Array.isArray(mapSource.urls) || mapSource.urls.length === 0) {
    throw new Error(`cog map-source "${mapSource.name || ""}" requires at least one <url>`);
  }
  const bands = parseBands(mapSource.params && mapSource.params.bands);
  return {
    sources: mapSource.urls.map((url) => {
      const u = withCacheBuster(url, cacheBuster);
      return bands ? { url: u, bands: [...bands] } : { url: u };
    }),
    convertToRGB: true,
  };
}

function cogKey(mapSource) {
  const params = mapSource.params || {};
  return JSON.stringify([mapSource.urls || [], params.bands || null]);
}

function rebuildSource(layer, mapSource, cacheBuster) {
  const prev = layer.getSource();
  layer.setSource(new GeoTIFFSource(defineSource(mapSource, cacheBuster)));
  if (prev && typeof prev.dispose === "function") {
    prev.dispose();
  }
}

export function createLayer(mapSource) {
  const layer = new WebGLTileLayer({
    source: new GeoTIFFSource(defineSource(mapSource)),
    minResolution: mapSource.minresolution,
    maxResolution: mapSource.maxresolution,
  });
  layer.set(COG_KEY, cogKey(mapSource));
  return layer;
}

export function updateLayer(map, layer, mapSource) {
  const nextKey = cogKey(mapSource);
  if (layer.get(COG_KEY) === nextKey) {
    return;
  }
  rebuildSource(layer, mapSource);
  layer.set(COG_KEY, nextKey);
}

export function refreshLayer(map, layer, mapSource) {
  rebuildSource(layer, mapSource, Date.now());
}
