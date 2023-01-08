import { getSquareBuffer } from "../util";

const getPixelTolerance = (querySource, defaultPx = 10) => {
  // the default pixel tolerance is 10 pixels.
  let pxTolerance = defaultPx;
  try {
    if (querySource.config["pixel-tolerance"]) {
      pxTolerance = parseFloat(querySource.config["pixel-tolerance"]);
    }
  } catch (err) {
    // swallow the error
  }
  return pxTolerance;
};

export const applyPixelTolerance = (
  queryFeature,
  querySource,
  resolution,
  defaultPxTolerance
) => {
  const pxTolerance = getPixelTolerance(querySource, defaultPxTolerance);
  if (pxTolerance > 0 && queryFeature.geometry.type === "Point") {
    // buffer point is in pixels,
    //  this converts pixels to ground units
    const width = pxTolerance * resolution;
    return getSquareBuffer(queryFeature.geometry.coordinates, width);
  }
  return queryFeature;
};

export const normalizeSelection = (selectionFeatures) => {
  // OpenLayers handles MultiPoint geometries in an awkward way,
  // each feature is a 'MultiPoint' type but only contains one feature,
  //  this normalizes that in order to be submitted properly to query services.
  if (selectionFeatures && selectionFeatures.length > 0) {
    if (selectionFeatures[0].geometry.type === "MultiPoint") {
      const allCoords = [];
      selectionFeatures.forEach((feature) => {
        if (feature.geometry.type === "MultiPoint") {
          allCoords.push(feature.geometry.coordinates[0]);
        }
      });
      return [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "MultiPoint",
            coordinates: allCoords,
          },
        },
      ];
    }
  }
  return selectionFeatures;
};

export const normalizeFieldValues = (serviceDef, fieldValues = {}) =>
  serviceDef.fields.map((field) => ({
    name: field.name,
    value: fieldValues[field.name] || field.default,
  }));
