import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  allowedDevOrigins: ["*.localhost", "localhost", "127.0.0.1"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
