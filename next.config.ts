import type { NextConfig } from "next";

/** `standalone` is for Docker self-hosting; Vercel applies its own output layout. */
const nextConfig: NextConfig = {
  ...(!process.env.VERCEL ? { output: "standalone" as const } : {}),
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
