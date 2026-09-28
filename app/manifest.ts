import type { MetadataRoute } from "next";
import { colorTokens } from "@/lib/generated/palette";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lumina — Stellar Data Explorer",
    short_name: "Lumina",
    description: "Explore indexed data and Soroban events on the Stellar network.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: colorTokens["--color-bg-base"],
    theme_color: colorTokens["--color-accent-fill"],
    icons: [
      { src: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" },
    ],
  };
}