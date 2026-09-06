"use client";

import { Component, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { PluggableList } from "unified";
import { CARD_PREVIEW_CHARS } from "@/lib/constants";

function resolvePlugin(mod: unknown) {
  if (typeof mod === "function") return mod;
  if (mod && typeof mod === "object" && "default" in mod) {
    const inner = (mod as { default: unknown }).default;
    if (typeof inner === "function") return inner;
  }
  return null;
}

const gfm = resolvePlugin(remarkGfm);
const remarkPlugins = (gfm ? [gfm] : []) as PluggableList;

const markdownComponents: Components = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer" data-ui="true">
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="md-table-wrap">
      <table>{children}</table>
    </div>
  ),
  input: (props) => (
    <input
      type={props.type}
      checked={Boolean(props.checked)}
      disabled={props.type === "checkbox"}
      readOnly
    />
  ),
};

export function excerptMarkdown(
  source: string,
  maxChars = CARD_PREVIEW_CHARS,
): string {
  const trimmed = source.trim();
  if (trimmed.length <= maxChars) return trimmed;

  const slice = trimmed.slice(0, maxChars);
  const breakAt = Math.max(slice.lastIndexOf("\n\n"), slice.lastIndexOf("\n"));
  return (breakAt > 40 ? slice.slice(0, breakAt) : slice).trimEnd();
}

class MarkdownErrorBoundary extends Component<
  { fallback: string; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return <pre className="note-md-fallback">{this.props.fallback}</pre>;
    }
    return this.props.children;
  }
}

export function MarkdownBody({
  markdown,
  excerpt = false,
  className = "note-md",
}: {
  markdown: string;
  excerpt?: boolean;
  className?: string;
}) {
  const source = excerpt ? excerptMarkdown(markdown ?? "") : (markdown ?? "");

  return (
    <MarkdownErrorBoundary fallback={source}>
      <div className={className}>
        <ReactMarkdown
          remarkPlugins={remarkPlugins}
          components={markdownComponents}
        >
          {source}
        </ReactMarkdown>
      </div>
    </MarkdownErrorBoundary>
  );
}
