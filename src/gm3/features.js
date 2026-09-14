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

/** Helpers for turning source data into OpenLayers features.
 *
 *  This sits below featureStore and util so that both can use it -
 *  util.js already imports featureStore, so a shared helper in either
 *  of those would close an import cycle.
 */

import GeoJSONFormat from "ol/format/GeoJSON";

const MAP_PROJECTION = "EPSG:3857";

/** The extent of a feature's geometry.
 *
 *  Templates and getExtentForQuery read this back as a "boundedBy"
 *  property. A row with a NULL geometry has no extent to report, hence
 *  the optional call - reading it off a null geometry throws.
 *
 *  @param olFeature An OpenLayers feature.
 *
 *  @returns Array containing [minx,miny,maxx,maxy], or undefined.
 */
export const getBoundedBy = (olFeature) => olFeature.getGeometry()?.getExtent();

/** Read GeoJSON into OpenLayers features in the map projection.
 *
 *  Each feature is given the "boundedBy" property that the search
 *  templates and query result helpers expect.
 *
 *  @param geojson        A FeatureCollection, or a bare array of features.
 *  @param dataProjection The projection the data is in.
 *
 *  @returns A list of OpenLayers features in the map projection.
 */
export const readFeatureCollection = (geojson, dataProjection = "EPSG:4326") => {
  const collection = Array.isArray(geojson)
    ? { type: "FeatureCollection", features: geojson }
    : geojson;

  const olFeatures = new GeoJSONFormat({
    dataProjection,
    featureProjection: MAP_PROJECTION,
  }).readFeatures(collection);

  olFeatures.forEach((feature) => {
    const boundedBy = getBoundedBy(feature);
    if (boundedBy !== undefined) {
      // boundedBy bug caught by Mariana...
      feature.set("boundedBy", boundedBy, true);
    }
  });

  return olFeatures;
};
