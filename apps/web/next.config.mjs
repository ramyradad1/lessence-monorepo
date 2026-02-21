/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@lessence/core", "@lessence/supabase", "@lessence/ui"],
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'mdlceagbdodmpgdfocrz.supabase.co',
                port: '',
                pathname: '/storage/v1/object/public/**',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                port: '',
                pathname: '/**',
            }
        ],
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    output: "standalone",
    env: {
        NEXT_PUBLIC_SUPABASE_URL: "https://mdlceagbdodmpgdfocrz.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: "sb_publishable_JwsgSf70Sz3FcVLsOTUqlw_Fl-y2Hl4"
    }
};

export default nextConfig;
