export type MarkdownHint = {
  id: string;
  label: string;
  insert: string;
  cursor: number;
  select?: number;
};

export type MarkdownHintState = {
  start: number;
  end: number;
  items: MarkdownHint[];
};

function isBoundary(text: string, index: number) {
  if (index < 0) return true;
  return /\s/.test(text[index] ?? "");
}

export function getMarkdownHints(
  text: string,
  caret: number,
): MarkdownHintState | null {
  if (caret < 0 || caret > text.length) return null;

  const lineStart = text.lastIndexOf("\n", caret - 1) + 1;
  const prefix = text.slice(lineStart, caret);

  if (/^#{1,3}$/.test(prefix)) {
    const items = [
      hint("h1", "Heading 1", "# "),
      hint("h2", "Heading 2", "## "),
      hint("h3", "Heading 3", "### "),
    ].filter((item) => item.insert.startsWith(prefix));
    return items.length ? { start: lineStart, end: caret, items } : null;
  }

  if (prefix === "-" || prefix === "*" || prefix === "+") {
    return {
      start: lineStart,
      end: caret,
      items: [
        hint("ul", "List", `${prefix} `),
        hint("todo", "To-do", `${prefix} [ ] `),
      ],
    };
  }

  if (prefix === ">") {
    return {
      start: lineStart,
      end: caret,
      items: [hint("quote", "Quote", "> ")],
    };
  }

  if (prefix === "1.") {
    return {
      start: lineStart,
      end: caret,
      items: [hint("ol", "Numbered list", "1. ")],
    };
  }

  if (prefix === "``" || prefix === "```") {
    return {
      start: lineStart,
      end: caret,
      items: [
        {
          id: "codeblock",
          label: "Code block",
          insert: "```\n\n```",
          cursor: 4,
        },
      ],
    };
  }

  const tail = text.slice(Math.max(lineStart, caret - 3), caret);

  if (tail.endsWith("![") && isBoundary(text, caret - 3)) {
    return {
      start: caret - 2,
      end: caret,
      items: [
        {
          id: "image",
          label: "Image",
          insert: "![alt](url)",
          cursor: 2,
          select: 3,
        },
      ],
    };
  }

  if (tail.endsWith("[") && !tail.endsWith("![") && isBoundary(text, caret - 2)) {
    return {
      start: caret - 1,
      end: caret,
      items: [
        {
          id: "link",
          label: "Link",
          insert: "[text](url)",
          cursor: 1,
          select: 4,
        },
      ],
    };
  }

  if (tail.endsWith("**") && isBoundary(text, caret - 3)) {
    return {
      start: caret - 2,
      end: caret,
      items: [
        { id: "bold", label: "Bold", insert: "**text**", cursor: 2, select: 4 },
      ],
    };
  }

  if (tail.endsWith("~~") && isBoundary(text, caret - 3)) {
    return {
      start: caret - 2,
      end: caret,
      items: [
        {
          id: "strike",
          label: "Strikethrough",
          insert: "~~text~~",
          cursor: 2,
          select: 4,
        },
      ],
    };
  }

  return null;
}

export function applyMarkdownHint(
  text: string,
  state: MarkdownHintState,
  item: MarkdownHint,
) {
  const next = text.slice(0, state.start) + item.insert + text.slice(state.end);
  const selectionStart = state.start + item.cursor;
  return {
    text: next,
    selectionStart,
    selectionEnd: selectionStart + (item.select ?? 0),
  };
}

function hint(id: string, label: string, insert: string): MarkdownHint {
  return { id, label, insert, cursor: insert.length };
}
