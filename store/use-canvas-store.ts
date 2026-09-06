import { create } from "zustand";
import {
  DEFAULT_NOTE_HEIGHT,
  DEFAULT_NOTE_WIDTH,
} from "@/lib/constants";
import { resolveOverlaps as placeWithoutOverlaps } from "@/lib/collision";
import { screenToWorld } from "@/lib/coords";
import { emptyWorkspace, loadWorkspace, saveWorkspace } from "@/lib/db";
import { clampZoom, snapToGrid } from "@/lib/geometry";
import { createId } from "@/lib/id";
import { createMarkdownSyntaxNote } from "@/lib/markdown-syntax-note";
import { createStarterNotes } from "@/lib/sample-note";
import type { Note, Viewport, Workspace } from "@/lib/types";

export interface CanvasStore {
  notes: Note[];
  viewport: Viewport;
  hydrated: boolean;
  nextZ: number;
  editingId: string | null;
  draggingId: string | null;

  hydrate: () => Promise<void>;
  addNote: (position?: { x: number; y: number }) => string;
  addMarkdownSyntaxNote: () => string;
  updateNote: (id: string, changes: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  bringToFront: (id: string) => void;
  setViewport: (viewport: Viewport) => void;
  pan: (dx: number, dy: number) => void;
  zoomAt: (zoom: number, screenX: number, screenY: number) => void;
  setEditingId: (id: string | null) => void;
  setDraggingId: (id: string | null) => void;
  resolveOverlaps: (anchorId: string) => void;
  commitEditing: () => void;
  replaceWorkspace: (workspace: Workspace) => void;
  clearWorkspace: () => void;
  persistNow: () => Promise<void>;
}

function nextZFromNotes(notes: Note[]): number {
  return notes.reduce((max, note) => Math.max(max, note.zIndex), 0) + 1;
}

function snapshot(): Workspace {
  const { notes, viewport } = useCanvasStore.getState();
  return { version: 1, notes, viewport };
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  notes: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  hydrated: false,
  nextZ: 1,
  editingId: null,
  draggingId: null,

  hydrate: async () => {
    if (get().hydrated) return;
    const { workspace, isNew } = await loadWorkspace();
    const starter = isNew ? createStarterNotes(workspace.viewport) : null;
    const notes = starter
      ? placeWithoutOverlaps(starter, starter[0].id)
      : workspace.notes;
    set({
      notes,
      viewport: workspace.viewport,
      nextZ: nextZFromNotes(notes),
      hydrated: true,
      editingId: null,
      draggingId: null,
    });
    void saveWorkspace({
      version: 1,
      notes,
      viewport: workspace.viewport,
    });
  },

  addNote: (position) => {
    const { notes, nextZ, viewport } = get();
    const width = DEFAULT_NOTE_WIDTH;
    const point = position ?? {
      x: viewport.x + 120,
      y: viewport.y + 120,
    };
    const now = Date.now();
    const id = createId();

    const note: Note = {
      id,
      x: snapToGrid(point.x - width / 2),
      y: snapToGrid(point.y - 36),
      width,
      height: DEFAULT_NOTE_HEIGHT,
      zIndex: nextZ,
      markdown: "",
      createdAt: now,
      updatedAt: now,
    };

    set({
      notes: placeWithoutOverlaps([...notes, note], id),
      nextZ: nextZ + 1,
      editingId: id,
      draggingId: null,
    });

    return id;
  },

  addMarkdownSyntaxNote: () => {
    const { notes, nextZ, viewport } = get();
    const note = createMarkdownSyntaxNote(viewport, { zIndex: nextZ });
    set({
      notes: placeWithoutOverlaps([...notes, note], note.id),
      nextZ: nextZ + 1,
      editingId: note.id,
      draggingId: null,
    });
    return note.id;
  },

  updateNote: (id, changes) => {
    set({
      notes: get().notes.map((note) => {
        if (note.id !== id) return note;
        const updatedAt =
          changes.markdown !== undefined ? Date.now() : note.updatedAt;
        return { ...note, ...changes, updatedAt };
      }),
    });
  },

  deleteNote: (id) => {
    const { notes, editingId, draggingId } = get();
    set({
      notes: notes.filter((note) => note.id !== id),
      editingId: editingId === id ? null : editingId,
      draggingId: draggingId === id ? null : draggingId,
    });
  },

  bringToFront: (id) => {
    const { notes, nextZ } = get();
    const note = notes.find((item) => item.id === id);
    if (!note || note.zIndex === nextZ - 1) return;
    set({
      notes: notes.map((item) =>
        item.id === id ? { ...item, zIndex: nextZ } : item,
      ),
      nextZ: nextZ + 1,
    });
  },

  setViewport: (viewport) => set({ viewport }),

  pan: (dx, dy) => {
    const { viewport } = get();
    set({
      viewport: {
        ...viewport,
        x: viewport.x - dx / viewport.zoom,
        y: viewport.y - dy / viewport.zoom,
      },
    });
  },

  zoomAt: (zoom, screenX, screenY) => {
    const { viewport } = get();
    const nextZoom = clampZoom(zoom);
    const world = screenToWorld(screenX, screenY, viewport);
    set({
      viewport: {
        x: world.x - screenX / nextZoom,
        y: world.y - screenY / nextZoom,
        zoom: nextZoom,
      },
    });
  },

  setEditingId: (id) => set({ editingId: id }),
  setDraggingId: (id) => set({ draggingId: id }),

  resolveOverlaps: (anchorId) => {
    set({ notes: placeWithoutOverlaps(get().notes, anchorId) });
  },

  commitEditing: () => {
    const { editingId, notes } = get();
    if (!editingId) return;
    const note = notes.find((item) => item.id === editingId);
    if (note && !note.markdown.trim()) {
      get().deleteNote(editingId);
      return;
    }
    set({ editingId: null });
  },

  replaceWorkspace: (workspace) => {
    set({
      notes: workspace.notes,
      viewport: workspace.viewport,
      nextZ: nextZFromNotes(workspace.notes),
      editingId: null,
      draggingId: null,
      hydrated: true,
    });
  },

  clearWorkspace: () => {
    const workspace = emptyWorkspace();
    set({
      notes: workspace.notes,
      viewport: workspace.viewport,
      nextZ: 1,
      editingId: null,
      draggingId: null,
    });
  },

  persistNow: async () => {
    if (!get().hydrated) return;
    await saveWorkspace(snapshot());
  },
}));
