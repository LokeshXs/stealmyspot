import type { MetadataRoute } from "next";
import { HOME_DESCRIPTION } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Steal My Spot",
    short_name: "Steal My Spot",
    description: HOME_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#fbfbfd",
    theme_color: "#6d5cf6",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
