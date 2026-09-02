/*
 * Test the feature store.
 */

import VectorSource from "ol/source/Vector";

import {
  clearSources,
  ensureSourceData,
  getSource,
  isStoreBacked,
  registerSource,
  unregisterSource,
} from "gm3/featureStore";

const geojsonBody = (features = []) => JSON.stringify({ type: "FeatureCollection", features });

const POINT_FEATURE = {
  type: "Feature",
  properties: { OWNER_NAME: "Bob Smith" },
  geometry: { type: "Point", coordinates: [100, 100] },
};

describe("ensureSourceData", () => {
  afterEach(() => {
    clearSources();
    fetch.resetMocks();
  });

  test("passes through a map-source already in the feature store", async () => {
    const source = new VectorSource();
    registerSource("parcels", source);

    const mapSource = { type: "geoparquet", name: "parcels", urls: ["/parcels.geoparquet"] };
    await expect(ensureSourceData(mapSource)).resolves.toBe(source);
    expect(fetch).not.toHaveBeenCalled();
  });

  test("resolves null for map-sources whose features live in redux", async () => {
    const mapSource = { type: "vector", name: "sketch", features: [] };
    await expect(ensureSourceData(mapSource)).resolves.toBe(null);
    expect(getSource("sketch")).toBe(null);
    expect(fetch).not.toHaveBeenCalled();
  });

  test("resolves null when the map-source already carries its features", async () => {
    const mapSource = {
      type: "geojson",
      name: "parcels",
      urls: ["/parcels.geojson"],
      features: [POINT_FEATURE],
    };
    await expect(ensureSourceData(mapSource)).resolves.toBe(null);
    expect(fetch).not.toHaveBeenCalled();
  });

  test("loads features for a geojson source which was never enabled", async () => {
    fetch.mockResponseOnce(geojsonBody([POINT_FEATURE]));

    const mapSource = {
      type: "geojson",
      name: "parcels",
      urls: ["/parcels.geojson"],
      // already in the map projection, skip reprojection
      params: { crs: "EPSG:3857" },
    };

    const source = await ensureSourceData(mapSource);

    // the features should now live in the feature store
    expect(source).toBe(getSource("parcels"));
    const features = source.getFeatures();
    expect(features).toHaveLength(1);
    expect(features[0].get("OWNER_NAME")).toBe("Bob Smith");
    expect(features[0].getGeometry().getCoordinates()).toEqual([100, 100]);
  });

  test("concurrent calls share a single load", async () => {
    fetch.mockResponse(geojsonBody());

    const mapSource = { type: "geojson", name: "parcels", urls: ["/parcels.geojson"] };

    const [first, second] = await Promise.all([
      ensureSourceData(mapSource),
      ensureSourceData(mapSource),
    ]);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
  });

  test("does not register the source until the features have arrived", async () => {
    // this is the whole point of the store owning the load: a query
    //  firing mid-flight must not see a registered but empty source
    let release;
    fetch.mockResponseOnce(() => new Promise((resolve) => (release = resolve)));

    const mapSource = {
      type: "geojson",
      name: "parcels",
      urls: ["/parcels.geojson"],
      params: { crs: "EPSG:3857" },
    };

    const pending = ensureSourceData(mapSource);
    // mid-flight, nothing is registered, so a query falls back rather
    //  than silently returning zero features from an empty source
    expect(getSource("parcels")).toBe(null);

    release(geojsonBody([POINT_FEATURE]));
    const source = await pending;

    expect(getSource("parcels")).toBe(source);
    expect(source.getFeatures()).toHaveLength(1);
  });

  test("a caller waiting mid-flight gets the loaded features", async () => {
    let release;
    fetch.mockResponseOnce(() => new Promise((resolve) => (release = resolve)));

    const mapSource = {
      type: "geojson",
      name: "parcels",
      urls: ["/parcels.geojson"],
      params: { crs: "EPSG:3857" },
    };

    const first = ensureSourceData(mapSource);
    // a second caller arrives while the first is still fetching
    const second = ensureSourceData(mapSource);

    release(geojsonBody([POINT_FEATURE]));

    const [a, b] = await Promise.all([first, second]);
    expect(a).toBe(b);
    expect(b.getFeatures()).toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test("rejects on an http error rather than registering an empty source", async () => {
    fetch.mockResponseOnce("not found", { status: 404 });

    const mapSource = { type: "geojson", name: "parcels", urls: ["/missing.geojson"] };

    await expect(ensureSourceData(mapSource)).rejects.toThrow(/404/);
    expect(getSource("parcels")).toBe(null);
  });

  test("a failed load is not cached, so a later call retries", async () => {
    fetch.mockRejectOnce(new Error("network down"));

    const mapSource = {
      type: "geojson",
      name: "parcels",
      urls: ["/parcels.geojson"],
      params: { crs: "EPSG:3857" },
    };

    await expect(ensureSourceData(mapSource)).rejects.toThrow("network down");

    fetch.mockResponseOnce(geojsonBody([POINT_FEATURE]));
    const source = await ensureSourceData(mapSource);
    expect(source.getFeatures()).toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test("resolves null for a type with no loader", async () => {
    const mapSource = { type: "wms", name: "basemap", urls: ["/wms"] };
    await expect(ensureSourceData(mapSource)).resolves.toBe(null);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("geoparquet sources", () => {
  /* The global Worker stub in tests/setup.js is inert; this one lets the
   *  test push a FEATURES_READY message back to the loader.
   */
  class FakeWorker {
    constructor() {
      this.listeners = {};
      FakeWorker.instance = this;
    }
    addEventListener(type, fn) {
      this.listeners[type] = this.listeners[type] || [];
      this.listeners[type].push(fn);
    }
    removeEventListener() {}
    postMessage() {}
    terminate() {}
    emit(type, event) {
      (this.listeners[type] || []).forEach((fn) => fn(event));
    }
  }

  let originalWorker;

  beforeEach(() => {
    originalWorker = window.Worker;
    FakeWorker.instance = null;
    window.Worker = FakeWorker;
  });

  afterEach(() => {
    window.Worker = originalWorker;
    clearSources();
  });

  test("loads through the worker and registers the result", async () => {
    const mapSource = {
      type: "geoparquet",
      name: "parcels",
      urls: ["/parcels.geoparquet"],
    };

    const pending = ensureSourceData(mapSource);
    // nothing is registered while the worker is still working
    expect(getSource("parcels")).toBe(null);

    FakeWorker.instance.emit("message", {
      data: {
        type: "FEATURES_READY",
        srcName: "parcels",
        features: [
          {
            type: "Feature",
            properties: { PIN: "123" },
            geometry: { type: "Point", coordinates: [-93.2, 44.9] },
          },
        ],
      },
    });

    const source = await pending;
    expect(source).toBe(getSource("parcels"));
    expect(source.getFeatures()).toHaveLength(1);
    expect(source.getFeatures()[0].get("PIN")).toBe("123");
  });

  test("a worker error rejects and leaves nothing registered", async () => {
    const mapSource = {
      type: "geoparquet",
      name: "parcels",
      urls: ["/parcels.geoparquet"],
    };

    const pending = ensureSourceData(mapSource);
    FakeWorker.instance.emit("message", {
      data: { type: "FEATURES_ERROR", srcName: "parcels", message: "no geometry columns" },
    });

    await expect(pending).rejects.toThrow("no geometry columns");
    expect(getSource("parcels")).toBe(null);
  });
});

describe("isStoreBacked", () => {
  test("is true for the types the store loads", () => {
    expect(isStoreBacked({ type: "geoparquet" })).toBe(true);
    expect(isStoreBacked({ type: "geojson" })).toBe(true);
  });

  test("is false for everything else", () => {
    expect(isStoreBacked({ type: "vector" })).toBe(false);
    expect(isStoreBacked({ type: "wms" })).toBe(false);
    expect(isStoreBacked({})).toBe(false);
    expect(isStoreBacked(undefined)).toBe(false);
  });

  test("agrees with what ensureSourceData will actually load", async () => {
    // the predicate and the loader are separate lists, this keeps them honest
    for (const type of ["vector", "wms", "wfs", "ags"]) {
      await expect(ensureSourceData({ type, name: `x-${type}` })).resolves.toBe(null);
      expect(isStoreBacked({ type })).toBe(false);
    }
  });
});

describe("the source registry", () => {
  afterEach(() => {
    clearSources();
  });

  test("getSource returns null for an unknown map-source", () => {
    expect(getSource("nope")).toBe(null);
  });

  test("register and unregister round trip", () => {
    const source = new VectorSource();
    registerSource("parcels", source);
    expect(getSource("parcels")).toBe(source);

    unregisterSource("parcels");
    expect(getSource("parcels")).toBe(null);
  });

  test("clearSources drops everything", () => {
    registerSource("a", new VectorSource());
    registerSource("b", new VectorSource());

    clearSources();

    expect(getSource("a")).toBe(null);
    expect(getSource("b")).toBe(null);
  });
});
