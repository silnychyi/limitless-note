import {
  CARD_GAP,
  CARD_MAX_HEIGHT,
  DEFAULT_NOTE_WIDTH,
  GRID_SIZE,
} from "@/lib/constants";
import { snapToGrid } from "@/lib/geometry";
import type { Note, Viewport } from "@/lib/types";

export const MARKDOWN_SYNTAX_MARKDOWN = `# A little cheat sheet

Write like you normally would. Sprinkle a few characters and Preview dresses it up. Switch to Write if you want to peek at how something was typed.

## Titles

Start a line with \`#\` — more hashes, smaller title.

# Big
## A bit smaller
### Smaller still

Or underline a line with \`=\` or \`-\`.

## Make words stand out

Wrap text in \`*\` or \`_\`:

I meant *this*, not that.

Two of them makes it **louder**.

Need a real star? Put a backslash in front: \\*

A pair of tildes crosses a word out: ~~never mind~~

## Lists

Start a line with \`-\`, \`+\`, or \`*\`:

- milk
+ bread
* coffee

Or number them with \`1.\` or \`1)\`:

1. wake up
2) write it down

A box on a list is a to-do:

- [ ] try this
- [x] already did

## A line across the page

Three or more dashes, stars, or underscores:

---

## Someone said it

Start the line with \`>\`:

> Keep it simple.

## A bit of code

Wrap a short bit in backticks: \`like this\`.

For a whole block, use three tildes or three backticks:

~~~
a few lines
you want left alone
~~~

## Links and pictures

A link is the words in brackets, the address in parentheses:

[CommonMark](https://spec.commonmark.org)

Or wrap an address in \`<\` \`>\` and it becomes a link on its own: <https://spec.commonmark.org>

A picture is the same idea with a \`!\` in front: \`![a description](the-image.jpg)\`

## A small table

Pipes for columns, dashes under the header:

| Day | Note |
| --- | ---- |
| Mon | quiet |
| Tue | louder |

That’s the whole toolbox. Play with Write and Preview until it feels natural.
`;

export function createMarkdownSyntaxNote(
  viewport: Viewport,
  extras?: { x?: number; y?: number; zIndex?: number },
): Note {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    x: extras?.x ?? snapToGrid(viewport.x + GRID_SIZE * 3),
    y: extras?.y ?? snapToGrid(viewport.y + GRID_SIZE * 3),
    width: DEFAULT_NOTE_WIDTH,
    height: CARD_MAX_HEIGHT,
    zIndex: extras?.zIndex ?? 1,
    markdown: MARKDOWN_SYNTAX_MARKDOWN,
    createdAt: now,
    updatedAt: now,
  };
}

export function placeBeside(note: Note): { x: number; y: number } {
  return {
    x: snapToGrid(note.x + note.width + CARD_GAP),
    y: note.y,
  };
}
