import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep `next dev` and `next build` isolated so a production build cannot
  // delete the manifest that an active development server is using.
  distDir: process.env.NEXT_OUTPUT_DIR || ".next",
};

export default nextConfig;
