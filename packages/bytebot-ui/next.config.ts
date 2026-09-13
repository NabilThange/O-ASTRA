import type { NextConfig } from "next";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const nextConfig: NextConfig = {
  transpilePackages: ["@bytebot/shared", "motion"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "motion/react": path.resolve(__dirname, "node_modules/motion/dist/cjs/react.js"),
    };
    return config;
  },
};

export default nextConfig;
