/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@lessence/core", "@lessence/supabase", "@lessence/ui"],
    images: {
        unoptimized: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
};

export default nextConfig;
