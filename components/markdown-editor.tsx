"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { MarkdownHintMenu } from "@/components/markdown-hint-menu";
import { getCaretCoordinates } from "@/lib/caret-coordinates";
import {
  applyMarkdownHint,
  getMarkdownHints,
  type MarkdownHintState,
} from "@/lib/markdown-hints";

type MarkdownEditorProps = {
  noteId: string;
  markdown: string;
  active: boolean;
  onChange: (value: string) => void;
};

type HintMenu = MarkdownHintState & {
  index: number;
  top: number;
  left: number;
};

export function MarkdownEditor({
  noteId,
  markdown,
  active,
  onChange,
}: MarkdownEditorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HintMenu | null>(null);
  const pendingSelection = useRef<{ start: number; end: number } | null>(null);
  const [menu, setMenu] = useState<HintMenu | null>(null);

  useLayoutEffect(() => {
    menuRef.current = menu;
  }, [menu]);

  useEffect(() => {
    if (!active) return;
    textareaRef.current?.focus();
  }, [noteId, active]);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const syncBottomSpace = () => {
      const styles = window.getComputedStyle(textarea);
      const line = Number.parseFloat(styles.lineHeight) || 27;
      const top = Number.parseFloat(styles.paddingTop) || 0;
      textarea.style.paddingBottom = `${Math.max(
        textarea.clientHeight - top - line * 3,
        120,
      )}px`;
    };

    syncBottomSpace();
    const observer = new ResizeObserver(syncBottomSpace);
    observer.observe(textarea);
    return () => observer.disconnect();
  }, [active]);

  useLayoutEffect(() => {
    const selection = pendingSelection.current;
    const textarea = textareaRef.current;
    if (!selection || !textarea) return;
    pendingSelection.current = null;
    textarea.focus();
    textarea.setSelectionRange(selection.start, selection.end);
  }, [markdown]);

  const placeMenu = (
    textarea: HTMLTextAreaElement,
    next: MarkdownHintState,
  ) => {
    const caret = getCaretCoordinates(textarea, textarea.selectionStart);
    const root = rootRef.current;
    if (!root) return;

    const top = Math.min(
      caret.top + caret.height + 6,
      root.clientHeight - 8,
    );
    const left = Math.min(Math.max(caret.left, 12), root.clientWidth - 220);
    const current = menuRef.current;
    const currentId = current?.items[current.index]?.id;
    const index = currentId
      ? Math.max(
          0,
          next.items.findIndex((item) => item.id === currentId),
        )
      : 0;

    setMenu({ ...next, index, top, left });
  };

  const refreshMenu = (textarea: HTMLTextAreaElement) => {
    const next = getMarkdownHints(textarea.value, textarea.selectionStart);
    if (!next) {
      setMenu(null);
      return;
    }
    placeMenu(textarea, next);
  };

  const applyItem = (index: number) => {
    const textarea = textareaRef.current;
    const current = menuRef.current;
    const item = current?.items[index];
    if (!textarea || !current || !item) return;

    const next = applyMarkdownHint(textarea.value, current, item);
    pendingSelection.current = {
      start: next.selectionStart,
      end: next.selectionEnd,
    };
    onChange(next.text);
    setMenu(null);
  };

  return (
    <div
      ref={rootRef}
      className={active ? "note-page-editor" : "note-page-editor is-hidden"}
    >
      <textarea
        ref={textareaRef}
        className="note-page-input"
        value={markdown}
        onChange={(event) => {
          onChange(event.target.value);
          refreshMenu(event.target);
        }}
        onClick={(event) => refreshMenu(event.currentTarget)}
        onScroll={(event) => {
          if (menuRef.current) refreshMenu(event.currentTarget);
        }}
        onKeyDown={(event) => {
          const current = menuRef.current;
          if (!current) return;

          if (event.key === "ArrowDown") {
            event.preventDefault();
            setMenu({
              ...current,
              index: (current.index + 1) % current.items.length,
            });
            return;
          }

          if (event.key === "ArrowUp") {
            event.preventDefault();
            setMenu({
              ...current,
              index:
                (current.index - 1 + current.items.length) %
                current.items.length,
            });
            return;
          }

          if (event.key === "Enter" || event.key === "Tab") {
            event.preventDefault();
            applyItem(current.index);
            return;
          }

          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            setMenu(null);
          }
        }}
        placeholder={"# Title\n\nWrite in Markdown…"}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />
      {menu && (
        <MarkdownHintMenu
          items={menu.items}
          index={menu.index}
          top={menu.top}
          left={menu.left}
          onHover={(index) => setMenu({ ...menu, index })}
          onSelect={applyItem}
        />
      )}
    </div>
  );
}
