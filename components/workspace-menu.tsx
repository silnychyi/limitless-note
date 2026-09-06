"use client";

import { Download, Ellipsis, Hash, Trash2, Upload } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { replaceWorkspace } from "@/lib/db";
import { parseWorkspace, serializeWorkspace } from "@/lib/workspace";
import { useCanvasStore } from "@/store/use-canvas-store";

export function WorkspaceMenu() {
  const editingId = useCanvasStore((state) => state.editingId);
  const [open, setOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
      setConfirmClear(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const showMessage = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 2200);
  };

  const exportWorkspace = () => {
    const { notes, viewport } = useCanvasStore.getState();
    const blob = new Blob(
      [serializeWorkspace({ version: 1, notes, viewport })],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "limitless-note.json";
    link.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const importWorkspace = async (file: File) => {
    try {
      const parsed = parseWorkspace(JSON.parse(await file.text()));
      if (!parsed) {
        showMessage("That file isn’t a valid workspace.");
        return;
      }
      useCanvasStore.getState().replaceWorkspace(parsed);
      await replaceWorkspace(parsed);
      showMessage("Workspace imported.");
    } catch {
      showMessage("That file isn’t a valid workspace.");
    } finally {
      setOpen(false);
      setConfirmClear(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const addMarkdownSyntax = () => {
    useCanvasStore.getState().addMarkdownSyntaxNote();
    setOpen(false);
    setConfirmClear(false);
  };

  const clearWorkspace = async () => {
    useCanvasStore.getState().clearWorkspace();
    await useCanvasStore.getState().persistNow();
    setConfirmClear(false);
    setOpen(false);
  };

  if (editingId) return null;

  return (
    <div ref={menuRef} className="absolute top-5 right-5 z-20" data-ui="true">
      <motion.button
        type="button"
        aria-label="Workspace menu"
        aria-expanded={open}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setOpen((value) => !value);
          setConfirmClear(false);
        }}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-700 shadow-[0_6px_20px_rgba(0,0,0,0.06)] ring-1 ring-black/5"
      >
        <Ellipsis size={18} strokeWidth={1.75} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute top-12 right-0 w-52 overflow-hidden rounded-2xl bg-white py-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.1)] ring-1 ring-black/5"
          >
            <MenuItem
              icon={Hash}
              label="Markdown syntax"
              onClick={addMarkdownSyntax}
            />
            <MenuItem icon={Download} label="Export workspace" onClick={exportWorkspace} />
            <MenuItem
              icon={Upload}
              label="Import workspace"
              onClick={() => fileRef.current?.click()}
            />
            {confirmClear ? (
              <button
                type="button"
                onClick={clearWorkspace}
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-red-600 hover:bg-red-50"
              >
                <Trash2 size={15} strokeWidth={1.75} />
                Clear all notes?
              </button>
            ) : (
              <MenuItem
                icon={Trash2}
                label="Clear workspace"
                danger
                onClick={() => setConfirmClear(true)}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void importWorkspace(file);
        }}
      />

      <AnimatePresence>
        {message && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-12 right-0 w-56 rounded-xl bg-white px-3 py-2 text-[12px] text-neutral-600 shadow-[0_10px_24px_rgba(0,0,0,0.08)] ring-1 ring-black/5"
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Download;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] hover:bg-neutral-50 ${
        danger ? "text-neutral-500 hover:text-red-600" : "text-neutral-700"
      }`}
    >
      <Icon size={15} strokeWidth={1.75} />
      {label}
    </button>
  );
}
