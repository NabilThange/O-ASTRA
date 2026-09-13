import type { NextConfig } from "next";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const nextConfig: NextConfig = {
  transpilePackages: ["@bytebot/shared"],
  
  // Exclude docs folder from build
  pageExtensions: ["ts", "tsx", "js", "jsx"],
  
  // Disable linting and type checking during build (for Docker)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Speed up compilation
  experimental: {
    optimizePackageImports: ['@hugeicons/react', '@hugeicons/core-free-icons'],
  },
  
  // Faster builds in development
  webpack: (config, { dev, isServer }) => {
    // Add alias for shared package
    config.resolve.alias = {
      ...config.resolve.alias,
      "@bytebot/shared": path.resolve(__dirname, "./shared/dist"),
    };
    
    // Exclude docs folder
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ["**/docs/**", "**/node_modules/**"],
    };
    
    if (dev && !isServer) {
      // Reduce bundle size and compilation time
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
    }
    return config;
  },
};

export default nextConfig;
