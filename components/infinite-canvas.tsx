"use client";

import { AnimatePresence } from "motion/react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { NoteCard } from "@/components/note-card";
import { GRID_SIZE, POINTER_CLICK_THRESHOLD } from "@/lib/constants";
import { screenToWorld } from "@/lib/coords";
import {
  clampZoom,
  getOverlappingIds,
  getVisibleNotes,
  snapToGrid,
} from "@/lib/geometry";
import { useCanvasStore } from "@/store/use-canvas-store";

type Pointer = {
  id: number;
  x: number;
  y: number;
  noteId: string | null;
};

type Gesture =
  | { type: "none" }
  | {
      type: "pending";
      startX: number;
      startY: number;
      noteId: string | null;
    }
  | { type: "pan"; lastX: number; lastY: number }
  | { type: "two-finger-pan"; lastMidX: number; lastMidY: number }
  | {
      type: "drag-note";
      noteId: string;
      lastX: number;
      lastY: number;
      worldX: number;
      worldY: number;
    };

function midpoint(a: Pointer, b: Pointer) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function noteIdFromTarget(target: EventTarget | null) {
  const el = (target as HTMLElement | null)?.closest?.("[data-note-id]");
  return el?.getAttribute("data-note-id") ?? null;
}

function isUiTarget(target: EventTarget | null) {
  return Boolean((target as HTMLElement | null)?.closest?.("[data-ui]"));
}

const NotesLayer = memo(function NotesLayer() {
  const notes = useCanvasStore((state) => state.notes);
  const draggingId = useCanvasStore((state) => state.draggingId);
  const visible = getVisibleNotes(notes, useCanvasStore.getState().viewport);

  const overlappingIds = useMemo(() => {
    if (!draggingId) return new Set<string>();
    return getOverlappingIds(notes, draggingId);
  }, [draggingId, notes]);

  return (
    <AnimatePresence>
      {visible.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          overlapping={
            overlappingIds.has(note.id) ||
            (draggingId === note.id && overlappingIds.size > 0)
          }
        />
      ))}
    </AnimatePresence>
  );
});

