import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // このプロジェクト配下をワークスペースルートとして扱う
    root: __dirname,
  },
};

export default nextConfig;
