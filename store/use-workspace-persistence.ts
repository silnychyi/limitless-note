"use client";

import { useEffect } from "react";
import { PERSIST_DEBOUNCE_MS } from "@/lib/constants";
import { saveWorkspace } from "@/lib/db";
import { useCanvasStore } from "./use-canvas-store";

export function useWorkspacePersistence() {
  const hydrate = useCanvasStore((state) => state.hydrate);
  const hydrated = useCanvasStore((state) => state.hydrated);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;

    let timer: number | undefined;

    const persist = () => {
      const { notes, viewport, hydrated: ready } = useCanvasStore.getState();
      if (!ready) return;
      void saveWorkspace({ version: 1, notes, viewport });
    };

    const unsub = useCanvasStore.subscribe((state, prev) => {
      if (state.notes === prev.notes && state.viewport === prev.viewport) {
        return;
      }
      window.clearTimeout(timer);
      timer = window.setTimeout(persist, PERSIST_DEBOUNCE_MS);
    });

    const flush = () => {
      window.clearTimeout(timer);
      persist();
    };

    const onHidden = () => {
      if (document.visibilityState === "hidden") flush();
    };

    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHidden);

    return () => {
      window.clearTimeout(timer);
      unsub();
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHidden);
    };
  }, [hydrated]);
}
