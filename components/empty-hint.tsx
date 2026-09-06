"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCanvasStore } from "@/store/use-canvas-store";

export function EmptyHint() {
  const hydrated = useCanvasStore((state) => state.hydrated);
  const notes = useCanvasStore((state) => state.notes);
  const visible = hydrated && notes.length === 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-[16px] text-neutral-300"
        >
          Click anywhere to write
        </motion.p>
      )}
    </AnimatePresence>
  );
}
