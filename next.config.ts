import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // このプロジェクト配下をワークスペースルートとして扱う
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
