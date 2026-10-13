// Both demos receive this configuration, even when their ignored config.js is absent.
const mode = process.env.E2E_MODE || "live";
if (!["live", "fixture"].includes(mode)) throw new Error(`Unknown E2E_MODE: ${mode}`);

module.exports = {
  mode,
  mapserverURL: process.env.E2E_MAPSERVER_URL || "https://demo.geomoose.org/cgi-bin/mapserv",
  mapfileRoot: process.env.E2E_MAPFILE_ROOT || "/srv/demo/src/3.x/gm3-demo-data/",
};
