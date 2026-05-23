export type QuestPhase =
  | "intro"
  | "village-training"
  | "bamboo-ready"
  | "bamboo-training"
  | "gate-open"
  | "complete";

export type MapId = "village" | "bamboo";

export type GameSnapshot = {
  phase: QuestPhase;
  map: MapId;
  lotuses: number;
  dummies: number;
  bambooTokens: number;
  requiredLotuses: number;
  requiredDummies: number;
  requiredBambooTokens: number;
  prompt: string;
};

const REQUIRED_LOTUSES = 5;
const REQUIRED_DUMMIES = 4;
const REQUIRED_BAMBOO_TOKENS = 3;

export class GameState {
  private phase: QuestPhase = "intro";
  private map: MapId = "village";
  private lotuses = 0;
  private dummies = 0;
  private bambooTokens = 0;
  private prompt =
    "Đứng gần thầy Ba rồi bấm Space hoặc E để nghe thầy chỉ bài.";

  acceptQuest() {
    if (this.phase !== "intro") return;
    this.phase = "village-training";
    this.prompt =
      "Bài 1: hái 5 bông sen ven ao và luyện 4 bù nhìn rơm quanh sân làng.";
  }

  collectLotus() {
    if (this.phase === "complete") return;
    this.lotuses = Math.min(REQUIRED_LOTUSES, this.lotuses + 1);
    this.prompt = "Đã hái thêm một bông sen. Gom đủ lễ vật rồi tiếp tục luyện quyền.";
    this.refreshPhase();
  }

  strikeDummy() {
    if (this.phase === "complete") return;
    this.dummies = Math.min(REQUIRED_DUMMIES, this.dummies + 1);
    this.prompt = "Đường quyền chắc hơn rồi. Bù nhìn rơm không còn đứng vững.";
    this.refreshPhase();
  }

  collectBambooToken() {
    if (this.phase !== "bamboo-training") return;
    this.bambooTokens = Math.min(REQUIRED_BAMBOO_TOKENS, this.bambooTokens + 1);
    this.prompt = "Đã lấy thêm một thẻ tre. Tập trung giữ nhịp thở giữa bãi tre.";
    this.refreshPhase();
  }

  enterMap(map: MapId) {
    this.map = map;
    if (map === "bamboo" && this.phase === "bamboo-ready") {
      this.phase = "bamboo-training";
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
    if (this.phase !== "gate-open") return;
    this.phase = "complete";
    this.prompt =
      "Cổng hội đã mở. Bạn hoàn thành bài nhập môn của võ đường làng Tre.";
  }

  setPrompt(prompt: string) {
    if (this.phase === "complete") return;
    this.prompt = prompt;
  }

  snapshot(): GameSnapshot {
    return {
      phase: this.phase,
      map: this.map,
      lotuses: this.lotuses,
      dummies: this.dummies,
      bambooTokens: this.bambooTokens,
      requiredLotuses: REQUIRED_LOTUSES,
      requiredDummies: REQUIRED_DUMMIES,
      requiredBambooTokens: REQUIRED_BAMBOO_TOKENS,
      prompt: this.prompt,
    };
  }

  private refreshPhase() {
    if (
      this.phase === "village-training" &&
      this.lotuses >= REQUIRED_LOTUSES &&
      this.dummies >= REQUIRED_DUMMIES
    ) {
      this.phase = "bamboo-ready";
      this.prompt =
        "Xong bài sân làng. Đi xuống lối đất phía nam, bấm Space/E để sang bãi tre.";
      return;
    }

    if (
      this.phase === "bamboo-training" &&
      this.bambooTokens >= REQUIRED_BAMBOO_TOKENS
    ) {
      this.phase = "gate-open";
      this.prompt =
        "Thân pháp đã đủ. Quay về làng Tre, ra cổng đình và bấm Space/E.";
    }
  }
}
