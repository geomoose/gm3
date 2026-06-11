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

/** A registry of OpenLayers vector sources.
 *
 *  This is the single, canonical in-memory home for the features
 *  of data-driven vector layers (geojson, geoparquet). Keeping the
 *  features in one OpenLayers source - instead of mirroring them
 *  into the store as GeoJSON - halves the memory footprint of large
 *  datasets and makes the spatial index available to queries.
 *
 *  Features in registered sources are in the map projection (EPSG:3857).
 */

const sources = {};

export const registerSource = (mapSourceName, source) => {
  sources[mapSourceName] = source;
};

export const unregisterSource = (mapSourceName) => {
  delete sources[mapSourceName];
};

export const getSource = (mapSourceName) => sources[mapSourceName] || null;
