import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Help with hydration mismatches caused by browser extensions
    optimizeCss: false,
  },
  // Reduce hydration mismatches
  reactStrictMode: true,
  
  // Add headers to prevent aggressive caching in development
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: process.env.NODE_ENV === 'development' 
              ? 'no-cache, no-store, must-revalidate, max-age=0' 
              : 'public, max-age=31536000, immutable'
          },
          {
            key: 'Pragma',
            value: 'no-cache'
          },
          {
            key: 'Expires',
            value: '0'
          }
        ],
      },
      {
        // Specific handling for Next.js static assets
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: process.env.NODE_ENV === 'development' 
              ? 'no-cache, no-store, must-revalidate' 
              : 'public, max-age=31536000, immutable'
          },
        ],
      },
    ];
  },
  
  // Force generation of build ID to bust cache
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
};

export default nextConfig;
