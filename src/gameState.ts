export type QuestPhase =
  | "intro"
  | "village-training"
  | "bamboo-ready"
  | "bamboo-training"
  | "gate-open"
  | "market-ready"
  | "market-training"
  | "river-ready"
  | "river-training"
  | "mountain-ready"
  | "mountain-training"
  | "chapter-complete";

export type MapId = "village" | "bamboo" | "market" | "river" | "mountain";
export type TerrainStatus = "normal" | "shallow-water" | "blocked-water";

export type SaveData = {
  version: 3;
  phase: QuestPhase;
  map: MapId;
  level: number;
  xp: number;
  lotuses: number;
  dummies: number;
  bambooTokens: number;
  marketScrolls: number;
  riverPearls: number;
  mountainSeals: number;
  collectedIds: string[];
  defeatedIds: string[];
  canSwim: boolean;
};

export type GameSnapshot = SaveData & {
  xpToNext: number;
  attackPower: number;
  rankName: string;
  requiredLotuses: number;
  requiredDummies: number;
  requiredBambooTokens: number;
  requiredMarketScrolls: number;
  requiredRiverPearls: number;
  requiredMountainSeals: number;
  chapterItems: number;
  requiredChapterItems: number;
  chapterLabel: string;
  prompt: string;
  terrain: TerrainStatus;
};

const REQUIRED_LOTUSES = 5;
const REQUIRED_DUMMIES = 4;
const REQUIRED_BAMBOO_TOKENS = 3;
const REQUIRED_MARKET_SCROLLS = 4;
const REQUIRED_RIVER_PEARLS = 4;
const REQUIRED_MOUNTAIN_SEALS = 5;

const DEFAULT_SAVE: SaveData = {
  version: 3,
  phase: "intro",
  map: "village",
  level: 1,
  xp: 0,
  lotuses: 0,
  dummies: 0,
  bambooTokens: 0,
  marketScrolls: 0,
  riverPearls: 0,
  mountainSeals: 0,
  collectedIds: [],
  defeatedIds: [],
  canSwim: false,
};

type CollectibleKind = "lotus" | "bamboo-token" | "market-scroll" | "river-pearl" | "mountain-seal";
type SerializedSave = Partial<Omit<SaveData, "version" | "phase" | "map">> & {
  version?: number;
  phase?: string;
  map?: unknown;
};

const COLLECT_XP: Record<CollectibleKind, number> = {
  lotus: 12,
  "bamboo-token": 16,
  "market-scroll": 20,
  "river-pearl": 24,
  "mountain-seal": 28,
};

const TARGET_XP: Partial<Record<MapId, number>> = {
  village: 20,
  bamboo: 24,
  market: 28,
  river: 32,
  mountain: 40,
};

const RANKS = [
  "Võ sinh nhập môn",
  "Tập sự gậy tre",
  "Tuần canh chợ huyện",
  "Bộ pháp bến sông",
  "Đệ tử núi trúc",
  "Võ sinh làng Tre",
];

export class GameState {
  private data: SaveData;
  private prompt =
    "Đứng gần thầy Ba rồi bấm Space hoặc E để nghe thầy chỉ bài.";
  private terrain: TerrainStatus = "normal";

  constructor(save?: SaveData | null) {
    this.data = { ...DEFAULT_SAVE, ...this.validateSave(save) };
    this.prompt =
      save == null
        ? this.prompt
        : "Đã tải lại tiến độ. Tiếp tục bài luyện còn dang dở.";
  }

  acceptQuest() {
    if (this.data.phase !== "intro") return false;
    this.data.phase = "village-training";
    this.prompt =
      "Bài 1: hái 5 bông sen ven ao và luyện 4 bù nhìn rơm quanh sân làng.";
    return true;
  }

