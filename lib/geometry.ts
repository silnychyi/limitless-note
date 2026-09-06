import { GRID_SIZE, MAX_ZOOM, MIN_ZOOM } from "./constants";
import type { Note, Rect, Viewport } from "./types";

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export function snapToGrid(value: number, grid = GRID_SIZE): number {
  return Math.round(value / grid) * grid;
}

export function intersects(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function noteRect(note: Note): Rect {
  return {
    x: note.x,
    y: note.y,
    width: note.width,
    height: note.height,
  };
}

export function getOverlappingIds(notes: Note[], noteId: string): Set<string> {
  const target = notes.find((note) => note.id === noteId);
  if (!target) return new Set();

  const a = noteRect(target);
  const ids = new Set<string>();

  for (const note of notes) {
    if (note.id === noteId) continue;
    if (intersects(a, noteRect(note))) ids.add(note.id);
  }

  return ids;
}

export function getVisibleNotes(
  notes: Note[],
  viewport: Viewport,
  screen?: { width: number; height: number },
): Note[] {
  void viewport;
  void screen;
  return notes;
}
