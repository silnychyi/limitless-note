import {
  CARD_GAP,
  COLLISION_MAX_RINGS,
  GRID_SIZE,
} from "@/lib/constants";
import { noteRect, snapToGrid } from "@/lib/geometry";
import type { Note, Rect } from "@/lib/types";

type Point = { x: number; y: number };

function intersectsWithGap(a: Rect, b: Rect, gap = CARD_GAP): boolean {
  return !(
    a.x + a.width + gap <= b.x ||
    b.x + b.width + gap <= a.x ||
    a.y + a.height + gap <= b.y ||
    b.y + b.height + gap <= a.y
  );
}

function center(rect: Rect): Point {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

function directionFrom(from: Rect, to: Rect): Point {
  const a = center(from);
  const b = center(to);
  const x = b.x - a.x;
  const y = b.y - a.y;
  if (x === 0 && y === 0) return { x: 1, y: 0 };
  return { x, y };
}

function pushAway(note: Note, blocker: Note, grid: number, gap: number): Point {
  const a = noteRect(blocker);
  const b = noteRect(note);
  const ac = center(a);
  const bc = center(b);
  const overlapX = a.width / 2 + b.width / 2 - Math.abs(bc.x - ac.x);
  const overlapY = a.height / 2 + b.height / 2 - Math.abs(bc.y - ac.y);
  const dirX = bc.x === ac.x ? 1 : Math.sign(bc.x - ac.x);
  const dirY = bc.y === ac.y ? 1 : Math.sign(bc.y - ac.y);

  if (overlapX <= overlapY) {
    return {
      x: snapToGrid(note.x + dirX * (overlapX + gap), grid),
      y: snapToGrid(note.y, grid),
    };
  }

  return {
    x: snapToGrid(note.x, grid),
    y: snapToGrid(note.y + dirY * (overlapY + gap), grid),
  };
}

function spiralRing(origin: Point, ring: number, grid: number): Point[] {
  const points: Point[] = [];
  const reach = ring * grid;

  for (let i = -ring; i <= ring; i++) {
    const offset = i * grid;
    points.push({ x: origin.x + offset, y: origin.y - reach });
    points.push({ x: origin.x + offset, y: origin.y + reach });
    if (i !== -ring && i !== ring) {
      points.push({ x: origin.x - reach, y: origin.y + offset });
      points.push({ x: origin.x + reach, y: origin.y + offset });
    }
  }

  return points;
}

function candidateScore(point: Point, origin: Point, prefer: Point): number {
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  const preferLen = Math.hypot(prefer.x, prefer.y) || 1;
  const alignment = -(dx * prefer.x + dy * prefer.y) / preferLen;
  const distance = Math.abs(dx) + Math.abs(dy);
  return alignment * 0.35 + distance;
}

class SpatialHash {
  private cells = new Map<string, Note[]>();
  private cellSize: number;

  constructor(notes: Note[], cellSize: number) {
    this.cellSize = cellSize;
    for (const note of notes) this.insert(note);
  }

  private key(cx: number, cy: number) {
    return `${cx}:${cy}`;
  }

  private cellRange(rect: Rect, pad: number) {
    return {
      x0: Math.floor((rect.x - pad) / this.cellSize),
      y0: Math.floor((rect.y - pad) / this.cellSize),
      x1: Math.floor((rect.x + rect.width + pad) / this.cellSize),
      y1: Math.floor((rect.y + rect.height + pad) / this.cellSize),
    };
  }

  private insert(note: Note) {
    const range = this.cellRange(noteRect(note), CARD_GAP);
    for (let x = range.x0; x <= range.x1; x++) {
      for (let y = range.y0; y <= range.y1; y++) {
        const key = this.key(x, y);
        const bucket = this.cells.get(key);
        if (bucket) bucket.push(note);
        else this.cells.set(key, [note]);
      }
    }
  }

  query(rect: Rect): Note[] {
    const range = this.cellRange(rect, CARD_GAP);
    const seen = new Set<string>();
    const nearby: Note[] = [];

    for (let x = range.x0; x <= range.x1; x++) {
      for (let y = range.y0; y <= range.y1; y++) {
        const bucket = this.cells.get(this.key(x, y));
        if (!bucket) continue;
        for (const note of bucket) {
          if (seen.has(note.id)) continue;
          seen.add(note.id);
          nearby.push(note);
        }
      }
    }

    return nearby;
  }
}

function isFree(rect: Rect, index: SpatialHash, gap: number): boolean {
  for (const other of index.query(rect)) {
    if (intersectsWithGap(rect, noteRect(other), gap)) return false;
  }
  return true;
}

export function findNearestFreePosition(
  note: Note,
  obstacles: Note[],
  prefer: Point,
  grid = GRID_SIZE,
  gap = CARD_GAP,
): Point {
  const origin = {
    x: snapToGrid(note.x, grid),
    y: snapToGrid(note.y, grid),
  };
  const index = new SpatialHash(obstacles, Math.max(note.width, note.height, 256));
  const fits = (x: number, y: number) =>
    isFree({ x, y, width: note.width, height: note.height }, index, gap);

  if (fits(origin.x, origin.y)) return origin;

  const nearestBlocker = obstacles.find((item) =>
    intersectsWithGap(noteRect(note), noteRect(item), gap),
  );
  if (nearestBlocker) {
    const pushed = pushAway(note, nearestBlocker, grid, gap);
    if (fits(pushed.x, pushed.y)) return pushed;
  }

  for (let ring = 1; ring <= COLLISION_MAX_RINGS; ring++) {
    const candidates = spiralRing(origin, ring, grid).sort(
      (a, b) =>
        candidateScore(a, origin, prefer) - candidateScore(b, origin, prefer),
    );
    for (const point of candidates) {
      if (fits(point.x, point.y)) return point;
    }
  }

  return {
    x: snapToGrid(origin.x + Math.sign(prefer.x || 1) * (COLLISION_MAX_RINGS + 1) * grid),
    y: snapToGrid(origin.y + Math.sign(prefer.y || 0) * (COLLISION_MAX_RINGS + 1) * grid),
  };
}

function notesOverlapping(notes: Note[], targetId: string, gap = CARD_GAP): Note[] {
  const target = notes.find((note) => note.id === targetId);
  if (!target) return [];
  const rect = noteRect(target);

  return notes.filter(
    (note) =>
      note.id !== targetId && intersectsWithGap(rect, noteRect(note), gap),
  );
}

function firstConflict(notes: Note[], gap = CARD_GAP): [Note, Note] | null {
  for (let i = 0; i < notes.length; i++) {
    const a = notes[i];
    const aRect = noteRect(a);
    for (let j = i + 1; j < notes.length; j++) {
      const b = notes[j];
      if (intersectsWithGap(aRect, noteRect(b), gap)) return [a, b];
    }
  }
  return null;
}

export function resolveOverlaps(notes: Note[], anchorId: string): Note[] {
  const next = notes.map((note) => ({ ...note }));
  const anchor = next.find((note) => note.id === anchorId);
  if (!anchor) return notes;

  const overlapping = notesOverlapping(next, anchorId).sort((a, b) => {
    const origin = center(noteRect(anchor));
    const da = Math.hypot(center(noteRect(a)).x - origin.x, center(noteRect(a)).y - origin.y);
    const db = Math.hypot(center(noteRect(b)).x - origin.x, center(noteRect(b)).y - origin.y);
    return da - db;
  });

  for (const mover of overlapping) {
    const current = next.find((note) => note.id === mover.id);
    if (!current) continue;
    const others = next.filter((note) => note.id !== current.id);
    const prefer = directionFrom(noteRect(anchor), noteRect(current));
    const free = findNearestFreePosition(current, others, prefer);
    current.x = free.x;
    current.y = free.y;
  }

  const maxPasses = Math.max(4, next.length);
  for (let pass = 0; pass < maxPasses; pass++) {
    const conflict = firstConflict(next);
    if (!conflict) return next;

    const [a, b] = conflict;
    const mover = a.id === anchorId ? b : a;
    const blocker = mover.id === a.id ? b : a;
    const current = next.find((note) => note.id === mover.id);
    if (!current) break;

    const others = next.filter((note) => note.id !== current.id);
    const prefer = directionFrom(noteRect(blocker), noteRect(current));
    const free = findNearestFreePosition(current, others, prefer);
    if (free.x === current.x && free.y === current.y) break;
    current.x = free.x;
    current.y = free.y;
  }

  return next;
}
