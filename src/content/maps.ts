import type { MapId, QuestPhase } from "../gameState";

export const WORLD = {
  width: 1440,
  height: 920,
} as const;

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Point = {
  x: number;
  y: number;
};

export type CollectibleKind = "lotus" | "bamboo-token";
export type TargetKind = "dummy" | "bamboo-post";
export type TerrainKind = "shallow-water" | "deep-water";

export type CollectibleDef = Point & {
  id: string;
  kind: CollectibleKind;
};

export type TargetDef = Point & {
  id: string;
  kind: TargetKind;
};

export type ExitDef = Rect & {
  id: string;
  label: string;
  to: MapId;
  spawn: Point;
  allowedPhases: QuestPhase[];
  blockedPrompt: string;
};

export type TerrainDef = Rect & {
  id: string;
  kind: TerrainKind;
  prompt: string;
  speedMultiplier: number;
};

export type MapDef = {
  id: MapId;
  name: string;
  backgroundKey: string;
  backgroundUrl: string;
  start: Point;
  fallbackSpawn: Point;
  playerDepth: number;
  blockers: Rect[];
  shallowTerrain: TerrainDef[];
  deepWater: TerrainDef[];
  exits: ExitDef[];
  npc?: Point & {
    id: "master";
    spriteKey: "master-npc";
  };
  gate?: Rect & {
    id: "festival-gate";
  };
  collectibles: CollectibleDef[];
  targets: TargetDef[];
};

const villageBlockers: Rect[] = [
  { x: 706, y: 92, width: 340, height: 180 },
  { x: 284, y: 688, width: 420, height: 170 },
  { x: 1114, y: 700, width: 350, height: 130 },
  { x: 48, y: 460, width: 96, height: 830 },
  { x: 1394, y: 460, width: 92, height: 830 },
  { x: 720, y: 908, width: 330, height: 24 },
];

const bambooBlockers: Rect[] = [
  { x: 66, y: 460, width: 130, height: 880 },
  { x: 1378, y: 460, width: 124, height: 880 },
  { x: 346, y: 152, width: 255, height: 115 },
  { x: 1068, y: 120, width: 290, height: 110 },
  { x: 364, y: 730, width: 280, height: 120 },
  { x: 1090, y: 755, width: 310, height: 120 },
  { x: 720, y: 908, width: 360, height: 24 },
];

export const MAPS: Record<MapId, MapDef> = {
  village: {
    id: "village",
    name: "Làng Tre",
    backgroundKey: "map-village",
    backgroundUrl: "/assets/maps/village.jpg",
    start: { x: 705, y: 305 },
    fallbackSpawn: { x: 700, y: 780 },
    playerDepth: 7,
    blockers: villageBlockers,
    shallowTerrain: [
      {
        id: "pond-bank",
        kind: "shallow-water",
        x: 1096,
        y: 380,
        width: 360,
        height: 220,
        speedMultiplier: 0.55,
        prompt: "Đang lội mép ao, di chuyển chậm lại. Ao sâu phía trong chưa bơi được.",
      },
    ],
    deepWater: [
      {
        id: "lotus-pond-deep",
        kind: "deep-water",
        x: 1110,
        y: 365,
        width: 250,
        height: 150,
        speedMultiplier: 0,
        prompt: "Ao sen sâu. Chưa học bơi thì không thể đi thẳng xuống nước.",
      },
      {
        id: "field-canal",
        kind: "deep-water",
        x: 324,
        y: 664,
        width: 320,
        height: 45,
        speedMultiplier: 0,
        prompt: "Mương ruộng trơn. Tìm cầu tre hoặc quay lại đường đất.",
      },
    ],
    exits: [
      {
        id: "south-bamboo-trail",
        label: "Lối xuống bãi tre",
        x: 720,
        y: 885,
        width: 240,
        height: 70,
        to: "bamboo",
        spawn: { x: 720, y: 155 },
        allowedPhases: ["bamboo-ready", "bamboo-training", "gate-open", "complete"],
        blockedPrompt: "Thầy Ba sẽ cho sang bãi tre sau khi con xong bài sân làng.",
      },
    ],
    npc: { id: "master", spriteKey: "master-npc", x: 724, y: 238 },
    gate: { id: "festival-gate", x: 704, y: 206, width: 190, height: 70 },
    collectibles: [
      { id: "lotus-1", kind: "lotus", x: 930, y: 325 },
      { id: "lotus-2", kind: "lotus", x: 978, y: 488 },
      { id: "lotus-3", kind: "lotus", x: 1270, y: 350 },
      { id: "lotus-4", kind: "lotus", x: 1238, y: 480 },
      { id: "lotus-5", kind: "lotus", x: 1105, y: 535 },
    ],
    targets: [
      { id: "dummy-1", kind: "dummy", x: 332, y: 330 },
      { id: "dummy-2", kind: "dummy", x: 430, y: 348 },
      { id: "dummy-3", kind: "dummy", x: 535, y: 338 },
      { id: "dummy-4", kind: "dummy", x: 432, y: 438 },
    ],
  },
  bamboo: {
    id: "bamboo",
    name: "Bãi Tre",
    backgroundKey: "map-bamboo",
    backgroundUrl: "/assets/maps/bamboo.jpg",
    start: { x: 720, y: 155 },
    fallbackSpawn: { x: 720, y: 155 },
    playerDepth: 7,
    blockers: bambooBlockers,
    shallowTerrain: [
      {
        id: "pond-edge",
        kind: "shallow-water",
        x: 220,
        y: 603,
        width: 260,
        height: 130,
        speedMultiplier: 0.62,
        prompt: "Mép hồ trong bãi tre trơn và chậm. Tránh bước sâu nếu chưa học bơi.",
      },
    ],
    deepWater: [
      {
        id: "bamboo-pond-deep",
        kind: "deep-water",
        x: 185,
        y: 632,
        width: 210,
        height: 110,
        speedMultiplier: 0,
        prompt: "Hồ bãi tre sâu, chưa có kỹ năng bơi.",
      },
    ],
    exits: [
      {
        id: "north-village-trail",
        label: "Đường về làng",
        x: 720,
        y: 78,
        width: 250,
        height: 140,
        to: "village",
        spawn: { x: 700, y: 780 },
        allowedPhases: ["bamboo-training", "gate-open", "complete"],
        blockedPrompt: "Đường về làng ở ngay phía bắc.",
      },
    ],
    collectibles: [
      { id: "bamboo-token-1", kind: "bamboo-token", x: 430, y: 260 },
      { id: "bamboo-token-2", kind: "bamboo-token", x: 785, y: 305 },
      { id: "bamboo-token-3", kind: "bamboo-token", x: 1025, y: 620 },
    ],
    targets: [
      { id: "post-1", kind: "bamboo-post", x: 820, y: 318 },
      { id: "post-2", kind: "bamboo-post", x: 946, y: 410 },
      { id: "post-3", kind: "bamboo-post", x: 1095, y: 455 },
    ],
  },
};

export function rectContains(rect: Rect, x: number, y: number) {
  return (
    x >= rect.x - rect.width / 2 &&
    x <= rect.x + rect.width / 2 &&
    y >= rect.y - rect.height / 2 &&
    y <= rect.y + rect.height / 2
  );
}
