import type { MetadataRoute } from "next";

export const dynamic = "force-static";
export const revalidate = false;

const ICON = {
  src: "/limitless.svg",
  type: "image/svg+xml",
  sizes: "any" as const,
};

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Limitless Note",
    short_name: "Limitless",
    description: "A spatial canvas for Markdown notes, stored on this device.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    lang: "en",
    categories: ["productivity", "utilities"],
    icons: [
      { ...ICON, purpose: "any" },
      { ...ICON, purpose: "maskable" },
    ],
  };
}
