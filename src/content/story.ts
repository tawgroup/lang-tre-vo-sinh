import type { GameSnapshot } from "../gameState";

export type DialogueScript = {
  speaker: string;
  lines: string[];
};

export function masterDialogue(snapshot: GameSnapshot): DialogueScript {
  if (snapshot.phase === "intro") {
    return {
      speaker: "Thầy Ba",
      lines: [
        "Muốn học võ làng Tre thì trước hết phải biết giữ lễ, giữ nhịp và biết nhìn địa hình.",
        "Con hái 5 bông sen ven ao làm lễ nhập môn, rồi luyện 4 bù nhìn rơm quanh sân.",
        "Ao sen là nước thật: mép ao thì lội chậm, nước sâu thì chưa học bơi không xuống được.",
        "Space không chỉ để đánh. Đứng gần người, cổng hoặc lối đi thì Space sẽ nói chuyện hoặc tương tác.",
      ],
    };
  }

  if (snapshot.phase === "bamboo-ready") {
    return {
      speaker: "Thầy Ba",
      lines: [
        "Tốt. Bài sân làng đã xong.",
        "Đi xuống lối đất phía nam để sang bãi tre. Ở đó con luyện gậy và nhặt 3 thẻ tre.",
      ],
    };
  }

  if (snapshot.phase === "gate-open") {
    return {
      speaker: "Thầy Ba",
      lines: [
        "Đủ bài nhập môn rồi. Ra cổng đình, Space hoặc E để mở đường hội.",
        "Sau cổng là chợ huyện, bến sông và Núi Trúc. Đi xa hơn thì phải luyện cấp, không chỉ nhặt đồ.",
      ],
    };
  }

  if (snapshot.phase === "market-ready" || snapshot.phase === "market-training") {
    return {
      speaker: "Thầy Ba",
      lines: [
        "Chợ huyện là nơi võ sinh học giữ trật tự mà không làm phiền dân làng.",
        `Con đang cấp ${snapshot.level}. Thu ${snapshot.requiredMarketScrolls} sổ việc làng và lên cấp 3 rồi theo đường đông xuống bến sông.`,
      ],
    };
  }

  if (snapshot.phase === "river-ready" || snapshot.phase === "river-training") {
    return {
      speaker: "Thầy Ba",
      lines: [
        "Bến sông dạy bộ pháp: nhìn bờ, nghe nước, đừng ham đường thẳng.",
        `Nhặt ${snapshot.requiredRiverPearls} ngọc sông, luyện đến cấp 5 rồi mới lên Núi Trúc.`,
      ],
    };
  }

  if (snapshot.phase === "mountain-ready" || snapshot.phase === "mountain-training") {
    return {
      speaker: "Thầy Ba",
      lines: [
        "Núi Trúc là bài cuối của chương đầu. Cọc đá hồi nhanh hơn, đánh chậm là nó tự hồi.",
        `Gom ${snapshot.requiredMountainSeals} ấn trúc và đạt cấp 7 để được công nhận là võ sinh làng Tre.`,
      ],
    };
  }

  if (snapshot.phase === "chapter-complete") {
    return {
      speaker: "Thầy Ba",
      lines: [
        "Con đã đi qua làng, bãi tre, chợ huyện, bến sông và Núi Trúc.",
        "Chương sau có thể mở thêm võ đường liên làng, đồ nghề, chiêu thức và quái ngoài đồng.",
      ],
    };
  }

  return {
    speaker: "Thầy Ba",
    lines: [
      "Bài này không cần vội. Quan sát đường đất, bụi tre và khoảng cách trước khi vung gậy.",
      `Tiến độ: cấp ${snapshot.level}, ${snapshot.chapterLabel.toLowerCase()} ${snapshot.chapterItems}/${snapshot.requiredChapterItems}.`,
    ],
  };
}
