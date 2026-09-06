import { clampZoom } from "./geometry";
import type { Note, Workspace } from "./types";

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function parseWorkspace(data: unknown): Workspace | null {
  if (!data || typeof data !== "object") return null;

  const raw = data as Record<string, unknown>;
  if (raw.version !== 1) return null;
  if (!raw.viewport || typeof raw.viewport !== "object") return null;
  if (!Array.isArray(raw.notes)) return null;

  const viewport = raw.viewport as Record<string, unknown>;
  if (
    !isFiniteNumber(viewport.x) ||
    !isFiniteNumber(viewport.y) ||
    !isFiniteNumber(viewport.zoom)
  ) {
    return null;
  }

  const notes: Note[] = [];

  for (const item of raw.notes) {
    if (!item || typeof item !== "object") return null;
    const note = item as Record<string, unknown>;

    if (typeof note.id !== "string" || note.id.length === 0) return null;
    if (!isFiniteNumber(note.x) || !isFiniteNumber(note.y)) return null;
    if (!isFiniteNumber(note.width) || note.width <= 0) return null;
    if (typeof note.markdown !== "string") return null;
    if (!isFiniteNumber(note.createdAt) || !isFiniteNumber(note.updatedAt)) {
      return null;
    }

    notes.push({
      id: note.id,
      x: note.x,
      y: note.y,
      width: note.width,
      height: isFiniteNumber(note.height) && note.height > 0 ? note.height : 160,
      zIndex: isFiniteNumber(note.zIndex) ? note.zIndex : notes.length + 1,
      markdown: note.markdown,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    });
  }

  return {
    version: 1,
    notes,
    viewport: {
      x: viewport.x,
      y: viewport.y,
      zoom: clampZoom(viewport.zoom),
    },
  };
}

export function serializeWorkspace(workspace: Workspace): string {
  return JSON.stringify(workspace, null, 2);
}
