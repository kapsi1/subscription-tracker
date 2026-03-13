import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@subtracker/shared"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "flagcdn.com" },
    ],
  },
};

export default nextConfig;
