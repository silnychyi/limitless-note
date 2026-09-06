"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ConfirmDelete } from "@/components/confirm-delete";
import { MarkdownBody } from "@/components/markdown-body";
import { A4_MAX_WIDTH, A4_RATIO } from "@/lib/constants";
import { useCanvasStore } from "@/store/use-canvas-store";

export function NotePage() {
  const editingId = useCanvasStore((state) => state.editingId);
  const note = useCanvasStore((state) =>
    state.notes.find((item) => item.id === state.editingId),
  );
  const updateNote = useCanvasStore((state) => state.updateNote);
  const deleteNote = useCanvasStore((state) => state.deleteNote);
  const commitEditing = useCanvasStore((state) => state.commitEditing);
  const [modeForId, setModeForId] = useState<{
    id: string | null;
    mode: "write" | "preview";
  }>({ id: null, mode: "write" });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mode =
    editingId && modeForId.id === editingId
      ? modeForId.mode
      : note?.markdown.trim()
        ? "preview"
        : "write";
  const setMode = (next: "write" | "preview") => {
    setModeForId({ id: editingId, mode: next });
  };

  useEffect(() => {
    if (!note || mode !== "write") return;
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }, [mode, note]);

  useEffect(() => {
    if (!editingId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        commitEditing();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commitEditing, editingId]);

  return (
    <AnimatePresence>
      {note && (
        <motion.div
          key={note.id}
          className="absolute inset-0 z-30 flex items-center justify-center bg-white/78 p-5 backdrop-blur-[3px] sm:p-8"
          data-ui="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) commitEditing();
          }}
        >
          <motion.article
            role="dialog"
            aria-label="Note"
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.985 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="note-page"
            style={{
              width: `min(${A4_MAX_WIDTH}px, calc(100vw - 32px))`,
              height: `min(calc(min(${A4_MAX_WIDTH}px, calc(100vw - 32px)) / ${A4_RATIO}), calc(100dvh - 32px))`,
            }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <header className="note-page-toolbar">
              <div className="flex rounded-full bg-neutral-100 p-0.5">
                <ModeButton
                  active={mode === "write"}
                  onClick={() => setMode("write")}
                >
                  Write
                </ModeButton>
                <ModeButton
                  active={mode === "preview"}
                  onClick={() => setMode("preview")}
                >
                  Preview
                </ModeButton>
              </div>
              <div className="flex items-center gap-1">
                <ConfirmDelete
                  onConfirm={() => deleteNote(note.id)}
                  label="Delete note"
                />
                <button
                  type="button"
                  aria-label="Close note"
                  onClick={() => commitEditing()}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            </header>

            {mode === "write" ? (
              <textarea
                ref={textareaRef}
                value={note.markdown}
                placeholder={"# Title\n\nWrite in Markdown…"}
                spellCheck={false}
                onChange={(event) => {
                  updateNote(note.id, { markdown: event.target.value });
                }}
                className="note-page-editor"
              />
            ) : note.markdown.trim() ? (
              <div className="note-page-preview">
                <MarkdownBody markdown={note.markdown} />
              </div>
            ) : (
              <p className="note-page-preview text-neutral-300">
                Nothing to preview yet.
              </p>
            )}
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-[12px] transition-colors ${
        active
          ? "bg-white text-neutral-800 shadow-sm"
          : "text-neutral-500 hover:text-neutral-700"
      }`}
    >
      {children}
    </button>
  );
}
