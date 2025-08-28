/** @type {import('next').NextConfig} */
const nextConfig = {
  // React configuration
  reactStrictMode: true,
  swcMinify: true,

  // Production optimizations
  output: 'standalone',
  compress: true,
  poweredByHeader: false,

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Experimental features
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
    optimizePackageImports: ['@heroicons/react', 'lodash'],
  },

  // Image optimization
  images: {
    domains: [
      'localhost',
      'rbi.org.in',
      'sebi.gov.in',
      'irdai.gov.in',
      'cdn.rbi-compliance.com',
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Security headers
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
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.rbi-compliance.com wss://api.rbi-compliance.com;",
          },
        ],
      },
    ];
  },

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Public runtime config
  publicRuntimeConfig: {
    APP_NAME: 'RBI Compliance Platform',
    APP_VERSION: '1.0.0',
  },

  // Server runtime config
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname,
  },

  // Headers configuration
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
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'development' ? '*' : 'https://compliance.yourdomain.com',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },

  // Redirects configuration
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/dashboard/overview',
        permanent: true,
      },
      {
        source: '/compliance',
        destination: '/compliance/overview',
        permanent: true,
      },
    ];
  },

  // Rewrites configuration - disabled for now to fix startup issues
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/regulatory/:path*',
  //       destination: 'http://localhost:8000/api/v1/regulatory/:path*',
  //     },
  //     {
  //       source: '/api/compliance/:path*',
  //       destination: 'http://localhost:8000/api/v1/compliance/:path*',
  //     },
  //     {
  //       source: '/api/documents/:path*',
  //       destination: 'http://localhost:8000/api/v1/documents/:path*',
  //     },
  //     {
  //       source: '/api/risk/:path*',
  //       destination: 'http://localhost:8000/api/v1/risk/:path*',
  //     },
  //     {
  //       source: '/api/ai/:path*',
  //       destination: 'http://localhost:8000/api/v1/ai/:path*',
  //     },
  //   ];
  // },

  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Custom webpack configurations can be added here
    // Bundle analyzer removed to avoid dependency issues

    // Custom webpack rules
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    // Resolve aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/lib': path.resolve(__dirname, 'src/lib'),
      '@/hooks': path.resolve(__dirname, 'src/hooks'),
      '@/types': path.resolve(__dirname, 'src/types'),
      '@/utils': path.resolve(__dirname, 'src/utils'),
      '@/styles': path.resolve(__dirname, 'src/styles'),
    };

    // Optimization
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      };
    }

    return config;
  },

  // Output configuration
  output: 'standalone',

  // Compression
  compress: true,

  // Power by header
  poweredByHeader: false,

  // Generate ETags
  generateEtags: true,

  // Page extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],

  // Trailing slash
  trailingSlash: false,

  // Asset prefix for CDN
  assetPrefix: process.env.NODE_ENV === 'production' ? process.env.CDN_URL : '',

  // Base path
  basePath: process.env.BASE_PATH || '',
};

const path = require('path');

module.exports = nextConfig;
