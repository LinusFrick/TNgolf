/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly set the workspace root to the current project directory
  // Using absolute path to prevent Next.js from detecting parent directory's package-lock.json
  outputFileTracingRoot: 'C:\\Users\\KIFLI\\Desktop\\kod\\tngolf',
  
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
