import { createSelector } from '@reduxjs/toolkit';

import { matchFeatures } from '../util';

// TODO: make this a selector
import { getLayerFromPath } from '../actions/mapSource';

export const getAllResults = state => state.query.results;
export const getFilter = state => state.query.filter;
export const getServiceName = state => state.query.service;

// TODO: Move this to a map sources selector
export const getMapSources = state => state.mapSources;

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

export const getHighlightResults = createSelector(
    getAllResults,
    getFilter,
    getServiceName,
    getMapSources,
    (results, filter, serviceName, mapSources) => {
        let features = [];
        for (const path in results) {
            const layer = getLayerFromPath(mapSources, path);

            let highlight = true;
            if (layer.templates[serviceName]) {
                highlight = layer.templates[serviceName].highlight !== false;
            }
            if (highlight) {
                features = features.concat(matchFeatures(results[path], filter));
            }
        }
        return features;
    }
);
