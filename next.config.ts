import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Inlined into the client bundle so the footer can show which build is running.
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version ?? "unknown",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "stellar.expert",
      },
    ],
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
