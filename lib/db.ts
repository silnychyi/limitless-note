import Dexie, { type Table } from "dexie";
import type { Workspace } from "./types";

class UnlimitedNoteDB extends Dexie {
  workspace!: Table<Workspace & { id?: number }, number>;

  constructor() {
    super("unlimited-note");
    this.version(1).stores({
      workspace: "++id",
    });
  }
}

let db: UnlimitedNoteDB | undefined;

function getDb() {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is only available in the browser");
  }
  if (!db) db = new UnlimitedNoteDB();
  return db;
}

export function emptyWorkspace(): Workspace {
  return {
    version: 1,
    notes: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  };
}

export async function loadWorkspace(): Promise<{
  workspace: Workspace;
  isNew: boolean;
}> {
  const row = await getDb().workspace.orderBy("id").first();
  if (!row) {
    const workspace = emptyWorkspace();
    await getDb().workspace.add(workspace);
    return { workspace, isNew: true };
  }

  return {
    workspace: {
      version: 1,
      notes: row.notes ?? [],
      viewport: row.viewport ?? { x: 0, y: 0, zoom: 1 },
    },
    isNew: false,
  };
}

export async function saveWorkspace(workspace: Workspace): Promise<void> {
  const table = getDb().workspace;
  const row = await table.orderBy("id").first();
  if (row?.id != null) {
    await table.put({ ...workspace, id: row.id });
    return;
  }
  await table.add(workspace);
}

export async function replaceWorkspace(workspace: Workspace): Promise<void> {
  const table = getDb().workspace;
  await table.clear();
  await table.add(workspace);
}
