const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, "node_modules"),
    path.resolve(workspaceRoot, "node_modules"),
];

// Ensure we use the workspace root's react if needed, or lock it to the mobile app's react
config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName.startsWith("react") || moduleName.startsWith("react-dom")) {
        try {
    // Force resolution from the mobile app's node_modules
            const resolvedPath = require.resolve(moduleName, { paths: [projectRoot] });
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
config.resolver.blockList = [/.*\/apps\/web\/.*/];

module.exports = withNativeWind(config, { input: "./global.css" });

