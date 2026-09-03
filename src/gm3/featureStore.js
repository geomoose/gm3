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

import VectorSource from "ol/source/Vector";

import { fetchGeoParquetFeatures } from "@gm3/components/map/layers/geoparquet";
import { readFeatureCollection } from "@gm3/features";

/** The registry and loader for data-driven vector sources.
 *
 *  This is the single, canonical in-memory home for the features
 *  of data-driven vector layers (geojson, geoparquet). Keeping the
 *  features in one OpenLayers source - instead of mirroring them
 *  into the store as GeoJSON - halves the memory footprint of large
 *  datasets and makes the spatial index available to queries.
 *
 *  The store also owns the fetch. A map-source is only registered once
 *  its features have arrived, so "registered" always means "loaded" -
 *  and the map layer, a query, and the print map share one download
 *  instead of racing each other to three.
 *
 *  Features in registered sources are in the map projection (EPSG:3857).
 */

const sources = {};
// loads in flight, keyed by map-source name
const loads = {};

export const registerSource = (mapSourceName, source) => {
  sources[mapSourceName] = source;
};

export const unregisterSource = (mapSourceName) => {
  delete sources[mapSourceName];
  delete loads[mapSourceName];
};

export const getSource = (mapSourceName) => sources[mapSourceName] || null;

/** Drop every source. The store outlives individual layers, so this is
 *  how an Application releases its memory on teardown.
 */
export const clearSources = () => {
  Object.keys(sources).forEach((name) => delete sources[name]);
  Object.keys(loads).forEach((name) => delete loads[name]);
};

/** The map-source types whose features this store loads and owns.
 *  Everything else keeps its features in redux or fetches them itself.
 *  Keep in step with fetchFeatures below.
 */
const STORE_BACKED_TYPES = ["geoparquet", "geojson"];

/** True when this store is responsible for the map-source's features.
 *
 *  Useful to callers which want to avoid awaiting a load that could
 *  never happen.
 */
export const isStoreBacked = (mapSource) => STORE_BACKED_TYPES.indexOf(mapSource?.type) >= 0;

/** Fetch the features for a data-driven map-source.
 *
 *  @returns A Promise of OpenLayers features, or null when the type
 *           keeps its features somewhere else.
 */
const fetchFeatures = (mapSource) => {
  if (mapSource.type === "geoparquet") {
    return fetchGeoParquetFeatures(mapSource.name, mapSource.urls[0]);
  } else if (mapSource.type === "geojson") {
    return fetch(mapSource.urls[0])
      .then((response) => {
        if (!response.ok) {
          throw new Error(`${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then((geojson) => readFeatureCollection(geojson, mapSource.params?.crs || "EPSG:4326"));
  }
  return null;
};

/** Ensure a map-source's features are loaded and registered.
 *
 *  Concurrent callers share the one in-flight load. A failed load is not
 *  cached, so a later call retries rather than being stuck with an
 *  empty source.
 *
 *  @returns A Promise resolving to the VectorSource, or to null for
 *           map-sources whose features live in the redux store.
 */
export const ensureSourceData = (mapSource) => {
  if (sources[mapSource.name]) {
    return Promise.resolve(sources[mapSource.name]);
  }
  if (loads[mapSource.name]) {
    return loads[mapSource.name];
  }
  // "vector" sources, and anything already mirrored into redux,
  //  are queried from the redux copy.
  if (mapSource.features?.length > 0) {
    return Promise.resolve(null);
  }

  const loadFeatures = fetchFeatures(mapSource);
  if (loadFeatures === null) {
    return Promise.resolve(null);
  }

  loads[mapSource.name] = loadFeatures
    .then((olFeatures) => {
      const source = new VectorSource();
      source.addFeatures(olFeatures);
      sources[mapSource.name] = source;
      return source;
    })
    .finally(() => {
      delete loads[mapSource.name];
    });
  return loads[mapSource.name];
};
