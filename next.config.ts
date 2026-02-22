import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
} as NextConfig & { eslint: { ignoreDuringBuilds: boolean } };

export default nextConfig;
