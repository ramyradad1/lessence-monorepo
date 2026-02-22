const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Ensure we use the workspace root's react if needed, or lock it to the mobile app's react
const path = require("path");
config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName.startsWith("react") || moduleName.startsWith("react-dom")) {
        try {
            // Force resolution from the mobile app's node_modules
            const resolvedPath = require.resolve(moduleName, { paths: [__dirname] });
            return {
                filePath: resolvedPath,
                type: "sourceFile",
            };
        } catch (e) {
            // Fallback for internal paths if require.resolve fails
            return context.resolveRequest(context, moduleName, platform);
        }
    }
    return context.resolveRequest(context, moduleName, platform);
};

// Ignore the web app to prevent ENOENT errors during watching
config.resolver.blockList = [
    /.*\/apps\/web\/.*/,
];

module.exports = withNativeWind(config, { input: "./global.css" });