export function InfiniteCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const pointersRef = useRef(new Map<number, Pointer>());
  const gestureRef = useRef<Gesture>({ type: "none" });
  const [grabbing, setGrabbing] = useState(false);
  const viewport = useCanvasStore((state) => state.viewport);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const { viewport: current, zoomAt, pan } = useCanvasStore.getState();

      if (event.ctrlKey || event.metaKey) {
        const next = clampZoom(current.zoom * Math.exp(-event.deltaY * 0.01));
        zoomAt(next, event.clientX, event.clientY);
        return;
      }

      const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 800 : 1;
      pan(-event.deltaX * scale, -event.deltaY * scale);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const beginTwoFingerPan = () => {
    const pointers = [...pointersRef.current.values()];
    if (pointers.length < 2) return;
    const mid = midpoint(pointers[0], pointers[1]);
    useCanvasStore.getState().setDraggingId(null);
    gestureRef.current = {
      type: "two-finger-pan",
      lastMidX: mid.x,
      lastMidY: mid.y,
    };
  };

  const finishEditingIfEmpty = () => {
    useCanvasStore.getState().commitEditing();
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if (isUiTarget(event.target)) return;

    const noteId = noteIdFromTarget(event.target);
    const { editingId } = useCanvasStore.getState();

    if (noteId && editingId === noteId) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      noteId,
    });

    if (pointersRef.current.size >= 2) {
      beginTwoFingerPan();
      setGrabbing(true);
      return;
    }

    if (noteId) {
      useCanvasStore.getState().bringToFront(noteId);
    }

    gestureRef.current = {
      type: "pending",
      startX: event.clientX,
      startY: event.clientY,
      noteId,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const pointer = pointersRef.current.get(event.pointerId);
    if (!pointer) return;

    pointer.x = event.clientX;
    pointer.y = event.clientY;

    if (pointersRef.current.size >= 2) {
      if (gestureRef.current.type !== "two-finger-pan") {
        beginTwoFingerPan();
        setGrabbing(true);
      }
      const pointers = [...pointersRef.current.values()];
      const mid = midpoint(pointers[0], pointers[1]);
      const gesture = gestureRef.current;
      if (gesture.type !== "two-finger-pan") return;

      useCanvasStore
        .getState()
        .pan(mid.x - gesture.lastMidX, mid.y - gesture.lastMidY);
      gesture.lastMidX = mid.x;
      gesture.lastMidY = mid.y;
      return;
    }

    const gesture = gestureRef.current;

    if (gesture.type === "pending") {
      const moved = Math.hypot(
        event.clientX - gesture.startX,
        event.clientY - gesture.startY,
      );
      if (moved <= POINTER_CLICK_THRESHOLD) return;

      if (gesture.noteId && gesture.noteId !== useCanvasStore.getState().editingId) {
        const note = useCanvasStore
          .getState()
          .notes.find((item) => item.id === gesture.noteId);
        useCanvasStore.getState().setDraggingId(gesture.noteId);
        setGrabbing(true);
        gestureRef.current = {
          type: "drag-note",
          noteId: gesture.noteId,
          lastX: event.clientX,
          lastY: event.clientY,
          worldX: note?.x ?? 0,
          worldY: note?.y ?? 0,
        };
      } else {
        setGrabbing(true);
        gestureRef.current = {
          type: "pan",
          lastX: event.clientX,
          lastY: event.clientY,
        };
      }
      return;
    }

    if (gesture.type === "pan") {
      useCanvasStore
        .getState()
        .pan(event.clientX - gesture.lastX, event.clientY - gesture.lastY);
      gesture.lastX = event.clientX;
      gesture.lastY = event.clientY;
      return;
    }

    if (gesture.type === "drag-note") {
      const { viewport: current, updateNote } = useCanvasStore.getState();
      gesture.worldX += (event.clientX - gesture.lastX) / current.zoom;
      gesture.worldY += (event.clientY - gesture.lastY) / current.zoom;
      updateNote(gesture.noteId, {
        x: snapToGrid(gesture.worldX),
        y: snapToGrid(gesture.worldY),
      });
      gesture.lastX = event.clientX;
      gesture.lastY = event.clientY;
    }
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const pointer = pointersRef.current.get(event.pointerId);
    pointersRef.current.delete(event.pointerId);

    if (pointersRef.current.size === 1 && gestureRef.current.type === "two-finger-pan") {
      const remaining = [...pointersRef.current.values()][0];
      gestureRef.current = { type: "pan", lastX: remaining.x, lastY: remaining.y };
      return;
    }

    const gesture = gestureRef.current;

    if (gesture.type === "pending" && pointer) {
      const { hydrated, editingId, addNote, setEditingId } =
        useCanvasStore.getState();

      if (gesture.noteId) {
        setEditingId(gesture.noteId);
      } else if (hydrated) {
        if (editingId) {
          finishEditingIfEmpty();
        } else {
          const world = screenToWorld(
            event.clientX,
            event.clientY,
            useCanvasStore.getState().viewport,
          );
          addNote(world);
        }
      }
    }

    if (gesture.type === "pan" && useCanvasStore.getState().editingId) {
      finishEditingIfEmpty();
    }

    if (pointersRef.current.size === 0) {
      if (gesture.type === "drag-note") {
        useCanvasStore.getState().resolveOverlaps(gesture.noteId);
      }
      useCanvasStore.getState().setDraggingId(null);
      setGrabbing(false);
      gestureRef.current = { type: "none" };
    }
  };

  const gridSize = GRID_SIZE * viewport.zoom;

  return (
    <div
      ref={canvasRef}
      className={`absolute inset-0 touch-none overflow-hidden bg-white ${
        grabbing ? "cursor-grabbing" : "cursor-default"
      }`}
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(0,0,0,0.16) 0.65px, transparent 0.75px)",
        backgroundSize: `${gridSize}px ${gridSize}px`,
        backgroundPosition: `${-viewport.x * viewport.zoom}px ${-viewport.y * viewport.zoom}px`,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        className="absolute top-0 left-0"
        style={{
          transform: `translate3d(${-viewport.x * viewport.zoom}px, ${-viewport.y * viewport.zoom}px, 0) scale(${viewport.zoom})`,
          transformOrigin: "0 0",
          willChange: "transform",
        }}
      >
        <NotesLayer />
      </div>
    </div>
  );
}
