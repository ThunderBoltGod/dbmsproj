/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] },
  },
  images: {
    remotePatterns: [],
    // Allow local uploads served from /uploads/
    unoptimized: false,
  },
};

module.exports = nextConfig;