  collect(id: string, kind: CollectibleKind) {
    if (this.data.collectedIds.includes(id) || this.data.phase === "chapter-complete") return false;

    if (kind === "lotus") {
      if (this.data.phase === "intro") {
        this.prompt = "Nghe thầy Ba giao bài trước rồi hãy hái sen.";
        return false;
      }
      this.data.lotuses = Math.min(REQUIRED_LOTUSES, this.data.lotuses + 1);
      this.prompt = "Đã hái thêm một bông sen. Gom đủ lễ vật rồi tiếp tục luyện quyền.";
    } else if (kind === "bamboo-token") {
      if (this.data.phase !== "bamboo-training") {
        this.prompt = "Thẻ tre thuộc bài bãi tre. Hãy hoàn thành bài sân làng trước.";
        return false;
      }
      this.data.bambooTokens = Math.min(REQUIRED_BAMBOO_TOKENS, this.data.bambooTokens + 1);
      this.prompt = "Đã lấy thêm một thẻ tre. Tập trung giữ nhịp thở giữa bãi tre.";
    } else if (kind === "market-scroll") {
      if (this.data.phase !== "market-training") {
        this.prompt = "Sổ chợ chỉ tính khi thầy đã mở đường sang chợ huyện.";
        return false;
      }
      this.data.marketScrolls = Math.min(REQUIRED_MARKET_SCROLLS, this.data.marketScrolls + 1);
      this.prompt = "Đã ghi thêm một việc làng ở chợ huyện. Giúp đủ việc rồi sang bến sông.";
    } else if (kind === "river-pearl") {
      if (this.data.phase !== "river-training") {
        this.prompt = "Ngọc sông thuộc bài bến nước. Xong việc chợ rồi hãy qua đò.";
        return false;
      }
      this.data.riverPearls = Math.min(REQUIRED_RIVER_PEARLS, this.data.riverPearls + 1);
      this.prompt = "Nhặt được ngọc trai ven bến. Luyện bước nhẹ để không trượt xuống nước.";
    } else {
      if (this.data.phase !== "mountain-training") {
        this.prompt = "Ấn trúc nằm trên núi. Qua bến sông rồi mới lên đường núi.";
        return false;
      }
      this.data.mountainSeals = Math.min(REQUIRED_MOUNTAIN_SEALS, this.data.mountainSeals + 1);
      this.prompt = "Ấn trúc đã sáng. Còn thiếu thì luyện thêm cọc đá trên sân núi.";
    }

    this.data.collectedIds.push(id);
    this.gainXp(COLLECT_XP[kind]);
    this.refreshPhase();
    return true;
  }

  defeatTarget(id: string, map: MapId) {
    if (this.data.defeatedIds.includes(id) || this.data.phase === "chapter-complete") return false;
    this.data.defeatedIds.push(id);
    this.gainXp(TARGET_XP[map] ?? 20);
    if (map === "village") {
      this.data.dummies = Math.min(REQUIRED_DUMMIES, this.data.dummies + 1);
      this.prompt = "Đường quyền chắc hơn rồi. Bù nhìn rơm không còn đứng vững.";
      this.refreshPhase();
    } else if (map === "market") {
      this.prompt = "Giữ trật tự chợ huyện tốt hơn rồi. Nhặt đủ sổ việc làng để qua bến sông.";
      this.refreshPhase();
    } else if (map === "river") {
      this.prompt = "Nhịp chân đã vững trên cầu tre. Gom đủ ngọc sông để mở đường núi.";
      this.refreshPhase();
    } else if (map === "mountain") {
      this.prompt = "Cọc đá rung lên. Cấp càng cao, gậy tre càng đánh thấm.";
      this.refreshPhase();
    } else {
      this.prompt = "Gậy tre chạm cọc. Giữ nhịp rồi nhặt đủ thẻ tre.";
      this.refreshPhase();
    }
    return true;
  }

  enterMap(map: MapId) {
    this.data.map = map;
    if (map === "bamboo" && this.data.phase === "bamboo-ready") {
      this.data.phase = "bamboo-training";
      this.prompt =
        "Bãi tre: nhặt 3 thẻ tre và dùng gậy luyện thân pháp trước khi về đình.";
      return;
    }
    if (map === "market" && this.data.phase === "market-ready") {
      this.data.phase = "market-training";
      this.prompt =
        "Chợ huyện: thu 4 sổ việc làng, luyện cọc chợ để lên cấp 3 rồi sang bến sông.";
      return;
    }
    if (map === "river" && this.data.phase === "river-ready") {
      this.data.phase = "river-training";
      this.prompt =
        "Bến sông: nhặt 4 ngọc trai, giữ bước trên bờ nước và lên cấp 5 để mở đường núi.";
      return;
    }
    if (map === "mountain" && this.data.phase === "mountain-ready") {
      this.data.phase = "mountain-training";
      this.prompt =
        "Núi Trúc: gom 5 ấn trúc và đạt cấp 7 để hoàn thành chương đầu.";
      return;
    }
    this.prompt = this.promptForMap(map);
  }

