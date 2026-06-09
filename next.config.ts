import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-chat-38c2c2d5-f1e7-4697-ba4a-0fc9022b0d3f.space-z.ai",
  ],
};

export default nextConfig;
