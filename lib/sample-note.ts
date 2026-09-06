import {
  CARD_MAX_HEIGHT,
  DEFAULT_NOTE_WIDTH,
  GRID_SIZE,
} from "@/lib/constants";
import { snapToGrid } from "@/lib/geometry";
import {
  createMarkdownSyntaxNote,
  placeBeside,
} from "@/lib/markdown-syntax-note";
import type { Note, Viewport } from "@/lib/types";

export const SAMPLE_MARKDOWN = `# Hey! This is Limitless Note

Think of it like a big desk you can spread notes across. Click anywhere empty to drop a new one. Click a card to open it. Drag a card to move it.

When a note is open, write in it like you would in a notebook. Switch to **Preview** if you want to see it dressed up. Close with the **X**, or just click off the page.

If two notes pile on top of each other, the others politely slide out of the way.

## Getting around

Drag the empty space to look around. Scroll or use two fingers the same way. Hold **Ctrl** or **⌘** and scroll if you want to zoom in or out.

## Your notes stay here

They live on this computer, in this browser — not on some website in the cloud. No account, nobody else can see them.

That also means they’re only here. A different browser, a different phone, or wiping this site’s data will lose them. If you care about a note, use the **⋯** menu to save a copy or bring one back in.

That’s it. Put a thought somewhere and leave it there.
`;

export function createWelcomeNote(viewport: Viewport): Note {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    x: snapToGrid(viewport.x + GRID_SIZE * 3),
    y: snapToGrid(viewport.y + GRID_SIZE * 3),
    width: DEFAULT_NOTE_WIDTH,
    height: CARD_MAX_HEIGHT,
    zIndex: 1,
    markdown: SAMPLE_MARKDOWN,
    createdAt: now,
    updatedAt: now,
  };
}

export function createStarterNotes(viewport: Viewport): Note[] {
  const welcome = createWelcomeNote(viewport);
  const syntax = createMarkdownSyntaxNote(viewport, {
    ...placeBeside(welcome),
    zIndex: 2,
  });
  return [welcome, syntax];
}
