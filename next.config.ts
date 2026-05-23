import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@google-cloud/vision", "sharp"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
