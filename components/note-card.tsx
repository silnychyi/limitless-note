"use client";

import { motion } from "motion/react";
import { memo, useEffect, useRef, useState } from "react";
import { MarkdownBody } from "@/components/markdown-body";
import { CARD_MAX_HEIGHT, CARD_PREVIEW_CHARS } from "@/lib/constants";
import type { Note } from "@/lib/types";
import { useCanvasStore } from "@/store/use-canvas-store";

type NoteCardProps = {
  note: Note;
  overlapping: boolean;
};

export const NoteCard = memo(function NoteCard({
  note,
  overlapping,
}: NoteCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const draggingId = useCanvasStore((state) => state.draggingId);
  const updateNote = useCanvasStore((state) => state.updateNote);
  const [clipped, setClipped] = useState(
    note.markdown.trim().length > CARD_PREVIEW_CHARS,
  );

  const isDragging = draggingId === note.id;
  const isNew = Date.now() - note.createdAt < 600;

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const measure = () => {
      const overflows = el.scrollHeight > el.clientHeight + 1;
      const truncated = note.markdown.trim().length > CARD_PREVIEW_CHARS;
      setClipped(overflows || truncated);

      const height = Math.min(el.offsetHeight, CARD_MAX_HEIGHT);
      if (Math.abs(height - note.height) > 1) {
        updateNote(note.id, { height });
      }
    };

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    measure();
    return () => observer.disconnect();
  }, [note.height, note.id, note.markdown, updateNote]);

  return (
    <motion.article
      ref={cardRef}
      data-note-id={note.id}
      initial={isNew ? { opacity: 0, scale: 0.92 } : false}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ type: "spring", stiffness: 460, damping: 32 }}
      className={`note-card absolute origin-top-left ${
        overlapping ? "note-card-overlap" : ""
      } ${isDragging ? "note-card-dragging" : ""} ${
        clipped ? "is-clipped" : ""
      }`}
      style={{
        left: note.x,
        top: note.y,
        width: note.width,
        maxHeight: CARD_MAX_HEIGHT,
        zIndex: note.zIndex,
      }}
    >
      {note.markdown.trim() ? (
        <MarkdownBody markdown={note.markdown} excerpt />
      ) : (
        <p className="text-[15px] leading-7 text-neutral-300">Click to write</p>
      )}
      <div className="note-card-fade" />
    </motion.article>
  );
});
