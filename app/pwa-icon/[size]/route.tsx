import { ImageResponse } from "next/og";
import { AppIconMark } from "@/lib/app-icon";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = false;

const ALLOWED = new Set([192, 512]);

export function generateStaticParams() {
  return [{ size: "192" }, { size: "512" }];
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> },
) {
  const size = Number((await params).size);
  if (!ALLOWED.has(size)) {
    return new Response("Not found", { status: 404 });
  }

  return new ImageResponse(<AppIconMark size={size} />, {
    width: size,
    height: size,
  });
}
