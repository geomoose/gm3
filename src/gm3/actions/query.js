import { createAction, createAsyncThunk } from "@reduxjs/toolkit";

import { agsFeatureQuery } from "../query/ags";
import { vectorFeatureQuery } from "../query/vector";
import { wfsGetFeatureQuery } from "../query/wfs";
import { wmsGetFeatureInfoQuery } from "../query/wms";
import { getMapSourceName } from "../util";

import {
  changeTool,
  setSelectionBuffer,
  clearSelectionFeatures,
  addSelectionFeature,
} from "./map";
import { clearFeatures, addFeatures } from "./mapSource";
import { setUiHint } from "./ui";

export const changeService = createAction(
  "query/change-service",
  (serviceName, defaultValues = {}) => ({
    payload: {
      serviceName,
      defaultValues,
    },
  })
);

export const startService = createAsyncThunk(
  "query/start-service",
  (
    { serviceName, defaultTool = null, defaultValues = {}, withFeatures = [] },
    { getState, dispatch }
  ) => {
    const state = getState();
    const currentService = state.query.serviceName;
    const currentDrawTool = state.map?.interactionType;

    // if the service is changing then reset the
    //  buffer and selection geometry settings.
    if (serviceName !== currentService) {
      dispatch(clearSelectionFeatures());
      dispatch(setSelectionBuffer(0));
      dispatch(changeTool(defaultTool));
      if (state.mapSources.selection) {
        dispatch(clearFeatures("selection"));
      }
    } else if (currentDrawTool === null) {
      dispatch(changeTool(defaultTool));
    }

    // start a service "with [these] features"
    if (withFeatures.length > 0) {
      withFeatures.forEach((feature) => {
        dispatch(addSelectionFeature(feature));
      });
      if (state.mapSources.selection) {
        dispatch(addFeatures("selection", withFeatures));
      }
    }

    dispatch(changeService(serviceName, defaultValues));
    dispatch(setUiHint("service-start"));
  }
);

/**
 * Clearing the service will reset the internal bits of the query state
 */
export const clearService = createAction("query/clear-service");

/**
 * Finishing the service will close out and clear the service.
 */
export const finishService = createAsyncThunk(
  "query/finish-service",
  (arg, { dispatch }) => {
    dispatch(clearService());
    dispatch(removeQueryResults());
    dispatch(changeTool(""));
    dispatch(clearSelectionFeatures());
    dispatch(clearFeatures("selection"));
  }
);

export const createQuery = createAction(
  "query/create",
  (serviceName, selection, fields, layers, runOptions = {}) => ({
    payload: {
      serviceName,
      selection,
      fields,
      layers,
      runOptions,
    },
  })
);

export const addFilter = createAction("query/add-filter");

export const removeFilter = createAction("query/remove-filter");

/** Set the filter to highlight a specific subset of features
 *  from the results. This is the "highlight the highlight"
 *  seen when floating over the grid.
 *  Set to `false` to clear any hot filtering.
 */
export const setHotFilter = createAction("query/set-hot-filter");

export const runQuery = createAsyncThunk(
  "query/run",
  (arg, { getState, dispatch }) => {
    const state = getState();
    const queryDef = state.query.query;
    const mapSources = state.mapSources;

    if (!queryDef.layers || queryDef.layers.length === 0) {
      // if there are no layers defined, return
      //  a resolved query with a completely empty set.
      return new Promise((resolve) => resolve([]));
    }

    const layerQueries = queryDef.layers.map((layer) => {
      const mapSource = mapSources[getMapSourceName(layer)];
      switch (mapSource.type) {
        case "wms":
          return wmsGetFeatureInfoQuery(layer, state.map, mapSource, queryDef);
        case "wfs":
          return wfsGetFeatureQuery(layer, state.map, mapSource, queryDef);
        case "ags":
        case "ags-vector":
          return agsFeatureQuery(layer, state.map, mapSource, queryDef);
        case "geojson":
        case "vector":
          return vectorFeatureQuery(layer, state.map, mapSource, queryDef);
        default:
          // this is an un-supproted type so just bail
          return new Promise((resolve) => resolve({ layer, features: [] }));
      }
    });

    return Promise.all(layerQueries).then((allResults) => {
      const results = {};
      allResults.forEach((result) => {
        results[result.layer] = result.features;
      });
      return results;
    });
  }
);

export const bufferResults = createAsyncThunk(
  "query/buffer-results",
  (arg, { getState, dispatch }) => {
    const state = getState();
    const query = state.query;

    // flatten the query results down to just a
    //  list of features
    let features = [];
    for (const path in query.results) {
      features = features.concat(query.results[path]);
    }

    if (features.length > 0) {
      dispatch(changeTool(""));

      // reset the buffer since this is a new buffer set.
      dispatch(setSelectionBuffer(0));
      // dispatch the features
      dispatch(clearSelectionFeatures());
      features.forEach((f) => {
        dispatch(addSelectionFeature(f));
      });
      dispatch(clearFeatures("selection"));
      dispatch(addFeatures("selection", features));

      dispatch(changeService("buffer-select"));
    } else {
      // TODO: Dispatch an error message that it
      //       it is not possible to buffer nothing.
    }
  }
);

export const removeQueryResults = createAction("query/remove-results");

export const setServiceStep = createAction("query/set-service-step");
