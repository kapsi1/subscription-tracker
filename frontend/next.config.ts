import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.0.241'],
  transpilePackages: ["@subtracker/shared"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "flagcdn.com" },
    ],
  },
};

export default nextConfig;
