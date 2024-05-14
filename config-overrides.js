const path = require("path-browserify");

module.exports = function override(config, env) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    path: require.resolve("path-browserify"),
    fs: require.resolve("browserify-fs"),
    readline: false,
  };
  return config;
};
