import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'v2.exercisedb.io' },
      { protocol: 'https', hostname: 'exercisedb.io' },
      { protocol: 'https', hostname: '*.rapidapi.com' },
      { protocol: 'https', hostname: 'v2.uploadthing.com' },
      { protocol: 'https', hostname: 'raw.githubusercontent.com' },
      { protocol: 'https', hostname: 'cdn.exercisedb.dev' },
    ],
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