  completeFestival() {
    if (this.data.phase !== "gate-open") return false;
    this.data.phase = "market-ready";
    this.prompt =
      "Cổng hội đã mở. Từ đây con sang chợ huyện, giúp việc làng và luyện lên cấp mới.";
    return true;
  }

  setPrompt(prompt: string) {
    if (this.data.phase === "chapter-complete") return;
    this.prompt = prompt;
  }

  setTerrain(terrain: TerrainStatus, prompt?: string) {
    this.terrain = terrain;
    if (prompt && this.data.phase !== "chapter-complete") this.prompt = prompt;
  }

  hasCollected(id: string) {
    return this.data.collectedIds.includes(id);
  }

  hasDefeated(id: string) {
    return this.data.defeatedIds.includes(id);
  }

  toSave(): SaveData {
    return {
      ...this.data,
      collectedIds: [...this.data.collectedIds],
      defeatedIds: [...this.data.defeatedIds],
    };
  }

  snapshot(): GameSnapshot {
    return {
      ...this.toSave(),
      xpToNext: this.xpToNext(),
      attackPower: this.attackPower(),
      rankName: this.rankName(),
      requiredLotuses: REQUIRED_LOTUSES,
      requiredDummies: REQUIRED_DUMMIES,
      requiredBambooTokens: REQUIRED_BAMBOO_TOKENS,
      requiredMarketScrolls: REQUIRED_MARKET_SCROLLS,
      requiredRiverPearls: REQUIRED_RIVER_PEARLS,
      requiredMountainSeals: REQUIRED_MOUNTAIN_SEALS,
      ...this.chapterProgress(),
      prompt: this.prompt,
      terrain: this.terrain,
    };
  }

  private refreshPhase() {
    if (
      this.data.phase === "village-training" &&
      this.data.lotuses >= REQUIRED_LOTUSES &&
      this.data.dummies >= REQUIRED_DUMMIES
    ) {
      this.data.phase = "bamboo-ready";
      this.prompt =
        "Xong bài sân làng. Đi xuống lối đất phía nam, bấm Space/E để sang bãi tre.";
      return;
    }

    if (
      this.data.phase === "bamboo-training" &&
      this.data.bambooTokens >= REQUIRED_BAMBOO_TOKENS
    ) {
      this.data.phase = "gate-open";
      this.prompt =
        "Thân pháp đã đủ. Quay về làng Tre, ra cổng đình và bấm Space/E.";
      return;
    }

    if (
      this.data.phase === "market-training" &&
      this.data.marketScrolls >= REQUIRED_MARKET_SCROLLS &&
      this.data.level >= 3
    ) {
      this.data.phase = "river-ready";
      this.prompt =
        "Chợ huyện yên ổn. Theo đường phía đông sang bến sông để học bài giữ bước.";
      return;
    }

    if (
      this.data.phase === "market-training" &&
      this.data.marketScrolls >= REQUIRED_MARKET_SCROLLS &&
      this.data.level < 3
    ) {
      this.prompt = "Đủ sổ chợ rồi, nhưng cần lên cấp 3. Luyện thêm cọc chợ để tăng kinh nghiệm.";
      return;
    }

    if (
      this.data.phase === "river-training" &&
      this.data.riverPearls >= REQUIRED_RIVER_PEARLS &&
      this.data.level >= 5
    ) {
      this.data.phase = "mountain-ready";
      this.prompt =
        "Bến sông đã qua. Theo lối đá phía bắc để lên Núi Trúc.";
      return;
    }

    if (
      this.data.phase === "river-training" &&
      this.data.riverPearls >= REQUIRED_RIVER_PEARLS &&
      this.data.level < 5
    ) {
      this.prompt = "Đủ ngọc sông rồi, nhưng cần cấp 5. Luyện thêm cọc tre ven bến.";
      return;
    }

    if (
      this.data.phase === "mountain-training" &&
      this.data.mountainSeals >= REQUIRED_MOUNTAIN_SEALS &&
      this.data.level >= 7
    ) {
      this.data.phase = "chapter-complete";
      this.data.canSwim = true;
      this.prompt =
        "Hoàn thành chương đầu: võ sinh làng Tre đã qua làng, chợ, bến sông và Núi Trúc.";
      return;
    }

    if (
      this.data.phase === "mountain-training" &&
      this.data.mountainSeals >= REQUIRED_MOUNTAIN_SEALS &&
      this.data.level < 7
    ) {
      this.prompt = "Đủ ấn trúc rồi, nhưng cần cấp 7. Luyện cọc đá để nâng công lực.";
    }
  }

