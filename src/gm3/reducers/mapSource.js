/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 Dan "Ducky" Little
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

/** Reduces Map-Sources
 *
 */

import uuid from "uuid";
import { createReducer } from "@reduxjs/toolkit";
import { changeFeatures, filterFeatures } from "../util";

import {
  add,
  remove,
  addLayer,
  setLayerVisibilityInternal,
  favoriteLayer,
  setLayerTemplate,
  setOpacity,
  setMapSourceZIndex,
  reloadSource,
  addFeatures,
  clearFeatures,
  removeFeatureInternal,
  removeFeatures,
  changeFeatures as changeFeaturesAction,
  modifyFeatureGeometry,
} from "../actions/mapSource";

const ID_PROP = "_uuid";

const modifyLayer = (layers, layerName, changeFn) => {
  let found = false;
  for (let i = 0, ii = layers.length; !found && i < ii; i++) {
    if (layers[i].name === layerName) {
      layers[i] = changeFn(layers[i]);
      found = true;
    }
  }
  return layers;
};

const reducer = createReducer(
  {},
  {
    [add]: (state, { payload }) => {
      state[payload.name] = {
        features: [],
        featuresVersion: 0,
        ...payload,
      };
    },
    [remove]: (state, { payload }) => {
      delete state[payload.mapSourceName];
    },
    [addLayer]: (state, { payload }) => {
      state[payload.mapSourceName].layers.push(payload.layer);
    },
    [setLayerVisibilityInternal]: (
      state,
      { payload: { mapSourceName, layerName, on } }
    ) => {
      state[mapSourceName].layers = modifyLayer(
        state[mapSourceName].layers,
        layerName,
        (layer) => {
          layer.on = on;
          return layer;
        }
      );
    },
    [favoriteLayer]: (
      state,
      { payload: { mapSourceName, layerName, favorite } }
    ) => {
      state[mapSourceName].layers = modifyLayer(
        state[mapSourceName].layers,
        layerName,
        (layer) => {
          layer.favorite = favorite;
          return layer;
        }
      );
    },
    [setLayerTemplate]: (
      state,
      { payload: { mapSourceName, layerName, name, template } }
    ) => {
      state[mapSourceName].layers = modifyLayer(
        state[mapSourceName].layers,
        layerName,
        (layer) => {
          layer.templates = {
            ...layer.templates,
            [name]: template,
          };
          return layer;
        }
      );
    },
    [setMapSourceZIndex]: (state, { payload: { mapSourceName, zIndex } }) => {
      state[mapSourceName].zIndex = zIndex;
    },
    [setOpacity]: (state, { payload: { mapSourceName, opacity } }) => {
      state[mapSourceName].opacity = opacity;
    },
    [reloadSource]: (state, { payload: mapSourceName }) => {
      state[mapSourceName].featuresVersion += 1;
      state[mapSourceName].params = {
        ...state[mapSourceName].params,
        _ck: "." + new Date().getTime(),
      };
    },
    [addFeatures]: (state, { payload: { mapSourceName, features, copy } }) => {
      if (!state[mapSourceName].features) {
        state[mapSourceName].features = [];
        state[mapSourceName].featuresVersion = 0;
      }

      // copy assumes a raw dump where the ID does not matter.
      for (let i = 0, ii = features.length; !copy && i < ii; i++) {
        features[i] = {
          ...features[i],
          properties: {
            ...features[i].properties,
            [ID_PROP]: uuid(),
          },
        };
      }
      state[mapSourceName].features =
        state[mapSourceName].features.concat(features);
      state[mapSourceName].featuresVersion += 1;
    },
    [clearFeatures]: (state, { payload: mapSourceName }) => {
      state[mapSourceName].features = [];
      state[mapSourceName].featuresVersion += 1;
    },
    [removeFeatureInternal]: (state, { payload: { mapSourceName, id } }) => {
      state[mapSourceName].features = state[mapSourceName].features.filter(
        (feature) => {
          return feature.properties[ID_PROP] !== id;
        }
      );
      state[mapSourceName].featuresVersion += 1;
    },
    [removeFeatures]: (state, { payload: { mapSourceName, filter } }) => {
      state[mapSourceName].features = filterFeatures(
        state[mapSourceName].features,
        filter
      );
      state[mapSourceName].featuresVersion += 1;
    },
    [changeFeaturesAction]: (
      state,
      { payload: { mapSourceName, filter, properties } }
    ) => {
      state[mapSourceName].features = changeFeatures(
        state[mapSourceName].features,
        filter,
        properties
      );
      state[mapSourceName].featuresVersion += 1;
    },
    [modifyFeatureGeometry]: (
      state,
      { payload: { mapSourceName, id, geometry } }
    ) => {
      state[mapSourceName].features = changeFeatures(
        state[mapSourceName].features,
        { [ID_PROP]: id },
        null,
        geometry
      );
      state[mapSourceName].featuresVersion += 1;
    },
  }
);

export default reducer;
