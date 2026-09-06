"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export function ConfirmDelete({
  onConfirm,
  label = "Delete note",
}: {
  onConfirm: () => void;
  label?: string;
}) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = window.setTimeout(() => setArmed(false), 2400);
    return () => window.clearTimeout(timer);
  }, [armed]);

  if (!armed) {
    return (
      <button
        type="button"
        data-ui="true"
        aria-label={label}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          setArmed(true);
        }}
        className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
      >
        <Trash2 size={14} strokeWidth={2} />
      </button>
    );
  }

  return (
    <button
      type="button"
      data-ui="true"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onConfirm();
      }}
      className="h-7 rounded-full bg-red-50 px-2.5 text-[12px] font-medium text-red-600 transition-colors hover:bg-red-100"
    >
      Delete
    </button>
  );
}
