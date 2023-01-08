import { createSelector } from "@reduxjs/toolkit";

import { matchFeatures, featureMatch } from "../util";

// TODO: make this a selector
import { getLayerFromPath } from "../actions/mapSource";

export const getAllResults = (state) => state.query.results;
export const getFilter = (state) => state.query.filter;
export const getServiceName = (state) => state.query.serviceName;
export const getHotFilter = (state) => state.query.hotFilter;

// TODO: Move this to a map sources selector
export const getMapSources = (state) => state.mapSources;

export const getQueryResults = createSelector(
  getAllResults,
  getFilter,
  (results, filter) => {
    let features = [];
    for (const path in results) {
      features = features.concat(matchFeatures(results[path], filter));
    }
    return features;
  }
);

export const getFlatResults = createSelector(getAllResults, (results) => {
  let features = [];
  for (const path in results) {
    features = features.concat(results[path]);
  }
  return features;
});

export const getHighlightResults = createSelector(
  getAllResults,
  getFilter,
  getServiceName,
  getMapSources,
  getHotFilter,
  (results, filter, serviceName, mapSources, hotFilter) => {
    let features = [];
    for (const path in results) {
      const layer = getLayerFromPath(mapSources, path);

      let highlight = true;
      if (layer.templates[serviceName]) {
        highlight = layer.templates[serviceName].highlight !== false;
      }
      if (highlight) {
        let layerFeatures = matchFeatures(results[path], filter);
        if (hotFilter) {
          layerFeatures = layerFeatures.map((feature) => {
            // featureMatch uses a different query syntax than
            //  the rest of the filters, so requries the featureMatch
            //  function.
            if (featureMatch(feature, hotFilter)) {
              // this is necessary because the feature from
              //  the store has been frozen by immer
              feature = {
                type: "Feature",
                geometry: { ...feature.geometry },
                properties: {
                  ...feature.properties,
                  displayClass: "hot",
                },
              };
            }
            return feature;
          });
        }
        features = features.concat(layerFeatures);
      }
    }
    return features;
  }
);
