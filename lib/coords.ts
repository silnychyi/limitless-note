import type { Viewport } from "./types";

export function worldToScreen(
  worldX: number,
  worldY: number,
  viewport: Viewport,
) {
  return {
    x: (worldX - viewport.x) * viewport.zoom,
    y: (worldY - viewport.y) * viewport.zoom,
  };
}

export function screenToWorld(
  screenX: number,
  screenY: number,
  viewport: Viewport,
) {
  return {
    x: screenX / viewport.zoom + viewport.x,
    y: screenY / viewport.zoom + viewport.y,
  };
}

export function viewportCenterWorld(
  viewport: Viewport,
  screenWidth: number,
  screenHeight: number,
) {
  return screenToWorld(screenWidth / 2, screenHeight / 2, viewport);
}
