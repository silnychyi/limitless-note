# Limitless note — MVP

Build a minimal, local-first spatial Markdown notes application.

## Stack

- Next.js + TypeScript
- Zustand for application state
- Dexie + IndexedDB for persistence
- Tailwind CSS for styling
- Motion for lightweight animations
- react-markdown + remark-gfm for Markdown rendering
- Lucide React for icons

Do not implement authentication, backend, cloud sync, or accounts.

---

## Core concept

The application is a completely white, visually infinite canvas.

Users create Markdown notes. Each note appears as a floating card on the canvas and can be freely positioned.

The canvas has no visible boundaries.

The user navigates the canvas using:

- mouse/touch drag → pan
- pinch gesture → zoom
- mouse wheel → zoom
- drag note → reposition note
- double click / tap → edit note

The canvas should feel smooth, minimalistic and playful.

---



## Data model

```ts
type Note = {
  id: string
  x: number
  y: number
  width: number
  markdown: string
  createdAt: number
  updatedAt: number
}

type Viewport = {
  x: number
  y: number
  zoom: number
}

type Workspace = {
  version: 1
  notes: Note[]
  viewport: Viewport
}
```

Coordinates are world coordinates.

Do not create a finite canvas.

Do not use min/max X/Y boundaries.

Use JavaScript floating-point numbers for X/Y.

---



## Canvas architecture

The viewport is fixed to the browser window.

Notes exist in an infinite world.

Convert world coordinates to screen coordinates:

```ts
screenX = (worldX - viewport.x) * viewport.zoom
screenY = (worldY - viewport.y) * viewport.zoom
```

Convert screen coordinates to world coordinates:

```ts
worldX = screenX / viewport.zoom + viewport.x
worldY = screenY / viewport.zoom + viewport.y
```

Pan by modifying the viewport rather than moving individual notes.

---



## Zustand store

Create a single workspace store:

```ts
interface CanvasStore {
  notes: Note[]
  viewport: Viewport

  addNote: (position?: { x: number; y: number }) => void
  updateNote: (id: string, changes: Partial<Note>) => void
  deleteNote: (id: string) => void

  setViewport: (viewport: Viewport) => void
  pan: (dx: number, dy: number) => void
  zoomAt: (zoom: number, screenX: number, screenY: number) => void
}
```

Persist state to IndexedDB using Dexie.

Debounce persistence so every pointer movement does not immediately write to IndexedDB.

---



## Creating notes

The main UI should have a minimal floating `+` button.

When creating a note:

1. Determine the center of the current viewport.
2. Convert it to world coordinates.
3. Create the note there.
4. Give it a default width around 280–320px.
5. Focus the Markdown editor immediately.

Also support creating a note by clicking/tapping an empty canvas area.

---



## Note component

Each note is a floating card.

Minimum UI:

```text
┌─────────────────────────┐
│                         │
│ # My note               │
│                         │
│ Some Markdown content   │
│                         │
└─────────────────────────┘
```

Normal state:

- Markdown rendered as HTML
- subtle border
- small radius
- light shadow
- white/off-white card
- no unnecessary toolbar

Editing state:

- Markdown textarea/editor
- automatically focused
- card remains at the same world position

Avoid making cards look like traditional productivity software.

---



## Dragging

Dragging a note must modify its world coordinates.

Important:

Do not mix screen coordinates and world coordinates.

During drag:

```ts
worldDeltaX = pointerDeltaX / viewport.zoom
worldDeltaY = pointerDeltaY / viewport.zoom
```

Then:

```ts
note.x += worldDeltaX
note.y += worldDeltaY
```

Dragging should feel identical at every zoom level.

---



## Canvas gestures

Implement:

### Mouse

- left drag on empty canvas → pan
- wheel → zoom around cursor
- drag note → move note



### Touch

- one finger on empty canvas → pan
- one finger on note → drag note
- two fingers → pan + pinch zoom

Zoom must happen around the cursor/finger position.

When zooming, preserve the world coordinate underneath the cursor/fingers.

Clamp zoom only to sensible UI values, for example:

```ts
0.1 <= zoom <= 4
```

Do not clamp world X/Y.

---



## Note collisions

Notes are allowed to overlap.

Do NOT implement physics-based collision avoidance in the MVP.

Instead, implement a lightweight collision helper that detects overlapping rectangles.

```ts
type Rect = {
  x: number
  y: number
  width: number
  height: number
}

function intersects(a: Rect, b: Rect): boolean
```

When dragging a note:

- allow overlap
- optionally show a subtle visual indication when it overlaps another note
- do not automatically move other notes

Future versions can implement magnetic positioning / collision avoidance.

---



## Layering

Notes should have a `z-index` concept.

When a note is selected or dragged:

```ts
bringToFront(noteId)
```

The dragged note should appear above other notes.

This can initially be implemented with a simple increasing `zIndex`.

---



## Rendering performance

Do not render an enormous DOM canvas.

The canvas itself should remain viewport-sized.

Initially render all notes.

Structure the code so viewport culling can be added later:

```ts
getVisibleNotes(notes, viewport)
```

Do not implement a spatial index/quadtree in the MVP unless performance requires it.

---



## Visual design

The default canvas is pure white.

No grid.

No visible coordinates.

No borders around the canvas.

Notes should feel like small physical objects floating on an infinite sheet.

Use:

- generous whitespace
- rounded corners
- subtle shadows
- playful but restrained animations
- smooth hover/press states
- minimal icons
- typography-focused cards

Avoid:

- dashboards
- sidebars
- excessive buttons
- visible technical controls
- conventional whiteboard UI

The canvas should dominate the interface.

---



## Persistence

Use Dexie.

Suggested database:

```ts
class UnlimitedNoteDB extends Dexie {
  workspace!: Table<Workspace, number>

  constructor() {
    super("unlimited-note")

    this.version(1).stores({
      workspace: "++id"
    })
  }
}
```

For MVP there can be exactly one workspace.

Load it on application startup.

If no workspace exists, create an empty workspace automatically.

Save changes automatically with debouncing.

---



## Import/export

Add a minimal menu with:

- Export workspace
- Import workspace
- Clear workspace

Export the entire workspace as JSON.

Example:

```text
unlimited-note.json
```

Import should validate the data structure and workspace version before replacing local data.

---



## MVP acceptance criteria

The MVP is complete when:

1. App opens directly without authentication.
2. Empty white infinite canvas is visible immediately.
3. User can create a Markdown note.
4. Note appears at the viewport center or selected canvas position.
5. Note can be edited.
6. Markdown renders correctly.
7. Notes can be dragged freely.
8. Notes can overlap.
9. Dragging works correctly at different zoom levels.
10. Canvas can be panned infinitely.
11. Canvas can be zoomed with mouse wheel.
12. Canvas supports pinch zoom on touch devices.
13. Zoom happens around cursor/fingers.
14. Selected/dragged notes appear above other notes.
15. Notes survive page refresh.
16. Viewport position and zoom survive page refresh.
17. Workspace can be exported/imported as JSON.
18. No login/register/backend is required.



## Explicitly out of scope

Do not implement yet:

- authentication
- cloud sync
- collaboration
- sharing links
- permissions
- real-time collaboration
- folders
- tags
- search
- AI
- rich text editor
- complex collision physics
- automatic layout
- infinite canvas grid
- multiplayer cursors

Focus entirely on making **"create a note → throw it somewhere on an infinite canvas → smoothly explore the canvas"** feel excellent.