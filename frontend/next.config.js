/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  trailingSlash: false,
  
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  
  images: {
    domains: ['localhost'],
  },
  
  typescript: {
    ignoreBuildErrors: false,
  },
  
  eslint: {
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig
