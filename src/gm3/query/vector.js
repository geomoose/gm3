// import { intersects as bboxIntersects } from 'ol/extent';
import intersects from "@turf/boolean-intersects";

export const vectorFeatureQuery = (layer, mapState, mapSource, query) => {
  const selection = query.selection[0];
  const queryFeatures = mapSource.features || [];
  return new Promise((resolve) => {
    resolve({
      layer,
      features: queryFeatures.filter((feature) => {
        return intersects(selection, feature.geometry);
      }),
    });
  });
};
