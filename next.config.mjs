/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Enable development server for all hostnames in Replit environment
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
  // Configuration for Replit proxy environment
  images: {
    domains: [
      'localhost',
      'eriggalive.com',
      'www.eriggalive.com',
      'eriggalive.vercel.app',
      '*.replit.dev',
      '*.repl.co',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.replit.dev',
      },
      {
        protocol: 'https',
        hostname: '**.repl.co',
      },
    ],
    unoptimized: true,
  },
  // Enable allowedHosts for Replit proxy environment
  async rewrites() {
    return []
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
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
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  experimental: {
    // Disable the missing suspense with CSR bailout check
    missingSuspenseWithCSRBailout: false,
    // Additional experimental flags to help with SSR issues
    serverComponentsExternalPackages: [],
    optimizePackageImports: ['lucide-react'],
  },
  // Force static generation for specific pages
  output: 'standalone',
};

export default nextConfig;
