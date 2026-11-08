import type { MetadataRoute } from "next";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";

// Lets people add Amble to their home screen and open it full screen, like an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_TAGLINE,
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    categories: ["lifestyle", "social"],
    // Same as the page background in globals.css, so the launch screen blends into the app.
    background_color: "#f6f6f2",
    theme_color: "#f6f6f2",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
