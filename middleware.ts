import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const NETWORK_ONLY_SW = `/* Network-only worker. Notes live in IndexedDB, never Cache Storage. */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
`;

export function middleware(request: NextRequest) {
  if (
    process.env.NODE_ENV === "development" &&
    request.nextUrl.pathname === "/sw.js"
  ) {
    return new NextResponse(NETWORK_ONLY_SW, {
      headers: {
        "content-type": "application/javascript; charset=utf-8",
        "cache-control": "no-store",
        "service-worker-allowed": "/",
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/sw.js",
};
