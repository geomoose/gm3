/*
 * Test the OpenLayers feature helpers.
 */

import GeoJSONFormat from "ol/format/GeoJSON";
import { toLonLat } from "ol/proj";

import { getBoundedBy, readFeatureCollection } from "gm3/features";

const olFeature = (geometry) =>
  new GeoJSONFormat().readFeature({ type: "Feature", properties: {}, geometry });

const point = (coordinates, properties = {}) => ({
  type: "Feature",
  properties,
  geometry: { type: "Point", coordinates },
});

describe("getBoundedBy", () => {
  test("returns the extent of a geometry", () => {
    const feature = olFeature({
      type: "Polygon",
      coordinates: [
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 10],
          [0, 0],
        ],
      ],
    });
    expect(getBoundedBy(feature)).toEqual([0, 0, 10, 10]);
  });

  test("returns a degenerate extent for a point", () => {
    expect(getBoundedBy(olFeature({ type: "Point", coordinates: [5, 7] }))).toEqual([5, 7, 5, 7]);
  });

  // the WFS and AGS query paths used to call getGeometry().getExtent()
  //  directly here, which threw and rejected the whole query
  test("returns undefined for a feature with no geometry", () => {
    expect(getBoundedBy(olFeature(null))).toBeUndefined();
  });

  test("does not throw for a feature with no geometry", () => {
    expect(() => getBoundedBy(olFeature(null))).not.toThrow();
  });
});

describe("readFeatureCollection", () => {
  test("reprojects from 4326 into the map projection by default", () => {
    const [feature] = readFeatureCollection([point([-93.2, 44.9])]);

    const coordinates = feature.getGeometry().getCoordinates();
    expect(coordinates[0]).toBeLessThan(-1000000);

    const [lon, lat] = toLonLat(coordinates);
    expect(lon).toBeCloseTo(-93.2, 6);
    expect(lat).toBeCloseTo(44.9, 6);
  });

  test("honors an explicit data projection", () => {
    // already in the map projection, so it should pass through
    const [feature] = readFeatureCollection([point([100, 200])], "EPSG:3857");
    expect(feature.getGeometry().getCoordinates()).toEqual([100, 200]);
  });

  test("accepts a bare array of features", () => {
    expect(readFeatureCollection([point([0, 0]), point([1, 1])])).toHaveLength(2);
  });

  test("accepts a FeatureCollection object", () => {
    const collection = { type: "FeatureCollection", features: [point([0, 0])] };
    expect(readFeatureCollection(collection)).toHaveLength(1);
  });

  test("accepts an empty collection", () => {
    expect(readFeatureCollection([])).toEqual([]);
  });

  test("sets boundedBy to the reprojected extent", () => {
    const [feature] = readFeatureCollection([point([-93.2, 44.9])]);
    expect(feature.get("boundedBy")).toEqual(feature.getGeometry().getExtent());
  });

  test("keeps the feature properties", () => {
    const [feature] = readFeatureCollection([point([0, 0], { OWNER_NAME: "Bob Smith" })]);
    expect(feature.get("OWNER_NAME")).toBe("Bob Smith");
  });

  test("leaves boundedBy unset for a null geometry, without throwing", () => {
    const features = readFeatureCollection([
      { type: "Feature", properties: { PIN: "1" }, geometry: null },
      point([0, 0], { PIN: "2" }),
    ]);

    expect(features).toHaveLength(2);
    expect(features[0].getGeometry()).toBe(null);
    expect(features[0].get("boundedBy")).toBeUndefined();
    // the row with a geometry is still decorated
    expect(features[1].get("boundedBy")).toEqual(features[1].getGeometry().getExtent());
  });

  test("throws on an unparseable geometry rather than silently dropping it", () => {
    expect(() =>
      readFeatureCollection([{ type: "Feature", geometry: { type: "Bogus" } }])
    ).toThrow();
  });
});
