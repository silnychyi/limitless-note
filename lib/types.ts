export type Note = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  markdown: string;
  createdAt: number;
  updatedAt: number;
};

export type Viewport = {
  x: number;
  y: number;
  zoom: number;
};

export type Workspace = {
  version: 1;
  notes: Note[];
  viewport: Viewport;
};

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};
