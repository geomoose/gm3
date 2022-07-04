import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import { agsFeatureQuery } from '../query/ags';
import { vectorFeatureQuery } from '../query/vector';
import { wfsGetFeatureQuery } from '../query/wfs';
import { wmsGetFeatureInfoQuery } from '../query/wms';
import { getMapSourceName } from '../util';

import { changeTool, setSelectionBuffer, clearSelectionFeatures, addSelectionFeature } from './map';
import { clearFeatures, addFeatures } from './mapSource';

export const startService = createAction('query/start-service', (serviceName, defaultValues = {}) => ({
    payload: {
        serviceName,
        defaultValues,
    },
}));

export const finishService = createAction('query/finish-service');

export const createQuery = createAction('query/create', (serviceName, selection, fields, layers, runOptions = {}) => ({
    payload: {
        serviceName,
        selection,
        fields,
        layers,
        runOptions,
    },
}));

export const addFilter = createAction('query/add-filter');

export const removeFilter = createAction('query/remove-filter');

export const runQuery = createAsyncThunk('query/run', (arg, {getState, dispatch}) => {
    const state = getState();
    const queryDef = state.query.query;
    const mapSources = state.mapSources;

    if (!queryDef.layers || queryDef.layers.length === 0) {
        dispatch(finishQuery());
    }

    const layerQueries = queryDef.layers.map(layer => {
        const mapSource = mapSources[getMapSourceName(layer)];
        switch(mapSource.type) {
            case 'wms':
                return wmsGetFeatureInfoQuery(layer, state.map, mapSource, queryDef);
            case 'wfs':
                return wfsGetFeatureQuery(layer, state.map, mapSource, queryDef);
            case 'ags-vector':
                return agsFeatureQuery(layer, state.map, mapSource, queryDef);
            case 'geojson':
            case 'vector':
                return vectorFeatureQuery(layer, state.map, mapSource, queryDef);
            default:
                // this is an un-supproted type so just bail
                return new Promise(resolve => resolve({layer, features: []}));
        }
    });

    return Promise.all(layerQueries)
        .then(allResults => {
            const results = {};
            allResults.forEach(result => {
                results[result.layer] = result.features;
                /* {
                    features: result.features,
                    error: result.error,
                    message: result.message,
                };
                */
            });
            return results;
        });
});


export const bufferResults = createAsyncThunk('query/buffer-results', (arg, {getState, dispatch}) => {
    const state = getState();
    const query = state.query;

    // flatten the query results down to just a
    //  list of features
    let features = [];
    for (const path in query.results) {
        features = features.concat(query.results[path]);
    }

    if (features.length > 0) {
        dispatch(changeTool(''));

        // reset the buffer since this is a new buffer set.
        dispatch(setSelectionBuffer(0));
        // dispatch the features
        dispatch(clearSelectionFeatures());
        features.forEach(f => {
            dispatch(addSelectionFeature(f))
        });
        dispatch(clearFeatures('selection'));
        dispatch(addFeatures('selection', features));

        dispatch(startService('buffer-select'));
    } else {
        // TODO: Dispatch an error message that it
        //       it is not possible to buffer nothing.
    }
});
