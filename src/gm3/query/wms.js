import WMSGetFeatureInfoFormat from "ol/format/WMSGetFeatureInfo";
import GeoJSONFormat from "ol/format/GeoJSON";

import { createLayer } from "../components/map/layers/wms";
import { getLayerName } from "../util";

export const wmsGetFeatureInfoQuery = (layer, mapState, mapSource, query) => {
  // get the map source
  const selectionPoints = query.selection.filter(
    (feature) => feature.geometry && feature.geometry.type === "Point"
  );

  // check that we have a geometry, if not fail.
  if (selectionPoints.length === 0) {
    return new Promise((resolve) => {
      resolve({
        error: true,
        message: "No valid selection geometry",
      });
    });
  }

  const coords = selectionPoints[0].geometry.coordinates;
  // the OpenLayers utility is really handy for constructing the URL
  const src = createLayer(mapSource).getSource();

  // TODO: Allow the configuration to specify GML vs GeoJSON,
  //       but GeoMoose needs a real feature returned.
  const params = {
    FEATURE_COUNT: 1000,
    QUERY_LAYERS: getLayerName(layer),
    INFO_FORMAT: "application/vnd.ogc.gml",
  };

  const infoUrl = src.getFeatureInfoUrl(
    coords,
    mapState.resolution,
    mapState.projection,
    params
  );

  return fetch(infoUrl, {
    headers: {
      "Access-Control-Request-Headers": "*",
    },
  })
    .then((r) => r.text())
    .then((responseText) => {
      // not all WMS services play nice and will return the
      //  error message as a 200, so this still needs checked.
      if (responseText) {
        const gmlFormat = new WMSGetFeatureInfoFormat();
        const features = gmlFormat.readFeatures(responseText);
        const jsFeatures = new GeoJSONFormat().writeFeaturesObject(
          features
        ).features;

        return {
          layer,
          features: jsFeatures,
        };
      } else {
        return {
          layer,
          error: true,
          features: [],
        };
      }
    })
    .catch((err, msg) => {
      return {
        layer,
        error: true,
        features: [],
      };
    });
};
