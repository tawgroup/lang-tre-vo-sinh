import type { CollisionShapes } from "../collision";
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
  maxHp: number;
  recoveryPerSecond: number;
  recoveryDelayMs: number;
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
  collisionShapes?: CollisionShapes;
};

const villageBlockers: Rect[] = [
  { x: 706, y: 92, width: 340, height: 180 },
  { x: 34, y: 460, width: 68, height: 920 },
  { x: 1406, y: 460, width: 68, height: 920 },
  { x: 720, y: 18, width: 1440, height: 36 },
  { x: 360, y: 646, width: 310, height: 120 },
  { x: 522, y: 680, width: 210, height: 160 },
  { x: 267, y: 788, width: 310, height: 170 },
  { x: 503, y: 827, width: 245, height: 185 },
  { x: 984, y: 706, width: 250, height: 140 },
  { x: 1236, y: 716, width: 305, height: 150 },
  { x: 1018, y: 848, width: 305, height: 150 },
  { x: 1292, y: 846, width: 292, height: 150 },
  { x: 300, y: 914, width: 600, height: 20 },
  { x: 1140, y: 914, width: 600, height: 20 },
];

const bambooBlockers: Rect[] = [
  { x: 50, y: 460, width: 100, height: 920 },
  { x: 1390, y: 460, width: 100, height: 920 },
  { x: 720, y: 18, width: 1440, height: 36 },
  { x: 346, y: 152, width: 255, height: 115 },
  { x: 1068, y: 120, width: 290, height: 110 },
  { x: 364, y: 730, width: 280, height: 120 },
  { x: 1090, y: 755, width: 310, height: 120 },
  { x: 300, y: 914, width: 600, height: 20 },
  { x: 1140, y: 914, width: 600, height: 20 },
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
        x: 1118,
        y: 412,
        width: 520,
        height: 355,
        speedMultiplier: 0.42,
        prompt: "Đang lội mép ao: bước nặng, nước kéo chân. Vào sâu hơn sẽ bị chặn.",
      },
    ],
    deepWater: [
      {
        id: "lotus-pond-deep",
        kind: "deep-water",
        x: 1128,
        y: 410,
        width: 405,
        height: 245,
        speedMultiplier: 0,
        prompt: "Ao sen sâu. Chưa học bơi thì không thể đi thẳng xuống nước.",
      },
      {
        id: "field-canal",
        kind: "deep-water",
        x: 320,
        y: 704,
        width: 390,
        height: 72,
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
      { id: "lotus-1", kind: "lotus", x: 880, y: 318 },
      { id: "lotus-2", kind: "lotus", x: 948, y: 558 },
      { id: "lotus-3", kind: "lotus", x: 1344, y: 382 },
      { id: "lotus-4", kind: "lotus", x: 1252, y: 260 },
      { id: "lotus-5", kind: "lotus", x: 1082, y: 560 },
    ],
    targets: [
      { id: "dummy-1", kind: "dummy", x: 332, y: 330, maxHp: 3, recoveryPerSecond: 0.55, recoveryDelayMs: 1600 },
      { id: "dummy-2", kind: "dummy", x: 430, y: 348, maxHp: 3, recoveryPerSecond: 0.55, recoveryDelayMs: 1600 },
      { id: "dummy-3", kind: "dummy", x: 535, y: 338, maxHp: 3, recoveryPerSecond: 0.55, recoveryDelayMs: 1600 },
      { id: "dummy-4", kind: "dummy", x: 432, y: 438, maxHp: 3, recoveryPerSecond: 0.55, recoveryDelayMs: 1600 },
    ],
    collisionShapes: {
      ellipses: [
        { x: 1128, y: 410, rx: 225, ry: 145 },
        { x: 320, y: 704, rx: 210, ry: 42 },
      ],
      polygons: [
        {
          points: [
            { x: 120, y: 600 },
            { x: 520, y: 610 },
            { x: 528, y: 730 },
            { x: 84, y: 718 },
          ],
        },
        {
          points: [
            { x: 108, y: 728 },
            { x: 542, y: 738 },
            { x: 538, y: 910 },
            { x: 70, y: 908 },
          ],
        },
        {
          points: [
            { x: 910, y: 608 },
            { x: 1348, y: 604 },
            { x: 1352, y: 738 },
            { x: 902, y: 736 },
          ],
        },
        {
          points: [
            { x: 908, y: 748 },
            { x: 1352, y: 748 },
            { x: 1356, y: 910 },
            { x: 906, y: 910 },
          ],
        },
      ],
    },
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
      { id: "post-1", kind: "bamboo-post", x: 820, y: 318, maxHp: 4, recoveryPerSecond: 0.65, recoveryDelayMs: 1400 },
      { id: "post-2", kind: "bamboo-post", x: 946, y: 410, maxHp: 4, recoveryPerSecond: 0.65, recoveryDelayMs: 1400 },
      { id: "post-3", kind: "bamboo-post", x: 1095, y: 455, maxHp: 4, recoveryPerSecond: 0.65, recoveryDelayMs: 1400 },
    ],
    collisionShapes: {
      ellipses: [{ x: 185, y: 632, rx: 132, ry: 82 }],
      polygons: [
        {
          points: [
            { x: 92, y: 104 },
            { x: 360, y: 98 },
            { x: 310, y: 292 },
            { x: 76, y: 334 },
          ],
        },
        {
          points: [
            { x: 1112, y: 118 },
            { x: 1360, y: 104 },
            { x: 1362, y: 340 },
            { x: 1190, y: 310 },
          ],
        },
      ],
    },
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
