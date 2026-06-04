/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  serverExternalPackages: [
    "@prisma/client",
    "prisma",
    "@google/generative-ai",
    "@arcjet/next",
  ],
};

export default nextConfig;