  private gainXp(amount: number) {
    this.data.xp += amount;
    let leveled = false;
    while (this.data.xp >= this.xpToNext()) {
      this.data.xp -= this.xpToNext();
      this.data.level += 1;
      leveled = true;
    }
    if (leveled) {
      this.prompt = `Lên cấp ${this.data.level}: ${this.rankName()}. Sát thương gậy tre tăng theo cấp.`;
    }
  }

  private xpToNext() {
    return 70 + (this.data.level - 1) * 35;
  }

  private attackPower() {
    return 1 + Math.floor((this.data.level - 1) / 3);
  }

  private rankName() {
    return RANKS[Math.min(RANKS.length - 1, Math.floor((this.data.level - 1) / 2))];
  }

  private chapterProgress() {
    if (this.data.phase === "market-training" || this.data.phase === "river-ready") {
      return {
        chapterItems: this.data.marketScrolls,
        requiredChapterItems: REQUIRED_MARKET_SCROLLS,
        chapterLabel: "Sổ chợ",
      };
    }
    if (this.data.phase === "river-training" || this.data.phase === "mountain-ready") {
      return {
        chapterItems: this.data.riverPearls,
        requiredChapterItems: REQUIRED_RIVER_PEARLS,
        chapterLabel: "Ngọc sông",
      };
    }
    if (this.data.phase === "mountain-training" || this.data.phase === "chapter-complete") {
      return {
        chapterItems: this.data.mountainSeals,
        requiredChapterItems: REQUIRED_MOUNTAIN_SEALS,
        chapterLabel: "Ấn trúc",
      };
    }
    return {
      chapterItems: this.data.bambooTokens,
      requiredChapterItems: REQUIRED_BAMBOO_TOKENS,
      chapterLabel: "Thẻ tre",
    };
  }

  private promptForMap(map: MapId) {
    const prompts: Record<MapId, string> = {
      village: "Đã về làng Tre. Tìm thầy, ra cổng đình hoặc theo đường sang chợ khi đã mở.",
      bamboo: "Bãi tre rì rào. Nhặt thẻ tre và luyện thân pháp.",
      market: "Chợ huyện đông người. Giữ đường đi, luyện cọc và thu sổ việc làng.",
      river: "Bến sông nước xoáy. Đi theo bờ đất, tránh nước sâu và cầu trơn.",
      mountain: "Núi Trúc lộng gió. Luyện cọc đá và gom đủ ấn trúc.",
    };
    return prompts[map];
  }

  private validateSave(save?: SerializedSave | null): Partial<SaveData> {
    if (!save || (save.version !== 2 && save.version !== 3)) return {};
    const migratedPhase = save.version === 2 && save.phase === "complete" ? "market-ready" : save.phase;
    return {
      ...save,
      version: 3,
      phase: this.validatePhase(migratedPhase),
      map: this.validateMap(save.map),
      level: typeof save.level === "number" ? Math.max(1, save.level) : 1,
      xp: typeof save.xp === "number" ? Math.max(0, save.xp) : 0,
      marketScrolls: typeof save.marketScrolls === "number" ? save.marketScrolls : 0,
      riverPearls: typeof save.riverPearls === "number" ? save.riverPearls : 0,
      mountainSeals: typeof save.mountainSeals === "number" ? save.mountainSeals : 0,
      collectedIds: Array.isArray(save.collectedIds) ? save.collectedIds : [],
      defeatedIds: Array.isArray(save.defeatedIds) ? save.defeatedIds : [],
      canSwim: Boolean(save.canSwim),
    };
  }

  private validateMap(map: unknown): MapId {
    return map === "village" || map === "bamboo" || map === "market" || map === "river" || map === "mountain"
      ? map
      : "village";
  }

  private validatePhase(phase: unknown): QuestPhase {
    const phases: QuestPhase[] = [
      "intro",
      "village-training",
      "bamboo-ready",
      "bamboo-training",
      "gate-open",
      "market-ready",
      "market-training",
      "river-ready",
      "river-training",
      "mountain-ready",
      "mountain-training",
      "chapter-complete",
    ];
    return phases.includes(phase as QuestPhase) ? (phase as QuestPhase) : "intro";
  }
}
