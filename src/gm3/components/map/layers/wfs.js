/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2019-present Dan "Ducky" Little
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

import GeoJSONFormat from "ol/format/GeoJSON";
import WFSFormat from "ol/format/WFS";
import GML2Format from "ol/format/GML2";

import * as olFilters from "ol/format/filter";
import * as proj from "ol/proj";

import { featureToJson, transformFeatures } from "../../../util";

function chainFilters(operator, filters) {
  let chainedFilters = null;
  if (filters.length > 1) {
    chainedFilters = operator(filters[0], filters[1]);
    for (let i = 2, ii = filters.length; i < ii; i++) {
      chainedFilters = operator(chainedFilters, filters[i]);
    }
  } else {
    chainedFilters = filters[0];
  }
  return chainedFilters;
}

// map the functions from OpenLayers to the internal
//  types
const FILTER_MAPPING = {
  like: olFilters.like,
  ilike: function (name, value) {
    return olFilters.like(name, value, "%", "_", "\\", false);
  },
  eq: olFilters.equalTo,
  ge: olFilters.greaterThanOrEqualTo,
  gt: olFilters.greaterThan,
  le: olFilters.lessThanOrEqualTo,
  lt: olFilters.lessThan,
};

const FILTER_OPERATORS = {
  and: olFilters.and,
  or: olFilters.or,
};

const mapFilters = (fields) => {
  return fields.map((field) => {
    if (Array.isArray(field)) {
      return chainFilters(
        FILTER_OPERATORS[field[0]],
        mapFilters(field.slice(1))
      );
    } else {
      return FILTER_MAPPING[field.comparitor](field.name, field.value);
    }
  });
};

const getTypeName = (mapSource) => {
  let typename = mapSource.params.typename;
  if (mapSource.config && mapSource.config.typename) {
    typename = mapSource.config.typename;
  }
  return typename;
};

const getGeometryName = (mapSource) =>
  mapSource.config && mapSource.config["geometry-name"]
    ? mapSource.config["geometry-name"]
    : "geom";

const DEFAULT_OUTPUT_FORMAT = "text/xml; subtype=gml/2.1.2";

export function buildWfsQuery(
  query,
  mapSource,
  mapProjection,
  outputFormat = DEFAULT_OUTPUT_FORMAT
) {
  const geomField = getGeometryName(mapSource);

  // the internal storage mechanism requires features
  //  returned from the query be stored in 4326 and then
  //  reprojected on render.
  let queryProjection = mapProjection;
  if (mapSource.wgs84Hack) {
    queryProjection = new proj.get("EPSG:4326");
  }

  const filters = [];
  if (query.selection && query.selection.length > 0) {
    const geoFilters = query.selection.map((selectionFeature) => {
      // convert the geojson geometry into a ol geometry.
      const olGeom = new GeoJSONFormat().readGeometry(
        selectionFeature.geometry
      );
      // convert the geometry to the query projection
      olGeom.transform(mapProjection, queryProjection);

      // add the intersection filter to the filter stack.
      return olFilters.intersects(geomField, olGeom);
    });

    if (geoFilters.length === 1) {
      filters.push(geoFilters[0]);
    } else {
      filters.push(chainFilters(FILTER_OPERATORS.or, geoFilters));
    }
  }

  mapFilters(query.fields).forEach((f) => filters.push(f));

  // when multiple filters are set then they need to be
  //  chained together to create the compound filter.
  let chainedFilters = null;
  if (filters.length > 1) {
    chainedFilters = chainFilters(FILTER_OPERATORS.and, filters);
  } else {
    chainedFilters = filters[0];
  }

  // the OL formatter requires that the typename and the schema be
  //  broken apart in order to properly format the request.
  const typename = getTypeName(mapSource);

  const typeParts = typename.split(":");
  const formatOptions = {
    srsName: queryProjection.getCode(),
    featurePrefix: typeParts[0],
    featureTypes: [typeParts[1]],
    outputFormat,
    filter: chainedFilters,
  };

  const featureRequest = new WFSFormat().writeGetFeature(formatOptions);

  return new XMLSerializer().serializeToString(featureRequest);
}

export function wfsGetFeatures(
  query,
  mapSource,
  mapProjection,
  outputFormat = DEFAULT_OUTPUT_FORMAT
) {
  const queryBody = buildWfsQuery(
    query,
    mapSource,
    mapProjection,
    outputFormat
  );

  // TODO: check for params and properly join to URL!

  return fetch(mapSource.urls[0], {
    method: "POST",
    body: queryBody,
  })
    .then((r) => r.text())
    .then((response) => {
      const gmlFormat = new GML2Format();

      let features = gmlFormat.readFeatures(response).map((feature) => {
        const jsonFeature = featureToJson(feature);
        jsonFeature.properties = {
          ...jsonFeature.properties,
          boundedBy: feature.getGeometry().getExtent(),
        };
        return jsonFeature;
      });
      // apply the transforms
      features = transformFeatures(mapSource.transforms, features);
      return features;
    });
}

function wfsTransact(mapSource, mapProjection, inFeatures) {
  const format = new WFSFormat();
  const config = mapSource.config || {};
  const typename = getTypeName(mapSource);
  const typeParts = typename.split(":");
  const options = {
    featurePrefix: typeParts[0],
    featureType: typeParts[1],
    srsName: config.srs || "EPSG:3857",
  };

  if (config["namespace-uri"]) {
    options.featureNS = config["namespace-uri"];
  }

  const geometryName = getGeometryName(mapSource);
  const jsonFormat = new GeoJSONFormat({ geometryName });

  const features = {
    updates: [],
    inserts: [],
    deletes: [],
  };

  ["inserts", "updates", "deletes"].forEach((operation) => {
    if (inFeatures[operation]) {
      features[operation] = inFeatures[operation].map((f) =>
        jsonFormat.readFeature(f, { geometryName })
      );
      // reproject the features to the layers native SRS
      if (options.srsName !== "EPSG:3857") {
        features[operation].forEach((f) =>
          f.getGeometry().transform("EPSG:3857", options.srsName)
        );
      }
    }
  });

  const transaction = format.writeTransaction(
    features.inserts,
    features.updates,
    features.deletes,
    options
  );
  return new XMLSerializer().serializeToString(transaction);
}

export function wfsSaveFeatures(
  mapSource,
  mapProjection,
  inFeatures,
  insert = false
) {
  return wfsTransact(mapSource, mapProjection, {
    [insert ? "inserts" : "updates"]: inFeatures,
  });
}

export function wfsDeleteFeatures(mapSource, mapProjection, inFeatures) {
  return wfsTransact(mapSource, mapProjection, { deletes: inFeatures });
}
