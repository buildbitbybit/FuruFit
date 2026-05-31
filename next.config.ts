import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Enable static HTML export for GitHub Pages
  images: { unoptimized: true },
};

export default nextConfig;
