import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ShiftWise",
    short_name: "ShiftWise",
    description: "Shift tracker for international students working abroad",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    scope: "/",
    background_color: "#f0f4f8",
    theme_color: "#f0f4f8",
    icons: [
      {
        src: "/icon-filled.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-filled.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  }
}
