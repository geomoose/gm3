module.exports = api => {
  const plugins = [];
  if (api.env('test')) {
    plugins.push("babel-plugin-transform-import-meta");
  }

  return {
    "presets": ["@babel/env", "@babel/react"],
    "targets": {
        "node": "current"
    },
    plugins,
  }
}
