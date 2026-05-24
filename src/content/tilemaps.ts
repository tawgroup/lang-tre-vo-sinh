import type { Rect } from "./maps";

export const TILE_SIZE = 40;
export const TILE_COLS = 36;
export const TILE_ROWS = 23;

export type TileKind =
  | "grass"
  | "path"
  | "courtyard"
  | "water"
  | "shallow-water"
  | "rice"
  | "fence"
  | "bamboo"
  | "temple"
  | "bridge";

export type TileLayer = TileKind[];
export type DetailLayer = Array<TileKind | undefined>;

export type TileMapDef = {
  cols: number;
  rows: number;
  tileSize: number;
  ground: TileLayer;
  detail: DetailLayer;
};

const BLOCKED_TILES = new Set<TileKind>(["water", "rice", "fence", "bamboo", "temple"]);

export const VILLAGE_TILEMAP = createVillageTilemap();

export function tileAtPixel(tilemap: TileMapDef, x: number, y: number): TileKind {
  const col = Math.floor(x / tilemap.tileSize);
  const row = Math.floor(y / tilemap.tileSize);
  if (col < 0 || col >= tilemap.cols || row < 0 || row >= tilemap.rows) return "fence";
  return tilemap.detail[index(tilemap, col, row)] ?? tilemap.ground[index(tilemap, col, row)];
}

export function tileBlocks(tile: TileKind) {
  return BLOCKED_TILES.has(tile);
}

export function tileCollisionRects(tilemap: TileMapDef): Rect[] {
  const rects: Rect[] = [];
  for (let row = 0; row < tilemap.rows; row++) {
    for (let col = 0; col < tilemap.cols; col++) {
      const tile = tilemap.detail[index(tilemap, col, row)] ?? tilemap.ground[index(tilemap, col, row)];
      if (!tileBlocks(tile)) continue;
      rects.push({
        x: col * tilemap.tileSize + tilemap.tileSize / 2,
        y: row * tilemap.tileSize + tilemap.tileSize / 2,
        width: tilemap.tileSize,
        height: tilemap.tileSize,
      });
    }
  }
  return rects;
}

export function tileTerrainAt(tilemap: TileMapDef, x: number, y: number) {
  const tile = tileAtPixel(tilemap, x, y);
  if (tile === "shallow-water") {
    return {
      kind: "shallow-water" as const,
      speedMultiplier: 0.56,
      prompt: "Đang lội mép nước: bước chậm lại, tránh vùng nước sâu.",
    };
  }
  return undefined;
}

function createVillageTilemap(): TileMapDef {
  const ground = filled<TileKind>("grass");
  const detail = filled<TileKind | undefined>(undefined);
  const map: TileMapDef = { cols: TILE_COLS, rows: TILE_ROWS, tileSize: TILE_SIZE, ground, detail };

  paintRect(map, ground, 15, 0, 8, 6, "temple");
  paintRect(map, ground, 16, 6, 6, 2, "courtyard");
  paintRect(map, ground, 17, 8, 4, 2, "path");
  paintRect(map, ground, 18, 9, 3, 14, "path");
  paintRect(map, ground, 0, 5, 12, 8, "path");
  paintRect(map, ground, 8, 7, 9, 5, "path");
  paintRect(map, ground, 21, 5, 7, 8, "path");
  paintRect(map, ground, 30, 3, 6, 8, "shallow-water");
  paintRect(map, ground, 31, 4, 5, 7, "water");
  paintRect(map, ground, 0, 15, 12, 8, "shallow-water");
  paintRect(map, ground, 1, 16, 11, 7, "water");
  paintRect(map, ground, 22, 15, 14, 8, "rice");
  paintRect(map, ground, 1, 12, 15, 11, "rice");

  paintRect(map, ground, 12, 17, 2, 2, "bridge");
  paintRect(map, ground, 18, 21, 3, 2, "path");
  paintRect(map, ground, 19, 21, 1, 2, "bridge");

  paintLine(map, detail, 7, 6, 12, 6, "fence");
  paintLine(map, detail, 12, 6, 17, 8, "fence");
  paintLine(map, detail, 17, 8, 17, 13, "fence");
  paintLine(map, detail, 7, 13, 15, 13, "fence");
  paintLine(map, detail, 22, 6, 28, 6, "fence");
  paintLine(map, detail, 0, 0, 0, 22, "bamboo");
  paintLine(map, detail, 35, 0, 35, 22, "bamboo");
  paintLine(map, detail, 0, 0, 35, 0, "bamboo");
  paintLine(map, detail, 0, 22, 17, 22, "bamboo");
  paintLine(map, detail, 21, 22, 35, 22, "bamboo");

  clearRect(map, detail, 18, 21, 3, 2);
  return map;
}

function filled<T>(value: T): T[] {
  return Array<T>(TILE_COLS * TILE_ROWS).fill(value);
}

function index(tilemap: TileMapDef, col: number, row: number) {
  return row * tilemap.cols + col;
}

function paintRect(tilemap: TileMapDef, layer: TileLayer, x: number, y: number, width: number, height: number, tile: TileKind) {
  for (let row = y; row < y + height; row++) {
    for (let col = x; col < x + width; col++) {
      if (col < 0 || col >= tilemap.cols || row < 0 || row >= tilemap.rows) continue;
      layer[index(tilemap, col, row)] = tile;
    }
  }
}

function clearRect(tilemap: TileMapDef, layer: (TileKind | undefined)[], x: number, y: number, width: number, height: number) {
  for (let row = y; row < y + height; row++) {
    for (let col = x; col < x + width; col++) {
      if (col < 0 || col >= tilemap.cols || row < 0 || row >= tilemap.rows) continue;
      layer[index(tilemap, col, row)] = undefined;
    }
  }
}

function paintLine(tilemap: TileMapDef, layer: DetailLayer, fromX: number, fromY: number, toX: number, toY: number, tile: TileKind) {
  const steps = Math.max(Math.abs(toX - fromX), Math.abs(toY - fromY));
  for (let step = 0; step <= steps; step++) {
    const col = Math.round(fromX + ((toX - fromX) * step) / steps);
    const row = Math.round(fromY + ((toY - fromY) * step) / steps);
    if (col < 0 || col >= tilemap.cols || row < 0 || row >= tilemap.rows) continue;
    layer[index(tilemap, col, row)] = tile;
  }
}
