import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
    // ... existing config
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
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
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
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kbGNlYWdiZG9kbXBnZGZvY3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODM4MTEsImV4cCI6MjA4NzE1OTgxMX0.ZSKteQSLGlHKLatY62swXdtTSRRjLYwbiDwSW9ICaTY",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: "sb_publishable_JwsgSf70Sz3FcVLsOTUqlw_Fl-y2Hl4"
    }
};

export default withNextIntl(nextConfig);
