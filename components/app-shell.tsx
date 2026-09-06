"use client";

import { EmptyHint } from "@/components/empty-hint";
import { InfiniteCanvas } from "@/components/infinite-canvas";
import { NotePage } from "@/components/note-page";
import { WorkspaceMenu } from "@/components/workspace-menu";
import { useWorkspacePersistence } from "@/store/use-workspace-persistence";

export function AppShell() {
  useWorkspacePersistence();

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-white">
      <InfiniteCanvas />
      <EmptyHint />
      <WorkspaceMenu />
      <NotePage />
    </main>
  );
}
