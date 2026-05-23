export type QuestPhase =
  | "intro"
  | "village-training"
  | "bamboo-ready"
  | "bamboo-training"
  | "gate-open"
  | "complete";

export type MapId = "village" | "bamboo";
export type TerrainStatus = "normal" | "shallow-water" | "blocked-water";

export type SaveData = {
  version: 2;
  phase: QuestPhase;
  map: MapId;
  lotuses: number;
  dummies: number;
  bambooTokens: number;
  collectedIds: string[];
  defeatedIds: string[];
  canSwim: boolean;
};

export type GameSnapshot = SaveData & {
  requiredLotuses: number;
  requiredDummies: number;
  requiredBambooTokens: number;
  prompt: string;
  terrain: TerrainStatus;
};

const REQUIRED_LOTUSES = 5;
const REQUIRED_DUMMIES = 4;
const REQUIRED_BAMBOO_TOKENS = 3;

const DEFAULT_SAVE: SaveData = {
  version: 2,
  phase: "intro",
  map: "village",
  lotuses: 0,
  dummies: 0,
  bambooTokens: 0,
  collectedIds: [],
  defeatedIds: [],
  canSwim: false,
};

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

  collect(id: string, kind: "lotus" | "bamboo-token") {
    if (this.data.collectedIds.includes(id) || this.data.phase === "complete") return false;

    if (kind === "lotus") {
      if (this.data.phase === "intro") {
        this.prompt = "Nghe thầy Ba giao bài trước rồi hãy hái sen.";
        return false;
      }
      this.data.lotuses = Math.min(REQUIRED_LOTUSES, this.data.lotuses + 1);
      this.prompt = "Đã hái thêm một bông sen. Gom đủ lễ vật rồi tiếp tục luyện quyền.";
    } else {
      if (this.data.phase !== "bamboo-training") {
        this.prompt = "Thẻ tre thuộc bài bãi tre. Hãy hoàn thành bài sân làng trước.";
        return false;
      }
      this.data.bambooTokens = Math.min(REQUIRED_BAMBOO_TOKENS, this.data.bambooTokens + 1);
      this.prompt = "Đã lấy thêm một thẻ tre. Tập trung giữ nhịp thở giữa bãi tre.";
    }

    this.data.collectedIds.push(id);
    this.refreshPhase();
    return true;
  }

  defeatTarget(id: string, map: MapId) {
    if (this.data.defeatedIds.includes(id) || this.data.phase === "complete") return false;
    this.data.defeatedIds.push(id);
    if (map === "village") {
      this.data.dummies = Math.min(REQUIRED_DUMMIES, this.data.dummies + 1);
      this.prompt = "Đường quyền chắc hơn rồi. Bù nhìn rơm không còn đứng vững.";
      this.refreshPhase();
    } else {
      this.prompt = "Gậy tre chạm cọc. Giữ nhịp rồi nhặt đủ thẻ tre.";
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
    this.prompt =
      map === "village"
        ? "Đã về làng Tre. Tìm thầy hoặc ra cổng đình khi đủ bài."
        : "Bãi tre rì rào. Nhặt thẻ tre và luyện thân pháp.";
  }

  completeFestival() {
    if (this.data.phase !== "gate-open") return false;
    this.data.phase = "complete";
    this.prompt =
      "Cổng hội đã mở. Bạn hoàn thành bài nhập môn của võ đường làng Tre.";
    return true;
  }

  setPrompt(prompt: string) {
    if (this.data.phase === "complete") return;
    this.prompt = prompt;
  }

  setTerrain(terrain: TerrainStatus, prompt?: string) {
    this.terrain = terrain;
    if (prompt && this.data.phase !== "complete") this.prompt = prompt;
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
      requiredLotuses: REQUIRED_LOTUSES,
      requiredDummies: REQUIRED_DUMMIES,
      requiredBambooTokens: REQUIRED_BAMBOO_TOKENS,
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
    }
  }

  private validateSave(save?: SaveData | null): Partial<SaveData> {
    if (!save || save.version !== 2) return {};
    return {
      ...save,
      collectedIds: Array.isArray(save.collectedIds) ? save.collectedIds : [],
      defeatedIds: Array.isArray(save.defeatedIds) ? save.defeatedIds : [],
      canSwim: Boolean(save.canSwim),
    };
  }
}
