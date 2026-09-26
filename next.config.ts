import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Opt in only annotated components; keep this change scoped to the explorer.
  reactCompiler: { compilationMode: "annotation" },
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

// Load the development-only analyzer only for the explicit analysis command.
// Production Docker images install with --omit=dev.
export default async function config() {
  if (process.env.ANALYZE === "true") {
    const { default: bundleAnalyzer } = await import("@next/bundle-analyzer");
    return bundleAnalyzer({ enabled: true, openAnalyzer: false })(nextConfig);
  }
  return nextConfig;
}
