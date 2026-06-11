/*
 * Test the query actions.
 */

import VectorSource from "ol/source/Vector";

import { ensureMapSourceFeatures } from "gm3/actions/query";
import { getSource, registerSource, unregisterSource } from "gm3/featureStore";

describe("ensureMapSourceFeatures", () => {
  afterEach(() => {
    unregisterSource("parcels");
    fetch.mockClear();
  });

  test("passes through map-sources already in the feature store", async () => {
    registerSource("parcels", new VectorSource());
    const mapSource = { type: "geoparquet", name: "parcels", urls: ["/parcels.geoparquet"] };
    const result = await ensureMapSourceFeatures(mapSource);
    expect(result).toBe(mapSource);
    expect(fetch).not.toHaveBeenCalled();
  });

  test("passes through vector map-sources kept in the store", async () => {
    const mapSource = { type: "vector", name: "sketch", features: [] };
    const result = await ensureMapSourceFeatures(mapSource);
    expect(result).toBe(mapSource);
    expect(getSource("sketch")).toBe(null);
  });

  test("loads features for a geojson source which was never enabled", async () => {
    fetch.mockResponseOnce(
      JSON.stringify({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { OWNER_NAME: "Bob Smith" },
            geometry: {
              type: "Point",
              coordinates: [100, 100],
            },
          },
        ],
      })
    );

    const mapSource = {
      type: "geojson",
      name: "parcels",
      urls: ["/parcels.geojson"],
      // already in the map projection, skip reprojection
      params: { crs: "EPSG:3857" },
    };

    const result = await ensureMapSourceFeatures(mapSource);
    expect(result).toBe(mapSource);

    // the features should now live in the feature store
    const olSource = getSource("parcels");
    expect(olSource).not.toBe(null);
    const features = olSource.getFeatures();
    expect(features).toHaveLength(1);
    expect(features[0].get("OWNER_NAME")).toBe("Bob Smith");
    expect(features[0].getGeometry().getCoordinates()).toEqual([100, 100]);
  });

  test("concurrent calls share a single load", async () => {
    fetch.mockResponse(
      JSON.stringify({
        type: "FeatureCollection",
        features: [],
      })
    );

    const mapSource = {
      type: "geojson",
      name: "parcels",
      urls: ["/parcels.geojson"],
    };

    await Promise.all([ensureMapSourceFeatures(mapSource), ensureMapSourceFeatures(mapSource)]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
