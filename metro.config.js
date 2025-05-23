// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("@expo/metro-config");

// Fallback for Node.js < 18
const os = require("os");
if (!os.availableParallelism) {
    os.availableParallelism = () => os.cpus().length;
}

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
    // [Web-only]: Enables CSS support in Metro.
    isCSSEnabled: true,
});

// Handle ES modules
config.resolver.sourceExts = [...config.resolver.sourceExts, "mjs", "cjs"];
config.transformer.experimentalImportSupport = false;
config.resolver.resolverMainFields = ["react-native", "browser", "main"];

// Add support for web-specific file extensions
const { resolver } = config;
config.resolver = {
    ...resolver,
    sourceExts: [
        ...resolver.sourceExts,
        "web.js",
        "web.jsx",
        "web.ts",
        "web.tsx",
    ],
};

// Ensure assetExts is defined
config.resolver.assetExts = config.resolver.assetExts || [];

// Add 'wasm' to assetExts if it's not already included
if (!config.resolver.assetExts.includes("wasm")) {
    config.resolver.assetExts.push("wasm");
}

module.exports = config;
