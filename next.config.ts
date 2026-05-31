import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Enable static HTML export for GitHub Pages
  images: { unoptimized: true },
  basePath: '/FuruFit',
};

export default nextConfig;
