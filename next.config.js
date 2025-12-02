/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack configuration (Next.js 16 uses Turbopack by default)
  turbopack: {},
  
  // Webpack configuration for compatibility (used when --webpack flag is passed)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig
