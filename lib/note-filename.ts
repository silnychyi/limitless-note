export function titleFromMarkdown(markdown: string) {
  const line = markdown
    .trim()
    .split(/\r?\n/)
    .find((item) => item.trim());
  const title = (line ?? "Untitled")
    .replace(/^#{1,6}\s+/, "")
    .replace(/[*_`[\]]/g, "")
    .trim();
  return title || "Untitled";
}

export function filenameFromMarkdown(markdown: string) {
  const title = titleFromMarkdown(markdown)
    .replace(/[\\/:*?"<>|]+/g, "")
    .slice(0, 80)
    .trim();
  return `${title || "note"}.pdf`;
}
