const { getDefaultConfig } = require("@expo/metro-config");

const config = getDefaultConfig(__dirname);

// Ensure assetExts is defined
config.resolver.assetExts = config.resolver.assetExts || [];

// Add 'wasm' to assetExts if it's not already included
if (!config.resolver.assetExts.includes("wasm")) {
    config.resolver.assetExts.push("wasm");
}

module.exports = config;
