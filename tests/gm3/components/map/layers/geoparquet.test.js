/*
 * Test the GeoParquet worker plumbing.
 */

import { toLonLat } from "ol/proj";

import { fetchGeoParquetFeatures } from "gm3/components/map/layers/geoparquet";

/* The global Worker stub in tests/setup.js is inert. This one records
 *  what was posted to it and lets a test push messages back.
 */
class FakeWorker {
  constructor() {
    this.listeners = {};
    this.posted = [];
    this.terminated = false;
    FakeWorker.instances.push(this);
  }

  addEventListener(type, fn) {
    this.listeners[type] = this.listeners[type] || [];
    this.listeners[type].push(fn);
  }

  removeEventListener() {}

  postMessage(message) {
    this.posted.push(message);
  }

  terminate() {
    this.terminated = true;
  }

  emit(type, event) {
    (this.listeners[type] || []).forEach((fn) => fn(event));
  }
}

const point = (coordinates, properties = {}) => ({
  type: "Feature",
  properties,
  geometry: { type: "Point", coordinates },
});

const ready = (srcName, features) => ({
  data: { type: "FEATURES_READY", srcName, features },
});

describe("fetchGeoParquetFeatures", () => {
  let originalWorker;

  beforeEach(() => {
    originalWorker = window.Worker;
    FakeWorker.instances = [];
    window.Worker = FakeWorker;
  });

  afterEach(() => {
    window.Worker = originalWorker;
  });

  const start = (srcName, url) => {
    const promise = fetchGeoParquetFeatures(srcName, url);
    return { promise, worker: FakeWorker.instances[0] };
  };

  describe("the url handed to the worker", () => {
    test("resolves a relative url against the page", () => {
      const { worker } = start("parcels", "./parcels.geoparquet");
      // the worker's own base is dist/, so a bare relative path would
      //  otherwise be fetched from the wrong place
      expect(worker.posted[0].url).toBe("http://localhost/parcels.geoparquet");
    });

    test("resolves a root relative url against the page", () => {
      const { worker } = start("parcels", "/data/parcels.geoparquet");
      expect(worker.posted[0].url).toBe("http://localhost/data/parcels.geoparquet");
    });

    test("leaves an absolute url alone", () => {
      const url = "https://example.com/county/parcels.geoparquet";
      const { worker } = start("parcels", url);
      expect(worker.posted[0].url).toBe(url);
    });

    test("posts the map-source name and the load request", () => {
      const { worker } = start("parcels", "/parcels.geoparquet");
      expect(worker.posted[0].type).toBe("LOAD_PARQUET");
      expect(worker.posted[0].srcName).toBe("parcels");
    });
  });

  test("resolves with reprojected features carrying boundedBy", async () => {
    const { promise, worker } = start("parcels", "/parcels.geoparquet");
    worker.emit("message", ready("parcels", [point([-93.2, 44.9], { OWNER_NAME: "Bob Smith" })]));

    const features = await promise;
    expect(features).toHaveLength(1);
    expect(features[0].get("OWNER_NAME")).toBe("Bob Smith");

    // 4326 in, 3857 out. Assert by round tripping rather than by
    //  hard coding mercator metres.
    const coordinates = features[0].getGeometry().getCoordinates();
    expect(coordinates[0]).toBeLessThan(-1000000);
    const [lon, lat] = toLonLat(coordinates);
    expect(lon).toBeCloseTo(-93.2, 6);
    expect(lat).toBeCloseTo(44.9, 6);

    expect(features[0].get("boundedBy")).toEqual(features[0].getGeometry().getExtent());
    expect(worker.terminated).toBe(true);
  });

  test("a row with a null geometry does not wedge the load", async () => {
    // getGeometry() returns null for these, and calling getExtent() on it
    //  used to throw inside the message listener, leaving the promise
    //  neither resolved nor rejected and the worker running forever
    const { promise, worker } = start("parcels", "/parcels.geoparquet");
    worker.emit(
      "message",
      ready("parcels", [
        { type: "Feature", properties: { PIN: "1" }, geometry: null },
        point([-93.2, 44.9], { PIN: "2" }),
      ])
    );

    const features = await promise;
    expect(features).toHaveLength(2);
    expect(features[0].getGeometry()).toBe(null);
    expect(features[0].get("boundedBy")).toBeUndefined();
    // the good row is still processed
    expect(features[1].get("boundedBy")).toEqual(features[1].getGeometry().getExtent());
    expect(worker.terminated).toBe(true);
  });

  test("rejects on a FEATURES_ERROR message", async () => {
    const { promise, worker } = start("parcels", "/parcels.geoparquet");
    worker.emit("message", {
      data: { type: "FEATURES_ERROR", srcName: "parcels", message: "no geometry columns" },
    });

    await expect(promise).rejects.toThrow("no geometry columns");
    expect(worker.terminated).toBe(true);
  });

  test("rejects rather than hanging when the features cannot be parsed", async () => {
    const { promise, worker } = start("parcels", "/parcels.geoparquet");
    worker.emit(
      "message",
      ready("parcels", [{ type: "Feature", properties: {}, geometry: { type: "Bogus" } }])
    );

    await expect(promise).rejects.toThrow();
    expect(worker.terminated).toBe(true);
  });

  test("rejects on a worker error event", async () => {
    const { promise, worker } = start("parcels", "/parcels.geoparquet");
    worker.emit("error", new Error("worker blew up"));

    await expect(promise).rejects.toThrow("worker blew up");
    expect(worker.terminated).toBe(true);
  });

  test("ignores an unrecognised message type", async () => {
    const { promise, worker } = start("parcels", "/parcels.geoparquet");

    worker.emit("message", { data: { type: "PROGRESS", srcName: "parcels", percent: 50 } });
    expect(worker.terminated).toBe(false);

    worker.emit("message", ready("parcels", [point([0, 0])]));
    await expect(promise).resolves.toHaveLength(1);
  });

  test("ignores messages addressed to a different map-source", async () => {
    const { promise, worker } = start("parcels", "/parcels.geoparquet");

    worker.emit("message", ready("something-else", [point([1, 1])]));
    expect(worker.terminated).toBe(false);

    worker.emit("message", ready("parcels", [point([0, 0])]));
    await expect(promise).resolves.toHaveLength(1);
  });
});
