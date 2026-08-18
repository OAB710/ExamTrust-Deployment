import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep `next dev` and `next build` isolated so a production build cannot
  // delete the manifest that an active development server is using.
  distDir: process.env.NEXT_OUTPUT_DIR || ".next",
  // Required by @opennextjs/cloudflare's build step (npm run build:cf) —
  // it reads `.next/standalone/.next/server/pages-manifest.json`, which
  // Next.js only emits when output is "standalone". Without this, build:cf
  // fails with ENOENT on that path.
  output: "standalone",
};

export default nextConfig;
