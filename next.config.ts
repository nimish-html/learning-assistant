import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: [
      '@supabase/supabase-js', 
      'lucide-react',
      '@ai-sdk/react',
      '@ai-sdk/xai',
      'react-aria-components'
    ],
  },
  
  // Transpile packages for better compatibility
  transpilePackages: ['@supabase/supabase-js'],
  
  // Optimize images and static assets
  images: {
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Production optimizations
  poweredByHeader: false,
  compress: true,
  
  // Bundle analyzer and optimization
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size in production
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            // Separate Supabase into its own chunk
            supabase: {
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
              name: 'supabase',
              chunks: 'all',
              priority: 10,
            },
            // Separate AI SDK into its own chunk
            ai: {
              test: /[\\/]node_modules[\\/]@ai-sdk[\\/]/,
              name: 'ai-sdk',
              chunks: 'all',
              priority: 10,
            },
            // Separate React Aria into its own chunk
            reactAria: {
              test: /[\\/]node_modules[\\/]react-aria-components[\\/]/,
              name: 'react-aria',
              chunks: 'all',
              priority: 10,
            },
          },
        },
      }
    }
    
    return config
  },
  
  // Security headers for production
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
      // Cache static assets
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
