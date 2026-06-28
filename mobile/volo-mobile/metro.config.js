const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  tailwindcss: path.resolve(__dirname, "node_modules/tailwindcss"),
};

module.exports = withNativeWind(config, { input: "./global.css" });
